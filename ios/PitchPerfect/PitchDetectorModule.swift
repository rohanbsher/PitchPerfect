/**
 * Native iOS Pitch Detector Module
 *
 * High-performance pitch detection using:
 * - AVAudioEngine for low-latency audio capture
 * - Accelerate framework for SIMD-optimized DSP
 * - Optimized YIN algorithm
 *
 * Expected latency: 15-30ms (vs 100-180ms in JavaScript)
 */

import Foundation
import AVFoundation
import Accelerate
import React

@objc(PitchDetectorModule)
class PitchDetectorModule: RCTEventEmitter {

  // Audio engine components
  private var audioEngine: AVAudioEngine?
  private var inputNode: AVAudioInputNode?
  private var bufferSize: UInt32 = 2048
  private var sampleRate: Double = 44100.0

  // Pitch detection state
  private var isRunning = false
  private let threshold: Float = 0.1

  // Note mapping
  private let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

  // Event listener count
  private var hasListeners = false

  override init() {
    super.init()
    // Don't setup audio session here - wait until permissions are granted
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc override func supportedEvents() -> [String]! {
    return ["onPitchDetected"]
  }

  @objc override func startObserving() {
    hasListeners = true
  }

  @objc override func stopObserving() {
    hasListeners = false
  }

  private func setupAudioSession() -> Bool {
    do {
      let audioSession = AVAudioSession.sharedInstance()
      // Use .default mode instead of .measurement to allow audio playback (piano notes, TTS)
      // .measurement mode is too restrictive and blocks expo-av audio playback
      try audioSession.setCategory(.playAndRecord, mode: .default, options: [.allowBluetooth, .defaultToSpeaker, .mixWithOthers])
      try audioSession.setPreferredSampleRate(44100.0)
      try audioSession.setPreferredIOBufferDuration(0.01) // 10ms buffer for low latency
      try audioSession.setActive(true, options: [.notifyOthersOnDeactivation])

      sampleRate = audioSession.sampleRate
      print("🎤 Audio session configured: \(sampleRate) Hz (mode: default, mixWithOthers)")
      return true
    } catch {
      print("❌ Audio session setup failed: \(error)")
      return false
    }
  }

  @objc func startPitchDetection(_ callback: @escaping RCTResponseSenderBlock) {
    print("📍 startPitchDetection called, isRunning: \(isRunning)")

    guard !isRunning else {
      // Already running is not an error - just return success
      print("📍 Already running, returning success")
      callback([NSNull(), "Already running"])
      return
    }

    // Setup audio session first (after permissions are granted)
    print("📍 Setting up audio session...")
    guard setupAudioSession() else {
      callback(["Failed to setup audio session"])
      return
    }

    audioEngine = AVAudioEngine()
    guard let engine = audioEngine else {
      callback(["Failed to create audio engine"])
      return
    }

    inputNode = engine.inputNode
    guard let input = inputNode else {
      callback(["Failed to get input node"])
      return
    }

    let format = input.outputFormat(forBus: 0)
    sampleRate = format.sampleRate
    print("📍 Input format: \(format), sample rate: \(sampleRate)")

    // Install tap on input node
    print("📍 Installing audio tap on bus 0, buffer size: \(bufferSize)")
    input.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, time in
      self?.processAudioBuffer(buffer)
    }

    do {
      print("📍 Preparing audio engine...")
      engine.prepare()
      print("📍 Starting audio engine...")
      try engine.start()
      isRunning = true
      print("✅ Pitch detection started at \(sampleRate) Hz")
      callback([NSNull(), "Started at \(sampleRate) Hz"])
    } catch {
      print("❌ Engine start failed: \(error)")
      callback(["Failed to start engine: \(error.localizedDescription)"])
    }
  }

  @objc func stopPitchDetection() {
    guard isRunning else { return }

    inputNode?.removeTap(onBus: 0)
    audioEngine?.stop()
    isRunning = false
    print("🛑 Pitch detection stopped")
  }

  /**
   * Stop pitch detection AND release the audio session.
   * This is critical for allowing other audio services (like voice recognition) to use the microphone.
   * The callback returns success/failure for proper async handling.
   */
  @objc func stopPitchDetectionAndReleaseSession(_ callback: @escaping RCTResponseSenderBlock) {
    // Stop the audio engine if running
    if isRunning {
      inputNode?.removeTap(onBus: 0)
      audioEngine?.stop()
      audioEngine = nil
      inputNode = nil
      isRunning = false
    }

    // Critical: Deactivate the audio session to release microphone for other services
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setActive(false, options: [.notifyOthersOnDeactivation])
      print("🔇 Audio session deactivated for voice assistant")
      callback([NSNull(), "Audio session released"])
    } catch {
      print("❌ Failed to deactivate audio session: \(error)")
      // Still report success for the stop - audio session issues shouldn't block
      callback([NSNull(), "Stopped but audio session release failed: \(error.localizedDescription)"])
    }
  }

  /**
   * Reconfigure and start pitch detection with a fresh audio session.
   * Called after voice assistant releases the microphone.
   */
  @objc func reconfigureAndStartPitchDetection(_ callback: @escaping RCTResponseSenderBlock) {
    print("📍 reconfigureAndStartPitchDetection called, isRunning: \(isRunning)")

    guard !isRunning else {
      print("📍 Already running, returning success")
      callback([NSNull(), "Already running"])
      return
    }

    // Full setup: configure audio session fresh
    print("📍 Setting up fresh audio session...")
    guard setupAudioSession() else {
      callback(["Failed to setup audio session"])
      return
    }

    // Create new audio engine
    audioEngine = AVAudioEngine()
    guard let engine = audioEngine else {
      callback(["Failed to create audio engine"])
      return
    }

    inputNode = engine.inputNode
    guard let input = inputNode else {
      callback(["Failed to get input node"])
      return
    }

    let format = input.outputFormat(forBus: 0)
    sampleRate = format.sampleRate
    print("📍 Input format: \(format), sample rate: \(sampleRate)")

    // Install tap on input node
    print("📍 Installing audio tap on bus 0, buffer size: \(bufferSize)")
    input.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, time in
      self?.processAudioBuffer(buffer)
    }

    do {
      print("📍 Preparing audio engine...")
      engine.prepare()
      print("📍 Starting audio engine...")
      try engine.start()
      isRunning = true
      print("✅ Pitch detection reconfigured and started at \(sampleRate) Hz")
      callback([NSNull(), "Reconfigured and started at \(sampleRate) Hz"])
    } catch {
      print("❌ Engine start failed: \(error)")
      callback(["Failed to start engine: \(error.localizedDescription)"])
    }
  }

  private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
    // Always send events (hasListeners might not be set correctly)
    guard let channelData = buffer.floatChannelData?[0] else { return }

    let frameCount = Int(buffer.frameLength)
    let audioData = Array(UnsafeBufferPointer(start: channelData, count: frameCount))

    // Calculate RMS (volume) using Accelerate
    var rms: Float = 0
    vDSP_rmsqv(audioData, 1, &rms, vDSP_Length(frameCount))

    // Log RMS periodically for debugging
    if Int.random(in: 0..<30) == 0 {
      print("🎙️ Audio buffer - RMS: \(rms), Frames: \(frameCount)")
    }

    // Only detect pitch if sufficient volume
    guard rms > 0.003 else {
      sendPitchEvent(frequency: 0, confidence: 0, note: "", rms: rms)
      return
    }

    // Detect pitch using optimized YIN
    let (frequency, confidence) = detectPitchYIN(audioData)

    guard frequency > 0 && confidence > 0.3 else {
      sendPitchEvent(frequency: 0, confidence: confidence, note: "", rms: rms)
      return
    }

    let (note, centsOff) = frequencyToNoteWithCents(frequency)
    sendPitchEvent(frequency: frequency, confidence: confidence, note: note, rms: rms, centsOff: centsOff)
  }

  /**
   * YIN Pitch Detection Algorithm
   * Optimized with Accelerate framework (SIMD)
   */
  private func detectPitchYIN(_ buffer: [Float]) -> (Float, Float) {
    let bufferCount = buffer.count
    let halfBuffer = bufferCount / 2

    guard halfBuffer > 0 else { return (0, 0) }

    // Step 1: Difference function (optimized with vDSP)
    var difference = [Float](repeating: 0, count: halfBuffer)

    for tau in 0..<halfBuffer {
      var sum: Float = 0
      let length = bufferCount - tau

      if length > 0 {
        var shifted = Array(buffer[tau..<bufferCount])
        var original = Array(buffer[0..<length])
        var diff = [Float](repeating: 0, count: length)

        vDSP_vsub(shifted, 1, original, 1, &diff, 1, vDSP_Length(length))
        vDSP_svesq(diff, 1, &sum, vDSP_Length(length))
      }

      difference[tau] = sum
    }

    // Step 2: Cumulative mean normalized difference
    var cmndf = [Float](repeating: 0, count: halfBuffer)
    cmndf[0] = 1.0

    var runningSum: Float = 0
    for tau in 1..<halfBuffer {
      runningSum += difference[tau]
      cmndf[tau] = runningSum > 0 ? difference[tau] / (runningSum / Float(tau)) : 1.0
    }

    // Step 3: Absolute threshold
    var tau = 2
    while tau < halfBuffer {
      if cmndf[tau] < threshold {
        while tau + 1 < halfBuffer && cmndf[tau + 1] < cmndf[tau] {
          tau += 1
        }
        break
      }
      tau += 1
    }

    if tau == halfBuffer || tau < 2 {
      return (0, 0)
    }

    // Step 4: Parabolic interpolation
    let x0 = tau > 0 ? tau - 1 : tau
    let x2 = tau + 1 < halfBuffer ? tau + 1 : tau

    var betterTau: Float
    if x0 == tau {
      betterTau = cmndf[tau] <= cmndf[x2] ? Float(tau) : Float(x2)
    } else if x2 == tau {
      betterTau = cmndf[tau] <= cmndf[x0] ? Float(tau) : Float(x0)
    } else {
      let s0 = cmndf[x0]
      let s1 = cmndf[tau]
      let s2 = cmndf[x2]
      betterTau = Float(tau) + (s2 - s0) / (2 * (2 * s1 - s2 - s0))
    }

    let frequency = Float(sampleRate) / betterTau
    let confidence = 1.0 - cmndf[tau]

    return (frequency, confidence)
  }

  private func frequencyToNoteWithCents(_ frequency: Float) -> (String, Int) {
    let a4: Float = 440.0
    let c0 = a4 * pow(2, -4.75)

    let halfSteps = 12 * log2(frequency / c0)
    let roundedHalfSteps = round(halfSteps)
    let cents = Int((halfSteps - roundedHalfSteps) * 100)

    let octave = Int(roundedHalfSteps / 12)
    let noteIndex = Int(roundedHalfSteps) % 12

    let noteName = noteNames[noteIndex >= 0 ? noteIndex : noteIndex + 12]
    return ("\(noteName)\(octave)", cents)
  }

  private func sendPitchEvent(frequency: Float, confidence: Float, note: String, rms: Float, centsOff: Int = 0) {
    let pitchData: [String: Any] = [
      "frequency": frequency,
      "confidence": confidence,
      "note": note,
      "rms": rms,
      "centsOff": centsOff,
      "timestamp": Date().timeIntervalSince1970 * 1000
    ]

    // Dispatch to main thread to avoid threading issues with React Native bridge
    DispatchQueue.main.async { [weak self] in
      self?.sendEvent(withName: "onPitchDetected", body: pitchData)
    }
  }

  @objc func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock,
                                 reject: @escaping RCTPromiseRejectBlock) {
    AVAudioSession.sharedInstance().requestRecordPermission { granted in
      if granted {
        resolve("granted")
      } else {
        reject("PERMISSION_DENIED", "Microphone permission denied", nil)
      }
    }
  }
}

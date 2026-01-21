import Foundation
import AVFoundation
import Accelerate

@objc(PitchDetectorModule)
class PitchDetectorModule: RCTEventEmitter {

  private var audioEngine: AVAudioEngine?
  private var isRunning = false
  private let sampleRate: Double = 44100
  private let bufferSize: AVAudioFrameCount = 2048

  // YIN algorithm parameters
  private let yinThreshold: Float = 0.15
  private let minFrequency: Float = 60.0   // ~B1
  private let maxFrequency: Float = 2000.0 // ~B6

  override init() {
    super.init()
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return ["onPitchDetected"]
  }

  @objc func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    AVAudioSession.sharedInstance().requestRecordPermission { granted in
      DispatchQueue.main.async {
        resolve(granted ? "granted" : "denied")
      }
    }
  }

  @objc func startPitchDetection(_ callback: @escaping RCTResponseSenderBlock) {
    if isRunning {
      callback([NSNull(), "already_running"])
      return
    }

    do {
      // Configure audio session
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .allowBluetooth])
      try session.setActive(true)

      // Create audio engine
      audioEngine = AVAudioEngine()
      guard let audioEngine = audioEngine else {
        callback(["Failed to create audio engine", NSNull()])
        return
      }

      let inputNode = audioEngine.inputNode
      let format = inputNode.outputFormat(forBus: 0)

      // Install tap for audio processing
      inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, time in
        self?.processAudioBuffer(buffer)
      }

      // Start engine
      try audioEngine.start()
      isRunning = true
      callback([NSNull(), "started"])

    } catch {
      callback([error.localizedDescription, NSNull()])
    }
  }

  @objc func stopPitchDetection() {
    guard isRunning, let audioEngine = audioEngine else { return }

    audioEngine.inputNode.removeTap(onBus: 0)
    audioEngine.stop()

    do {
      try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    } catch {
      print("Error deactivating audio session: \(error)")
    }

    self.audioEngine = nil
    isRunning = false
  }

  private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
    guard let channelData = buffer.floatChannelData?[0] else { return }
    let frameCount = Int(buffer.frameLength)

    // Calculate RMS (volume level)
    var rms: Float = 0
    vDSP_rmsqv(channelData, 1, &rms, vDSP_Length(frameCount))

    // Skip if too quiet (noise floor)
    if rms < 0.01 {
      return
    }

    // Detect pitch using YIN algorithm
    if let frequency = detectPitchYIN(channelData, frameCount: frameCount) {
      // Convert frequency to note
      let (note, centsOff) = frequencyToNote(frequency)

      // Calculate confidence based on signal clarity
      let confidence = min(1.0, Double(rms) * 10)

      // Send event to JavaScript
      let eventData: [String: Any] = [
        "frequency": frequency,
        "confidence": confidence,
        "note": note,
        "rms": rms,
        "centsOff": centsOff,
        "timestamp": Date().timeIntervalSince1970 * 1000
      ]

      sendEvent(withName: "onPitchDetected", body: eventData)
    }
  }

  // YIN pitch detection algorithm
  private func detectPitchYIN(_ samples: UnsafePointer<Float>, frameCount: Int) -> Float? {
    let minPeriod = Int(sampleRate / Double(maxFrequency))
    let maxPeriod = Int(sampleRate / Double(minFrequency))

    guard maxPeriod < frameCount / 2 else { return nil }

    var yinBuffer = [Float](repeating: 0, count: maxPeriod)

    // Step 1: Difference function
    for tau in minPeriod..<maxPeriod {
      var sum: Float = 0
      for i in 0..<(frameCount - tau) {
        let diff = samples[i] - samples[i + tau]
        sum += diff * diff
      }
      yinBuffer[tau] = sum
    }

    // Step 2: Cumulative mean normalized difference
    yinBuffer[0] = 1
    var runningSum: Float = 0
    for tau in minPeriod..<maxPeriod {
      runningSum += yinBuffer[tau]
      if runningSum != 0 {
        yinBuffer[tau] *= Float(tau) / runningSum
      }
    }

    // Step 3: Absolute threshold
    var bestTau = -1
    for tau in minPeriod..<maxPeriod {
      if yinBuffer[tau] < yinThreshold {
        // Find local minimum
        while tau + 1 < maxPeriod && yinBuffer[tau + 1] < yinBuffer[tau] {
          bestTau = tau + 1
        }
        if bestTau == -1 {
          bestTau = tau
        }
        break
      }
    }

    guard bestTau > 0 else { return nil }

    // Step 4: Parabolic interpolation for better accuracy
    let betterTau: Float
    if bestTau > 0 && bestTau < maxPeriod - 1 {
      let s0 = yinBuffer[bestTau - 1]
      let s1 = yinBuffer[bestTau]
      let s2 = yinBuffer[bestTau + 1]
      betterTau = Float(bestTau) + (s2 - s0) / (2 * (2 * s1 - s2 - s0))
    } else {
      betterTau = Float(bestTau)
    }

    let frequency = Float(sampleRate) / betterTau

    // Validate frequency range
    guard frequency >= minFrequency && frequency <= maxFrequency else { return nil }

    return frequency
  }

  // Convert frequency to musical note
  private func frequencyToNote(_ frequency: Float) -> (String, Int) {
    let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    // A4 = 440 Hz
    let a4Frequency: Float = 440.0
    let a4NoteNumber = 69

    // Calculate semitones from A4
    let semitones = 12.0 * log2(Double(frequency) / Double(a4Frequency))
    let roundedSemitones = Int(round(semitones))
    let noteNumber = a4NoteNumber + roundedSemitones

    // Calculate cents off from perfect pitch
    let perfectFrequency = a4Frequency * pow(2.0, Float(roundedSemitones) / 12.0)
    let centsOff = Int(round(1200.0 * log2(Double(frequency) / Double(perfectFrequency))))

    // Get note name and octave
    let noteIndex = ((noteNumber % 12) + 12) % 12
    let octave = (noteNumber / 12) - 1
    let noteName = "\(noteNames[noteIndex])\(octave)"

    return (noteName, centsOff)
  }
}

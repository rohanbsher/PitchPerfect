/**
 * Voice Assistant Overlay Component
 *
 * Full-screen overlay shown when the voice assistant is active.
 * Displays listening state, real-time transcription, responses, and conversation history.
 * Supports multi-turn conversations with chat-like UI.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { VoiceAssistantState, ConversationTurn } from '../services/voiceAssistant';

interface VoiceAssistantOverlayProps {
  visible: boolean;
  state: VoiceAssistantState;
  transcript: string;
  response: string;
  conversationHistory?: ConversationTurn[];
  isConversationMode?: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function VoiceAssistantOverlay({
  visible,
  state,
  transcript,
  response,
  conversationHistory = [],
  isConversationMode = false,
  onClose,
}: VoiceAssistantOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (conversationHistory.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationHistory.length]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT * 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Pulse animation for listening state
  useEffect(() => {
    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  // Get status text and colors
  const getStatusInfo = () => {
    switch (state) {
      case 'listening':
        return {
          icon: '🎙️',
          text: 'Listening...',
          color: '#10B981',
          subtext: 'Speak now',
        };
      case 'processing':
        return {
          icon: '🤔',
          text: 'Processing...',
          color: '#8B5CF6',
          subtext: 'Thinking',
        };
      case 'speaking':
        return {
          icon: '🗣️',
          text: 'Speaking',
          color: '#3B82F6',
          subtext: '',
        };
      case 'error':
        return {
          icon: '⚠️',
          text: 'Error',
          color: '#EF4444',
          subtext: 'Try again',
        };
      default:
        return {
          icon: '🎤',
          text: 'Ready',
          color: '#888888',
          subtext: 'Tap to speak',
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={30} style={styles.blurContainer} tint="dark">
          <TouchableOpacity
            style={styles.dismissArea}
            onPress={onClose}
            activeOpacity={1}
          />

          <Animated.View
            style={[
              styles.content,
              { transform: [{ translateY: slideAnim }] },
              isConversationMode && conversationHistory.length > 0 && styles.conversationContent,
            ]}
          >
            {/* Status Indicator */}
            <View style={styles.statusContainer}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: statusInfo.color,
                  },
                ]}
              >
                <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
              </Animated.View>

              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>

              {statusInfo.subtext ? (
                <Text style={styles.statusSubtext}>{statusInfo.subtext}</Text>
              ) : null}
            </View>

            {/* Conversation History */}
            {conversationHistory.length > 0 ? (
              <ScrollView
                ref={scrollViewRef}
                style={styles.conversationScrollView}
                contentContainerStyle={styles.conversationScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {conversationHistory.map((turn) => (
                  <View
                    key={turn.id}
                    style={[
                      styles.chatBubble,
                      turn.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chatBubbleText,
                        turn.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText,
                      ]}
                    >
                      {turn.content}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <>
                {/* Single-turn transcript display */}
                {transcript ? (
                  <View style={styles.transcriptContainer}>
                    <Text style={styles.transcriptLabel}>You said:</Text>
                    <Text style={styles.transcriptText}>"{transcript}"</Text>
                  </View>
                ) : null}

                {/* Single-turn response display */}
                {response ? (
                  <View style={styles.responseContainer}>
                    <Text style={styles.responseText}>{response}</Text>
                  </View>
                ) : null}
              </>
            )}

            {/* Waveform visualization for listening state */}
            {state === 'listening' && (
              <View style={styles.waveformContainer}>
                <WaveformAnimation color={statusInfo.color} />
              </View>
            )}

            {/* Cancel/Close button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>
                {isConversationMode ? 'End conversation' : 'Tap to cancel'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

// Simple waveform animation
function WaveformAnimation({ color }: { color: string }) {
  const bars = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const animations = bars.map((bar, index) => {
      const delay = index * 100;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(bar, {
            toValue: Math.random() * 0.6 + 0.4,
            duration: 200 + Math.random() * 200,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: Math.random() * 0.3 + 0.2,
            duration: 200 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.waveformBars}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveformBar,
            {
              backgroundColor: color,
              transform: [{ scaleY: bar }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 24,
    minHeight: SCREEN_HEIGHT * 0.4,
    alignItems: 'center',
  },
  conversationContent: {
    minHeight: SCREEN_HEIGHT * 0.55,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  conversationScrollView: {
    width: '100%',
    flex: 1,
    marginBottom: 16,
  },
  conversationScrollContent: {
    paddingVertical: 8,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderBottomLeftRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#8B5CF6',
  },
  chatBubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  assistantBubbleText: {
    color: '#FFFFFF',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 36,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  transcriptContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  transcriptLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  responseContainer: {
    width: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  responseText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  waveformContainer: {
    marginVertical: 24,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
  },
  waveformBar: {
    width: 6,
    height: 40,
    borderRadius: 3,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

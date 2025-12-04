/**
 * ErrorBoundary - Catches React errors to prevent full app crashes
 *
 * Wrap your app or critical sections with this component to gracefully
 * handle unexpected errors and show a fallback UI instead of a white screen.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DesignSystem as DS } from '../design/DesignSystem';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: Send to error reporting service (e.g., Sentry)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We encountered an unexpected error. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DS.spacing.xl,
  },
  card: {
    backgroundColor: DS.colors.background.secondary,
    borderRadius: DS.radius.xl,
    padding: DS.spacing.xxl,
    alignItems: 'center',
    maxWidth: 320,
    ...DS.shadows.lg,
  },
  title: {
    ...DS.typography.title2,
    color: DS.colors.text.primary,
    marginBottom: DS.spacing.md,
    textAlign: 'center',
  },
  message: {
    ...DS.typography.body,
    color: DS.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
  },
  errorBox: {
    backgroundColor: DS.colors.background.tertiary,
    borderRadius: DS.radius.md,
    padding: DS.spacing.md,
    marginBottom: DS.spacing.lg,
    width: '100%',
  },
  errorText: {
    ...DS.typography.caption1,
    color: DS.colors.accent.error,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: DS.colors.accent.primary,
    paddingVertical: DS.spacing.md,
    paddingHorizontal: DS.spacing.xl,
    borderRadius: DS.radius.lg,
    ...DS.shadows.md,
  },
  buttonText: {
    ...DS.typography.headline,
    color: DS.colors.text.primary,
    fontWeight: '600',
  },
});

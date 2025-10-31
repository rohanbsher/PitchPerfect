#!/bin/bash

# PitchPerfect - App Store Build Script
# This script will start the build process and guide you through Apple login

cd /Users/rohanbhandari/Desktop/Professional_Projects/ML_PROJECTS_AI/PitchPerfect

echo "============================================"
echo "  PitchPerfect - App Store Build"
echo "============================================"
echo ""
echo "Starting EAS build for iOS..."
echo ""
echo "You will be asked for:"
echo "  1. Apple ID: rohanbsher@gmail.com (or bhandarirohan556@gmail.com)"
echo "  2. Apple Password: Your Apple account password"
echo "  3. 2FA Code: 6-digit code from your iPhone"
echo ""
echo "Everything else is automated!"
echo "============================================"
echo ""

# Run the build
eas build --platform ios --profile production

echo ""
echo "============================================"
echo "Build submitted to EAS!"
echo "Check status at: https://expo.dev/accounts/rohanbsher/projects/PitchPerfect/builds"
echo "============================================"

#!/bin/bash

# PitchPerfect - Steve Jobs Edition
# "It Just Works"

echo "🎵 Starting PitchPerfect..."
echo "✨ Creating magic..."

# Start the server in the background
npm start &

# Wait for the server to be ready
sleep 3

# Open in browser automatically
echo "🚀 Opening PitchPerfect in your browser..."
open http://localhost:8082

echo "🎯 PitchPerfect is ready! Enjoy your musical journey."

# Keep the script running
wait
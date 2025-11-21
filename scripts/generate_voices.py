#!/usr/bin/env python3
"""
Generate natural voice clips for PitchPerfect using ElevenLabs API.

Usage:
    export ELEVENLABS_API_KEY="your-api-key"
    python3 scripts/generate_voices.py

Get your API key at: https://elevenlabs.io (Profile > API Keys)
"""

import os
import requests
import time

# ElevenLabs API configuration
API_KEY = os.environ.get("ELEVENLABS_API_KEY")
BASE_URL = "https://api.elevenlabs.io/v1"

# Use "Rachel" voice - calm, soothing female voice perfect for guidance
# You can change this to other voices like "Bella", "Elli", "Josh", etc.
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel

# Voice prompts to generate
VOICE_PROMPTS = {
    # Breathing exercise
    "breathing_intro": "Starting 4-7-8 Breathing. A calming breath pattern.",
    "inhale": "In",
    "hold": "Hold",
    "exhale": "Out",
    "breathing_complete": "Breathing exercise complete. Well done.",

    # Workout
    "workout_intro": "Starting Daily Vocal Workout.",
    "warmup_scale": "Warm-up Scale",
    "descending_scale": "Descending Scale",
    "major_arpeggio": "Major Arpeggio",
    "octave_jump": "Octave Jump",
    "siren": "Siren",
    "extended_range": "Extended Range",
    "next_exercise": "Next exercise",
    "workout_complete": "Workout complete. Great job!",

    # Feedback
    "good": "Good!",
    "try_match_pitch": "Try to match the pitch",
}

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "audio", "voice")

def generate_voice(text: str, filename: str) -> bool:
    """Generate a voice clip using ElevenLabs API."""

    url = f"{BASE_URL}/text-to-speech/{VOICE_ID}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": API_KEY
    }

    data = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",  # New free-tier model
        "voice_settings": {
            "stability": 0.6,  # Slightly varied for natural feel
            "similarity_boost": 0.8,
            "style": 0.3,  # Calm, relaxed style
            "use_speaker_boost": True
        }
    }

    try:
        response = requests.post(url, json=data, headers=headers)

        if response.status_code == 200:
            output_path = os.path.join(OUTPUT_DIR, f"{filename}.mp3")
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"  Generated: {filename}.mp3")
            return True
        else:
            print(f"  ERROR generating {filename}: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"  ERROR generating {filename}: {e}")
        return False

def main():
    if not API_KEY:
        print("ERROR: ELEVENLABS_API_KEY environment variable not set.")
        print("\nTo get your API key:")
        print("1. Go to https://elevenlabs.io")
        print("2. Sign up for free")
        print("3. Go to Profile > API Keys")
        print("4. Copy your API key")
        print("\nThen run:")
        print('  export ELEVENLABS_API_KEY="your-api-key"')
        print("  python3 scripts/generate_voices.py")
        return

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Generating {len(VOICE_PROMPTS)} voice clips...")
    print(f"Output directory: {OUTPUT_DIR}\n")

    success_count = 0

    for filename, text in VOICE_PROMPTS.items():
        if generate_voice(text, filename):
            success_count += 1
        # Small delay to avoid rate limiting
        time.sleep(0.5)

    print(f"\nComplete! Generated {success_count}/{len(VOICE_PROMPTS)} voice clips.")

    if success_count == len(VOICE_PROMPTS):
        print("\nAll voice clips generated successfully!")
        print("You can now rebuild the app to use the new voices.")
    else:
        print("\nSome clips failed. Check your API key and try again.")

if __name__ == "__main__":
    main()

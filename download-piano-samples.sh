#!/bin/bash
# Download piano samples C3-C6 from University of Iowa
# Total: 37 notes (chromatic scale)

BASE_URL="https://theremin.music.uiowa.edu/sound%20files/MIS/Piano_Other/piano"
OUTPUT_DIR="assets/audio/piano"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Note names in chromatic order
NOTES=(
  "C3" "Db3" "D3" "Eb3" "E3" "F3" "Gb3" "G3" "Ab3" "A3" "Bb3" "B3"
  "C4" "Db4" "D4" "Eb4" "E4" "F4" "Gb4" "G4" "Ab4" "A4" "Bb4" "B4"
  "C5" "Db5" "D5" "Eb5" "E5" "F5" "Gb5" "G5" "Ab5" "A5" "Bb5" "B5"
  "C6"
)

# Iowa uses "s" for sharp instead of "b" for flat
# C# = Cs, D# = Ds, etc.
IOWA_NOTES=(
  "C3" "Cs3" "D3" "Ds3" "E3" "F3" "Fs3" "G3" "Gs3" "A3" "As3" "B3"
  "C4" "Cs4" "D4" "Ds4" "E4" "F4" "Fs4" "G4" "Gs4" "A4" "As4" "B4"
  "C5" "Cs5" "D5" "Ds5" "E5" "F5" "Fs5" "G5" "Gs5" "A5" "As5" "B5"
  "C6"
)

echo "📥 Downloading 37 piano samples from University of Iowa..."
echo "🎹 Range: C3 to C6 (chromatic scale)"
echo ""

# Download each note
for i in "${!NOTES[@]}"; do
  note="${NOTES[$i]}"
  iowa_note="${IOWA_NOTES[$i]}"
  filename="$OUTPUT_DIR/${note}.aiff"
  url="$BASE_URL/Piano.mf.${iowa_note}.aiff"

  echo -n "[$((i+1))/37] Downloading $note..."

  if curl -f -s -o "$filename" "$url" --max-time 15; then
    size=$(ls -lh "$filename" | awk '{print $5}')
    echo " ✅ ($size)"
  else
    echo " ❌ FAILED"
  fi
done

echo ""
echo "✅ Download complete!"
echo "📁 Files saved to: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR" | tail -n +2 | wc -l | xargs echo "📊 Total files:"

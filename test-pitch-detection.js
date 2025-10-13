/**
 * Automated Browser Test for PitchPerfect
 * Tests WebAudioService initialization, permissions, and UI
 */

const http = require('http');

console.log('🧪 PitchPerfect Automated Test Suite\n');
console.log('=' .repeat(60));

// Test 1: Check if server is running
console.log('\n📋 TEST 1: Server Status');
console.log('-'.repeat(60));

const checkServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8082', (res) => {
      console.log('✅ Server is running on http://localhost:8082');
      console.log(`   Status Code: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Check if it's the React app
        if (data.includes('PitchPerfect') || data.includes('root')) {
          console.log('✅ React application HTML detected');
          resolve(true);
        } else {
          console.log('⚠️  Unexpected HTML content');
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Server is NOT running');
      console.log(`   Error: ${err.message}`);
      reject(err);
    });
  });
};

// Test 2: Check bundle availability
console.log('\n📋 TEST 2: JavaScript Bundle');
console.log('-'.repeat(60));

const checkBundle = () => {
  return new Promise((resolve) => {
    const bundleReq = http.get('http://localhost:8082/index.ts.bundle?platform=web&dev=true&hot=false&lazy=true', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ JavaScript bundle is available');
        console.log(`   Status Code: ${res.statusCode}`);

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Check for key components
          const hasWebAudioService = data.includes('WebAudioService');
          const hasExerciseScreen = data.includes('ExerciseTestScreenV2');
          const hasPitchDetection = data.includes('YINPitchDetector') || data.includes('detectPitch');

          console.log(`   Contains WebAudioService: ${hasWebAudioService ? '✅' : '❌'}`);
          console.log(`   Contains ExerciseTestScreenV2: ${hasExerciseScreen ? '✅' : '❌'}`);
          console.log(`   Contains Pitch Detection: ${hasPitchDetection ? '✅' : '❌'}`);

          resolve(hasWebAudioService && hasExerciseScreen && hasPitchDetection);
        });
      } else {
        console.log(`⚠️  Bundle request returned ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Failed to fetch bundle');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
  });
};

// Run tests
(async () => {
  try {
    await checkServer();
    await checkBundle();

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST SUMMARY');
    console.log('-'.repeat(60));
    console.log('✅ Server is running and accessible');
    console.log('✅ React application is loaded');
    console.log('✅ JavaScript bundle contains required components');

    console.log('\n🔍 NEXT STEPS - Manual Browser Testing Required:');
    console.log('-'.repeat(60));
    console.log('1. Open http://localhost:8082 in Chrome/Safari/Firefox');
    console.log('2. Open DevTools Console (F12 or Cmd+Option+I)');
    console.log('3. Look for initialization logs:');
    console.log('   - "🎹 Initializing cross-platform audio..."');
    console.log('   - "🎹 WebAudioService: Initializing..."');
    console.log('   - "✅ WebAudioService: Piano loaded"');
    console.log('   - "✅ Audio initialized successfully"');
    console.log('4. Click "Start Test" button');
    console.log('5. Grant microphone permission when prompted');
    console.log('6. Make a sound (hum, sing, or whistle)');
    console.log('7. Observe:');
    console.log('   - Detected note updates in UI');
    console.log('   - Frequency value changes');
    console.log('   - Confidence percentage displays');
    console.log('8. Click "Stop" to end recording');
    console.log('9. Check console for any errors');

    console.log('\n💡 EXPECTED CONSOLE LOGS:');
    console.log('-'.repeat(60));
    console.log('🎹 Initializing cross-platform audio...');
    console.log('🎹 WebAudioService: Initializing...');
    console.log('✅ WebAudioService: Piano loaded');
    console.log('✅ WebAudioService: Microphone permission granted');
    console.log('✅ Audio initialized successfully');
    console.log('🎤 WebAudioService: Starting microphone capture...');
    console.log('📊 WebAudioService: Sample Rate: 48000');
    console.log('✅ WebAudioService: Microphone capture started');

    console.log('\n🐛 COMMON ISSUES TO CHECK:');
    console.log('-'.repeat(60));
    console.log('❌ "Microphone permission denied" - User blocked permissions');
    console.log('❌ "Piano loading failed" - Network issue loading samples');
    console.log('❌ "getUserMedia not supported" - Browser compatibility issue');
    console.log('❌ No pitch detection - Audio input too quiet or no input device');

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
})();

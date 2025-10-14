# Quick Test Checklist - PitchPerfect

**Ready to test in 5 minutes!**

---

## Pre-Flight Check ✈️

✅ **Metro Bundler Running:** Port 8081 is active (PID 62656)
✅ **Mac IP Address:** 192.168.0.5
✅ **App Ready:** All code compiled successfully

---

## Connection Steps

1. **On iPhone:**
   - Open Expo Dev Client
   - Scan QR code from Metro terminal
   - OR manually enter: `http://192.168.0.5:8081`

2. **Wait for app to load** (~10 seconds)

---

## Critical Test (5 minutes)

### 1. Home Screen (30 seconds)
- [ ] JourneyProgress card shows "Week 1: Foundation"
- [ ] Single button: "Start Today's Lesson"
- [ ] "Browse All Exercises" at bottom (subtle)

### 2. Start Exercise (2 minutes)
- [ ] Tap "Start Today's Lesson"
- [ ] Preview screen appears (What/Why/How)
- [ ] Tap "I'm Ready - Start Exercise"
- [ ] 3-2-1 countdown shows
- [ ] Exercise starts automatically

### 3. Complete Exercise (2 minutes)
- [ ] Follow breathing visualizer OR sing with piano
- [ ] Complete at least 1 round/note
- [ ] Results screen appears
- [ ] Shows percentage and "What's Next?"

### 4. Sample Rate Check (30 seconds)
**Look at Metro logs for:**
```
✅ Real-time audio capture started {
  "sampleRate": 48000  ⬅️ MUST BE 48000!
}
```

---

## Success = All 4 Checked ✅

If anything fails, check detailed test plan: `END_TO_END_TEST_PLAN.md`

---

## What You're Testing

1. **Quick Win 1-3:** Exercise Preview + Countdown + Results
2. **Quick Win 4:** Single CTA + Journey Progress
3. **Day 2 Fix:** Sample rate accuracy (48000 Hz)
4. **Day 2 UX:** Exercise icons

---

## Ready? Start Testing! 🚀

**Estimated Time:** 5 minutes for critical path
**Full Test:** 20-25 minutes (see END_TO_END_TEST_PLAN.md)

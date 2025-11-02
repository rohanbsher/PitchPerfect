# 🤖 AI Vocal Coach Setup Guide

The AI Vocal Coach feature provides personalized, intelligent feedback on your singing practice using Claude AI.

## ✨ What You Get

After each vocal exercise, the AI Coach analyzes your performance and provides:

- **Performance Summary**: Overall assessment of how you did
- **Strengths**: Specific things you did well
- **Areas to Improve**: What needs work
- **Vocal Technique Tips**: Actionable advice based on your actual pitch patterns
- **Encouragement**: Motivation to keep practicing
- **Next Steps**: Recommendations for what to practice next

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy your API key (it starts with `sk-ant-`)

**Free Tier**: New accounts get $5 in free credits = ~5,000 exercises with AI feedback!

### Step 2: Add API Key to Your App

1. In the PitchPerfect project root, copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder with your actual key:
   ```
   EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

3. Save the file

### Step 3: Restart the App

1. Stop the Metro bundler (Ctrl+C)
2. Restart: `npm start`
3. Reload the app

That's it! The AI Coach will now appear after vocal exercises.

## 💡 Usage Tips

### When It Works
- ✅ After completing any vocal exercise (scales, warm-ups, etc.)
- ✅ Shows in the results screen below performance stats
- ✅ Requires internet connection

### When It Doesn't Work
- ❌ Breathing exercises (AI is only for vocal exercises)
- ❌ No API key configured
- ❌ No internet connection
- ❌ API key is invalid or expired

### Getting Different Insights
Tap "Get Different Insights" to regenerate feedback with a different focus.

## 💰 Cost Breakdown

The AI Coach uses Claude 3.5 Haiku, which is:
- **Very affordable**: ~$0.001 per exercise
- **Fast**: Feedback appears in 1-2 seconds
- **Smart**: Understands vocal pedagogy and technique

Example costs:
- 100 exercises = $0.10
- 1,000 exercises = $1.00
- 10,000 exercises = $10.00

## 🔒 Privacy & Security

### Your Data
- Performance data is sent to Anthropic's API for analysis
- No audio recordings are sent (only pitch accuracy numbers)
- Anthropic doesn't train on your data (see their [Commercial Terms](https://www.anthropic.com/commercial-terms))

### API Key Security
- Never commit `.env` to git (it's in `.gitignore`)
- Don't share your API key publicly
- If exposed, rotate it immediately in the Anthropic Console

### Local-First Option (Future)
We're exploring on-device ML models for privacy-first AI coaching without internet.

## 🛠️ Troubleshooting

### "AI Coach requires an API key"
- Check that `.env` file exists (not `.env.example`)
- Verify the key starts with `sk-ant-`
- Restart Metro bundler completely

### "Failed to generate AI feedback"
- Check internet connection
- Verify API key is valid (test in Anthropic Console)
- Check if you have credits remaining
- Look at Metro console for detailed error messages

### AI feedback seems generic
- Try the "Get Different Insights" button
- Complete more notes in the exercise (more data = better analysis)
- Check that exercise completed successfully (not cut short)

### High API costs
- Claude Haiku is very cheap (~$0.001/exercise)
- Set usage limits in Anthropic Console if concerned
- Monitor spending in the Anthropic dashboard

## 🔍 How It Works (Technical)

1. **Exercise Completion**: You finish a vocal exercise
2. **Data Collection**: App gathers:
   - Exercise name and type
   - Note accuracy percentages
   - Pitch tendencies (sharp, flat, unstable)
   - Problem notes
   - Overall accuracy
3. **API Call**: Structured prompt sent to Claude 3.5 Haiku
4. **AI Analysis**: Claude analyzes patterns using vocal pedagogy knowledge
5. **Feedback Generation**: Returns JSON with personalized insights
6. **Display**: Beautiful card UI shows the feedback

## 📊 Example Feedback

```
Performance Summary:
"Good work! Your pitch control is developing nicely."

Strengths:
• Excellent breath support on lower notes
• Consistent pitch on C Major scale ascending

Areas to Improve:
• Tendency to go sharp on intervals larger than a fifth
• Pitch stability wavers after 2+ minutes of singing

Vocal Technique Tips:
1. Try relaxing your throat when jumping to high notes
2. Focus on diaphragm engagement for sustained notes
3. Practice interval training separately to build muscle memory

Encouragement:
"Your consistent practice is paying off - keep going!"

What's Next:
Practice Major Thirds exercise to improve interval accuracy
```

## 🎯 Roadmap

Planned improvements:
- [ ] Voice quality analysis (vibrato, breathiness, strain detection)
- [ ] Vocal health monitoring
- [ ] Historical trend analysis ("You've improved 23% this month!")
- [ ] On-device ML models (no internet required)
- [ ] Comparison to professional singers
- [ ] Custom coaching personalities

## 🤝 Support

Having issues? Let us know!

- Check the [Troubleshooting](#-troubleshooting) section
- Review Anthropic's [API Documentation](https://docs.anthropic.com/)
- Open an issue on GitHub

---

**Happy practicing! 🎵**

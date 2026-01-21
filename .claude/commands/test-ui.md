---
description: Test a UI flow in the iOS simulator
---

Test the specified UI flow in the iOS Simulator using the ios-simulator-skill:

1. **Check simulator**: Run `python3 ~/.claude/skills/ios-simulator-skill/ios-simulator-skill/scripts/sim_list.py` to list available simulators
2. **Boot if needed**: Use `simctl_boot.py` to boot the target simulator
3. **Build and launch**: Run `npm run ios` to build and install the app
4. **Map the screen**: Use `screen_mapper.py` to understand current UI elements
5. **Navigate to feature**: Use `navigator.py` to reach: $ARGUMENTS
6. **Verify behavior**: Check that the UI matches expectations
7. **Report findings**: Summarize what works and what doesn't

If something fails, attempt to fix the code and re-test once before reporting.

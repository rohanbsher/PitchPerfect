---
description: Verify recent changes work correctly (Boris's verification loop)
---

Run the verification loop for recent changes:

1. **Build check**: Run the build and check for compilation errors
2. **Type check**: Verify TypeScript types are correct
3. **Review changes**: Use `git diff` to see what changed
4. **Report findings**: Summarize what was verified and any issues found

This is the critical verification loop - use after every significant change.

$ARGUMENTS

# 🚀 BugTrace Production Test Guide

## Quick Installation Test

### 1. Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"** 
4. Select the entire `BugTrace` folder (not the dist folder)
5. Verify extension appears with green checkmark

### 2. Test DevTools Integration
1. Open any website (e.g., https://example.com)
2. Open Chrome DevTools (F12)
3. Look for **"BugTrace"** tab in the DevTools tabs bar
4. Click the BugTrace tab - should show the interface

### 3. Test Error Capture
1. In the browser console, run: `console.error("Test error")`
2. Switch to BugTrace tab
3. Verify the error appears in the "Errors" list
4. Click on the error to see details

### 4. Test GitHub Integration
1. Click the GitHub settings icon in BugTrace
2. Add a GitHub Personal Access Token (optional for now)
3. Navigate to the "GitHub" tab
4. Verify the integration panel loads

### 5. Production Checklist
- [ ] Extension loads without errors
- [ ] DevTools panel appears and functions
- [ ] Error capture works
- [ ] All tabs (Errors, Suggestions, Fixes, GitHub) load
- [ ] Settings panel opens and closes
- [ ] No console errors in DevTools
- [ ] UI is responsive and styled correctly

## Expected Results
- **Clean UI**: Dark theme matching DevTools
- **Real-time Updates**: Errors appear immediately
- **Smooth Navigation**: Tab switching works
- **Professional Look**: Icons and branding consistent

## Troubleshooting
- **Blank page**: Check browser console for errors
- **Missing tab**: Refresh the page and reopen DevTools
- **No errors captured**: Try `throw new Error("test")` in console

## 📧 Contact
If you encounter issues during testing:
**Ivo Pereira** - ivopereiraix3@gmail.com

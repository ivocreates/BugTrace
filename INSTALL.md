# 🚀 Quick Installation Guide for BugTrace

![Works with GitHub](https://img.shields.io/badge/Works%20with-GitHub-181717?style=flat-square&logo=github)

## Prerequisites
- Node.js 16+ installed on your system
- Chrome browser
- GitHub account (optional, for enhanced GitHub integration)

## Installation Steps

### 1. Setup the Project
```bash
# Navigate to the project directory
cd BugTrace

# Install dependencies
npm install

# Build the extension
npm run build
```

### 2. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `BugTrace` project folder
5. The extension should now appear in your extensions list

### 3. Access BugTrace Panel
1. Open any website (try a site that might have errors)
2. Open Chrome DevTools:
   - **Windows/Linux**: `F12` or `Ctrl + Shift + I`
   - **Mac**: `Cmd + Option + I`
3. Look for the **"BugTrace"** tab in DevTools
4. Click on it to open the BugTrace panel

## 🧪 Testing the Extension

### Option 1: Use the Demo Script
1. Open the BugTrace DevTools panel
2. In the browser console, paste the contents of `demo/test-errors.js`
3. Watch as errors appear in the BugTrace panel

### Option 2: Manual Error Testing
In the browser console, try these commands:
```javascript
// Generate different types of errors
console.error("Test error message");
undefined.foo();
JSON.parse("invalid json");
fetch("/nonexistent").catch(console.error);
```

## 📱 Using BugTrace

### Capturing Errors
- Errors automatically appear in the "Errors" tab
- Click any error to see detailed information
- View stack traces, file locations, and error context

### Getting Suggestions  
- Select an error and switch to "Suggestions" tab
- View solutions from StackOverflow, GitHub, and MDN
- Use the search bar for manual queries
- Vote on suggestions to improve quality

### Managing Snippets
- Click the save button on any error details
- Add your own notes and solutions
- Access saved snippets in "My Fixes" tab
- Export/import your knowledge base

## 🛠️ Development Mode

For active development:
```bash
# Watch mode - rebuilds automatically
npm run dev
```

After making changes:
1. Rebuild if not in dev mode: `npm run build`
2. Go to `chrome://extensions/`
3. Click refresh button on BugTrace extension
4. Reload DevTools to see changes

## ❌ Troubleshooting

### Extension Not Loading
- Check that `dist/` folder exists after building
- Verify no syntax errors in `manifest.json`
- Look for error messages in `chrome://extensions/`

### DevTools Panel Missing
- Ensure extension is enabled in Chrome
- Check browser console for JavaScript errors
- Try refreshing the page and reopening DevTools

### No Errors Captured
- Make sure you're on the "Errors" tab in BugTrace
- Try generating errors manually (see testing section)
- Check that the website actually has JavaScript errors

### API Suggestions Not Working
- Check internet connection
- External APIs may have rate limits
- Some corporate firewalls may block API requests

## 🎯 Success!

If you can see the BugTrace panel in DevTools and it captures errors, you're all set! 

The extension will now help you debug more efficiently by providing intelligent suggestions and letting you build a personal knowledge base of fixes.

---

**Need help?** Check the full [README.md](README.md) or [DEVELOPMENT.md](DEVELOPMENT.md) for detailed information.

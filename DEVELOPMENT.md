# BugTrace Development Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development mode**
   ```bash
   npm run dev
   ```
   This will build the extension in watch mode, automatically rebuilding when files change.

3. **Load extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select this project folder
   - The extension will appear in your extensions list

4. **Test the extension**
   - Open any website
   - Open DevTools (F12 or Ctrl+Shift+I)
   - Look for the "BugTrace" tab in DevTools
   - Generate some errors to test (e.g., type `undefined.foo()` in console)

## Development Workflow

### Making Changes

1. **Edit source files** in the `src/` directory
2. **Files are auto-rebuilt** in dev mode (`npm run dev`)
3. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the BugTrace extension
4. **Refresh DevTools** to see changes (close and reopen DevTools)

### Important Files

- `manifest.json` - Extension configuration and permissions
- `devtools.html/js` - DevTools panel registration
- `panel.html` - Container for the React app
- `src/App.tsx` - Main React application
- `src/services/` - Core functionality (error detection, storage, suggestions)
- `src/components/` - UI components

### Testing Features

#### Error Capture
```javascript
// Test console errors
console.error("Test error message");
throw new Error("Test runtime error");

// Test promise rejections  
Promise.reject(new Error("Test promise rejection"));
```

#### Network Errors
- Navigate to a page that makes failed API calls
- Use browser's Network tab to throttle/block requests
- Observe how network errors appear in BugTrace

#### Storage
- Save some error snippets
- Check browser storage: DevTools > Application > Storage > IndexedDB > BugTraceDB

## Building for Production

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

## Architecture

### Error Detection Flow
1. `ErrorDetector` service listens for console/network errors
2. Errors are captured and parsed
3. UI components display errors in real-time
4. Users can save errors as snippets

### Suggestion Flow
1. User selects an error or searches manually
2. `SuggestionService` queries external APIs:
   - StackOverflow API for Q&A
   - GitHub API for issues
   - MDN for documentation
3. Results are ranked and displayed
4. User feedback improves future suggestions

### Storage Flow
1. `StorageService` manages IndexedDB operations
2. Snippets are saved with notes and tags
3. Export/import functionality for data portability
4. Search and filtering for knowledge management

## API Integration

### StackOverflow API
- Endpoint: `https://api.stackexchange.com/2.3/search/advanced`
- No auth required, but rate limited
- Returns questions with answers

### GitHub API  
- Endpoint: `https://api.github.com/search/issues`
- No auth required for public repos
- Returns closed issues (assumed solved)

## Debugging Tips

### Extension Issues
- Check `chrome://extensions/` for error messages
- Enable "Collect errors" in Chrome extensions page
- Use browser's console for extension-level errors

### DevTools Panel Issues
- Check browser console when DevTools is open
- Inspect the DevTools panel itself: DevTools > Settings > Experiments > "Allow custom UI themes" + right-click panel > Inspect

### Network Issues
- Use browser's Network tab to see API requests
- Check CORS issues (should not occur with manifest permissions)
- Monitor rate limiting from external APIs

## Common Issues

### Extension Not Loading
- Check manifest.json syntax
- Verify all file paths exist
- Ensure build files are present in dist/

### DevTools Panel Not Appearing
- Check devtools.js is registering the panel correctly
- Verify panel.html exists and loads panel.js
- Look for JavaScript errors in browser console

### React Errors
- Check browser console for React-specific errors
- Verify all imports are correct
- Ensure TypeScript types match usage

### Storage Issues
- Check IndexedDB in browser DevTools
- Verify idb package is working correctly
- Test storage operations in isolation

## Performance Considerations

- Error capturing should not impact page performance
- API requests should be throttled/debounced
- Storage operations should be asynchronous
- UI should remain responsive during operations

## Security Notes

- All Chrome extension permissions are necessary
- No sensitive data is stored or transmitted
- External API calls only send error messages (no personal data)
- Local storage is isolated per extension

## Future Improvements

- Add tests (Jest/React Testing Library)
- Implement proper icon generation pipeline
- Add source maps for better debugging
- Consider content security policy improvements

// BugTrace Demo Script
// Copy and paste these commands in the browser console to test error capture

console.log("🐛 BugTrace Demo - Testing Error Capture");

// 1. Console Errors
console.error("Demo Error: Failed to load user data");
console.warn("Demo Warning: API response time is slow");

// 2. Runtime Errors
setTimeout(() => {
  try {
    throw new Error("Demo Runtime Error: Undefined function call");
  } catch (e) {
    console.error(e);
  }
}, 1000);

// 3. Promise Rejections
Promise.reject(new Error("Demo Promise Rejection: Failed to fetch data"))
  .catch(err => console.error("Unhandled Promise:", err));

// 4. Type Errors
setTimeout(() => {
  try {
    const obj = null;
    obj.someMethod(); // This will throw TypeError
  } catch (e) {
    console.error(e);
  }
}, 2000);

// 5. Reference Errors  
setTimeout(() => {
  try {
    nonExistentVariable.toString();
  } catch (e) {
    console.error(e);
  }
}, 3000);

// 6. Network Simulation (creates failed requests)
setTimeout(() => {
  fetch('/non-existent-endpoint')
    .catch(err => console.error('Network Error:', err));
  
  fetch('https://httpstat.us/500')
    .catch(err => console.error('Server Error:', err));
}, 4000);

console.log("✅ Demo errors scheduled. Check the BugTrace panel in DevTools!");
console.log("💡 Tip: You can also manually create errors by typing things like:");
console.log("   - undefined.foo()");
console.log("   - JSON.parse('invalid json')");
console.log("   - document.getElementById('nonexistent').click()");

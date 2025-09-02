// Register the BugTrace panel in Chrome DevTools
chrome.devtools.panels.create(
  "BugTrace",
  "icons/icon32.png",
  "panel.html",
  function(panel) {
    // Panel created successfully
    console.log("BugTrace panel created");
  }
);

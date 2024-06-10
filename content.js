console.log("Content script loaded");

chrome.runtime.sendMessage({
  action: "takeScreenshot",
});

// content.js
document.addEventListener('click', (event) => {
  if (event.target.matches('.next-button, .prev-button')) { // Adjust selectors to match your calendar navigation buttons
    chrome.runtime.sendMessage({ action: "takeScreenshot" });
  }
});

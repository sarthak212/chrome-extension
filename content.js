console.log("Content script loaded");

chrome.runtime.sendMessage({
  action: "takeScreenshot",
});

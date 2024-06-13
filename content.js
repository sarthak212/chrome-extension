console.log("Content script loaded");

chrome.runtime.sendMessage({
  action: "takeScreenshot",
});

// content.js
document.addEventListener("click", (event) => {
  // fire event on above input id click
  console.log("Clicked Event");
  if (event.target.matches("#appointments_consulate_appointment_date")) {
    console.log("Screenshot taken on date input click");
    chrome.runtime.sendMessage({ action: "takeScreenshot" });
  }
  // check for calendar navigation button click for next and previous
  if (event.target.matches(".ui-datepicker-next *")) {
    console.log("Screenshot taken on calendar navigation next click");
    // Adjust selectors to match your calendar navigation buttons
    chrome.runtime.sendMessage({ action: "takeScreenshot" });
  }
  if (event.target.matches(".ui-datepicker-prev *")) {
    console.log("Screenshot taken on calendar navigation prev click");
    // Adjust selectors to match your calendar navigation buttons
    chrome.runtime.sendMessage({ action: "takeScreenshot" });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.sync.get(["userCode"], (result) => {
      if (!result.userCode) {
        console.log("No user code found.");
        return;
      }

      if (
        changeInfo.status === "complete" &&
        tab.url &&
        tab.url.includes("http://127.0.0.1:5500/index.html")
      ) {
        console.log("Executing script on:", tab.url); // Log the URL where the script is being executed
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ["content.js"],
          })
          .catch((err) => console.error("Script execution error:", err));
      }
    });
  });
});

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "takeScreenshot") {
    console.log("Taking screenshot...", request.data);
    chrome.storage.sync.get(["userCode"], (result) => {
      if (!result.userCode) {
        sendResponse({ success: false, error: "No user code found." });
        return;
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("inside tabls", tabs);
        if (tabs.length > 0) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tabs[0].id },
              func: () => {
                console.log("inside function");
                const selectElement = document.getElementById(
                  "appointments_consulate_appointment_facility_id"
                );
                const selectedOption =
                  selectElement.options[selectElement.selectedIndex];
                const selectedValue = selectedOption
                  ? selectedOption.textContent
                  : null;
                const tdElements = document.querySelectorAll("td");
                const results = [];

                tdElements.forEach((td) => {
                  const aTag = td.querySelector('a[href="#"]');
                  if (aTag) {
                    const dataYear = td.getAttribute("data-year");
                    const dataMonth = td.getAttribute("data-month");
                    const aTagValue = aTag.textContent;

                    results.push(
                      new Date(
                        parseInt(dataYear),
                        parseInt(dataMonth) - 1,
                        parseInt(aTagValue)
                      ).toISOString()
                    );
                  }
                });
                console.log("After script");
                console.log(
                  "result8 ",
                  results,
                  "selectedValue",
                  selectedValue
                );
                return { results, selectedValue };
              },
            },
            (results) => {
              console.log("result ", results);
              if (!(results && results[0] && results[0].result)) {
                return;
              }

              const { selectedValue, results: dateResults } = results[0].result;
              console.log(
                dateResults,
                selectedValue,
                "here we have location and available results date"
              );

              console.log("Screenshot taken:", dataUrl);
              console.log("selected value ", selectedValue, results);
              fetch("http://16.16.27.18/slot/update", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${result.userCode}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  location: selectedValue,
                  dates: dateResults,
                }),
              })
                .then((response) => {
                  if (response.ok) {
                    console.log("Code saved in database");
                  } else {
                    console.error("Failed to save code in database");
                  }
                })
                .catch((error) => console.error("Error:", error));

              fetch("http://16.16.27.18/user/validate", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${result.userCode}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ file: dataUrl }),
              })
                .then((response) => {
                  if (response.ok) {
                    console.log("Code saved in database");
                  } else {
                    console.error("Failed to save code in database");
                  }
                })
                .catch((error) => console.error("Error:", error));
              sendResponse({ success: true, dataUrl: dataUrl });
            }
          );
          chrome.tabs.captureVisibleTab(
            null,
            { format: "png" },
            function (dataUrl) {
              if (chrome.runtime.lastError) {
                console.log("error ");
                console.error(
                  "Failed to capture tab:",
                  chrome.runtime.lastError.message
                );
                sendResponse({
                  success: false,
                  error: chrome.runtime.lastError.message,
                });
              } else {
                console.log("tab ", tabs);
              }
            }
          );
        } else {
          console.log("No active tab found.");
          sendResponse({ success: false, error: "No active tab found." });
        }
      });

      // Return true to indicate that the response will be sent asynchronously
      return true;
    });
  }
});

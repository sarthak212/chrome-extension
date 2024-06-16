chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.sync.get(["userCode"], (result) => {
      if (!result.userCode) {
        console.log("No user code found.");
        return;
      }

      if (changeInfo.status === "complete" && tab.url) {
        // Regular expression to match the URL pattern with a dynamic segment
        const urlPattern =
          /^https:\/\/ais\.usvisa-info\.com\/en-ca\/niv\/schedule\/\d+\/appointment$/;

        if (urlPattern.test(tab.url)) {
          console.log("Executing script on:", tab.url);
          chrome.scripting
            .executeScript({
              target: { tabId: tabId },
              files: ["content.js"],
            })
            .catch((err) => console.log("Script execution error:", err));
        }
      }
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Action on background ", request.action);
  if (request.action === "takeScreenshot") {
    console.log("Taking screenshot...", request.data);
    chrome.storage.sync.get(["userCode"], (result) => {
      if (!result.userCode) {
        sendResponse({ success: false, error: "No user code found." });
        return;
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const tabId = tabs[0].id;

          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              func: () => {
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
                    console.log(
                      dataYear,
                      dataMonth,
                      aTagValue,
                      "what all this value is ???"
                    );
                    if (dataYear && dataMonth && aTagValue) {
                      results.push({
                        month: parseInt(dataMonth),
                        year: parseInt(dataYear),
                        date: parseInt(aTagValue),
                      });
                    }
                  }
                });
                return { results, selectedValue };
              },
            },
            (injectedResults) => {
              if (
                !(
                  injectedResults &&
                  injectedResults[0] &&
                  injectedResults[0].result
                )
              ) {
                console.log("Failed to get results from injected script.");
                sendResponse({
                  success: false,
                  error: "Failed to get results from injected script.",
                });
                return;
              }

              const { selectedValue, results: dateResults } =
                injectedResults[0].result;

              if (dateResults.length) {
                console.log("Dates found");
                chrome.tabs.captureVisibleTab(
                  null,
                  { format: "png" },
                  function (dataUrl) {
                    if (chrome.runtime.lastError) {
                      console.log(
                        "Failed to capture tab:",
                        chrome.runtime.lastError.message
                      );
                      sendResponse({
                        success: false,
                        error: chrome.runtime.lastError.message,
                      });
                    } else {
                      console.log(
                        "Screenshot taken:",
                        dateResults,
                        selectedValue
                      );

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
                        .then(async (response) => {
                          const body = await response.json();
                          console.log(response, "response value is here", body);

                          if (response.ok) {
                            console.log("Slot info saved in database");
                          } else {
                            console.log("Failed to save slot info in database");
                          }
                        })
                        .catch((error) => console.log("Error:", error));

                      fetch("http://16.16.27.18/slot/upload", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${result.userCode}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ file: dataUrl }),
                      })
                        .then((response) => {
                          console.log(response, "response value is here");
                          if (response.ok) {
                            console.log("Screenshot saved in database");
                          } else {
                            console.log(
                              "Failed to save screenshot in database"
                            );
                          }
                        })
                        .catch((error) => console.log("Error:", error));
                      sendResponse({ success: true, dataUrl: dataUrl });
                    }
                  }
                );
              } else {
                console.log("Dates not found");
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

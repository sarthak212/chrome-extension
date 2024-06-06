chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      chrome.storage.sync.get(['userCode'], (result) => {
        if (!result.userCode) {
          console.log('No user code found.');
          return;
        }
        
        if (changeInfo.status === 'complete' && tab.url && tab.url.includes("cricbuzz.com")) {
          console.log("Executing script on:", tab.url); // Log the URL where the script is being executed
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          }).catch(err => console.error("Script execution error:", err));
        }
      });
    });
});

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "takeScreenshot") {
      chrome.storage.sync.get(['userCode'], (result) => {
          if (!result.userCode) {
              sendResponse({ success: false, error: "No user code found." });
              return;
          }

          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs.length > 0) {
                  chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
                      if (chrome.runtime.lastError) {
                          console.error("Failed to capture tab:", chrome.runtime.lastError.message);
                          sendResponse({ success: false, error: chrome.runtime.lastError.message });
                      } else {
                          chrome.scripting.executeScript({
                              target: { tabId: tabs[0].id },
                              func: () => {
                                  const selectElement = document.getElementById('appointments_consulate_appointment_facility_id');
                                  const selectedOption = selectElement.options[selectElement.selectedIndex];
                                  const selectedValue = selectedOption ? selectedOption.textContent : null;
                                  const tdElements = document.querySelectorAll('td');
                                  const results = [];

                                  tdElements.forEach(td => {
                                      const aTag = td.querySelector('a[href="#"]');
                                      if (aTag) {
                                          const dataYear = td.getAttribute('data-year');
                                          const dataMonth = td.getAttribute('data-month');
                                          const aTagValue = aTag.textContent;

                                          results.push({
                                              year: dataYear,
                                              month: dataMonth,
                                              day: aTagValue
                                          });
                                      }
                                  });

                                  return { results, selectedValue };
                              }
                          }, (results) => {
                              const { selectedValue, results: dateResults } = results[0].result;
                              console.log(dateResults, selectedValue, 'here we have location and available results date');

                              console.log("Screenshot taken:", dataUrl);

                              fetch('https://chrome-extension-backend-rriv.onrender.com/user/validate', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${result.userCode}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ location: selectedValue, dates: dateResults })
                              }).then(response => {
                                if (response.ok) {
                                    console.log('Code saved in database');
                                } else {
                                    console.error('Failed to save code in database');
                                }
                              }).catch(error => console.error('Error:', error));
                        
                              fetch('https://chrome-extension-backend-rriv.onrender.com/user/validate', {
                                  method: 'POST',
                                  headers: {
                                      'Authorization': `Bearer ${result.userCode}`,
                                      'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ file: dataUrl })
                              }).then(response => {
                                  if (response.ok) {
                                      console.log('Code saved in database');
                                  } else {
                                      console.error('Failed to save code in database');
                                  }
                              }).catch(error => console.error('Error:', error));
                              sendResponse({ success: true, dataUrl: dataUrl });
                          });
                      }
                  });
              } else {
                  console.error("No active tab found.");
                  sendResponse({ success: false, error: "No active tab found." });
              }
          });

          // Return true to indicate that the response will be sent asynchronously
          return true;
      });
  }
});


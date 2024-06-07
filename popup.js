// document.getElementById("takeScreenshot").addEventListener("click", () => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     chrome.tabs.sendMessage(tabs[0].id, { action: "takeScreenshot" });
//   });
// });
console.log("Script loaded");

document.getElementById("saveCode").addEventListener("click", () => {
  const userCode = document.getElementById("userCode").value;
  if (userCode.length > 0) {
    document.getElementById("status").textContent = "";
    fetch("https://chrome-extension-backend-rriv.onrender.com/user/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: userCode }),
    })
      .then(async (response) => {
        console.log("response ", response);
        let jsonBody = await response.json();
        if (response.ok) {
          console.log("Code saved in database");
          // Save the code in Chrome storage
          chrome.storage.sync.set({ userCode: userCode }, () => {
            document.getElementById("success-status").textContent =
              "Code saved successfully!";

            // Send the code to your backend to save it in MongoDB
          });
        } else {
          document.getElementById("status").textContent = jsonBody.message;
        }
      })
      .catch((error) => {
        document.getElementById("status").textContent = error.message;
      });
  } else {
    document.getElementById("status").textContent =
      "Please enter a valid code.";
  }
});

document.getElementById("signUpButton").addEventListener("click", () => {
  const userEmail = document.getElementById("user-email").value;
  const checkBox = document.getElementById("checkbox-input").checked;
  if (!checkBox) {
    document.getElementById("email-status").textContent =
      "Please accept the terms and conditions.";
    return;
  }
  document.getElementById("email-status").textContent = "";
  document.getElementById("email-success-status").textContent = "";
  if (
    userEmail.length > 0 &&
    userEmail.includes("@") &&
    userEmail.includes(".")
  ) {
    // Send the code to your backend to save it in MongoDB
    fetch("https://chrome-extension-backend-rriv.onrender.com/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: userEmail }),
    })
      .then(async (response) => {
        const jsonData = await response.json();
        if (response.ok) {
          console.log("Email Created in database");
          document.getElementById("email-success-status").textContent =
            jsonData.message;
        } else {
          document.getElementById("email-status").textContent =
            jsonData.message;
        }
      })
      .catch((error) => {
        document.getElementById("email-status").textContent =
          "Error in validating Email. Please try again";
      });
  } else {
    document.getElementById("email-status").textContent =
      "Please enter a valid email.";
  }
});

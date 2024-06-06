// document.getElementById("takeScreenshot").addEventListener("click", () => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     chrome.tabs.sendMessage(tabs[0].id, { action: "takeScreenshot" });
//   });
// });
console.log("Script loaded");

document.getElementById("saveCode").addEventListener("click", () => {
  const userCode = document.getElementById("userCode").value;
  if (userCode.length > 0) {
    fetch("https://chrome-extension-backend-rriv.onrender.com/user/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: userCode }),
    })
      .then((response) => {
        console.log("response ", response);
        if (response.ok) {
          console.log("Code saved in database");
          // Save the code in Chrome storage
          chrome.storage.sync.set({ userCode: userCode }, () => {
            document.getElementById("status").textContent =
              "Code saved successfully!";

            // Send the code to your backend to save it in MongoDB
          });
        } else {
          console.error("Failed to save code in database");
          document.getElementById("status").textContent =
            "Invalid code. Please enter a valid code.";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        document.getElementById("status").textContent =
          "Invalid code. Please enter a valid code.";
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
      .then((response) => {
        if (response.ok) {
          console.log("Email Created in database");
          document.getElementById("email-success-status").textContent =
            "Code is sent to your email. Please add that code in below input to verify!";
        } else {
          console.error("Failed to save code in database");
          document.getElementById("email-status").textContent =
            "Error in creating email. Please try again.";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        document.getElementById("email-status").textContent =
          "Error in validating Email. Please try again";
      });
  } else {
    document.getElementById("email-status").textContent =
      "Please enter a valid email.";
  }
});

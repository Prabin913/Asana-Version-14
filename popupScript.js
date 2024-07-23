document
  .getElementById("createPdfButton")
  .addEventListener("click", function () {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      async function (tabs) {
        const activeTab = tabs[0];
        if (activeTab.url.includes("app.asana.com")) {
          await chrome.scripting.executeScript({
            target: {
              tabId: activeTab.id,
            },
            func: () => {
              chrome.runtime.sendMessage({
                message: "createPdfRequest",
              });
            },
          });
          document.getElementById("spinner").classList.remove("loading");
        } else {
          document.getElementById("spinner").classList.remove("loading");
          document.querySelector('#message').innerHTML = `<p>this page isn't supported</p>`
        }
      }
    );
  });

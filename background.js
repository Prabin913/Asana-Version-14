chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("$%%^&&*%%")
    if (request.message === "pdfCreated") {
        console.log("$%%^&&*%%2222")
        // Open the PDF in a new tab
        chrome.tabs.create({
            url: URL.createObjectURL(new Blob([message.pdfData], { type: "application/pdf" })),
        });
    }
});
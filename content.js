function insertPageNumbers(contentContainer) {
  let div = document.createElement('div');
  div.style.position = 'relative'; // Ensure the content container has a position set
  div.innerHTML = contentContainer;
  document.body.appendChild(div);

  // Calculate content height after adding it to the document
  const contentHeight = div.clientHeight;
  const pages = Math.ceil(contentHeight / 842); // Assuming each page height is 842px

  for (let i = 0; i < pages; i++) {
    const pageNumber = document.createElement('div');
    pageNumber.textContent = `Page ${i + 1} of ${pages}`;
    pageNumber.style.position = 'absolute';
    pageNumber.style.bottom = '10px'; // Adjust bottom margin as needed
    pageNumber.style.left = '50%';
    pageNumber.style.transform = 'translateX(-50%)'; // Center horizontally
    pageNumber.style.fontSize = '12px'; // Adjust font size as needed
    pageNumber.style.color = '#333'; // Adjust color as needed
    pageNumber.style.opacity = '0.5'; // Adjust opacity as needed
    pageNumber.style.pointerEvents = 'none'; // Ensure the page number does not interfere with interactions
    div.appendChild(pageNumber);
  }
  return div;
}



async function executeScriptInActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        const activeTab = tabs[0];
        chrome.tabs.update(activeTab.id, { active: true });
        const data = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            var elements = document.querySelectorAll('.CustomPropertyEnumValueInput-button--large');

            elements.forEach(function (element) {
              element.classList.add('SpreadsheetMutableDateCell-cell');
            });

            const headerTable1 = document.querySelector(".SpreadsheetHeaderLeftStructure").innerHTML;
            const headerTable2 = document.querySelector(".SpreadsheetHeaderStructure-right").innerHTML;

            const taskContent = document.querySelector("div.SortableList-itemContainer.SortableList-itemContainer--column").innerHTML;

            const headerTable1WithStyle = `<div style=" width:16.65%;  display: inline-block;">${headerTable1}</div>`;

            const headerTable2WithStyle = `<div style=" display: inline-block;">${headerTable2}</div>`;

            const headerContentWithStyle = `<div style=" width:200%;  max-width: 200%; display: flex;">${headerTable1WithStyle}${headerTable2WithStyle}</div>`;
            const taskContentWithStyle = `<div style=" max-width: 35%; margin-top: 10px;">${taskContent}</div>`;

            return `${headerContentWithStyle}  ${taskContentWithStyle}`;
          },
        });

        resolve(data);
      }
    );
  });
}

async function generatePdf(htmlContent, portraitRadio) {
  const div = document.createElement('div');
  div.style.display = "none";
  div.innerHTML = htmlContent;
  document.body.appendChild(div);
  document.getElementById("spinner").classList.add("loading");

  // Wait for a short duration to ensure the content is rendered
  await new Promise(resolve => setTimeout(resolve, 500));

  // Calculate the content height dynamically
  const contentHeight = div.clientHeight;
  const pages = Math.ceil(contentHeight / window.innerHeight);

  // Add footer directly to the HTML content
  const footerHtml = `<div style="position: absolute; bottom: 10px; width: 100%; text-align: center;"><span class="pageNumber"></span></div>`;
  const htmlContentWithFooter = htmlContent + footerHtml;

  const paperFormat = portraitRadio === "landscape" ? 'a3' : 'a3';
  const marginSize = portraitRadio === "landscape" ? [12, 20, 25, 20] : [13, 4, 14, 4];
  const orient =  portraitRadio === "landscape" ? 'landscape' : 'portrait'

  const options = {
    html2canvas: {
      onclone: (element) => {
        const elementsToRemove = element.querySelectorAll(".SomeClassToRemove");
        elementsToRemove.forEach((el) => el.remove());

        const svgElements = Array.from(element.querySelectorAll("svg"));
        svgElements.forEach((s) => {
          const bBox = s.getBBox();

          s.setAttribute("x", bBox.x);
          s.setAttribute("y", bBox.y);
          s.setAttribute("width", bBox.width);
          s.setAttribute("height", bBox.height);
        });
      },
    },
    margin: marginSize,
    image: { type: "jpeg", quality: 1 },
    jsPDF: { unit: "mm", format: paperFormat, orientation: orient},
  };

  await html2pdf().set(options).from(htmlContentWithFooter).toPdf().get('pdf').then(function (pdf) {
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.setPage(i);
      pdf.setFontSize(10);
      // Adjust the x-coordinate to position the page number on the right
      pdf.text(pageWidth - 20, pageHeight - 20, 'Page ' + i + ' of ' + totalPages);
    }
  }).save();

  // Remove the temporary div used for content height calculation
  div.remove();
}


chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.message === "createPdfRequest") {
    try {

      const portraitRadio = document.getElementById("portraitRadio");
      const data = await executeScriptInActiveTab();
      const content = data[0].result;
   
      let logoHtml = '<img src="assets/TAG-Logo-Black.png" alt="Logo" style="width: 100px">';
      if (portraitRadio.checked)
        logoHtml = '<img src="assets/TAG-Logo-Black.png" alt="Logo" style="width: 88px">';
      // Add header at the beginning of the content
      let headerHtml = '<html><body><div style="text-align: right; margin:20px;">' + logoHtml + '</div>';   
      if (portraitRadio.checked)
        headerHtml = '<html><body><div style="text-align: right; margin:25px 20px 20px 20px;">' + logoHtml + '</div>';
      const htmlContentWithHeader = headerHtml + content;

      // Add footer at the end of the content
      const footerHtml = '<div style="text-align: center;"></div>';
      const htmlContentWithFooter = htmlContentWithHeader + footerHtml + '</body></html>';

      await generatePdf(htmlContentWithFooter, portraitRadio.checked ? "portrait" : "landscape");

      document.getElementById("spinner").classList.remove("loading");
      // window.close();
    } catch (error) {
      console.error(error);
    }
  }
});

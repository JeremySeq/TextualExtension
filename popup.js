document.getElementById("openHighlights").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("highlights.html") });
});
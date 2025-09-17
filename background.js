async function showPopup(selectedText) {

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // prompt AI to summarize
    const prompt = `
    Summarize the following text in short bullet points.
    Only output the bullets, no extra commentary.

    ${selectedText}`;

    // ty hackclub for the free ai api <3
    const response = await fetch("https://ai.hackclub.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    let summary = data?.choices?.[0]?.message?.content || "No summary received";

    // remove any <think> sections
    summary = summary.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // turn markdown into html for display
    summary = summary
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^\# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^\* (.*$)/gim, "<li>$1</li>")
      .replace(/\n$/gim, "<br />")
      .replace(/\*\*(.*)\*\*/gim, "<b>$1</b>")
      .replace(/\*(.*)\*/gim, "<i>$1</i>");

    // inject overlay into the current page
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (html) => {
        // create overlay div
        const overlay = document.createElement("div");
        overlay.id = "aiSummaryOverlay";
        overlay.style.position = "fixed";
        overlay.style.top = "20px";
        overlay.style.right = "20px";
        overlay.style.width = "max-content";
        overlay.style.maxWidth = "800px";
        overlay.style.maxHeight = "80vh";
        overlay.style.overflowY = "auto";
        overlay.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
        overlay.style.border = "2px solid #333";
        overlay.style.borderRadius = "8px";
        overlay.style.padding = "15px";
        overlay.style.zIndex = "99999";
        overlay.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
        overlay.style.fontFamily = "sans-serif";
        overlay.style.fontSize = "14px";
        overlay.style.lineHeight = "1.5";
        overlay.style.color = "#666";

        // add a close button
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "x";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "5px";
        closeBtn.style.right = "10px";
        closeBtn.style.border = "none";
        closeBtn.style.background = "transparent";
        closeBtn.style.fontSize = "18px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.color = "#666";
        closeBtn.onclick = () => overlay.remove();
        overlay.appendChild(closeBtn);

        // add summary content
        const content = document.createElement("pre");
        content.innerHTML = html;
        content.style.whiteSpace = "pre-wrap";
        overlay.appendChild(content);

        document.body.appendChild(overlay);
      },
      args: [summary]
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "summarizeSelection",
        title: "Summarize selection",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "saveHighlight",
        title: "Save highlight",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "summarizeSelection" || !tab.id)
        return;
    if (!tab || !tab.id) return;

    try {
        const selectedText = info.selectionText || "";
        if (!selectedText) return;

        console.log(selectedText);
        showPopup(selectedText);
    } catch (error) {
        console.error("Error summarizing selection:", error);
    }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveHighlight" && info.selectionText && tab?.url) {
      saveHighlight(info.selectionText, tab);
    }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-highlight") {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    // grab highlighted text from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });

    const selectedText = results?.[0]?.result || "";
    if (!selectedText) return;

    saveHighlight(selectedText, tab);
  }
});


function saveHighlight(selectedText, tab) {
    const highlight = {
      url: tab.url,
      text: selectedText,
      time: Date.now()
    };

    chrome.storage.local.get({ highlights: [] }, (data) => {
      const highlights = data.highlights;
      highlights.push(highlight);
      chrome.storage.local.set({ highlights });
    });

    // notification
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (msg) => {
        const toast = document.createElement("div");
        toast.textContent = msg;
        toast.style.position = "fixed";
        toast.style.top = "-50px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.background = "#3498db";
        toast.style.color = "#fff";
        toast.style.padding = "8px 12px";
        toast.style.borderRadius = "5px";
        toast.style.fontSize = "14px";
        toast.style.zIndex = "999999";
        toast.style.transition = "top 0.25s ease-in-out";
        document.body.appendChild(toast);
        setTimeout(() => {toast.style.top = "20px";}, 2);
        setTimeout(() => {toast.style.top = "-50px";}, 2000);
        setTimeout(() => toast.remove(), 3000);
      },
      args: ["Highlight saved!"]
    });
}

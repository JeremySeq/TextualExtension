function renderHighlights(highlights) {
    const list = document.getElementById("list");
    list.innerHTML = "";

    if (highlights.length === 0) {
        list.innerHTML = `<p class='emptyText'>
            No highlights saved.<br>
            Highlight some text, then right click and select <strong>Text Summarizer > Save Highlight</strong> or use the keyboard shortcut <strong>Ctrl+Shift+H</strong>.
            </p>`;
        return;
    }

    highlights.forEach((h, i) => {
        const div = document.createElement("div");
        div.className = "highlight";
        div.innerHTML = `
            <div class="text">${h.text}</div>
            <a class="url" href="${h.url}" target="_blank">${h.url}</a>
            <small>${new Date(h.time).toLocaleString()}</small>
            <button data-index="${i}">Delete</button>
        `;
        list.appendChild(div);
    });

    document.querySelectorAll("button[data-index]").forEach(btn => {
        btn.addEventListener("click", () => {
            highlights.splice(btn.dataset.index, 1);
            chrome.storage.local.set({ highlights }, () => renderHighlights(highlights));
        });
    });
}

chrome.storage.local.get({ highlights: [] }, (data) => {
    renderHighlights(data.highlights);
});

document.getElementById("export").addEventListener("click", () => {
    chrome.storage.local.get({ highlights: [] }, (data) => {
        const content = data.highlights.map(h =>
            `${h.text}\n${h.url}\n${new Date(h.time).toLocaleString()}\n\n`
        ).join("");
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "highlights.txt";
        a.click();
    });
});

document.getElementById("clear").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all highlights?")) {
        chrome.storage.local.set({ highlights: [] }, () => renderHighlights([]));
    }
});


const memes = [
    "errrrmmmm...textual evidence?",
    "made with java!.... script",
    "as seen on tv!",
    "to highlight, or not to highlight, that is the question.",
    "I put the 'lit' in literature.",
    "I'm silently judging your highlights.",
]
const randomIndex = Math.floor(Math.random() * memes.length);
const randomPhrase = memes[randomIndex]

document.getElementById("memeText").textContent = randomPhrase;
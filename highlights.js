const searchInput = document.getElementById("search");

function renderHighlights(highlights) {
    const query = searchInput.value.toLowerCase();
    const filtered = highlights.filter(h => h.text.toLowerCase().includes(query) || h.url.toLowerCase().includes(query));
    
    
    const list = document.getElementById("list");
    list.innerHTML = "";

    if (highlights.length === 0) {
        list.innerHTML = `<p class='emptyText'>
            No highlights saved.<br>
            Highlight some text, then right click and select <strong>Text Summarizer > Save Highlight</strong> or use the keyboard shortcut <strong>Ctrl+Shift+H</strong>.
            </p>`;
        return;
    }

    if (filtered.length === 0) {
        list.innerHTML = `<p class='emptyText'>
            No results.<br>
            </p>`;
        return;
    }

    let draggedIndex = null;

    filtered.forEach((h, i) => {
        const div = document.createElement("div");
        div.className = "highlight";
        div.draggable = true;
        div.dataset.index = i;
        div.innerHTML = `
            <div class="text">${h.text}</div>
            <a class="url" href="${h.url}" target="_blank">${h.url}</a>
            <small>${new Date(h.time).toLocaleString()}</small>
            <div class="highlightOptions">
                <button data-index="${i*2}">Copy</button>
                <button data-index="${i*2+1}">Delete</button>
            </div>
        `;

        // drag and drop
        div.addEventListener("dragstart", () => {
            draggedIndex = i;
        });

        div.addEventListener("dragend", () => {
            draggedIndex = null;
        });

        div.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        div.addEventListener("drop", () => {
            if (draggedIndex === null || draggedIndex === i) return;

            const movedItem = highlights.find(hh => hh.time === filtered[draggedIndex].time && hh.text === filtered[draggedIndex].text);
            const fromIndex = highlights.findIndex(hh => hh.time === movedItem.time && hh.text === movedItem.text);
            const toIndex = highlights.findIndex(hh => hh.time === filtered[i].time && hh.text === filtered[i].text);
            const temp = highlights[fromIndex];
            highlights[fromIndex] = highlights[toIndex];
            highlights[toIndex] = temp;
            chrome.storage.local.set({ highlights }, () => renderHighlights(highlights));
        });

        list.appendChild(div);
    });

    document.querySelectorAll("button[data-index]").forEach(btn => {
        if (btn.dataset.index % 2 == 1) {
            btn.addEventListener("click", () => {
                const target = filtered[(btn.dataset.index-1)/2];

                const realIndex = highlights.findIndex(h => h.time === target.time && h.text === target.text);

                if (realIndex > -1) {
                    highlights.splice(realIndex, 1);
                    chrome.storage.local.set({ highlights }, () => renderHighlights(highlights));
                }
            });
        } else {
            btn.addEventListener("click", () => {
                navigator.clipboard.writeText(filtered[btn.dataset.index/2].text);
                btn.textContent = "Copied!";
                setTimeout(() => btn.textContent = "Copy", 2000);
            });
        }
    });
}

chrome.storage.local.get({ highlights: [] }, (data) => {
    renderHighlights(data.highlights);
});

// re-render when search input changes
searchInput.addEventListener("input", () => {
    chrome.storage.local.get({ highlights: [] }, (data) => renderHighlights(data.highlights));
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
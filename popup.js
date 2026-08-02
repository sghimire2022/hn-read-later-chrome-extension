const STORAGE_KEY = "hnReadLater";
let view = "unread";

async function getSaved() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || {};
}

async function setSaved(saved) {
  await chrome.storage.local.set({ [STORAGE_KEY]: saved });
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

async function render() {
  const saved = await getSaved();
  const items = Object.values(saved)
    .filter((it) => (view === "unread" ? !it.read : it.read))
    .sort((a, b) => b.savedAt - a.savedAt);

  const list = document.getElementById("list");
  list.innerHTML = "";

  const unreadCount = Object.values(saved).filter((it) => !it.read).length;
  document.getElementById("count").textContent =
    unreadCount === 1 ? "1 unread" : `${unreadCount} unread`;

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent =
      view === "unread"
        ? "Nothing saved yet. Click \u201cread later\u201d next to any story on Hacker News."
        : "No read items yet. Mark a story as read and it moves here.";
    list.appendChild(empty);
    return;
  }

  for (const it of items) {
    const div = document.createElement("div");
    div.className = "item" + (it.read ? " read" : "");

    const title = document.createElement("a");
    title.className = "title";
    title.href = it.url;
    title.target = "_blank";
    title.rel = "noopener";
    title.textContent = it.title;
    // Opening a story marks it read
    title.addEventListener("click", async () => {
      const saved = await getSaved();
      if (saved[it.id]) {
        saved[it.id].read = true;
        await setSaved(saved);
      }
    });

    const meta = document.createElement("div");
    meta.className = "meta";

    const time = document.createElement("span");
    time.textContent = timeAgo(it.savedAt);

    const comments = document.createElement("a");
    comments.href = it.commentsUrl;
    comments.target = "_blank";
    comments.rel = "noopener";
    comments.textContent = "comments";

    const toggle = document.createElement("button");
    toggle.textContent = it.read ? "mark unread" : "mark read";
    toggle.addEventListener("click", async () => {
      const saved = await getSaved();
      if (saved[it.id]) {
        saved[it.id].read = !saved[it.id].read;
        await setSaved(saved);
        render();
      }
    });

    const remove = document.createElement("button");
    remove.textContent = "remove";
    remove.addEventListener("click", async () => {
      const saved = await getSaved();
      delete saved[it.id];
      await setSaved(saved);
      render();
    });

    meta.append(time, comments, toggle, remove);
    div.append(title, meta);
    list.appendChild(div);
  }
}

document.getElementById("tab-unread").addEventListener("click", () => {
  view = "unread";
  document.getElementById("tab-unread").classList.add("active");
  document.getElementById("tab-read").classList.remove("active");
  render();
});

document.getElementById("tab-read").addEventListener("click", () => {
  view = "read";
  document.getElementById("tab-read").classList.add("active");
  document.getElementById("tab-unread").classList.remove("active");
  render();
});

document.getElementById("clear-read").addEventListener("click", async () => {
  const saved = await getSaved();
  for (const id of Object.keys(saved)) {
    if (saved[id].read) delete saved[id];
  }
  await setSaved(saved);
  render();
});

render();

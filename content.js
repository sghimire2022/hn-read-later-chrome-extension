// HN Read Later — content script
// Runs on news.ycombinator.com. Adds a "read later" link in the subtext row
// of every story, and marks stories that are already saved.

const STORAGE_KEY = "hnReadLater";

async function getSaved() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || {};
}

async function setSaved(saved) {
  await chrome.storage.local.set({ [STORAGE_KEY]: saved });
}

// Extract story info given its row id (HN uses <tr class="athing" id="12345">)
function getStoryInfo(athing) {
  const id = athing.id;
  const titleLink = athing.querySelector(".titleline > a");
  if (!titleLink) return null;

  const subtext = athing.nextElementSibling?.querySelector(".subtext");
  const points = subtext?.querySelector(".score")?.textContent || "";
  const commentsLink = subtext
    ? [...subtext.querySelectorAll("a")].find((a) =>
        /comment|discuss/.test(a.textContent)
      )
    : null;

  return {
    id,
    title: titleLink.textContent.trim(),
    url: titleLink.href,
    commentsUrl: commentsLink
      ? commentsLink.href
      : `https://news.ycombinator.com/item?id=${id}`,
    points,
    savedAt: Date.now(),
    read: false,
  };
}

function setLinkState(a, isSaved) {
  a.textContent = isSaved ? "saved \u2713" : "read later";
  a.classList.toggle("hn-rl-saved", isSaved);
}

function setIconState(a, isSaved) {
  a.classList.toggle("hn-rl-saved", isSaved);
  a.title = isSaved ? "Remove from read later" : "Save for later";
  a.setAttribute("aria-label", a.title);
}

async function toggleStory(story) {
  const current = await getSaved();
  let isSaved;
  if (current[story.id]) {
    delete current[story.id];
    isSaved = false;
  } else {
    current[story.id] = { ...story, savedAt: Date.now() };
    isSaved = true;
  }
  await setSaved(current);
  return isSaved;
}

function makeLink(saved, story) {
  const a = document.createElement("a");
  a.href = "#";
  a.className = "hn-rl-link";
  setLinkState(a, Boolean(saved[story.id]));

  a.addEventListener("click", async (e) => {
    e.preventDefault();
    const isSaved = await toggleStory(story);
    setLinkState(a, isSaved);
    syncControls(story.id, isSaved);
  });

  return a;
}

const ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 1.5h10a.5.5 0 0 1 .5.5v13l-5.5-3.5L2.5 15V2a.5.5 0 0 1 .5-.5z"/></svg>';

function makeIcon(saved, story) {
  const a = document.createElement("a");
  a.href = "#";
  a.className = "hn-rl-icon";
  a.innerHTML = ICON_SVG;
  setIconState(a, Boolean(saved[story.id]));

  a.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isSaved = await toggleStory(story);
    setIconState(a, isSaved);
    syncControls(story.id, isSaved);
  });

  return a;
}

// Update every control for a story id on the current page immediately
// (storage.onChanged also fires, but that's async and this keeps clicks snappy).
function syncControls(id, isSaved) {
  const athing = document.getElementById(id);
  if (!athing) return;
  const link = athing.nextElementSibling?.querySelector(".hn-rl-link");
  if (link) setLinkState(link, isSaved);
  const icon = athing.querySelector(".hn-rl-icon");
  if (icon) setIconState(icon, isSaved);
}

async function init() {
  const saved = await getSaved();
  const rows = document.querySelectorAll("tr.athing");

  rows.forEach((athing) => {
    const story = getStoryInfo(athing);
    if (!story) return;

    const titleLink = athing.querySelector(".titleline > a");
    if (titleLink && !athing.querySelector(".hn-rl-icon")) {
      titleLink.insertAdjacentElement("afterend", makeIcon(saved, story));
      titleLink.insertAdjacentText("afterend", " ");
    }

    const subtext = athing.nextElementSibling?.querySelector(".subtext");
    if (!subtext || subtext.querySelector(".hn-rl-link")) return;

    const sep = document.createTextNode(" | ");
    subtext.appendChild(sep);
    subtext.appendChild(makeLink(saved, story));
  });

  // Also support the single item page (item?id=...)
  const itemRow = document.querySelector("table.fatitem tr.athing");
  if (itemRow) {
    const story = getStoryInfo(itemRow);
    const titleLink = itemRow.querySelector(".titleline > a");
    if (story && titleLink && !itemRow.querySelector(".hn-rl-icon")) {
      titleLink.insertAdjacentElement("afterend", makeIcon(saved, story));
      titleLink.insertAdjacentText("afterend", " ");
    }

    const subtext = document.querySelector("table.fatitem .subtext");
    if (story && subtext && !subtext.querySelector(".hn-rl-link")) {
      subtext.appendChild(document.createTextNode(" | "));
      subtext.appendChild(makeLink(saved, story));
    }
  }
}

// Keep links in sync if the list changes from the popup while a HN tab is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[STORAGE_KEY]) return;
  const saved = changes[STORAGE_KEY].newValue || {};
  document.querySelectorAll("tr.athing").forEach((athing) => {
    const isSaved = Boolean(saved[athing.id]);
    const link = athing.nextElementSibling?.querySelector(".hn-rl-link");
    if (link) setLinkState(link, isSaved);
    const icon = athing.querySelector(".hn-rl-icon");
    if (icon) setIconState(icon, isSaved);
  });
});

init();

# HN Read Later

A tiny Chrome extension for [Hacker News](https://news.ycombinator.com) that lets you save stories to read later instead of losing them in the scroll.

- A bookmark icon next to every story title, and a "read later" link in the subtext row — click either to save
- A toolbar popup with your saved list, split into **Unread** / **Read** tabs
- Opening a saved story automatically marks it read
- Everything is stored locally in your browser — no accounts, no servers, no tracking

## Install

Not yet on the Chrome Web Store. To install from source:

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Visit [news.ycombinator.com](https://news.ycombinator.com) — you should see a bookmark icon next to each title and a "read later" link in the subtext row.

## Usage

- Click the bookmark icon next to a title, or the "read later" link under a story, to save it. Click again to unsave.
- Click the extension icon in the toolbar to open your reading list.
- Clicking a story's title in the popup opens it and marks it as read.
- Use "mark read" / "mark unread" to manage status manually, or "remove" to delete an item.
- "Clear read items" removes everything in the Read tab at once.

## How it works

The content script (`content.js`) runs only on `news.ycombinator.com`, injects the save controls into the page, and reads/writes a single `hnReadLater` entry in `chrome.storage.local`, keyed by story ID. The popup (`popup.js`) reads the same storage to render the list. A `storage.onChanged` listener keeps everything in sync if you have multiple HN tabs open.

The extension requests only the `storage` permission — it makes no network requests of its own and has no access to any site other than news.ycombinator.com.

## Project structure

```
manifest.json    Manifest V3 config
content.js       Injects save controls on news.ycombinator.com
content.css      Styles for the injected controls
popup.html       Toolbar popup markup
popup.js         Popup logic (list rendering, tabs, actions)
popup.css        Popup styles
icons/           Extension icons (16/48/128px)
```

## Contributing

Issues and pull requests are welcome. This is a small, dependency-free extension by design — plain HTML/CSS/JS, no build step. Please keep changes in that spirit.

## License

[MIT](LICENSE)

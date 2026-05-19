# Changelog

## 0.0.1

### Added
- Added a GitHub Actions `e2e` workflow to run end-to-end checks in CI.
- Added a fullscreen thumbnail directory mode for faster navigation across many uploaded pages.
- Added upload-batch grouping in the directory so pages from multiple upload actions are separated and easier to scan.
- Added keyboard shortcuts for directory navigation and control: `G` to toggle the directory, and `+` / `-` to resize thumbnails when the directory is open.
- Added `PageUp` / `PageDown` shortcuts to quickly jump to the previous or next image card from the main view.
- Added a dedicated keyboard-shortcuts help modal with entry points in both the header and directory toolbar.
- Added Playwright end-to-end coverage for fullscreen directory browsing, including `G` toggle, thumbnail click-to-jump, `+` / `-` thumbnail size controls, and `PageUp` / `PageDown` navigation checks.

### Changed
- Replaced the inline processing status bar with a fullscreen loading overlay to improve visibility during file processing.
- Updated append-mode auto-scroll behavior to focus on the first newly added image card instead of the last one.
- Updated directory thumbnails to use image aspect ratio based rendering, reducing large top/bottom whitespace for slide-like pages.
- Updated the directory size slider behavior to control thumbnail width more naturally while preserving per-user preference.
- Reordered the left panel inside each result card so the original image appears above per-image parameter controls, while keeping the right-side segmented results layout unchanged.
- Refactored keyboard shortcut handling into a dedicated `js/hotkeys.js` module, and centralized key bindings via a single configuration map for easier future customization.
- Unified `Esc` handling in the hotkey module so it consistently closes active overlays (shortcuts modal, lightbox, editor, and directory) from one place.
- Improved the new directory navigation e2e assertion strategy to reduce smooth-scroll flakiness by validating the most visible active card instead of strict pixel-top thresholds.

### Fixed
- Added a project-level JSHint configuration with ES6 support to prevent `W104`/`W119` warnings for modern syntax (`const`, `let`, arrow functions, and `for...of`) in `js/main.js`.
- Fixed a missing semicolon in the `window.blur` event listener in `js/main.js` to clear the remaining JSHint warning.

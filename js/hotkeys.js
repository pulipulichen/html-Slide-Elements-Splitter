let hotkeysInitialized = false;

const HOTKEYS = {
    closeModal: ['Escape'],
    toggleDirectory: ['g'],
    previousImage: ['PageUp'],
    nextImage: ['PageDown'],
    directoryThumbLarger: ['+', '='],
    directoryThumbSmaller: ['-', '_']
};

function matchesHotkey(e, bindings, caseInsensitive = false) {
    if (!bindings || bindings.length === 0) return false;
    if (caseInsensitive) {
        const pressedKey = e.key.toLowerCase();
        return bindings.some(key => key.toLowerCase() === pressedKey);
    }
    return bindings.includes(e.key);
}

function isTypingTarget(target) {
    if (!target) return false;
    return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
    );
}

function isVisible(el) {
    return !!el && !el.classList.contains('hidden');
}

function handleEscapeHotkey() {
    let handled = false;

    if (state.shortcutsModalOpen) {
        toggleShortcutsModal(false);
        return true;
    }

    if (isVisible(DOM.lightbox)) {
        closeLightbox();
        handled = true;
    }
    if (isVisible(DOM.editorModal)) {
        closeEditor();
        handled = true;
    }
    if (state.directoryModalOpen) {
        toggleDirectoryModal(false);
        handled = true;
    }

    return handled;
}

function handleGlobalHotkeys(e) {
    if (matchesHotkey(e, HOTKEYS.closeModal)) {
        if (handleEscapeHotkey()) {
            e.preventDefault();
        }
        return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(e.target)) return;

    if (matchesHotkey(e, HOTKEYS.toggleDirectory, true)) {
        e.preventDefault();
        toggleDirectoryModal();
        return;
    }

    const isPageDown = matchesHotkey(e, HOTKEYS.nextImage);
    const isPageUp = matchesHotkey(e, HOTKEYS.previousImage);
    const hasBlockingModal =
        state.directoryModalOpen ||
        state.shortcutsModalOpen ||
        isVisible(DOM.lightbox) ||
        isVisible(DOM.editorModal) ||
        isVisible(DOM.settingsModal) ||
        isVisible(DOM.promptsModal);

    if (!hasBlockingModal && (isPageDown || isPageUp)) {
        const didJump = jumpToAdjacentImage(isPageDown ? 1 : -1);
        if (didJump) e.preventDefault();
        return;
    }

    const isPlus = matchesHotkey(e, HOTKEYS.directoryThumbLarger);
    const isMinus = matchesHotkey(e, HOTKEYS.directoryThumbSmaller);
    if (!isPlus && !isMinus) return;
    if (!state.directoryModalOpen) return;

    e.preventDefault();
    const delta = isPlus ? 10 : -10;
    setDirectoryThumbSize(state.directoryThumbSize + delta, true);
}

window.initHotkeys = () => {
    if (hotkeysInitialized) return;
    window.addEventListener('keydown', handleGlobalHotkeys);
    hotkeysInitialized = true;
};

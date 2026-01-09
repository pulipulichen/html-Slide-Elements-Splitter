// --- Init ---
function initSettings() {
    const savedSize = localStorage.getItem(LS_KEYS.SIZE);
    const savedMerge = localStorage.getItem(LS_KEYS.MERGE);
    const savedTol = localStorage.getItem(LS_KEYS.TOL);

    const initialSize = savedSize !== null ? parseFloat(savedSize) : 0.5;
    const initialMerge = savedMerge !== null ? parseFloat(savedMerge) : 2;
    const initialTol = savedTol !== null ? parseInt(savedTol) : 10;

    DOM.g_size.value = initialSize;
    DOM.g_sizeInput.value = initialSize;
    DOM.g_merge.value = initialMerge;
    DOM.g_mergeInput.value = initialMerge;
    DOM.g_tol.value = initialTol;
    DOM.g_tolInput.value = initialTol;

    DOM.apiKeyInput.value = state.apiConfig.key;
    DOM.modelInput.value = state.apiConfig.model;
    DOM.baseUrlInput.value = state.apiConfig.baseUrl;

    updateSidebarUI();
}

// Initialize settings
initSettings();

// Sync global inputs
syncInputs(DOM.g_size, DOM.g_sizeInput, LS_KEYS.SIZE);
syncInputs(DOM.g_merge, DOM.g_mergeInput, LS_KEYS.MERGE);
syncInputs(DOM.g_tol, DOM.g_tolInput, LS_KEYS.TOL);

// --- File Inputs ---
DOM.fileInput.onchange = (e) => handleFiles(e.target.files);
DOM.pdfUrlButton.addEventListener('click', () => handlePdfUrl(DOM.pdfUrlInput.value));

// 如果網頁參數有 demo=1，那麼就點選 DOM.pdfUrlButton
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('demo') === '1') {
    DOM.pdfUrlButton.click();
}

DOM.pdfUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handlePdfUrl(DOM.pdfUrlInput.value);
    }
});

window.addEventListener('paste', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return; 
    }

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const files = [];
    for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            files.push(new File([file], `pasted_${Date.now()}.png`, { type: file.type }));
        }
    }
    if (files.length) handleFiles(files, true);
});

window.addEventListener('dragenter', () => DOM.dragOverlay.classList.remove('hidden'));
window.addEventListener('dragleave', (e) => {
    if (e.clientX === 0 && e.clientY === 0) DOM.dragOverlay.classList.add('hidden');
});
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dragOverlay.classList.add('hidden');
    handleFiles(e.dataTransfer.files, true);
});

window.addEventListener('blur', (e) => {
    DOM.dragOverlay.classList.add('hidden');
})

// --- Exit Confirmation ---
window.addEventListener('beforeunload', (e) => {
    if (state.images.length > 0) {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers
    }
});

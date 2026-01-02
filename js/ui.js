// --- Lightbox & Modal Functions ---
window.openLightbox = (src, event) => {
    if(event) event.stopPropagation();
    DOM.lightboxImg.src = src;
    DOM.lightbox.classList.remove('hidden');
    resetZoom();
    document.addEventListener('keydown', handleEscKey);
};

window.closeLightbox = () => {
    DOM.lightbox.classList.add('hidden');
    document.removeEventListener('keydown', handleEscKey);
    setTimeout(() => { DOM.lightboxImg.src = ''; resetZoom(); }, 300);
};

function handleEscKey(e) {
    if (e.key === 'Escape') {
        if(!DOM.lightbox.classList.contains('hidden')) closeLightbox();
        if(!DOM.editorModal.classList.contains('hidden')) closeEditor();
    }
}

function resetZoom() {
    state.lightbox.isZoomed = false;
    state.lightbox.scale = 1;
    DOM.lightboxImg.style.transform = `scale(1)`;
    DOM.lightboxImg.style.transformOrigin = `center center`;
    DOM.lightboxImg.classList.remove('zoom-out');
    DOM.lightboxImg.classList.add('zoom-in');
}

window.toggleZoom = (e) => {
    e.stopPropagation();
    state.lightbox.isZoomed = !state.lightbox.isZoomed;
    if (state.lightbox.isZoomed) {
        state.lightbox.scale = state.lightbox.maxScale;
        DOM.lightboxImg.classList.remove('zoom-in');
        DOM.lightboxImg.classList.add('zoom-out');
        panImage(e);
    } else {
        resetZoom();
    }
};

window.panImage = (e) => {
    if (!state.lightbox.isZoomed) return;
    const img = DOM.lightboxImg;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    img.style.transform = `scale(${state.lightbox.scale})`;
};

let toastTimeout;
window.showToast = (message, iconClass = "fa-info-circle") => {
    DOM.toastMsg.innerText = message;
    DOM.toastIcon.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
    DOM.toast.classList.remove('opacity-0', 'pointer-events-none');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { DOM.toast.classList.add('opacity-0', 'pointer-events-none'); }, 3000);
};

window.toggleSidebar = (forceState) => {
    if (typeof forceState !== 'undefined') {
        state.sidebarOpen = forceState;
    } else {
        state.sidebarOpen = !state.sidebarOpen;
    }
    localStorage.setItem(LS_KEYS.SIDEBAR, state.sidebarOpen);
    updateSidebarUI();
};

function updateSidebarUI() {
    if (state.sidebarOpen) {
        DOM.mainSidebar.classList.remove('hidden');
        DOM.mainSidebar.classList.add('flex');
    } else {
        DOM.mainSidebar.classList.add('hidden');
        DOM.mainSidebar.classList.remove('flex');
    }
}

window.toggleSettingsModal = () => {
    DOM.settingsModal.classList.toggle('hidden');
};

window.saveApiSettings = () => {
    const key = DOM.apiKeyInput.value.trim();
    const model = DOM.modelInput.value.trim();
    const baseUrl = DOM.baseUrlInput.value.trim();
    localStorage.setItem(LS_KEYS.API_KEY, key);
    localStorage.setItem(LS_KEYS.MODEL, model);
    localStorage.setItem(LS_KEYS.BASE_URL, baseUrl);
    state.apiConfig = { key, model, baseUrl };
    localStorage.setItem(LS_KEYS.SIZE, DOM.g_size.value);
    localStorage.setItem(LS_KEYS.MERGE, DOM.g_merge.value);
    localStorage.setItem(LS_KEYS.TOL, DOM.g_tol.value);
    toggleSettingsModal();
    showToast("設定已儲存", "fa-check");
};

function syncInputs(slider, number, storageKey) {
    const update = (val) => {
        let v = parseFloat(val);
        if(isNaN(v)) v = 0;
        slider.value = v;
        number.value = v;
        localStorage.setItem(storageKey, v); 
    };
    slider.addEventListener('input', () => { number.value = slider.value; });
    slider.addEventListener('change', () => update(slider.value));
    number.addEventListener('change', () => update(number.value));
}

// These will be initialized in init.js
// syncInputs(DOM.g_size, DOM.g_sizeInput, LS_KEYS.SIZE);
// syncInputs(DOM.g_merge, DOM.g_mergeInput, LS_KEYS.MERGE);
// syncInputs(DOM.g_tol, DOM.g_tolInput, LS_KEYS.TOL);

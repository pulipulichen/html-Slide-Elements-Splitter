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

window.togglePromptsModal = () => {
    const isHidden = DOM.promptsModal.classList.toggle('hidden');
    if (!isHidden) {
        renderPromptsList();
    }
};

window.renderPromptsList = () => {
    DOM.promptsList.innerHTML = '';
    state.prompts.forEach((prompt, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 group';
        item.style.cursor = "pointer"
        item.addEventListener('click', () => {
            copyPrompt(index);
        });
        item.innerHTML = `
            <div class="flex-1 text-sm text-slate-700 break-all">${prompt}</div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="copyPrompt(${index})" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" title="複製">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <button onclick="deletePrompt(${index}, event)" class="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="刪除">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        DOM.promptsList.appendChild(item);
    });
};

window.addPrompt = () => {
    const text = DOM.newPromptInput.value.trim();
    if (!text) return;
    state.prompts.push(text);
    localStorage.setItem(LS_KEYS.PROMPTS, JSON.stringify(state.prompts));
    DOM.newPromptInput.value = '';
    renderPromptsList();
    showToast("提示詞已新增", "fa-check");
};

window.deletePrompt = (index, event) => {
    if (event) event.stopPropagation(); // 阻止事件冒泡向上傳播

    state.prompts.splice(index, 1);
    localStorage.setItem(LS_KEYS.PROMPTS, JSON.stringify(state.prompts));
    renderPromptsList();
    showToast("提示詞已刪除", "fa-trash-can");
};


window.copyPrompt = (index) => {
    const text = state.prompts[index];
    navigator.clipboard.writeText(text).then(() => {
        showToast("提示詞已複製到剪貼簿", "fa-copy");
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showToast("提示詞複製失敗", "fa-exclamation-circle");
    });
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

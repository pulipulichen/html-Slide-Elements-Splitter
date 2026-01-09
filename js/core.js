// --- Core Logic ---
window.handleFiles = async (fileList, append = false) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    if (!append) {
        state.images = [];
        DOM.resultsArea.innerHTML = '';
        DOM.sidebarContent.innerHTML = '';
    }
    DOM.emptyState.classList.add('hidden');

    DOM.resultsArea.classList.remove('hidden');
    DOM.statusMsg.classList.remove('hidden');
    DOM.statusText.innerText = "讀取檔案中...";

    toggleSidebar(true);

    const newImages = [];
    const globalSettings = getGlobalSettings();

    try {
        for (const file of files) {
            if (file.type === 'application/pdf') {
                DOM.statusText.innerText = `解析 PDF: ${file.name}`;
                const pdfImages = await processPDF(file);
                pdfImages.forEach(img => {
                    newImages.push(createImageObject(img.name, img.element, globalSettings));
                });
            } else if (file.type.startsWith('image/')) {
                DOM.statusText.innerText = `讀取圖片: ${file.name}`;
                const imgEl = await loadImage(file);
                newImages.push(createImageObject(file.name, imgEl, globalSettings));
            }
        }

        state.images = [...state.images, ...newImages];
        DOM.statusText.innerText = "智慧分析與裁切中...";
        await new Promise(r => setTimeout(r, 50));

        for (const imgData of newImages) {
            smartDetect(imgData);
            appendResultCard(imgData);
        }
        initScrollSpy();

        if (append && newImages.length > 0) {
            const lastId = newImages[newImages.length - 1].id;
            const lastCard = document.getElementById(`card-${lastId}`);
            if (lastCard) {
                lastCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

    } catch (e) {
        console.error(e);
        alert("處理發生錯誤: " + e.message);
    } finally {
        DOM.statusMsg.classList.add('hidden');
    }
};

function createImageObject(name, element, settings) {
    return {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        imgElement: element,
        settings: { ...settings }, 
        objects: [],
        processedCanvas: null,
        ocrResults: [] // Changed from single ocrResult to array
    };
}

window.applyGlobalToAll = () => {
    if (state.images.length === 0) return;
    const globalSettings = getGlobalSettings();
    state.images.forEach(img => { img.settings = { ...globalSettings }; });
    reprocessAllImages();
    showToast("已套用全域參數", "fa-layer-group");
};

function getGlobalSettings() {
    return {
        size: parseFloat(DOM.g_sizeInput.value),
        merge: parseFloat(DOM.g_mergeInput.value),
        tolerance: parseInt(DOM.g_tolInput.value)
    };
}

async function reprocessAllImages() {
    DOM.resultsArea.innerHTML = '';
    DOM.sidebarContent.innerHTML = '';
    for (const imgData of state.images) {
        const result = detectObjects(imgData.imgElement, imgData.settings);
        // Preserve manual objects
        const manualObjs = imgData.objects.filter(o => o.isManual);
        imgData.objects = [...result.objects, ...manualObjs];
        
        imgData.processedCanvas = result.transparentCanvas;
        imgData.autoTuned = null;
        appendResultCard(imgData);
    }
    initScrollSpy();
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

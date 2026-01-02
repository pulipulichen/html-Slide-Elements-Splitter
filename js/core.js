// --- Core Logic ---
window.handleFiles = async (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    state.images = [];
    DOM.resultsArea.innerHTML = '';
    DOM.sidebarContent.innerHTML = '';
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

// --- Core Detection ---
function smartDetect(imgData) {
    let currentSettings = { ...imgData.settings };
    let result = detectObjects(imgData.imgElement, currentSettings);
    
    if (result.objects.length === 1 && currentSettings.merge > 0) {
        let tempSettings = { ...currentSettings };
        for (let m = tempSettings.merge - 0.5; m >= 0; m -= 0.5) {
            tempSettings.merge = Math.max(0, parseFloat(m.toFixed(1)));
            let tempRes = detectObjects(imgData.imgElement, tempSettings);
            if (tempRes.objects.length >= 3) {
                imgData.settings = tempSettings;
                imgData.objects = tempRes.objects;
                imgData.processedCanvas = tempRes.transparentCanvas;
                return;
            }
        }
    }

    if (result.objects.length === 0) {
        const strategy1Settings = { ...imgData.settings, merge: 10 }; 
        let res1 = detectObjects(imgData.imgElement, strategy1Settings);
        if (res1.objects.length > 0) {
            imgData.settings = strategy1Settings;
            imgData.objects = res1.objects;
            imgData.processedCanvas = res1.transparentCanvas;
            return;
        }
        const strategy2Settings = { ...imgData.settings, size: 0, merge: 5 }; 
        let res2 = detectObjects(imgData.imgElement, strategy2Settings);
        if (res2.objects.length > 0) {
            imgData.settings = strategy2Settings;
            imgData.objects = res2.objects;
            imgData.processedCanvas = res2.transparentCanvas;
            return;
        }
    }

    imgData.objects = result.objects;
    imgData.processedCanvas = result.transparentCanvas;
    imgData.autoTuned = null;
}

function detectObjects(img, settings) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const tolerance = settings.tolerance;
    const minPixels = (width * height) * (settings.size / 100);
    const mergePx = width * (settings.merge / 100); 

    let bgR=0, bgG=0, bgB=0, count=0;
    for(let y=0; y<Math.min(5, height); y++) {
        for(let x=0; x<Math.min(5, width); x++) {
            const i = (y*width+x)*4;
            bgR += data[i]; bgG += data[i+1]; bgB += data[i+2]; count++;
        }
    }
    bgR=Math.round(bgR/count); bgG=Math.round(bgG/count); bgB=Math.round(bgB/count);

    const visited = new Uint8Array(width * height);
    const isBg = (r,g,b) => Math.abs(r-bgR)<tolerance && Math.abs(g-bgG)<tolerance && Math.abs(b-bgB)<tolerance;

    for(let i=0; i<data.length; i+=4) {
        if(isBg(data[i], data[i+1], data[i+2])) {
            visited[i/4] = 1; 
            data[i+3] = 0; 
        }
    }
    ctx.putImageData(imageData, 0, 0);

    let rawObjects = [];
    const skip = 2; 
    for(let y=0; y<height; y+=skip) {
        for(let x=0; x<width; x+=skip) {
            const idx = y*width + x;
            if(visited[idx] === 0) {
                const bounds = { minX: x, maxX: x, minY: y, maxY: y, count: 0 };
                const stack = [idx];
                visited[idx] = 1;
                while(stack.length) {
                    const cur = stack.pop();
                    const cx = cur % width;
                    const cy = Math.floor(cur / width);
                    bounds.count++;
                    if(cx < bounds.minX) bounds.minX = cx;
                    if(cx > bounds.maxX) bounds.maxX = cx;
                    if(cy < bounds.minY) bounds.minY = cy;
                    if(cy > bounds.maxY) bounds.maxY = cy;
                    [cur-1, cur+1, cur-width, cur+width].forEach(n => {
                        if(n>=0 && n<visited.length && visited[n]===0) {
                            if (Math.abs((n%width) - (cur%width)) > 1) return;
                            visited[n] = 1;
                            stack.push(n);
                        }
                    });
                }
                if((bounds.maxX-bounds.minX)*(bounds.maxY-bounds.minY) > 10) rawObjects.push(bounds);
            }
        }
    }

    if (mergePx > 0 && rawObjects.length > 1) {
        let changed = true;
        while(changed) {
            changed = false;
            for(let i=0; i<rawObjects.length; i++) {
                if(!rawObjects[i]) continue;
                for(let j=i+1; j<rawObjects.length; j++) {
                    if(!rawObjects[j]) continue;
                    const a = rawObjects[i];
                    const b = rawObjects[j];
                    const overlapX = (a.minX - mergePx) <= b.maxX && b.minX <= (a.maxX + mergePx);
                    const overlapY = (a.minY - mergePx) <= b.maxY && b.minY <= (a.maxY + mergePx);
                    if(overlapX && overlapY) {
                        a.minX = Math.min(a.minX, b.minX);
                        a.maxX = Math.max(a.maxX, b.maxX);
                        a.minY = Math.min(a.minY, b.minY);
                        a.maxY = Math.max(a.maxY, b.maxY);
                        rawObjects[j] = null;
                        changed = true;
                    }
                }
            }
        }
        rawObjects = rawObjects.filter(o => o);
    }

    const finalObjects = rawObjects.filter(obj => {
        const area = (obj.maxX - obj.minX + 1) * (obj.maxY - obj.minY + 1);
        return area >= minPixels;
    });
    return { objects: finalObjects, transparentCanvas: canvas };
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

async function processPDF(file) {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(buffer).promise;
    const images = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        await new Promise(r => img.onload = r);
        images.push({ name: `${file.name} (P${i})`, element: img });
    }
    return images;
}

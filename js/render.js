// --- UI Rendering ---
function appendResultCard(imgData) {
    const index = state.images.indexOf(imgData);
    const sidebarItem = document.createElement('div');
    sidebarItem.id = `thumb-${imgData.id}`;
    sidebarItem.className = "flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition border border-transparent group";
    sidebarItem.onclick = () => {
        const target = document.getElementById(`card-${imgData.id}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 40; thumbCanvas.height = 40;
    const tCtx = thumbCanvas.getContext('2d');
    
    // Left alignment logic for sidebar thumbnails
    const scale = Math.max(40/imgData.imgElement.width, 40/imgData.imgElement.height);
    const sw = imgData.imgElement.width * scale;
    const sh = imgData.imgElement.height * scale;
    // Align left (x=0) and center vertical
    const sy = (40 - sh) / 2;
    
    tCtx.fillStyle = "#fff";
    tCtx.fillRect(0,0,40,40);
    tCtx.drawImage(imgData.imgElement, 0, sy, sw, sh);
    
    sidebarItem.innerHTML = `
        <div class="w-10 h-10 bg-white border border-slate-200 rounded shrink-0 overflow-hidden relative shadow-sm group-hover:border-blue-300">
            <img src="${thumbCanvas.toDataURL()}" class="w-full h-full object-cover">
        </div>
        <div class="min-w-0 flex-1">
            <div class="text-xs font-bold text-slate-600 truncate">${imgData.name}</div>
            <div class="text-[10px] text-slate-400">P.${index + 1}</div>
        </div>
    `;
    DOM.sidebarContent.appendChild(sidebarItem);

    const card = document.createElement('div');
    card.id = `card-${imgData.id}`;
    card.className = "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-4"; 
    card.dataset.id = imgData.id; 
    DOM.resultsArea.appendChild(card);
    renderCardContent(card, imgData);
}

window.downloadImage = (dataUrl, filename, event) => {
    if(event) event.stopPropagation();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

window.copyImage = async (dataUrl, event) => {
    if(event) event.stopPropagation();
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({[blob.type]: blob})]);
        showToast("圖片已複製到剪貼簿", "fa-copy");
    } catch(e) {
        console.error(e);
        showToast("複製失敗", "fa-triangle-exclamation");
    }
};

window.downloadSVG = (dataUrl, filename, event) => {
    if(event) event.stopPropagation();
    if (typeof ImageTracer === 'undefined') {
        alert("SVG 轉換套件尚未載入，請檢查網路連線或稍後再試。");
        return;
    }
    showToast("正在轉換 SVG...", "fa-vector-square");
    
    ImageTracer.imageToSVG(
        dataUrl,
        function(svgstr) {
            const blob = new Blob([svgstr], {type: "image/svg+xml"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename.replace('.png', '.svg');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("SVG 下載完成", "fa-check");
        },
        { ltres:1, qtres:1, pathomit:8, rightangleenhance:0, colorsampling:2, numberofcolors:32, mincolorratio:0 }
    );
};

window.sendToGemini = async (dataUrl, event) => {
    if(event) event.stopPropagation();
    try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Try copying image AND text "放大這張圖片" to clipboard
        const textBlob = new Blob(["放大這張圖片"], { type: 'text/plain' });
        
        try {
             await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                    'text/plain': textBlob
                })
            ]);
            showToast("圖片與提示詞已複製！請在 Gemini 對話框貼上 (Ctrl+V)", "fa-copy");
        } catch(err2) {
            // Fallback to just image if multi-type fails
             await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
            showToast("圖片已複製！請在 Gemini 對話框貼上 (Ctrl+V)", "fa-copy");
        }
        
        setTimeout(() => { window.open('https://gemini.google.com/', '_blank'); }, 800);
    } catch (err) {
        console.error("Clipboard failed", err);
        alert("自動複製失敗，請手動下載圖片後上傳至 Gemini。");
        window.open('https://gemini.google.com/', '_blank');
    }
};

function renderCardContent(card, imgData) {
    let gridHtml = '';
    if (imgData.objects.length === 0) {
        gridHtml = `<div class="col-span-full h-full py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200"><i class="fa-regular fa-eye-slash text-4xl mb-2"></i><p>未偵測到物件</p><p class="text-xs mt-1">請使用手動工具選取，或調整參數</p></div>`;
    } else {
        imgData.objects.forEach((obj, idx) => {
            let w, h, dataUrl;
            
            if (obj.isManual) {
                dataUrl = obj.dataUrl;
                w = obj.maxX - obj.minX;
                h = obj.maxY - obj.minY;
            } else {
                w = obj.maxX - obj.minX + 1;
                h = obj.maxY - obj.minY + 1;
                const tCanvas = document.createElement('canvas');
                tCanvas.width = w; tCanvas.height = h;
                tCanvas.getContext('2d').drawImage(imgData.processedCanvas, obj.minX, obj.minY, w, h, 0, 0, w, h);
                dataUrl = tCanvas.toDataURL();
            }
            
            const filename = `crop_${idx+1}_${imgData.name}.png`;
            const badge = obj.isManual ? '<span class="absolute top-1 left-1 bg-green-600/90 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm">手動</span>' : '';
            
            const deleteBtn = obj.isManual ? 
                `<button onclick="removeManualObject('${imgData.id}', ${idx}); event.stopPropagation()" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm z-10 transition-opacity opacity-0 group-hover:opacity-100" title="刪除此區塊"><i class="fa-solid fa-times"></i></button>` : '';

            gridHtml += `
                <div class="relative group border border-slate-200 rounded-lg overflow-hidden bg-white cursor-pointer" onclick="copyImage('${dataUrl}', event)">
                     <div class="checkerboard-bg h-36 flex items-center justify-center transition-transform duration-300">
                         <img src="${dataUrl}" class="max-w-full max-h-full object-contain">
                     </div>
                     ${badge}
                     ${deleteBtn}
                     <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                         <span class="text-white text-[10px] font-bold mb-1"><i class="fa-regular fa-copy"></i> 點擊複製</span>
                         <div class="flex gap-2 flex-wrap justify-center">
                             <button onclick="downloadImage('${dataUrl}', '${filename}', event)" class="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition text-xs shadow-sm border border-white/10" title="下載 PNG"><i class="fa-solid fa-download"></i></button>
                             <button onclick="openLightbox('${dataUrl}', event)" class="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition text-xs shadow-sm border border-white/10" title="檢視大圖"><i class="fa-solid fa-expand"></i></button>
                             <button onclick="sendToGemini('${dataUrl}', event)" class="bg-purple-500/80 hover:bg-purple-600 text-white p-1.5 rounded-lg backdrop-blur-sm transition text-xs shadow-sm border border-white/10" title="AI 修圖 (Gemini)"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                             <button onclick="downloadSVG('${dataUrl}', '${filename}', event)" class="bg-orange-500/80 hover:bg-orange-600 text-white p-1.5 rounded-lg backdrop-blur-sm transition text-xs shadow-sm border border-white/10" title="下載 SVG"><i class="fa-solid fa-bezier-curve"></i></button>
                             <button onclick="performCropOCR('${imgData.id}', ${idx}, event)" class="bg-blue-500/80 hover:bg-blue-600 text-white p-1.5 rounded-lg backdrop-blur-sm transition text-xs shadow-sm border border-white/10" title="OCR 文字辨識"><i class="fa-solid fa-font"></i></button>
                         </div>
                     </div>
                     <span class="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded backdrop-blur-sm pointer-events-none group-hover:opacity-0 transition-opacity">${w}x${h}</span>
                </div>
            `;
        });
    }

    let ocrSection = '';
    if (imgData.ocrResults && imgData.ocrResults.length > 0) {
        const resultsHtml = imgData.ocrResults.map((res, i) => `
            <div class="mb-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div class="flex justify-between items-center px-3 py-2 bg-slate-50 border-b border-slate-100 rounded-t-lg">
                    <span class="text-xs font-bold text-slate-500">#${i + 1} - ${res.timestamp}</span>
                    <div class="flex gap-2">
                        <button onclick="copyOCRResult(${i}, '${imgData.id}')" class="text-xs text-blue-600 hover:text-blue-800 transition"><i class="fa-regular fa-copy"></i> 複製</button>
                        <button onclick="deleteOCRResult(${i}, '${imgData.id}')" class="text-xs text-red-400 hover:text-red-600 transition"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <textarea id="ocr-res-${imgData.id}-${i}" class="w-full h-24 text-sm p-3 focus:outline-none resize-y text-slate-700 bg-transparent rounded-b-lg">${res.text}</textarea>
            </div>
        `).join('');

        ocrSection = `
            <div class="mt-4 p-4 bg-slate-100 border border-slate-200 rounded-xl">
                <h4 class="text-sm font-bold text-slate-700 mb-3 flex items-center"><i class="fa-solid fa-file-lines mr-2 text-blue-600"></i> OCR 辨識結果紀錄</h4>
                ${resultsHtml}
            </div>
        `;
    }

    const sizeId = `size-${imgData.id}`;
    const mergeId = `merge-${imgData.id}`;
    const tolId = `tol-${imgData.id}`;
    const sizeInputId = `size-in-${imgData.id}`;
    const mergeInputId = `merge-in-${imgData.id}`;
    const tolInputId = `tol-in-${imgData.id}`;
    const ocrBtnId = `ocr-btn-${imgData.id}`;
    const originalFilename = `original_${imgData.name}.png`;

    card.innerHTML = `
        <div class="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div class="flex items-center gap-2 overflow-hidden">
                <div class="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">${state.images.indexOf(imgData) + 1}</div>
                <div class="min-w-0">
                    <h3 class="font-bold text-slate-700 text-sm truncate" title="${imgData.name}">${imgData.name}</h3>
                    <p class="text-xs text-slate-500">偵測: <span class="font-bold text-blue-600">${imgData.objects.length}</span></p>
                </div>
            </div>
            <button onclick="removeImage('${imgData.id}')" class="text-slate-400 hover:text-red-500 transition px-2"><i class="fa-solid fa-trash"></i></button>
        </div>
        
        <div class="p-4 flex flex-col lg:flex-row gap-6">
            <div class="w-full lg:w-1/3 flex-shrink-0 flex flex-col gap-4">
                <div class="bg-white border border-slate-200 rounded-lg p-3 text-sm shadow-sm space-y-3">
                    <h4 class="font-bold text-slate-600 text-xs uppercase tracking-wider mb-2">個別參數調整</h4>
                    <div class="space-y-1">
                        <div class="flex justify-between items-center"><label class="text-slate-500 text-xs">最小區塊 (%)</label><input type="number" id="${sizeInputId}" min="0" max="100" value="${imgData.settings.size}" step="1" class="w-14 text-right px-1 py-0.5 border border-slate-300 rounded text-slate-700 text-xs font-bold focus:outline-none focus:border-blue-500"></div>
                        <input type="range" id="${sizeId}" min="0" max="50" value="${imgData.settings.size}" step="0.5" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between items-center"><label class="text-slate-500 text-xs">合併距離 (%)</label><input type="number" id="${mergeInputId}" min="0" max="50" value="${imgData.settings.merge}" step="0.5" class="w-14 text-right px-1 py-0.5 border border-slate-300 rounded text-slate-700 text-xs font-bold focus:outline-none focus:border-blue-500"></div>
                        <input type="range" id="${mergeId}" min="0" max="20" value="${imgData.settings.merge}" step="0.5" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between items-center"><label class="text-slate-500 text-xs">容忍度</label><input type="number" id="${tolInputId}" min="1" max="100" value="${imgData.settings.tolerance}" step="1" class="w-14 text-right px-1 py-0.5 border border-slate-300 rounded text-slate-700 text-xs font-bold focus:outline-none focus:border-blue-500"></div>
                        <input type="range" id="${tolId}" min="1" max="100" value="${imgData.settings.tolerance}" step="1" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
                    </div>
                </div>
                <div class="bg-slate-100 p-2 rounded-lg border border-slate-200 flex flex-col gap-2">
                    <p class="text-xs font-bold text-slate-500 flex items-center justify-between"><span><i class="fa-regular fa-image mr-1"></i> 原始圖片</span></p>
                    
                    <div class="relative group cursor-pointer border border-slate-200 rounded overflow-hidden bg-white" onclick="copyImage('${imgData.imgElement.src}', event)">
                        <div class="checkerboard-bg h-48 flex justify-center items-center"><img src="${imgData.imgElement.src}" class="max-h-full max-w-full object-contain"></div>
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                             <span class="text-white text-[10px] font-bold mb-1"><i class="fa-regular fa-copy"></i> 點擊複製</span>
                             <div class="flex gap-2 flex-wrap justify-center">
                                 <button onclick="downloadImage('${imgData.imgElement.src}', '${originalFilename}', event)" class="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition text-xs shadow-sm border border-white/10" title="下載原圖"><i class="fa-solid fa-download"></i></button>
                                 <button onclick="openLightbox('${imgData.imgElement.src}', event)" class="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition text-xs shadow-sm border border-white/10" title="檢視大圖"><i class="fa-solid fa-expand"></i></button>
                                 <button onclick="sendToGemini('${imgData.imgElement.src}', event)" class="bg-purple-500/80 hover:bg-purple-600 text-white p-1.5 rounded-lg backdrop-blur-sm transition text-xs shadow-sm border border-white/10" title="AI 修圖 (Gemini)"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                             </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                     <div class="flex gap-2">
                        <button onclick="openEditor('${imgData.id}')" class="flex-1 bg-slate-500/80 hover:bg-slate-600 text-white text-xs py-2 rounded-lg transition shadow-sm flex items-center justify-center gap-2 border border-slate-500"><i class="fa-solid fa-crop-simple"></i> 手動裁切</button>
                        <button id="${ocrBtnId}" onclick="performOCR('${imgData.id}')" class="flex-1 bg-blue-500/80 hover:bg-blue-600 text-white text-xs py-2 rounded-lg transition shadow-sm flex items-center justify-center gap-2 border border-blue-500"><i class="fa-solid fa-font"></i> 整頁 OCR</button>
                    </div>
                </div>
            </div>
            <div class="w-full lg:w-2/3 flex-grow flex flex-col">
                <div class="bg-slate-50 rounded-lg border border-slate-200 p-2 flex-grow flex flex-col">
                     <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">${gridHtml}</div>
                     ${ocrSection}
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const setupControl = (sliderId, inputId, settingKey) => {
            const s = document.getElementById(sliderId);
            const i = document.getElementById(inputId);
            if(!s || !i) return;
            s.oninput = () => { i.value = s.value; };
            s.onchange = () => { updateImageSettings(imgData.id, settingKey, s.value); };
            i.onchange = () => {
                let val = parseFloat(i.value);
                if(isNaN(val)) val = 0;
                s.value = val;
                updateImageSettings(imgData.id, settingKey, val);
            };
        };
        setupControl(sizeId, sizeInputId, 'size');
        setupControl(mergeId, mergeInputId, 'merge');
        setupControl(tolId, tolInputId, 'tolerance');
    }, 0);
}

window.updateImageSettings = (id, key, value) => {
    const activeElementId = document.activeElement ? document.activeElement.id : null;
    const img = state.images.find(i => i.id === id);
    if (!img) return;
    img.settings[key] = parseFloat(value);
    img.autoTuned = null;
    const result = detectObjects(img.imgElement, img.settings);
    // Keep manual objects!
    const manualObjs = img.objects.filter(o => o.isManual);
    img.objects = [...result.objects, ...manualObjs];
    
    img.processedCanvas = result.transparentCanvas;
    const card = document.getElementById(`card-${id}`);
    renderCardContent(card, img);
    if (activeElementId) {
        setTimeout(() => {
            const el = document.getElementById(activeElementId);
            if (el) el.focus();
        }, 0);
    }
};

window.removeImage = (id) => {
    state.images = state.images.filter(i => i.id !== id);
    const card = document.getElementById(`card-${id}`);
    if(card) card.remove();
    const thumb = document.getElementById(`thumb-${id}`);
    if(thumb) thumb.remove();
    if (state.images.length === 0) {
        DOM.emptyState.classList.remove('hidden');
        DOM.resultsArea.classList.add('hidden');
    }
};

window.removeManualObject = (imgId, objIndex) => {
    const imgData = state.images.find(i => i.id === imgId);
    if(!imgData) return;
    imgData.objects.splice(objIndex, 1);
    const card = document.getElementById(`card-${imgId}`);
    if(card) renderCardContent(card, imgData);
};

let observer;
function initScrollSpy() {
    if (observer) observer.disconnect();
    const options = { root: DOM.mainScrollArea, threshold: 0.2 };
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.dataset.id;
                document.querySelectorAll('#sidebarContent > div').forEach(el => {
                    el.classList.remove('bg-blue-50', 'border-blue-500', 'ring-1', 'ring-blue-200');
                    el.classList.add('border-transparent');
                });
                const activeThumb = document.getElementById(`thumb-${id}`);
                if(activeThumb) {
                    activeThumb.classList.remove('border-transparent');
                    activeThumb.classList.add('bg-blue-50', 'border-blue-500', 'ring-1', 'ring-blue-200');
                    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        });
    }, options);
    document.querySelectorAll('#resultsArea > div').forEach(card => observer.observe(card));
}

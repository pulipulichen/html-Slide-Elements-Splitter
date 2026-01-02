// --- OCR Text Handling ---
window.copyOCRResult = (index, imgId) => {
    const textArea = document.getElementById(`ocr-res-${imgId}-${index}`);
    if (!textArea) return;
    navigator.clipboard.writeText(textArea.value).then(() => {
        showToast("文字已複製", "fa-check");
    });
};

window.deleteOCRResult = (index, imgId) => {
     const imgData = state.images.find(i => i.id === imgId);
     if (!imgData || !imgData.ocrResults) return;
     
     imgData.ocrResults.splice(index, 1);
     const card = document.getElementById(`card-${imgId}`);
     if(card) renderCardContent(card, imgData);
};

window.performOCR = async (id) => {
    if (!state.apiConfig.key) {
        alert("請先點擊右上角設定按鈕，輸入您的 Gemini API Key。");
        toggleSettingsModal();
        return;
    }
    const imgData = state.images.find(i => i.id === id);
    if (!imgData) return;
    const btn = document.getElementById(`ocr-btn-${id}`);
    // Show loading state
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    btn.disabled = true;
    try {
        const base64Image = imgData.imgElement.src.split(',')[1];
        const payload = {
            contents: [{
                parts: [
                    { text: "請辨識這張圖片中的所有文字，直接輸出純文字內容即可，不需要任何開場白或解釋。" },
                    { inline_data: { mime_type: "image/png", data: base64Image } }
                ]
            }]
        };
        const url = `${state.apiConfig.baseUrl}/v1beta/models/${state.apiConfig.model}:generateContent?key=${state.apiConfig.key}`;
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "無法辨識到文字";
        
        // Add to results array
        imgData.ocrResults.unshift({
            text: text,
            timestamp: new Date().toLocaleTimeString()
        });
        
        const card = document.getElementById(`card-${id}`);
        renderCardContent(card, imgData);
    } catch (err) {
        console.error(err);
        alert("OCR 失敗: " + err.message);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-font"></i> 整頁 OCR';
        btn.disabled = false;
    }
};

// --- Single Crop OCR ---
window.performCropOCR = async (imgId, objIndex, event) => {
    if(event) event.stopPropagation();
    if (!state.apiConfig.key) {
        alert("請先點擊右上角設定按鈕，輸入您的 Gemini API Key。");
        toggleSettingsModal();
        return;
    }
    
    showToast("正在辨識文字...", "fa-circle-notch fa-spin");

    // Reconstruct data URL for the crop
    const imgData = state.images.find(i => i.id === imgId);
    if (!imgData) return;
    const obj = imgData.objects[objIndex];
    
    let dataUrl;
    if (obj.isManual) {
        dataUrl = obj.dataUrl;
    } else {
         const w = obj.maxX - obj.minX + 1;
         const h = obj.maxY - obj.minY + 1;
         const tCanvas = document.createElement('canvas');
         tCanvas.width = w; tCanvas.height = h;
         tCanvas.getContext('2d').drawImage(imgData.processedCanvas, obj.minX, obj.minY, w, h, 0, 0, w, h);
         dataUrl = tCanvas.toDataURL();
    }

    try {
        const base64Image = dataUrl.split(',')[1];
        const payload = {
            contents: [{
                parts: [
                    { text: "請辨識這張圖片中的所有文字，直接輸出純文字內容即可，不需要任何開場白或解釋。" },
                    { inline_data: { mime_type: "image/png", data: base64Image } }
                ]
            }]
        };

        const url = `${state.apiConfig.baseUrl}/v1beta/models/${state.apiConfig.model}:generateContent?key=${state.apiConfig.key}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "無法辨識到文字";
        
        // Add to results array
        imgData.ocrResults.unshift({
            text: `[單圖 #${objIndex+1}] ` + text,
            timestamp: new Date().toLocaleTimeString()
        });

        const card = document.getElementById(`card-${imgId}`);
        renderCardContent(card, imgData);
        
        showToast("辨識完成", "fa-check");

    } catch (err) {
        console.error(err);
        alert("OCR 失敗: " + err.message);
    }
};

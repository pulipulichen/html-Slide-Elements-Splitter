window.openEditor = (imgId) => {
    const imgData = state.images.find(i => i.id === imgId);
    if(!imgData) return;

    state.editor.imgId = imgId;
    state.editor.active = true;
    state.editor.points = [];
    state.editor.mode = 'add'; // Default to add
    
    // Setup Canvases
    const baseCvs = DOM.editorBaseCanvas;
    const overCvs = DOM.editorOverlayCanvas;
    
    baseCvs.width = imgData.imgElement.width;
    baseCvs.height = imgData.imgElement.height;
    overCvs.width = imgData.imgElement.width;
    overCvs.height = imgData.imgElement.height;
    
    // Draw Image
    const ctx = baseCvs.getContext('2d');
    ctx.drawImage(imgData.imgElement, 0, 0);
    
    // Init Brush layer (Persistent Mask)
    state.editor.brushCanvas = document.createElement('canvas');
    state.editor.brushCanvas.width = baseCvs.width;
    state.editor.brushCanvas.height = baseCvs.height;
    state.editor.brushCtx = state.editor.brushCanvas.getContext('2d');

    DOM.editorModal.classList.remove('hidden');
    setEditorTool('rect'); // default
    setEditorMode('add');
    
    baseCvs.style.maxWidth = "100%";
    baseCvs.style.maxHeight = "calc(100vh - 10rem)";
    baseCvs.style.objectFit = "contain";
    overCvs.style.maxWidth = "100%";
    overCvs.style.maxHeight = "calc(100vh - 10rem)";
    overCvs.style.objectFit = "contain";
    
    initEditorEvents();
    document.addEventListener('keydown', handleEscKey);
};

window.closeEditor = () => {
    DOM.editorModal.classList.add('hidden');
    state.editor.active = false;
    document.removeEventListener('keydown', handleEscKey);
};

window.setEditorTool = (toolName) => {
    state.editor.tool = toolName;
    const btns = document.querySelectorAll('#editorToolbar button[id^="tool-"]');
    btns.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
    const activeBtn = document.getElementById(`tool-${toolName}`);
    if(activeBtn) activeBtn.classList.add('bg-blue-600', 'text-white');
    
    const ctx = DOM.editorOverlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, DOM.editorOverlayCanvas.width, DOM.editorOverlayCanvas.height);
};

window.setEditorMode = (modeName) => {
    state.editor.mode = modeName;
    const btns = document.querySelectorAll('#editorToolbar button[id^="mode-"]');
    btns.forEach(b => {
         b.classList.remove('bg-green-600', 'bg-red-600', 'text-white');
         b.classList.add('text-slate-300'); // default inactive style
    });
    
    const activeBtn = document.getElementById(`mode-${modeName}`);
    if(activeBtn) {
        activeBtn.classList.remove('text-slate-300');
        activeBtn.classList.add('text-white');
        if (modeName === 'add') activeBtn.classList.add('bg-green-600');
        else activeBtn.classList.add('bg-red-600');
    }
};

window.clearEditor = () => {
    if (state.editor.brushCtx) {
        const w = state.editor.brushCanvas.width;
        const h = state.editor.brushCanvas.height;
        state.editor.brushCtx.clearRect(0, 0, w, h);
        const ctx = DOM.editorOverlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
    }
};

function initEditorEvents() {
    const canvas = DOM.editorOverlayCanvas;
    const ctx = canvas.getContext('2d');
    
    let startX, startY;

    canvas.onmousedown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        startX = (e.clientX - rect.left) * scaleX;
        startY = (e.clientY - rect.top) * scaleY;
        
        state.editor.isDrawing = true;
        
        if (state.editor.tool === 'lasso') {
            state.editor.points = [{x: startX, y: startY}];
        } else if (state.editor.tool === 'brush') {
            const bCtx = state.editor.brushCtx;
            bCtx.beginPath();
            bCtx.moveTo(startX, startY);
            bCtx.lineWidth = Math.max(10, canvas.width * 0.02); 
            bCtx.lineCap = 'round';
            bCtx.lineJoin = 'round';
            // Mode logic
            bCtx.globalCompositeOperation = state.editor.mode === 'remove' ? 'destination-out' : 'source-over';
            bCtx.strokeStyle = state.editor.mode === 'remove' ? 'rgba(0,0,0,1)' : 'rgba(255, 0, 0, 1)';
        }
        // Rect doesn't draw immediately on brushCtx
    };

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const currX = (e.clientX - rect.left) * scaleX;
        const currY = (e.clientY - rect.top) * scaleY;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Mask
        if (state.editor.brushCanvas) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.drawImage(state.editor.brushCanvas, 0, 0);
            ctx.restore();
        }

        if (!state.editor.isDrawing) return;

        if (state.editor.tool === 'rect') {
            ctx.strokeStyle = state.editor.mode === 'remove' ? '#ef4444' : '#22c55e';
            ctx.lineWidth = Math.max(2, canvas.width * 0.002);
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(startX, startY, currX - startX, currY - startY);
            ctx.fillStyle = state.editor.mode === 'remove' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
            ctx.fillRect(startX, startY, currX - startX, currY - startY);
        } else if (state.editor.tool === 'lasso') {
            state.editor.points.push({x: currX, y: currY});
            drawLassoPath(ctx, state.editor.points, state.editor.mode);
        } else if (state.editor.tool === 'brush') {
            const bCtx = state.editor.brushCtx;
            bCtx.lineTo(currX, currY);
            bCtx.stroke();
            // Cursor circle
            ctx.beginPath();
            ctx.arc(currX, currY, bCtx.lineWidth/2, 0, Math.PI*2);
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }
    };

    canvas.onmouseup = (e) => {
        if (!state.editor.isDrawing) return;
        state.editor.isDrawing = false;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const currX = (e.clientX - rect.left) * scaleX;
        const currY = (e.clientY - rect.top) * scaleY;

        if (state.editor.tool === 'rect') {
            const x = Math.min(startX, currX);
            const y = Math.min(startY, currY);
            const w = Math.abs(currX - startX);
            const h = Math.abs(currY - startY);
            if (w > 5 && h > 5) {
                const bCtx = state.editor.brushCtx;
                bCtx.globalCompositeOperation = state.editor.mode === 'remove' ? 'destination-out' : 'source-over';
                bCtx.fillStyle = state.editor.mode === 'remove' ? 'rgba(255, 0, 0, 1)' : 'rgba(255, 0, 0, 1)'; // use opaque red for mask; overlay handles transparency
                bCtx.fillRect(x, y, w, h);
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.drawImage(state.editor.brushCanvas, 0, 0);
                ctx.restore();
            }
        } else if (state.editor.tool === 'lasso') {
            if (state.editor.points.length > 5) {
                const bCtx = state.editor.brushCtx;
                bCtx.globalCompositeOperation = state.editor.mode === 'remove' ? 'destination-out' : 'source-over';
                bCtx.fillStyle = state.editor.mode === 'remove' ? 'rgba(255, 0, 0, 1)' : 'rgba(255, 0, 0, 1)';
                bCtx.beginPath();
                const pts = state.editor.points;
                bCtx.moveTo(pts[0].x, pts[0].y);
                for(let i=1; i<pts.length; i++) bCtx.lineTo(pts[i].x, pts[i].y);
                bCtx.closePath();
                bCtx.fill();
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.drawImage(state.editor.brushCanvas, 0, 0);
                ctx.restore();
            }
            state.editor.points = [];
        }
    };
}

function drawLassoPath(ctx, points, mode) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = mode === 'remove' ? '#ef4444' : '#22c55e';
    ctx.lineWidth = Math.max(2, ctx.canvas.width * 0.002);
    ctx.setLineDash([10, 5]);
    ctx.stroke();
    ctx.fillStyle = mode === 'remove' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
    ctx.fill();
}

window.confirmEditorSelection = () => {
    const width = state.editor.brushCanvas.width;
    const height = state.editor.brushCanvas.height;
    const ctx = state.editor.brushCtx;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
            }
        }
    }

    if (!found) {
        alert("請先選取範圍（繪製區域）");
        return;
    }

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    extractFromEditor({
        type: 'confirm_brush', 
        maskCanvas: state.editor.brushCanvas,
        x: minX, y: minY, w: cropW, h: cropH
    });

    ctx.clearRect(0, 0, width, height);
    const oCtx = DOM.editorOverlayCanvas.getContext('2d');
    oCtx.clearRect(0, 0, width, height);
    
    closeEditor();
};

function extractFromEditor(selectionData) {
    const imgData = state.images.find(i => i.id === state.editor.imgId);
    if(!imgData) return;

    const { x: minX, y: minY, w, h, maskCanvas } = selectionData;

    const maskCropCanvas = document.createElement('canvas');
    maskCropCanvas.width = w;
    maskCropCanvas.height = h;
    const mCtx = maskCropCanvas.getContext('2d');
    mCtx.drawImage(maskCanvas, -minX, -minY);
    
    const mImgData = mCtx.getImageData(0, 0, w, h);
    const mData = mImgData.data;
    for(let i=0; i<mData.length; i+=4) {
        if(mData[i+3] > 0) mData[i+3] = 255; 
    }
    mCtx.putImageData(mImgData, 0, 0);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.save();
    tempCtx.drawImage(imgData.imgElement, -minX, -minY);
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(maskCropCanvas, 0, 0);
    tempCtx.restore();

    const cropImageData = tempCtx.getImageData(0, 0, w, h);
    const data = cropImageData.data;
    const settings = imgData.settings;
    
    const bgSamp = document.createElement('canvas');
    bgSamp.width = 10; bgSamp.height = 10;
    bgSamp.getContext('2d').drawImage(imgData.imgElement, 0, 0);
    const bgData = bgSamp.getContext('2d').getImageData(0,0,5,5).data;
    let bgR=0, bgG=0, bgB=0;
    for(let i=0; i<25; i++) { bgR+=bgData[i*4]; bgG+=bgData[i*4+1]; bgB+=bgData[i*4+2]; }
    bgR=Math.round(bgR/25); bgG=Math.round(bgG/25); bgB=Math.round(bgB/25);

    const isBg = (r,g,b) => Math.abs(r-bgR)<settings.tolerance && Math.abs(g-bgG)<settings.tolerance && Math.abs(b-bgB)<settings.tolerance;

    let tMinX = w, tMinY = h, tMaxX = 0, tMaxY = 0;
    let hasContent = false;

    for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
            const i = (y*w + x) * 4;
            if(data[i+3] > 0 && isBg(data[i], data[i+1], data[i+2])) {
                data[i+3] = 0;
            }
            if (data[i+3] > 0) {
                if (x < tMinX) tMinX = x;
                if (x > tMaxX) tMaxX = x;
                if (y < tMinY) tMinY = y;
                if (y > tMaxY) tMaxY = y;
                hasContent = true;
            }
        }
    }
    tempCtx.putImageData(cropImageData, 0, 0);

    let finalCanvas;
    if (hasContent) {
        const finalW = tMaxX - tMinX + 1;
        const finalH = tMaxY - tMinY + 1;
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = finalW;
        finalCanvas.height = finalH;
        finalCanvas.getContext('2d').drawImage(tempCanvas, tMinX, tMinY, finalW, finalH, 0, 0, finalW, finalH);
    } else {
        finalCanvas = tempCanvas;
    }

    const newObj = {
        isManual: true,
        dataUrl: finalCanvas.toDataURL(),
        minX: minX + (hasContent ? tMinX : 0), 
        minY: minY + (hasContent ? tMinY : 0), 
        maxX: minX + (hasContent ? tMaxX : w), 
        maxY: minY + (hasContent ? tMaxY : h) 
    };
    
    imgData.objects.push(newObj);
    const card = document.getElementById(`card-${imgData.id}`);
    if(card) renderCardContent(card, imgData);
    
    showToast("已建立新選取圖片", "fa-image");
}

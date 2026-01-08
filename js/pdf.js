
window.handlePdfUrl = async (url) => {
    if (state.images.length > 0) {
        if (!window.confirm('現在的分析結果將被移除，您確定嗎？')) {
            return;
        }
    }
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
        showToast("請輸入 PDF 網址", "fa-triangle-exclamation");
        return;
    }

    DOM.statusMsg.classList.remove('hidden');
    DOM.statusText.innerText = "下載 PDF 中...";

    try {
        const response = await fetch(trimmedUrl);
        if (!response.ok) {
            throw new Error(`下載失敗 (${response.status})`);
        }

        const blob = await response.blob();
        const filename = trimmedUrl.split('/').pop() || 'download.pdf';
        const file = new File([blob], filename, {
            type: blob.type || 'application/pdf'
        });
        await handleFiles([file]);
    } catch (error) {
        console.error(error);
        showToast(error.message || "下載失敗", "fa-triangle-exclamation");
        DOM.statusMsg.classList.add('hidden');
    }
};

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

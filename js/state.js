const LS_KEYS = {
    SIZE: 'sc_g_size',
    MERGE: 'sc_g_merge',
    TOL: 'sc_g_tol',
    API_KEY: 'sc_api_key',
    MODEL: 'sc_model',
    BASE_URL: 'sc_base_url',
    SIDEBAR: 'sc_sidebar_open',
    PROMPTS: 'sc_prompts'
};

const DEFAULT_PROMPTS = [
    "放大圖片，並讓我下載大圖",
    "讀取並分析圖片，轉換成svg輸出"
];

const state = {
    images: [], 
    isProcessing: false,
    sidebarOpen: localStorage.getItem(LS_KEYS.SIDEBAR) !== 'false', 
    apiConfig: {
        key: localStorage.getItem(LS_KEYS.API_KEY) || '',
        model: localStorage.getItem(LS_KEYS.MODEL) || 'gemini-flash-latest',
        baseUrl: localStorage.getItem(LS_KEYS.BASE_URL) || 'https://generativelanguage.googleapis.com'
    },
    prompts: JSON.parse(localStorage.getItem(LS_KEYS.PROMPTS)) || DEFAULT_PROMPTS,
    lightbox: { isZoomed: false, scale: 1, maxScale: 2.5 },
    editor: {
        active: false,
        imgId: null,
        tool: 'rect', // rect, lasso, brush
        mode: 'add', // add, remove
        isDrawing: false,
        points: [], // for lasso
        brushCtx: null, // offscreen canvas ctx for brush mask (Persistent layer)
        brushCanvas: null,
        scale: 1
    }
};

const DOM = {
    fileInput: document.getElementById('fileInput'),
    resultsArea: document.getElementById('resultsArea'),
    sidebarContent: document.getElementById('sidebarContent'),
    mainSidebar: document.getElementById('mainSidebar'),
    mainScrollArea: document.getElementById('mainScrollArea'),
    emptyState: document.getElementById('emptyState'),
    statusMsg: document.getElementById('statusMsg'),
    statusText: document.getElementById('statusText'),
    dragOverlay: document.getElementById('dragOverlay'),
    settingsModal: document.getElementById('settingsModal'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg'),
    toastIcon: document.getElementById('toastIcon'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    pdfUrlInput: document.getElementById('pdfUrlInput'),
    pdfUrlButton: document.getElementById('pdfUrlButton'),
    // Editor
    editorModal: document.getElementById('editorModal'),
    editorBaseCanvas: document.getElementById('editorBaseCanvas'),
    editorOverlayCanvas: document.getElementById('editorOverlayCanvas'),
    // Settings Inputs
    apiKeyInput: document.getElementById('apiKeyInput'),
    modelInput: document.getElementById('modelInput'),
    baseUrlInput: document.getElementById('baseUrlInput'),
    // Global inputs
    g_size: document.getElementById('g_size'),
    g_sizeInput: document.getElementById('g_sizeInput'),
    g_merge: document.getElementById('g_merge'),
    g_mergeInput: document.getElementById('g_mergeInput'),
    g_tol: document.getElementById('g_tol'),
    g_tolInput: document.getElementById('g_tolInput'),
    // Prompts
    promptsModal: document.getElementById('promptsModal'),
    promptsList: document.getElementById('promptsList'),
    newPromptInput: document.getElementById('newPromptInput')
};

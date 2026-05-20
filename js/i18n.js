const I18N_STORAGE_KEY = "sc_language";
const TRANSLATIONS = {
    en: window.I18N_EN || {},
    "zh-TW": window.I18N_ZH_TW || {}
};

const SUPPORTED_LANGUAGES = Object.keys(TRANSLATIONS);
const DEFAULT_LANGUAGE = "en";
let currentLanguage = DEFAULT_LANGUAGE;

function normalizeLanguageTag(lang) {
    return (lang || "").trim().toLowerCase();
}

function matchSupportedLanguage(lang) {
    const normalized = normalizeLanguageTag(lang);
    if (!normalized) return null;

    const exact = SUPPORTED_LANGUAGES.find((item) => normalizeLanguageTag(item) === normalized);
    if (exact) return exact;

    const base = normalized.split("-")[0];
    return SUPPORTED_LANGUAGES.find((item) => normalizeLanguageTag(item).split("-")[0] === base) || null;
}

function detectBrowserLanguage() {
    const candidates = [];
    if (Array.isArray(navigator.languages)) {
        candidates.push(...navigator.languages);
    }
    if (navigator.language) {
        candidates.push(navigator.language);
    }

    for (const lang of candidates) {
        const matched = matchSupportedLanguage(lang);
        if (matched) return matched;
    }
    return null;
}

const bootStoredLanguage = localStorage.getItem(I18N_STORAGE_KEY);
const bootDetectedLanguage = detectBrowserLanguage();
currentLanguage = matchSupportedLanguage(bootStoredLanguage) || bootDetectedLanguage || DEFAULT_LANGUAGE;

function interpolate(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => {
        const value = params[key];
        return value === undefined || value === null ? `{${key}}` : String(value);
    });
}

function getTranslationByLanguage(lang, key) {
    return TRANSLATIONS[lang] ? TRANSLATIONS[lang][key] : undefined;
}

function t(key, params = {}) {
    const primary = getTranslationByLanguage(currentLanguage, key);
    const fallback = getTranslationByLanguage(DEFAULT_LANGUAGE, key);
    let value = primary;
    if (value === undefined || value === null) value = fallback;
    if (value === undefined || value === null) value = key;
    return interpolate(value, params);
}

function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-html]").forEach((el) => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    root.querySelectorAll("[data-i18n-title]").forEach((el) => {
        el.setAttribute("title", t(el.dataset.i18nTitle));
    });
    root.querySelectorAll("[data-i18n-value]").forEach((el) => {
        el.value = t(el.dataset.i18nValue);
    });

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect && languageSelect.value !== currentLanguage) {
        languageSelect.value = currentLanguage;
    }

    document.documentElement.lang = currentLanguage;
    document.title = t("meta.appTitle");
}

function setLanguage(nextLanguage, options = {}) {
    const { persist = true, shouldApply = true, shouldEmit = true } = options;
    const matched = matchSupportedLanguage(nextLanguage) || DEFAULT_LANGUAGE;

    if (matched === currentLanguage) {
        if (shouldApply) applyTranslations();
        return currentLanguage;
    }

    currentLanguage = matched;

    if (persist) {
        localStorage.setItem(I18N_STORAGE_KEY, currentLanguage);
    }
    if (shouldApply) {
        applyTranslations();
    }
    if (shouldEmit) {
        window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { language: currentLanguage } }));
    }

    return currentLanguage;
}

function initI18n() {
    const stored = localStorage.getItem(I18N_STORAGE_KEY);
    const browser = detectBrowserLanguage();
    const initial = matchSupportedLanguage(stored) || browser || DEFAULT_LANGUAGE;
    currentLanguage = initial;
    applyTranslations();
}

window.I18N = {
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    getCurrentLanguage: () => currentLanguage,
    setLanguage,
    t,
    applyTranslations
};
window.t = t;

document.addEventListener("DOMContentLoaded", () => {
    initI18n();

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        languageSelect.addEventListener("change", (event) => {
            setLanguage(event.target.value, { persist: true, shouldApply: true, shouldEmit: true });
        });
    }
});

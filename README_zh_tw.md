# HTML-Slide-Elements-Splitter

[English](./README.md) | [繁體中文](./README_zh_tw.md)

將上傳的投影片（PDF 或圖片）分解成獨立的文字與圖表元素，並自動移除背景。

Demo: <https://pulipulichen.github.io/HTML-Slide-Elements-Splitter/>

## 說明

這個應用程式用來處理使用者上傳的投影片檔案。它可接收 PDF 或圖片格式的投影片，辨識投影片中的獨立元素（例如文字區塊與圖表），並分解成個別圖片檔。所有萃取出的元素都會自動進行去背處理。最終輸出為多個透明背景的獨立圖片檔，可下載或串接後續內容流程與 AI 工具（例如 Gemini）。

## 技術

- HTML Canvas：影像處理核心介面，負責像素讀取、透明化轉換、裁切、選取區渲染、區塊輪廓繪製與輸出。
- FileReader API：讀取本機圖片與剪貼簿貼上內容，轉為 Base64 Data URL 供 Canvas 處理。
- PDF.js：解析 PDF 並將頁面渲染為高解析 Canvas 影像，作為後續分解來源。
- ImageTracer.js：將處理後的點陣影像轉為向量 SVG，支援邊緣描繪與樣式近似。

## 自我揭露

此程式由 Gemini 3 Pro Canvas 建立，並經多次迭代與微調完成。

## 資源

- [Google NotebookLM](https://notebooklm.google.com/)

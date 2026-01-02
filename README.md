# html-Slide-Elements-Splitter
Splits uploaded slides (PDF or images) into independent text and chart elements, automatically removing the background.
將上傳的投影片（PDF或圖片）分解成獨立的文字和圖表元素，並自動移除背景。

Demo: https://pulipulichen.github.io/html-Slide-Elements-Splitter/

# Description

This application processes user-uploaded slide files. It takes PDF files or image format slides as input. The application uses visual analysis algorithms to identify independent elements within the slide (such as text blocks and charts) and splits these elements into individual image files. All extracted elements are automatically processed for background removal. Finally, it outputs multiple separate, background-removed image files, which can be downloaded or used with subsequent content management or AI tools (like Gemini).

這個應用程式的用途是處理使用者上傳的投影片檔案。它接收 PDF 檔案或圖片格式的投影片作為輸入。應用程式會利用視覺分析演算法來識別投影片中的獨立元素（例如文字區塊、圖表），並將這些元素分解成個別的圖片檔案。所有分解出來的元素都會自動進行去背處理。最終，它會輸出多個已分割且無背景的獨立圖片檔案，這些檔案可用於下載或搭配其他內容管理或AI工具（如Gemini）進行後續處理。

# Techniques

- HTML Canvas: Serves as the core interface for image processing, handling pixel reading, background transparency conversion, cropping, selection region rendering, block outline drawing, and final image output.
- FileReader API: Reads local images and clipboard-pasted content, converting them into Base64 DataURL format for pixel-level operations in the Canvas processing pipeline.
- PDF.js: Parses PDF files and renders pages into high-resolution Canvas, transforming them into image objects used as sources for cropping and subsequent image processing.
- ImageTracer.js: Converts processed Canvas raster images into vectorized SVG, supporting edge tracing, stroke outlining, and high-fidelity vector output with style approximation.


# Self-Disclosure

This program was created using Gemini 3 Pro Canvas and completed through multiple iterations and refinements.

# Resources

- Google NotebookLM: 
# HTML-Slide-Elements-Splitter

[English](./README.md) | [繁體中文](./README_zh_tw.md)

Splits uploaded slides (PDF or images) into independent text and chart elements with automatic background removal.

Demo: <https://pulipulichen.github.io/HTML-Slide-Elements-Splitter/>

## Description

This application processes user-uploaded slide files. It accepts PDF files or image-based slides as input, identifies independent elements (such as text blocks and charts), and splits them into separate image files. All extracted elements are automatically processed to remove backgrounds. The final output is a set of isolated, transparent-background image files for download or downstream use in content workflows and AI tools (such as Gemini).

## Techniques

- HTML Canvas: Core image-processing surface for pixel reads, transparency conversion, cropping, selection rendering, block outlines, and image export.
- FileReader API: Loads local images and pasted clipboard data as Base64 Data URLs for Canvas processing.
- PDF.js: Parses PDF files and renders pages into high-resolution Canvas images for extraction workflows.
- ImageTracer.js: Converts processed raster outputs to vector SVG with edge tracing and style approximation.

## Self-Disclosure

This program was created using Gemini 3 Pro Canvas and completed through multiple iterations and refinements.

## Resources

- [Google NotebookLM](https://notebooklm.google.com/)

---
title: "回顧 HCL Volt MX v10「Darwin」：Figma 直接變 App、AIAD、CarPlay"
description: "HCL 在 2025 年 8 月發佈了低程式碼平台 Volt MX 的 v10、代號「Darwin」。這不是最新消息、是一篇補課用的背景介紹 — 把這一版的重點整理給 Domino 開發者：用 GenAI 把 Figma 設計直接轉成 app、AIAD（AI Assisted Dev）讓 RAG 加持的 Volt IQ 幫你生程式與查文件、CarPlay / Android Auto 車機支援、Passkeys、iOS Live Activities 等。並說明它跟 Domino 的關係：Volt MX Go 是與 Domino 綁定的版本，而 Volt IQ 的 RAG 路線跟 Domino IQ 同源。"
pubDate: 2026-06-16T07:30:00+08:00
lang: zh-TW
slug: hcl-volt-mx-v10-darwin
tags:
  - "Volt MX"
  - "News"
sources:
  - title: "HCL Volt MX v10 'Darwin': From Figma to App, AIAD, CarPlay, and Beyond — HCL Blog"
    url: "https://www.hcl-software.com/blog/volt-mx/hcl-volt-mx-v10-darwin-from-figma-to-app-aiad-carplay-and-beyond"
  - title: "HCL Volt MX Release Notes — HCL Documentation"
    url: "https://help.hcl-software.com/voltmx/latest/VMX_release_notes.html"
  - title: "HCL Volt MX Release Part 1: The Future of App Development (video)"
    url: "https://www.youtube.com/watch?v=CrA-dKCZ8aI"
relatedJava: []
relatedSsjs: []
cover: "/covers/hcl-volt-mx-v10-darwin.webp"
coverStyle: "photoreal-3d"
---

先把話講清楚：這不是即時新聞。HCL 在 **2025 年 8 月**就[發佈了 Volt MX v10「Darwin」](https://www.hcl-software.com/blog/volt-mx/hcl-volt-mx-v10-darwin-from-figma-to-app-aiad-carplay-and-beyond)，這篇是一篇**補課用的背景介紹** —— 把這一版帶來什麼整理給沒在追 Volt MX 的 Domino 開發者，順便講清楚它跟 Domino 到底有什麼關係。

Volt MX 是 HCL 的**低程式碼（low-code）應用開發平台**，用來快速做跨平台的行動與 web app。v10「Darwin」這一版的主軸，幾乎全押在 **AI 與設計到開發的流程**上。

## 三個招牌功能

**1. Figma 設計直接變 App。** 可以把 Figma 設計稿透過 GenAI 直接匯入 Volt Iris（它的設計工具）轉成表單。官方說這能把開發工作量「砍半甚至更多」。對「設計師給稿、工程師重刻一遍」這個老問題，這是一條捷徑。

**2. AIAD（AI Assisted Dev）。** 這一版把 Volt IQ 用 **RAG**[^rag] 強化，做到「有上下文」的程式生成與文件查詢 —— 你問它怎麼做某件事，它會根據文件給出貼合情境的答案與程式碼，還附文件連結。這條路線跟站上先前介紹的 [Domino IQ 的 RAG](/domino-news/posts/domino-iq-rag/) 是同一套思路：把產品文件當知識庫、用 RAG 餵給模型。

**3. CarPlay / Android Auto。** 開發者可以做「能接上 Apple CarPlay 與 Google Android Auto」的車機 app —— 把 Volt MX 的目標裝置從手機、平板延伸到車上螢幕。

## 其他值得一提的

- **Volt Foundry 加入 Governance**：部署前可以有審查／核准流程。
- **iOS Live Activities**：鎖定畫面的即時更新（像點餐進度、配送狀態那種）。
- **Passkeys**：無密碼登入。
- **HCL DX portlet 部署整合**：跟 HCL Digital Experience 的整合。
- **重新設計的 Volt Iris 介面**。
- **AI Marketplace 擴充到 40+ 個 AI 資產**：文件智慧、影像分析、NLP、語音介面等現成元件。

完整的版本內容以[官方 release notes](https://help.hcl-software.com/voltmx/latest/VMX_release_notes.html) 為準；HCL 也有一支[發表會影片](https://www.youtube.com/watch?v=CrA-dKCZ8aI)做整體介紹。

## 那這跟 Domino 開發者有什麼關係？

兩個接點：

1. **Volt MX Go** 是與 **Domino 綁定**的版本 —— 讓你用 Volt MX 的工具，直接在既有的 Domino 資料與應用上做現代化前端。換句話說，Volt MX 不是「另一個世界」，對 Domino 客戶來說它是官方推的現代化路徑之一。
2. **Volt IQ 認得 Domino**。官方明說 Volt IQ 能回答「關於其他 HCL 產品的問題，包括 Leap、Volt MX Go 跟 Domino（依授權而定）」。也就是說，它的 AI 助理把 Domino 也納進了知識範圍。

所以即使你日常只碰 Domino、不寫 Volt MX，v10 這一版仍透露了 HCL 的方向：**設計到開發走 GenAI、AI 助理走 RAG、現代化前端走 Volt MX Go 接 Domino**。這跟 Domino 自己這兩年（Domino IQ 的 RAG、DRAPI 當 REST 後端）的走向是同一個大方向 —— 整個 HCL 生態系都在往「AI + 標準化整合」靠。

[^rag]: RAG = Retrieval-Augmented Generation，檢索增強生成。先從知識庫（如產品文件）檢索相關內容，再餵給大型語言模型生成答案，藉此讓回答有依據、減少幻覺。

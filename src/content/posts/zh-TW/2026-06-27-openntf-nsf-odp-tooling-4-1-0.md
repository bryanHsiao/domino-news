---
title: "NSF ODP Tooling：不開 Designer，把 NSF 變成可版控的原始碼"
description: "NSF ODP Tooling 是 OpenNTF 的專案，把二進位的 NSF 拆成檔案系統上的 On-Disk Project（ODP），讓你能把 Domino 應用放進 Git，再不靠 Domino Designer 就把 ODP 編譯回完整的 NSF —— 為 Domino 帶來真正的版本控制與 CI/CD。本文完整介紹它是什麼、Maven plugin 與容器化編譯怎麼運作，以及 4.1.0 這一版實際改了什麼。"
pubDate: "2026-06-27T11:45:02+08:00"
lang: "zh-TW"
slug: "openntf-nsf-odp-tooling-4-1-0"
tags:
  - "Domino Designer"
  - "Java"
  - "DevOps"
  - "Tutorial"
sources:
  - title: "NSF ODP Tooling — OpenNTF 專案頁"
    url: "https://openntf.org/main.nsf/project.xsp?r=project%2FNSF+ODP+Tooling%2Fsummary"
  - title: "OpenNTF/org.openntf.nsfodp — GitHub 原始碼庫"
    url: "https://github.com/OpenNTF/org.openntf.nsfodp"
  - title: "NSF ODP Tooling 4.1.0 — GitHub release notes"
    url: "https://github.com/OpenNTF/org.openntf.nsfodp/releases/tag/4.1.0"
  - title: "設定 Domino Designer 來源控制使用者喜好設定 — HCL Docs"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/user/wpd_designer_prefs_source_control.html"
cover: "/covers/openntf-nsf-odp-tooling-4-1-0.webp"
coverStyle: "low-poly-3d"
---
只要你試過把 Domino 應用放進版本控制，大概都撞過同一道牆：NSF 是二進位容器、Domino Designer 是只能用滑鼠點的 GUI IDE，Git 根本沒東西可以 diff。NSF ODP Tooling 就是 OpenNTF 用來打掉這道牆的專案。它在台灣的 Domino 圈子知道的人不多，所以這篇不是發版快訊，而是一篇完整介紹 —— 它是什麼、怎麼運作，以及最新的 4.1.0 帶來了什麼。

## 重點摘要

- **NSF ODP Tooling** 把二進位的 NSF 轉成 *On-Disk Project*（ODP）—— 一個由文字／XML 設計檔組成、可以 commit 進 Git 的資料夾 —— 並且能**不透過 Domino Designer**就把 ODP 編譯回完整的 NSF。
- 這解鎖了 Designer 做不到的事：有意義的 diff、分支與合併，以及在 CI/CD（Jenkins、GitHub Actions、GitLab CI）裡的**無頭編譯**[^headless]。
- 它以 **Maven plugin** 形式運作，提供三種執行模式 —— Domino 伺服器、Docker 容器，或本機 Notes／Domino 安裝。
- **4.1.0** 是一版維護與打磨更新：改善 Docker 容器編譯、可設定建置時間戳的語系／時區、ACL entry 類型設定，以及依賴清理。

## 問題所在，以及 Designer 已經解決的部分

傳統的 Domino 開發者整天待在 Domino Designer 裡。所有設計元件 —— form、view、agent、XPages、script library —— 都以二進位格式存在 NSF 內部。開箱即用的情況下，這讓現代工具鏈很尷尬：你沒辦法對二進位 NSF 下 `git diff`、兩個開發者沒辦法各開分支再合併設計變更，而且編譯一直以來都得靠 Designer GUI。

但 Designer **並不是**完全的死路，這點值得講精確。從 9.0.x 時代起，它就內建了**來源控制（Source Control）**功能 —— 檔案 ▸ 喜好設定 ▸ Domino Designer ▸ 來源控制 —— 把一個 NSF 綁到一個 on-disk project 並保持兩邊同步。有三個選項是關鍵（[HCL 官方文件](https://help.hcl-software.com/dom_designer/9.0.1/user/wpd_designer_prefs_source_control.html)有完整說明）：

- **啟用修改時自動匯出設計元素（從 NSF 至磁碟）** —— NSF 內的編輯會自動寫出到 on-disk project。
- **啟用修改時自動匯入設計元素（從磁碟至 NSF）** —— 磁碟上的變更會被拉回 NSF（需搭配 auto-build 開啟）。
- **使用「二進位 DXL」進行來源控制作業** —— 預設開啟，而這正是要知道的那一個。**把它取消勾選**，設計元素就會匯出成**文字 DXL**：人類可讀、能用一般 Git 工具合併。維持勾選則是二進位 DXL，round-trip 完全保真，但不能 diff、不能 merge。

所以版控這一半，光靠 Designer 就能做到，而且不少團隊就是這樣跑 —— 關掉二進位 DXL、把設計元素以文字形式 commit。代價是 HCL 文件與資深開發者都會提醒的「保真度」問題：少數元件類型用文字 DXL 無法乾淨 round-trip（例如以 resource 方式插入的 JavaScript library，可能匯出成空殼），所以你是用一點失真換取可合併的原始碼。

**真正剩下**的限制才是重點：Designer 的 on-disk project 仍然需要 **Designer 本身** —— 一台開發者機器上的 GUI IDE —— 才能把專案編譯回 NSF。你沒辦法叫一台無頭建置代理機去跑它。這就是 NSF ODP Tooling 補上的缺口。

## On-Disk Project 到底是什麼

**On-Disk Project（ODP）** 是 NSF 設計的檔案系統表示法。原本一坨不透明的二進位，攤開成一棵目錄樹：form 與 view 是 DXL／XML、LotusScript library 是原始檔、Java 與 XPages 維持各自正常的原始碼形式，外加 file resource、圖片，以及資料庫的 ACL 與屬性。這個格式是 Designer 相容的 —— Designer 本身就能把 NSF 與 on-disk project 雙向同步 —— 但 NSF ODP Tooling 讓你能在 Designer **之外**操作同一份結構，這正是重點。

因為每個元件現在都是磁碟上的文字，Git 就把 Domino 應用當成任何一般專案來對待：逐行 diff、blame、pull request，一應俱全。

## 它做的三件事

[NSF ODP Tooling 專案](https://github.com/OpenNTF/org.openntf.nsfodp)由三個互相搭配的部件組成：

1. **ODP Compiler** —— 吃進一個 on-disk project，產出完整的 NSF。過程中會解析傳統設計元件、XPages 以及 OSGi[^osgi] plugin 依賴。
2. **ODP Exporter** —— 反方向：把既有的 NSF 匯出成 Designer 相容的 ODP，讓你第一次把一個老應用納入版本控制。
3. **Maven 與 Eclipse 整合** —— 一個 Maven plugin（`org.openntf.maven:nsfodp-maven-plugin`）在建置流程裡驅動編譯與部署，另有 Eclipse plugin 在 IDE 裡加上 XPages 自動完成與編譯／部署動作。此外還有一個 NSF 部署服務，能不透過 Notes 用戶端就把編好的 NSF 推上伺服器；以及一個 XSP transpiler，把 XPages 與 Custom Control 轉成純 Java 原始碼。

## 實際怎麼用

實務上你會採用 `domino-nsf` 這個 Maven packaging，並在 `pom.xml` 裡設定 plugin：

```xml
<plugin>
  <groupId>org.openntf.maven</groupId>
  <artifactId>nsfodp-maven-plugin</artifactId>
  <version>4.1.0</version>
  <extensions>true</extensions>
</plugin>
```

常用的 Maven goal 有 `compile`（ODP → NSF）、`export-odp`（NSF → ODP）、`transpile-xsp`（XPages → Java）與 `deploy`（把建好的 NSF 推上伺服器）。編譯本身需要一個 Domino runtime 來解析設計元件，工具提供三種方式來給它：

- **容器化（Container-based）** —— 4.0 系列加入的招牌功能。編譯跑在一個內含 Domino runtime 的 Docker 容器裡，所以建置代理機**完全不需要**本機 Notes 或 Designer 安裝。這是最適合 CI 的路線。
- **遠端（Remote）** —— 讓建置指向一台已安裝本工具 update site 的專用 Domino 伺服器。
- **本機（Local）** —— 使用本機 Notes／Domino 安裝，並在 plugin 裡設定 program 與 platform 目錄。

整體需求是 Maven 3.x 加上一個現代 JDK；伺服器端部件以 Domino 9.0.1 FP10 以上為目標。多數團隊會想走容器化這條路，正因為它拿掉了「建置機器上必須裝 Notes」這個多年來讓 Domino CI 很痛的限制。

## 4.1.0 實際改了什麼

這點值得仔細講，因為這個版號聽起來比 changelog 實際內容更有戲 —— 4.1.0 是一版聚焦的維護更新。根據 [4.1.0 release notes](https://github.com/OpenNTF/org.openntf.nsfodp/releases/tag/4.1.0)，實質變更是：

- **Docker 容器編譯改善**與 GitHub Actions 建置 scaffolding，延續 4.0 定下的容器優先方向。
- **語系與時區設定** —— 為容器、以及寫進建置的時間戳，新增 `timeZone` 與語系屬性，並讓 title 時間戳格式可設定，全部從 Maven 端驅動。
- **ACL 設定** —— 支援在 ACL 設定中指定 `aclEntry` 類型。
- **正確處理 PNG 圖片資源**，並修正本機 Maven repository 位置查找。
- **依賴清理** —— 移除 `com.ibm.commons.xml` 依賴，並升級數個依賴版本。
- **內部重構** —— 把操作 ODP 的程序整併進一個 `OnDiskProject` 類別，並改善 parent template 名稱邏輯。

這裡沒有任何東西會改變你採用工具的方式；它就是那種拿來把容器建置磨順、把設定收緊的版本。有些摘要把執行緒安全的修正（把 `JavaSourceClassLoader` 改用 `ConcurrentHashMap` 以修掉 `ConcurrentModificationException`）算在 4.1.0 頭上，但那其實更早就進到 4.0.x 系列了 —— 這也提醒我們：要看 release tag，別信一份生成出來的摘要。

## 誰該關注

如果你維護 Domino 應用、又希望它們表現得像正常的軟體專案 —— 設計變更能 code review、能自動建置、能可重現地部署 —— NSF ODP Tooling 就是那座橋。它採 Apache 2.0 授權且持續維護中，[OpenNTF 上的專案頁](https://openntf.org/main.nsf/project.xsp?r=project%2FNSF+ODP+Tooling%2Fsummary)連到下載與文件。對一個還在靠 Designer 做完所有事的台灣團隊來說，光是容器化編譯就值得一看：它是「我們靠在用戶端 replace design 來部署」和「每次 merge 我們的 pipeline 就建置並出貨 NSF」之間的差別。

[^headless]: 無頭（headless）指不開圖形介面、純由指令或服務驅動的執行方式；無頭編譯就是不開 Designer GUI、由建置流程自動把 ODP 編譯成 NSF。

[^osgi]: OSGi 是 Java 的模組／plugin 框架，Domino 伺服器與 Designer 都建構在它之上；NSF ODP Tooling 在編譯 XPages 與 Java 設計元件時，必須解析 OSGi plugin 依賴。

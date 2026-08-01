---
title: "你永遠不會 new 出來的 NotesDOM 節點：唯讀的 DTD 角落"
description: "NotesDOM 實作了完整的 W3C 節點模型，這代表有四種節點型別存在於多數 XML 開發者從不碰的 DTD 角落：DocumentType、Entity、EntityReference、Notation。一份簡短地圖 —— 它們是什麼、哪一個你真的能建立（EntityReference）、哪些是已解析 DTD 的唯讀反映、以及為什麼在 2026 年你多數時候可以直接走過它們，外加那個「知道它們存在能省下一個下午」的情境。"
pubDate: 2026-07-25T07:30:00+08:00
lang: zh-TW
slug: notes-dom-dtd-nodes
tags:
  - "LotusScript"
sources:
  - title: "NotesDOMDocumentTypeNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTTYPENODE_CLASS.html"
  - title: "NotesDOMEntityReferenceNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMENTITYREFERENCENODE_CLASS.html"
  - title: "NotesDOMNotationNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNOTATIONNODE_CLASS.html"
  - title: "NotesDOMEntityNode (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMENTITYNODE_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-dom-dtd-nodes.webp"
coverStyle: "low-poly-3d"
---

[`NotesDOMParser`](/domino-news/zh-TW/posts/notes-dom-parser) 這一家實作了完整的 W3C 節點模型，而「完整」包含那個幾乎沒人造訪的角落：Document Type Definition。四種節點型別住在那裡 —— `NotesDOMDocumentTypeNode`、`NotesDOMEntityNode`、`NotesDOMEntityReferenceNode`、`NotesDOMNotationNode`。它們是本站 DOM/XML 家族最後四個未涵蓋的類別，這篇把地圖收尾。它刻意寫得短：誠實的結論是，在 2026 年你多數日子都能直接走過這四個，這裡的價值在於「哪天走不過去時，你知道它們是什麼」。

四個都是一樣的年份 —— Release 6 新增，都不支援 COM。

---

## 為什麼 DTD 這個角落很安靜

DTD 是宣告 XML 文件結構的老方法 —— 最上面一個 `<!DOCTYPE>`，裡面放 `<!ENTITY>` 與 `<!NOTATION>` 宣告。用來做驗證的工作，schema 語言（XSD、RELAX NG）多年前就取代了它，而你今天在 Domino 整合裡會解析到的多數 XML —— 一份 REST payload、一個設定檔、另一個系統的匯出 —— 根本不帶 DTD。沒有 DTD，這四種節點型別就一個都不會出現在你的樹裡。這就是為什麼一整個十年的 `NotesDOMParser` 程式，可以完全沒引用過它們。

它們只在一種情況浮現：你解析到一份**真的**帶 DTD 的文件 —— 常是某種老的交換格式，或一份會引入 `&companyName;` 這類具名 entity 的文件。這時 parser 會建出這些節點來反映 DTD 宣告了什麼，你走訪樹時就可能撞上它們。

## 三個唯讀的反映

[`NotesDOMDocumentTypeNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMDOCUMENTTYPENODE_CLASS.html) 是入口。HCL 說明文件把它描述為「文件所定義的 entity 清單」—— 當 `<!DOCTYPE>` 存在時你從 document 節點取得它，而它是那份宣告的唯讀反映。它在 LotusScript 上的介面刻意很薄；它存在是為了*代表* doctype，不是讓你改寫它。

掛在它底下的是兩種宣告節點：

- [`NotesDOMNotationNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMNOTATIONNODE_CLASS.html) ——「代表 DTD 裡宣告的一個 notation」。它兩個有意義的屬性 `PublicID` 與 `SystemID` 都是**唯讀**。notation 為一個外部格式命名（經典例子是用 `<!NOTATION jpeg SYSTEM "image/jpeg">` 建立關聯，讓一個未解析的 entity 能指向它）。你讀它；你不建它。
- `NotesDOMEntityNode` ——「代表 XML 裡的一個 entity 節點」，也就是被宣告的 entity 本身。跟 notation 節點一樣，它本質上是唯讀反映：多數屬性唯讀，只有通用的 `NodeValue` 與 `Prefix` 可寫（那是繼承來的，不是 DTD 專屬）。

這三個共通的樣式：它們映照 DTD 說了什麼，而 API 沒給你真正能撰寫它們的方式。這是對的 —— 你不會靠戳 DOM 節點來改寫一份文件的 DTD。

## 那一個你真的能建立

例外是 [`NotesDOMEntityReferenceNode`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOMENTITYREFERENCENODE_CLASS.html)。*entity reference* 是使用端 —— 內容裡的 `&companyName;`，相對於宣告它的那個 `<!ENTITY companyName "...">` —— 而這一個你可以建，用 document 節點上的 `CreateEntityReferenceNode`。所以如果你在組一份文件、它該輸出一個具名 entity reference 而不是展開後的文字，那就是這個呼叫。

實務上這很罕見：多數解析設定會在解析時把 entity reference 展開成文字，所以你根本看不到 reference 節點；而你產生的多數文件，用字面文字都比用一個「下一個消費端可能解不出來」的具名 reference 更好。但這個 create 方法確實存在，而它是這個角落裡唯一一道「你是作者、不是讀者」的縫。

## 實務上的結論

別為了保險，就把這四種的處理硬寫進一般的 parser 走訪。如果你那個對節點型別做 `Select Case` 的地方沒提它們，一份不帶 DTD 的文件 —— 現在幾乎是全部 —— 永遠不會踩到那個缺口。哪天你**真的**接手一個帶 DTD 的格式、走訪撞到一個不認得的節點，它就是從這個角落來的：一份 `<!DOCTYPE>` 的唯讀反映，外加那個「你需要時可以在輸出端建立」的 entity-reference 節點。

## 同類別在其他語言

跟 NotesDOM 家族其餘成員一樣：沒有 Domino 專屬的對應。Java 用標準的 `org.w3c.dom` 型別 —— `DocumentType`、`Entity`、`EntityReference`、`Notation` —— 透過一個 JAXP parser，SSJS 則靠平台原生的 DOM。DTD 的節點模型在三者間一模一樣，因為它是同一份 W3C 規範；只有 LotusScript 這組類別戴著 `NotesDOM` 前綴。如果你在語言之間搬一段懂 DTD 的程式，形狀一對一對得起來 —— 而考量到現在幾乎沒人再寫懂 DTD 的程式，這多半只是一個你用不到的安心保證。

---
title: "NotesDirectory：LotusScript 中的目錄查詢"
description: "深入探討 NotesDirectory 類別，學習如何在 LotusScript 中查詢和操作 Notes 目錄，實現高效的目錄查詢和用戶資訊檢索。"
pubDate: "2026-05-30T07:33:48+08:00"
lang: "zh-TW"
slug: "notesdirectory-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDirectory (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDIRECTORY_CLASS.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "LotusScript Classes A-Z"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_USING_THE_NOTES_CLASSES.html" was already cited by [notes-item] on 2026-05-21. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesdirectory-lotusscript
-->

## 簡介

在 HCL Domino 開發中，**NotesDirectory** 類別提供了一種強大的方式，讓開發者能夠在 LotusScript 中查詢和操作 Notes 目錄。這對於需要進行用戶資訊檢索、驗證或其他目錄相關操作的應用程式而言，至關重要。

## NotesDirectory 類別概述

**NotesDirectory** 類別代表特定伺服器或本地電腦上的 Notes 目錄。每個目錄都與一個或多個目錄導航器相關聯，允許進行目錄查詢。

### 主要屬性

- **AvailableItems**：只讀。已查詢並快取的摘要資料項目陣列。
- **AvailableNames**：只讀。已查詢並快取的名稱陣列。
- **AvailableView**：只讀。已查詢並快取的視圖名稱。

### 主要方法

- **CreateNavigator**：創建一個新的目錄導航器。
- **FreeLookupBuffer**：釋放查詢緩衝區。
- **GetMailInfo**：獲取郵件資訊。
- **LookupAllNames**：查詢所有名稱。
- **LookupNames**：查詢特定名稱。

## 使用範例

以下範例展示如何使用 **NotesDirectory** 類別來查詢特定用戶的郵件資訊。

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim directory As NotesDirectory
    Dim navigator As NotesDirectoryNavigator
    Dim entry As NotesDirectoryEntry
    
    ' 創建目錄對象，指向當前伺服器
    Set directory = session.GetDirectory("")
    
    ' 創建目錄導航器
    Set navigator = directory.CreateNavigator
    
    ' 查詢特定用戶的郵件資訊
    If directory.LookupNames("Users", "John Doe") Then
        Set entry = navigator.GetFirstEntry
        Do While Not entry Is Nothing
            Print "用戶名: " & entry.GetItemValue("FullName")(0)
            Print "郵件地址: " & entry.GetItemValue("InternetAddress")(0)
            Set entry = navigator.GetNextEntry
        Loop
    Else
        Print "未找到用戶資訊。"
    End If
End Sub
```

在此範例中，我們首先創建了一個 **NotesDirectory** 對象，指向當前伺服器。然後，通過 **CreateNavigator** 方法創建了一個目錄導航器。接著，使用 **LookupNames** 方法查詢名為 "John Doe" 的用戶資訊，並通過導航器遍歷查詢結果，輸出用戶名和郵件地址。

## 注意事項

- **目錄權限**：確保執行查詢的用戶具有適當的目錄訪問權限。
- **性能考量**：對於大型目錄，查詢可能會消耗較多資源。建議對查詢結果進行快取，以提高性能。

## 結論

**NotesDirectory** 類別為 LotusScript 開發者提供了一種高效的方式來查詢和操作 Notes 目錄。通過熟悉其屬性和方法，開發者可以實現各種目錄相關的功能，滿足應用程式的需求。

有關 **NotesDirectory** 類別的更多資訊，請參閱 [官方文檔](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDIRECTORY_CLASS.html)。

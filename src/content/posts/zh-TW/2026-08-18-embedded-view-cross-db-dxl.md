---
title: "跨 DB 的 embedded view 搬到測試區就「無法啟動」？問題出在 DXL 裡綁死的抄本 ID"
description: "一個 form 上的跨 DB 嵌入視圖，在開發區好好的，交到客戶測試區就顯示「無法啟動」。翻遍 Designer 的嵌入視圖 UI 也沒有地方換來源資料庫。把 form 匯出成 DXL 才發現：embeddedview 元素用來源庫的抄本 ID（replica ID）綁死來源，換了環境那個 ID 就對不上。這篇是實測記錄：怎麼診斷、怎麼用一支 NotesDXLExporter/Importer 的 agent 批次換掉，以及後來才發現的更快解法——Designer 直接「以 DXL 編輯」。"
pubDate: 2026-08-18T07:30:00+08:00
lang: zh-TW
slug: embedded-view-cross-db-dxl
tags:
  - "LotusScript"
  - "Tutorial"
  - "Domino Designer"
  - "DevOps"
sources:
  - title: "embeddedview element (Domino DTD) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EMBEDDEDVIEW_ELEMENT_XML.html"
  - title: "NotesDXLImporter class — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html"
  - title: "NotesDXLExporter class — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html"
relatedJava: ["DxlExporter", "DxlImporter"]
relatedSsjs: ["DxlExporter", "DxlImporter"]
cover: "/covers/embedded-view-cross-db-dxl.webp"
coverStyle: "risograph"
---

一個 form 上放了一個**跨 DB 的嵌入視圖**（embedded view）——顯示的資料來自另一個資料庫。在開發區跑得好好的，打包交到客戶測試區，一開表單，那個嵌入視圖卻是一句「**VDataRetentionMgmtLog 無法啟動**」，底下還寫著「若再次試著啟動，請按一下此長方形或按空白鍵」。

打開 Designer 的「嵌入的視圖」內容面板翻了一圈：名稱、目標圖文框、顯示方式（使用 Java Applet）……**就是沒有一個欄位讓你指定或更換來源資料庫**。來源 DB 到底被記在哪裡？這篇是那天的實測記錄。

---

## 重點摘要

- **嵌入視圖把來源庫用「抄本 ID（replica ID）」綁死在 form 的 DXL 裡**，不是用路徑、也不是 UNID。官方 DTD 寫明 `embeddedview` 的 `database` 屬性就是「the database's replica ID」。
- **換環境就失效**：測試區那個同名的來源庫是另一份拷貝、抄本 ID 不同，嵌入視圖拿舊 ID 找不到來源，Java Applet 版就顯示「無法啟動」。
- **Designer UI 沒有地方改它**——只能從 DXL 下手。
- **解法 A（可自動化）**：一支 agent 用 `NotesDXLExporter` 匯出 form → 換掉 `database` 屬性的值 → `NotesDXLImporter` 以 `REPLACE_ELSE_IGNORE` 重匯入。
- **解法 B（單一元件最快）**：設計元件右鍵「**以 DXL 編輯**」，直接改那個屬性、存檔，Designer 自動重匯入。我繞了 A 才發現 B。

---

## 問題現場：UI 裡找不到來源庫

嵌入視圖的內容面板能設的東西其實不多：名稱、目標圖文框（按一下 / 按兩下滑鼠）、以及「顯示」方式——這個案子用的是 **Java Applet**。而它顯示不出來時，那句「無法啟動、按空白鍵重試」正是 **Java Applet 版嵌入視圖**在啟動不了時的標準畫面。

問題是：applet 要去哪個資料庫抓那個 view？面板上完全沒提。來源庫的資訊一定被存在別的地方——那就是 form 的設計本身。

## 診斷：把 form 匯出成 DXL

要看見 UI 藏起來的設計，最直接的方法就是把設計元件匯出成 [DXL](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html)（Domino 的 XML 表示法）。匯出這個 form，在一堆設計 XML 裡就看到了那個嵌入視圖：

```xml
<embeddedview name='VDataRetentionMgmtLog'
    widthtype='fitwindow' width='90%' height='2in'
    database='48258DCC002E9502'>
  <code event='showsinglecategory'><formula>@Text(@DocumentUniqueID)</formula></code>
</embeddedview>
```

`database='48258DCC002E9502'` ——這串就是答案。對照來源庫的內容面板，它的**抄本 ID** 是 `48258DCC:002E9502`；除了 UI 顯示會加一個冒號，兩者一模一樣。[官方 DTD](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EMBEDDEDVIEW_ELEMENT_XML.html) 對這個屬性的定義寫得很白：

> Database containing the view being embedded. Can be the database's replica ID or one of the keywords defined in the %named.element.link.databases; entity…

也就是說，**嵌入視圖是用「抄本 ID」認來源庫的**。這下就懂為什麼一換環境就爛掉了：開發區那顆來源庫，和測試區這顆同名的來源庫，其實**不是彼此的抄本（replica）**——它們是各自獨立建立的拷貝，各有各的抄本 ID。（真正互為 replica 的兩顆，抄本 ID 反而會一樣；問題正是它們不是。）form 的 DXL 裡還寫著開發區那顆 ID，測試區沒有那個抄本 ID 的庫，Java Applet 一啟動就「無法啟動」。

## 解法 A：寫一支 agent 換掉 DXL 裡的抄本 ID

既然來源 ID 就在 DXL 裡，那就把 form 匯出、把那個 `database` 值換成測試區來源庫的抄本 ID、再匯入覆蓋回去。整個流程靠 `NotesDXLExporter` 和 [`NotesDXLImporter`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html) 一氣呵成：

```lotusscript
Const TARGET_FORM_NAME = "embeddedview_TEST"
Const EMBEDDED_VIEW_NAME = "VDataRetentionMgmtLog"
Const TARGET_DB_PATH = "TestBryan/SampleCode.nsf"

Sub Initialize
    Dim s As New NotesSession
    Dim db As NotesDatabase
    Dim targetDb As NotesDatabase
    Dim form As NotesForm
    Dim nc As NotesNoteCollection
    Dim exporter As NotesDXLExporter
    Dim importer As NotesDXLImporter
    Dim dxl As String, newDxl As String, replicaId As String

    Set db = s.CurrentDatabase

    ' 1. 開啟測試區的來源庫，拿它的抄本 ID
    Set targetDb = s.GetDatabase(db.Server, TARGET_DB_PATH, False)
    replicaId = targetDb.ReplicaID          ' 無冒號的 16 碼，正好對上 DXL 格式

    ' 2. 把要修改的 form 放進一個 NoteCollection
    Set form = db.GetForm(TARGET_FORM_NAME)
    Set nc = db.CreateNoteCollection(False)
    Call nc.Add(form)

    ' 3. 匯出 form 的 DXL
    Set exporter = s.CreateDXLExporter
    dxl = exporter.Export(nc)

    ' 4. 只換掉那個嵌入視圖的 database 屬性值
    newDxl = ReplaceEmbeddedViewDatabase(dxl, EMBEDDED_VIEW_NAME, replicaId)
    If newDxl = "" Then
        MessageBox "找不到 Embedded View：" & EMBEDDED_VIEW_NAME, 16, "失敗"
        Exit Sub
    End If

    ' 5. 匯入覆蓋回目前資料庫
    Set importer = s.CreateDXLImporter
    importer.DesignImportOption = DXLIMPORTOPTION_REPLACE_ELSE_IGNORE
    Call importer.Import(newDxl, db)
End Sub
```

第 5 步的 `DXLIMPORTOPTION_REPLACE_ELSE_IGNORE` 是重點：官方說 `DesignImportOption` 決定「incoming design elements 要 create、ignore、還是 replace」，而這個選項的意思是「有同名的就取代、沒有就略過」——正是「更新一個既有 form」要的行為，不會不小心新增出重複的設計。

真正的手術在 `ReplaceEmbeddedViewDatabase`。這裡**沒有**用 regex、也沒有動用 XML parser，而是用字串邊界一步步框出來——找到 `<embeddedview`、框到它的 `>`、確認 tag 內含我們要的 `name=`、再在**這個 tag 範圍內**找 `database=`，抓出引號、換掉引號之間的值：

```lotusscript
Function ReplaceEmbeddedViewDatabase(dxl As String, viewName As String, _
    replicaId As String) As String

    Dim tagStart As Long, tagEnd As Long, dbPos As Long
    Dim valueStart As Long, valueEnd As Long
    Dim tagText As String, quoteChar As String, pos As Long
    Dim searchName1 As String, searchName2 As String

    ReplaceEmbeddedViewDatabase = ""
    ' 單引號、雙引號兩種寫法都要認得
    searchName1 = "name='" & viewName & "'"
    searchName2 = |name="| & viewName & |"|

    pos = 1
    Do
        tagStart = InStr(pos, dxl, "<embeddedview")
        If tagStart = 0 Then Exit Do
        tagEnd = InStr(tagStart, dxl, ">")
        If tagEnd = 0 Then Exit Do
        tagText = Mid$(dxl, tagStart, tagEnd - tagStart + 1)

        ' 是不是我們要改的那個嵌入視圖？
        If InStr(tagText, searchName1) > 0 Or InStr(tagText, searchName2) > 0 Then
            dbPos = InStr(tagStart, dxl, "database=")
            If dbPos = 0 Or dbPos > tagEnd Then Exit Function   ' database= 不在這個 tag 內

            valueStart = dbPos + Len("database=")
            quoteChar = Mid$(dxl, valueStart, 1)                ' ' 或 "
            If quoteChar <> "'" And quoteChar <> |"| Then Exit Function

            valueStart = valueStart + 1
            valueEnd = InStr(valueStart, dxl, quoteChar)
            If valueEnd = 0 Or valueEnd > tagEnd Then Exit Function

            ' 換掉引號之間的舊抄本 ID
            ReplaceEmbeddedViewDatabase = _
                Left$(dxl, valueStart - 1) & replicaId & Mid$(dxl, valueEnd)
            Exit Function
        End If
        pos = tagEnd + 1
    Loop
End Function
```

幾個當時刻意做的判斷，回頭看都值得：`targetDb.ReplicaID` 回的是**無冒號**的 16 碼十六進位，剛好就是 DXL 屬性要的格式，不用轉；`name=` 同時比對單雙引號，因為 DXL 兩種都可能出現；每一步都用 `> tagEnd` 守住，確保換的是**這個** `<embeddedview>` 自己的 `database`，不會誤傷 tag 外的字串。

字串邊界解析在這種「只換一個屬性值」的情境夠用、也最省事。但要提醒：它比不上真正的 XML 解析穩——如果哪天要處理巢狀、跳脫字元、或多個屬性交錯，還是該用 `NotesDOMParser`。站上 [DXL round-trip 的雷](/domino-news/posts/dxl-round-trip-pitfalls) 那篇談過這條界線。這支 agent 的匯出／匯入骨架，也和 [NotesDXLImporter 那篇](/domino-news/posts/notes-dxl-importer)、[NotesNoteCollection 那篇](/domino-news/posts/notes-note-collection) 是同一套。

## 解法 B：其實可以直接「以 DXL 編輯」

agent 三兩下就把問題解掉了。但收工後才發現——**Designer 本來就能直接編輯設計元件的 DXL**。

在 Designer 的設計元件清單上，對那個 form 按右鍵，選單裡有一項「**以 DXL 編輯**」（英文選單為 Edit With DXL）。點下去，Designer 就把這個元件的 DXL 當成純文字打開讓你改；找到那行 `database='...'`、把抄本 ID 換成測試區的、存檔，Designer 會自動把改過的 DXL 匯回設計。

單一元件、一次性的修改，這是最快的路——不必寫 code、不必跑 agent，開—改—存三步就完。

## 那，什麼時候用哪一招？

兩招都在改同一個東西（DXL 裡的 `database` 屬性），差別只在規模與重複性：

- **一次、單一元件** → 直接「以 DXL 編輯」。最快。
- **要重複、要批次、要進部署流程** → 寫成 agent。譬如「每次把應用交付到新環境，就自動把所有跨 DB 嵌入視圖的來源指向該環境的來源庫」——這種可重複的動作，手動點 DXL 編輯就不划算了，agent 才是對的工具。

我繞了 A 才撞到 B，但兩個都留著沒有壞處：B 應急、A 收進交付腳本。

## 同類別在其他語言

DXL 的匯出／匯入不是 LotusScript 專利。Java 後端 API 裡有對應的 `DxlExporter` 與 `DxlImporter`（`session.createDXLExporter()` / `createDXLImporter()`），SSJS／XPages 也能呼叫同一套——所以「匯出設計、改 DXL、匯回去」這支 agent，換成 Java 或 SSJS 寫法幾乎一樣。至於「以 DXL 編輯」那顆右鍵，則是 Designer 這個工具本身的功能，跟語言無關。

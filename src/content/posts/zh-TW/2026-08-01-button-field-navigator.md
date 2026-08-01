---
title: "Button、Field、Navigator：三個沒有屬性、沒有方法的 LotusScript 類別"
description: "打開 Button 的 LotusScript 說明，你以為會有屬性和方法 —— 一個都沒有。Field 一樣、Navigator 也一樣。三個都是故意做空的：它們只作為事件的進入點存在，也就是那個「告訴前端事件 handler 是誰觸發了它」的具名 Source 參數。一篇關於「你永遠不會對它呼叫任何東西」的三個類別的實測報告 —— 它們的事件是什麼（Click、Entering／Exiting／OnChange），以及為什麼真正的工作永遠是透過 NotesUIDocument。"
pubDate: 2026-08-01T07:30:00+08:00
lang: zh-TW
slug: button-field-navigator
tags:
  - "LotusScript"
sources:
  - title: "Button (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_BUTTON_CLASS.html"
  - title: "Field (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FIELD_CLASS.html"
  - title: "Navigator (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAVIGATOR_CLASS.html"
relatedJava: []
relatedSsjs: []
---

打開 [`Button`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_BUTTON_CLASS.html) 類別的 Designer 說明，想找個 `Caption` 屬性或 `Click` 方法，結果只看到一句平淡的話：「Button 物件沒有屬性或方法。」打開 [`Field`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FIELD_CLASS.html) —— 一樣。打開 [`Navigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAVIGATOR_CLASS.html) —— 一樣。目錄裡三個類別，上面什麼都沒有。

它們是**故意**做空的。`Button`、`Field`、`Navigator` 不是你去操作的物件；它們是**事件的進入點** —— 前端事件 handler 那個具名的 `Source` 參數，作用是說「觸發我的是這種東西」。這是一篇關於「你永遠不會對它呼叫任何一個方法」的三個類別的簡短實測報告，以及真正的工作跑去哪裡了。三個都只在 Notes client 有效，也都不支援 COM。

---

## 把類別當事件掛鉤

多數 LotusScript 類別是你「對它做事」的東西 —— 你讀 `doc.Items`、呼叫 `db.Search`、設 `stream.Position`。這三個剛好相反。你從不 new 它、也從不對它呼叫任何東西；當使用者按下按鈕、進入欄位、或點一個 navigator 熱點時，runtime 把一個實例當成 `Source` 參數交給你。這個類別是那個參數的*型別*，它唯一的工作就是讓 handler 的簽名變得明確：

```lotusscript
Sub Click(Source As Button)
    ' Source 是一個 Button —— 但它身上沒有東西可讀。
    ' 工作透過前端 UI 類別發生：
    Dim ws As New NotesUIWorkspace
    Dim uidoc As NotesUIDocument
    Set uidoc = ws.CurrentDocument
    Call uidoc.FieldSetText("Status", "Approved")
    Call uidoc.Save()
End Sub
```

注意 `Source` 從頭到尾沒被碰過。它被型別化成 `Button`、讓事件毫不含糊，但因為這個類別沒有成員，所有真的事情 —— 讀欄位、存檔、重整 —— 都繞道 [`NotesUIWorkspace`](/domino-news/zh-TW/posts/notes-ui-view) 與 `NotesUIDocument`。三個都是這個樣式：空類別錨定事件；UI 類別做工。

## 各自錨定什麼

有價值的不是類別，是它讓你能寫的事件：

- **`Button`** ——「表單或文件上的一個 action、action 熱點、或按鈕」。它的事件是 `Click`（外加 `ObjectExecute`，在一個 OLE2 / Notesflow 伺服器啟動它時觸發）。這就是日常的動作按鈕 handler。
- **`Field`** ——「表單上的一個欄位」。這是三個裡有用的那個，因為欄位有生命週期：游標抵達時觸發 `Entering`、離開時觸發 `Exiting`、值改變時觸發 `OnChange`。classic 前端的欄位行為就住在那裡 —— 改值時重算相依欄位、離開時格式化、進入時預填一個值。
- **`Navigator`** ——「一個 navigator 按鈕、熱點、或其他 navigator 物件」。一個事件 `Click`，給老式 imagemap 風格的 navigator 物件用。

`Field` 的 handler 長得跟按鈕那個一樣 —— 你拿到一個不去碰的 `Source As Field`、然後伸手拿 UI 文件去讀或設值：

```lotusscript
Sub Exiting(Source As Field)
    Dim ws As New NotesUIWorkspace
    Dim uidoc As NotesUIDocument
    Set uidoc = ws.CurrentDocument
    If uidoc.FieldGetText("Amount") <> "" And Not IsNumeric(uidoc.FieldGetText("Amount")) Then
        Messagebox "金額必須是數字。", , "檢查"
    End If
End Sub
```

欄位自己那三個事件即使類別是空的也值得認識，因為在 classic client 裡，它們是「使用者在表單上移動時做點什麼」的唯一掛鉤 —— 在 web 驗證存在之前，很多老表單的互動性就放在這裡。

## 為什麼它們是空的（而這沒問題）

如果 `Button` 有個 `Caption` 屬性，會整潔一點，但設計元件真正的狀態住在它的*設計*裡（你在 Designer 設的公式或標籤），不是在一個 runtime 物件裡。事件發生的當下，按鈕身上沒有任何值得暴露、而你又不能從文件或 workspace 更直接拿到的東西。所以與其給你一個半吊子有用的物件，Notes 給你一個空的、它唯一的用途就是替 handler 定型。一旦你看懂這點，「沒有屬性或方法」那句話就不再是失望、而變成整件事的重點：這些不是物件，是通往 UI 程式碼那幾道門的名字。

## 同類別在其他語言

沒有對應，理由跟其他前端類別（[`NotesUIView`](/domino-news/zh-TW/posts/notes-ui-view)、`NotesUIDatabase`）一樣：Domino Java API 只有後端，而 XPages 裡的 SSJS 有它自己的「元件加事件」模型（按鈕是一個帶伺服器端 action 的 `xp:button`、欄位是一個帶 validator 的 `xp:inputText`）。那個*概念* —— 由 UI 元件觸發的一個事件 —— 到哪都通用，但這幾個特定的空類別是 classic-client 的產物。要移植這個行為，是在目標 stack 的事件模型裡重建它，不是去找一個根本不存在的 `Button` 類別。

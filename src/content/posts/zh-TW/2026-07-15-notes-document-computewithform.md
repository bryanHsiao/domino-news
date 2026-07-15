---
title: "NotesDocument.ComputeWithForm：用程式跑表單驗證 — 以及為什麼它擋不住你的 Save"
description: "ComputeWithForm 把表單的預設值、輸入轉換、輸入驗證公式跑在後端文件上 — 相當於使用者在表單上按存檔時觸發的驗證。但三件事會讓人意外：它回一個它從不強制執行的通過/失敗旗標（它照樣讓你把無效文件存進去）、輸入轉換公式可能改寫你的欄位值、而且除非你釘住 Form item、它會悄悄退回預設表單。"
pubDate: 2026-07-15T07:30:00+08:00
lang: zh-TW
slug: notes-document-computewithform
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDocument.ComputeWithForm method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPUTEWITHFORM_METHOD.html"
  - title: "Example: ComputeWithForm method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_COMPUTEWITHFORM_METHOD.html"
  - title: "NotesDocument class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
---

當使用者填好表單按存檔，Domino 會跑表單的公式：預設值填入、輸入轉換公式把資料整理乾淨、輸入驗證公式擋掉不合格的輸入。一個在後端建立文件的 agent 跳過了這一切 — 除非你呼叫 `ComputeWithForm`。這是你用程式拿到同一套驗證的方式。但它跟 UI 存檔的行為差異大到：天真地依賴它，會讓無效資料長驅直入你的資料庫。

---

## 重點摘要

- [`ComputeWithForm`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_COMPUTEWITHFORM_METHOD.html)「透過執行文件表單中定義的預設值、轉換、驗證公式（若有）來驗證一份文件」。
- 簽名：`flag = doc.ComputeWithForm(doDataTypes, raiseError)`。**第一個參數在 14.5.1 被忽略** — 傳 `False`。`raiseError` 決定失敗怎麼呈現：`True` 拋出一個可攔截的錯誤、`False` 回傳 `False`。
- **最大的陷阱：它從不擋 Save。**「不同於 Notes 使用者介面，這個方法允許存檔文件，即使 ComputeWithForm 回傳 False 或拋出錯誤。」你必須自己用回傳旗標把 `Save` 圍起來。
- **輸入轉換可能改寫你的值。** 呼叫後，任何轉換公式可能改過的欄位都要重讀一次（`@Trim`、`@ProperCase` 等）。
- **釘住表單。** 它解析表單的順序是：文件裡儲存的表單 → `Form` item → 資料庫預設表單。一份沒有 `Form` item 的全新後端文件，會悄悄退回預設表單 — 所以明確設 `doc.Form`。

## 它會跑什麼

`ComputeWithForm` 對後端文件執行三種表單公式，就跟在那張表單上存檔一樣：

- **預設值**公式 — 填入文件沒有的欄位。
- **輸入轉換**公式 — 轉換欄位值（去空白、轉大寫、格式化數字）。
- **輸入驗證**公式 — 檢查值，並透過 `@Failure` 擋掉它們。

它*不*做的是重現完整的 UI/web 存檔：WebQuerySave agent、`QuerySave` 事件、以及其他 UI 端的副作用都不在它範圍內。它是表單公式驗證，不是模擬使用者按存檔。

## 簽名，以及那個被忽略的參數

```lotusscript
flag = doc.ComputeWithForm(doDataTypes, raiseError)
```

- `doDataTypes` — **這個方法忽略它**；文件說「指定 True 或 False 皆可」。舊教學把它描述成資料型別檢查；在 14.5.1 它什麼都不做。傳 `False`。
- `raiseError` — `True` 在驗證失敗時拋出執行期錯誤（用 `On Error` 攔）；`False` 則回傳 `False`。多數程式用 `False` 並依結果分支。
- 回傳值 — `True` 代表「文件上沒有錯誤」、`False` 代表「有錯誤」。

## 那個讓壞資料溜進去的陷阱

這是該刺在手臂上的一句，直接取自方法文件：「不同於 Notes 使用者介面，這個方法允許存檔文件，即使 ComputeWithForm 回傳 False 或拋出錯誤。」

在 UI 裡，驗證失敗會*擋下*存檔。`ComputeWithForm` 不會。它算出通過/失敗旗標交給你 — 然後對強制執行不做任何事。如果你呼叫 `ComputeWithForm` 之後無條件 `Save`，你什麼都沒驗證到；無效文件照樣進去。只有當你用它來 gate 存檔，驗證才有意義：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
doc.Form = "Notification"          ' 釘住表單 — 別依賴預設
doc.Topic = "Large bodies of water"

If doc.ComputeWithForm(False, False) Then
    Call doc.Save(True, True)       ' 只在驗證通過時存
Else
    Print "Validation failed — not saving"
End If
```

這是[官方範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_COMPUTEWITHFORM_METHOD.html)，而且是刻意設計成會失敗的：「Notification」表單需要一個 `Subject`，但只設了 `Topic`，所以 `ComputeWithForm` 回傳 `False`、那道 guard 跳過存檔。拿掉 guard，這份不完整的文件照存不誤。要走成功路徑，在呼叫前設好必填欄位（`doc.Subject = "..."`）。

## 另外兩個意外

**輸入轉換會改你的資料。** 轉換公式在驗證*之前*跑，可以就地改欄位值 — 一個 `@Trim` 把你的空白去掉、一個 `@ProperCase` 把名字重新大小寫。如果下游程式依賴你寫入的確切內容，在 `ComputeWithForm` 之後重讀那個欄位；它可能不是你設的那樣。

**表單解析會悄悄退回。** 這個方法挑表單的順序是：文件裡儲存的表單，然後文件的 `Form` item，然後資料庫的預設表單。一份全新的後端文件沒有儲存表單，而且 — 如果你沒設 — 沒有 `Form` item，所以它會對著*預設*表單驗證，那張表單可能有完全不同的欄位與規則。永遠在你用程式建的文件上設 `doc.Form`。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `doc.ComputeWithForm(doDataTypes, raiseError)` | `doc.computeWithForm(dodatatypes, raiseerror)` | `document.computeWithForm(...)` |

Java 的 [`Document.computeWithForm(boolean, boolean)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) 是同樣的雙 Boolean 形狀、語意完全相同 — 第一個參數被忽略、第二個切換「拋例外 vs 回傳 False」（`True` 時 Java 丟 `NotesException`）。SSJS 呼叫同一個後端方法。而「它不擋存檔」這條規則在每個語言都成立：旗標只是建議性的，強制執行是你的事。

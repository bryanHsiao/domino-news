---
title: "Java 的 NotesException：.id、.text 與 try/catch/finally"
description: "LotusScript 的錯誤處理是 On Error Goto、Err.Number、Resume 那一套。搬到 Java，幾乎每個 lotus.domino 方法都會丟一個受檢的 NotesException——編譯器逼你處理，而它身上帶著 .id（Notes 錯誤碼）與 .text（錯誤訊息）。這篇講 Java 版的例外處理：NotesException 的欄位、怎麼用 .id 比對 NotesError 常數做針對性處理，以及把這整個 Java 資料層系列收在一起的那條規則——recycle 要放進 finally，這樣連拋例外時也收得乾淨。"
pubDate: 2026-08-17T07:30:00+08:00
lang: zh-TW
slug: java-notesexception
tags:
  - "Java"
sources:
  - title: "NotesException class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEXCEPTION_CLASS_JAVA.html"
  - title: "Base.recycle (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
  - title: "Document.getItemValue (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD_JAVA.html"
---

LotusScript 的錯誤處理，你大概很熟：`On Error Goto handler`，出錯跳到標籤，看 `Err`、`Error$`，也許 `Resume Next` 繼續。這套邏輯搬到 Java 完全換了個世界——幾乎每一個 `lotus.domino` 方法都會丟一個 [`NotesException`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEXCEPTION_CLASS_JAVA.html)，而且它是**受檢例外（checked exception）**：編譯器會逼你要嘛 `catch`、要嘛在方法簽章上 `throws`，躲不掉。

這篇講 Java 版怎麼處理這個例外，以及一條把整個「Java 資料層」系列收在一起的規則：**你在前幾篇讀到的那些要 recycle 的後端物件，收的動作要放進 `finally`**——否則一拋例外，收的那行就被跳過了。

---

## 重點摘要

- **`NotesException` 是受檢例外**：官方說它「extends java.lang.Exception」。編譯器逼你處理，這跟 LotusScript 的 `On Error`（可選、可忽略）是兩種心態。
- **它身上帶兩個公開欄位**：`id`（`int`，Notes 錯誤碼）與 `text`（`String`，錯誤訊息）。官方原文：「NotesException.id, of type int, contains the error code.」
- **用 `id` 做針對性處理**：拿 `e.id` 去比對 `NotesError` 常數（例如 `NOTES_ERR_SYS_FILE_NOT_FOUND`，值 4003），就能分辨「檔案不存在」跟其他錯誤、分別處理。
- **`recycle` 放進 `finally`**：這樣不論正常結束還是中途拋例外，前面 new 出來的 `Document`、`DateTime`、集合迭代物件都收得掉。這是整個系列的收尾規則。
- **還有一個 `internal` 欄位**：包住「造成這個 Domino 例外的內部例外」，多數情況是 null。

---

## NotesException：受檢，而且帶著錯誤碼

官方對它的定義一句話：「The NotesException class extends java.lang.Exception to include exception handling for Notes/Domino.」關鍵在「extends java.lang.Exception」——它是受檢例外，不是 `RuntimeException`。這一點決定了 Java 的錯誤處理心態跟 LotusScript 相反：LS 的 `On Error` 是你**可以選擇**要不要接；Java 的 `NotesException` 是編譯器**強迫**你接。呼叫任何一個 `lotus.domino` 方法而不處理它的 `NotesException`，程式根本編不過。

它身上有兩個你最常用的公開欄位：

- **`id`**（`int`）：官方寫「contains the error code」——就是那個 Notes 錯誤碼。
- **`text`**（`String`）：官方寫「contains the error text」——人看的錯誤訊息。

（還有一個 `internal`，型別是 `Exception`，包住造成這個 Domino 例外的底層例外；官方說「Otherwise (and typically), this variable is null」，多數時候你不用管它。）

## 用 id 做針對性處理

`text` 適合寫進 log 給人看；要讓程式**依錯誤種類分流**，看的是 `id`。Notes 的錯誤碼有一組具名常數在 `NotesError` 裡，你拿 `e.id` 去比對就能認出特定錯誤。官方自己的例子就示範了一個——當指定檔案不存在時，「Notes/Domino throws the exception NOTES_ERR_SYS_FILE_NOT_FOUND (4003)」。於是你可以：

```java
try {
    Database db = session.getDatabase("Server", "missing.nsf");
    // ...
} catch (NotesException e) {
    if (e.id == NotesError.NOTES_ERR_SYS_FILE_NOT_FOUND) {
        // 檔案不存在——這個我能處理（換一個、建一個、或略過）
    } else {
        throw e;  // 其他錯誤我不認得，往上丟
    }
}
```

這就是 Java 版的「分辨錯誤種類」，取代了 LotusScript 裡 `Select Case Err` 的角色。

## 收尾規則：recycle 放進 finally

這是把整個 Java 資料層系列收在一起的一條規則。前面幾篇一直在講：Java 裡的 [`Document`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD_JAVA.html)、`DateTime`、集合迭代出來的物件，都是要手動 [`recycle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html) 的後端物件。問題是——**如果 recycle 那行跟你的處理邏輯排在一起，一旦中間拋了 `NotesException`，執行就跳走了、recycle 永遠不會執行**。你以為有收，其實在出錯的路徑上漏了。

解法是 Java 的 `finally`：不管 `try` 區塊是正常跑完還是拋了例外，`finally` 都會執行。所以後端物件的 `recycle` 放這裡：

```java
Document doc = null;
try {
    doc = view.getFirstDocument();
    String s = doc.getItemValueString("Subject");   // 這裡若拋 NotesException…
    // ... 更多處理 ...
} catch (NotesException e) {
    System.out.println("Notes error " + e.id + ": " + e.text);
} finally {
    if (doc != null) doc.recycle();                 // …這行照樣會跑
}
```

`doc` 先宣告在 `try` 外面、`finally` 裡判 null 再收——這個樣式是 Java 版 Domino 程式的標準骨架。站上 [recycle() 那篇](/domino-news/posts/java-recycle-memory)講的是「為什麼要收」，這篇補上的是「**在會出錯的真實程式裡，要收在哪**」。

## 一個完整的例子

把三件事——受檢例外、用 id 分流、finally 收——放在一起：

```java
Document doc = null;
try {
    doc = db.getDocumentByUNID(unid);
    process(doc.getItemValue("Items"));
} catch (NotesException e) {
    // id 給程式判斷、text 給人看，兩個都記下來
    log.severe("Notes error " + e.id + ": " + e.text);
    throw e;                                         // 認不得的錯，往上丟
} finally {
    if (doc != null) doc.recycle();                 // 無論如何都收
}
```

`catch` 裡把 `id` 和 `text` 都記下來（`id` 給程式分流用、`text` 給人讀），而 `finally` 保證那份 `doc` 無論正常或出錯都收得掉。

## 同類別在其他語言

- **LotusScript**：`On Error Goto` + `Err` / `Error$` + `Resume`。沒有受檢例外、沒有 `finally`，也不必手動 recycle——記憶體自動收，所以 LS 沒有「收在哪」的問題。要在 LS 裡模擬 `finally`，通常是把清理邏輯放在一個所有路徑都會 `Resume` 過去的標籤。站上有 [LotusScript 錯誤處理](/domino-news/posts/lotusscript-error-handling) 一篇。
- **SSJS／XPages**：底層同一個 `lotus.domino`，`NotesException` 一樣有 `id` 和 `text`；但你是用 JavaScript 的 `try/catch/finally` 去接，寫法更接近 Java。一樣要在 `finally` 裡 recycle，尤其在跑大集合的 XPages 邏輯裡。

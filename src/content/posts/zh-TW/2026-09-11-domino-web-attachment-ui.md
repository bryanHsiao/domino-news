---
title: "傳統 Domino web 附件 UI 的眉角：用 $V2AttachmentOptions 藏掉陽春預設，自己畫下載清單與刪除"
description: "在 Domino web form 放個 File Upload Control、加個儲存鈕，功能是通了——但畫面很陽春：附件被 Domino 倒在頁尾、編輯時還多出一排沒法美化的「標記要刪除」勾選框。這篇講傳統 Domino web 開發者的老手法：用 $V2AttachmentOptions=\"0\" 把預設附件區藏掉、用 passthru HTML 配 @AttachmentNames 自己畫下載清單、以及那個很少人講清楚的刪除機制 %%Detach（自訂勾選框、或走 WebQuerySave）。含 $V2AttachmentOptions 只有 0/1、文字不是數字等踩雷點。"
pubDate: 2026-09-11T07:30:00+08:00
lang: zh-TW
slug: domino-web-attachment-ui
tags:
  - "Domino Designer"
  - "Formula"
  - "Tutorial"
sources:
  - title: "$V2AttachmentOptions — HCL Domino 開發者論壇（社群）"
    url: "https://developer.ds.hcl-software.com/t/v2attachmentoptions/63864"
  - title: "URL commands for opening image files, attachments, and OLE objects — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_IMAGE_FILES_ATTACHMENTS_AND_OLE_OBJECTS.html"
  - title: "Quick tip: Domino File Upload Control（%%File／%%Detach，社群）— notesweb2"
    url: "https://notesweb2.blogspot.com/2007/03/quick-tip-domino-file-upload-control.html"
  - title: "How to hide attachments in hide-whens（社群）— DominoPower"
    url: "http://dominopower.com/article/how-to-hide-attachments-in-hide-whens/"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-web-attachment-ui.webp"
coverStyle: "pencil-sketch"
---

[前一篇](/domino-news/posts/domino-attachments-three-ways)把「怎麼在 web form 放一個 File Upload Control」講完了。功能會動——但畫面通常很陽春：使用者存完檔，Domino 把附件圖示**倒在整頁最下面**一條分隔線底下；進編輯模式，每個附件旁邊還自動長出一排**「標記要刪除的附件」的勾選框**，樣式醜、又擠在你版面外面。

![Domino web form 的陽春預設：一個未美化的紫色「儲存」鈕、檔案上傳輸入框，下面是 Domino 自動長出的「標記要刪除的附件」區——每個附件配一個裸勾選框](/domino-news/post-images/domino-web-attachment-crude-default.png)

一般 web 應用不會就這樣交出去。傳統 Domino web 開發有一整套「把它藏掉、自己重畫」的老手法，這篇把最實用的幾個串起來——包含你可能聽過、但值不太確定的那個 `$V2AttachmentOptions`。

> 註：這題的核心（`$V2AttachmentOptions`、`%%Detach`）多半是社群長年累積的知識、少有現行官方文件，下面會標清楚哪些是官方、哪些是社群共識。

---

## 重點摘要

- **藏掉預設**：在表單加一個**文字**欄位 `$V2AttachmentOptions`，值 `"0"` = 對 web 隱藏所有 V2 附件、`"1"` = 顯示。**只有 0/1，沒有 2**；而且**一定要文字 `"0"`、不是數字 0**（寫成數字會靜默失效）。
- **它是顯示、不是安全**：藏起來≠擋下載——知道檔名的人照樣能抓（社群明講）。
- **自己畫下載清單**：用 **Pass-Thru HTML** 的計算欄位配 `@AttachmentNames`，組出指向 `…/$FILE/檔名?OpenElement` 的連結；檔名有空白要用 `@URLEncode`。
- **刪除的真相是 `%%Detach`**：預設那排勾選框其實是 Domino 自動吐出的 `<input name="%%Detach">`；submit 時 web 引擎自動刪掉被勾的檔，**不必寫 agent**。你也能自己吐這種勾選框做美化版。

---

## 先搞懂預設怎麼運作：`%%File` 與 `%%Detach`

要重畫，得先知道 Domino 預設在幹嘛。兩個 `%%` 開頭的保留名字是關鍵（[社群整理](https://notesweb2.blogspot.com/2007/03/quick-tip-domino-file-upload-control.html)）：

- **上傳**：File Upload Control 在 web 上渲染成一個 `<input type="file">`，它的 name 是 **`%%File`** 開頭（例如 `%%File.482571b1...$Body...`）。
- **刪除**：預設那排「標記要刪除的附件」勾選框，其實是 Domino 自動吐出的——`<input type="checkbox" name="%%Detach" value="檔名">`。**submit 時，Domino web 引擎會自動把 `%%Detach` 送出的那些檔名刪掉，不需要任何 agent 程式。**

搞懂這點很關鍵：所謂「內建刪除」不是什麼黑魔法，就是 `%%Detach` 這個約定名字。知道它，你就能**自己吐一組 `%%Detach` 勾選框**、放進你自己的版面裡，照樣有刪除功能（下面會用到）。

## 第一步：用 `$V2AttachmentOptions` 藏掉預設附件區

要重畫，先把 Domino 預設那坨藏掉。做法是在表單上加一個**文字欄位**，名字就叫 `$V2AttachmentOptions`（[HCL 論壇有社群整理](https://developer.ds.hcl-software.com/t/v2attachmentoptions/63864)）。社群長年的說法是：值 `"0"` 會讓所有「V2 style」附件對 **web client** 隱藏、`"1"` 顯示；**Notes client 不受影響、照樣看得到**。值就只有這兩個（沒有你以為的「2」）。

欄位建議設成 **Computed for Display**，值最簡單就寫 `"0"` 一直藏；要「讀取時藏、編輯時秀」就用：

```
@If(@IsDocBeingEdited; "1"; "0")
```

**兩個一定要記的雷：**

1. **文字 `"0"`，不是數字 `0`。** 社群反覆提醒：用 formula／agent 設這個值時，要確定塞的是**文字**的 "0"、不是數字 0——塞成數字，功能會**靜默失效**、完全沒反應。
2. **這是顯示、不是安全。** 論壇講白：「the web user could still download the file attachments if they knew the filenames.」藏掉只是不顯示 icon，擋不了知道檔名的人用 URL 直接抓。真要控管存取，得靠 ACL／Readers 欄位，不是靠這個。

（另外，`$V2AttachmentOptions` 管的是舊式「V2 style」的 icon 渲染；文件若是走 MIME 方式產生的附件，隱藏行為未必一致——這是社群觀察，遇到 MIME 附件時要實測。）

## 第二步：自己畫下載清單（Pass-Thru HTML + `@AttachmentNames`）

藏掉之後，用一個 **Pass-Thru HTML** 的計算欄位（Computed for display，並在段落屬性勾 Pass-Thru HTML），配 `@AttachmentNames` 組出你自己的下載連結清單。下載 URL 的格式是官方的（[URL commands](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_IMAGE_FILES_ATTACHMENTS_AND_OLE_OBJECTS.html)）：`…/$File/檔名?OpenElement`。

```
files := @AttachmentNames;
@If(files = ""; "（沒有附件）";
    @Implode(
        "<a href=\"/" + @WebDbName + "/0/" + @Text(@DocumentUniqueID) +
        "/$FILE/" + @URLEncode("Domino"; files) + "?OpenElement\">" + files + "</a>"
    ; "<br>"))
```

幾個要點：

- `@AttachmentNames` 回的是一個 list，formula 的字串相接會**逐元素**套用，所以上面一句就替每個附件各組一條 `<a>`，再用 `@Implode` 以 `<br>` 串起來。
- **檔名有空白／特殊字元會壞連結**——一定要用 `@URLEncode("Domino"; 檔名)` 編碼（不然瀏覽器抓不到）。這是最常見的坑。
- URL 裡的 `0/` 是「不透過 view、直接用 UNID」的慣用寫法（官方標準格式是 `View/Document`，`0` 是常見替代）。

這樣你就能把附件清單放進**你自己的表格/區塊、套你自己的 CSS**，而不是 Domino 倒在頁尾那坨。

## 第三步：自訂刪除——兩條路

**做法一：自己吐 `%%Detach` 勾選框（不必 agent）。** 既然知道刪除是靠 `%%Detach`，就自己在編輯模式下、用 Pass-Thru HTML 畫一組你要的樣式：

```
files := @AttachmentNames;
@If(files = ""; "";
    @Implode(
        "<label><input type=\"checkbox\" name=\"%%Detach\" value=\"" +
        @URLEncode("Domino"; files) + "\"> " + files + "</label>"
    ; "<br>"))
```

使用者勾選、按你自己的儲存鈕 submit，Domino 就把被勾的檔刪掉——功能跟預設一樣，但外觀完全你作主。

**做法二：WebQuerySave agent + `Remove`（要完全掌控時）。** 想在刪之前做驗證、稽核、或不想依賴 `%%Detach` 行為，就自己吐一組欄位（例如一個多值欄位列出要刪的檔名），在 **WebQuerySave** 的 LotusScript agent 裡用 `doc.GetAttachment(檔名).Remove` 逐一刪、再 `doc.Save`。後端這套（`GetAttachment`／`Remove`）站上 [LotusScript 處理附件](/domino-news/posts/notes-embedded-object)講得很完整，這裡不重複。

## 動作列與儲存鈕

最後順帶一個：Domino 自動生的 web 動作列、預設儲存機制通常也醜。傳統做法是**不用**內建那套，改自己放一個 Pass-Thru HTML 的 `<input type="submit">`（或用 JavaScript `document.forms[0].submit()`）當儲存鈕、套自己的樣式。這比較是通用的傳統 web 手法、沒有單一權威出處，但跟上面藏附件、自畫清單是同一套思路：**把 Domino 自動生的東西關掉，改用你控制得了的 HTML。**

## 小結

傳統 Domino web 的附件 UI 醜，是因為 Domino 自動幫你渲染了一坨你控制不了的東西。三步把它接管過來：`$V2AttachmentOptions="0"`（文字零、只藏不擋）藏掉預設 → Pass-Thru HTML 配 `@AttachmentNames`（檔名記得 `@URLEncode`）自己畫下載清單 → 用 `%%Detach` 自訂勾選框、或 WebQuerySave + `Remove` 自訂刪除。這些多半是社群長年累積的眉角、少有現行官方文件，但在維護老 Domino web 應用時天天用得到。想回到「怎麼放上傳控制項」的基礎，見[三種上傳法](/domino-news/posts/domino-attachments-three-ways)；多檔與批次刪除見[這篇](/domino-news/posts/domino-attachments-bulk)。

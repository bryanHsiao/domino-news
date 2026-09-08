---
title: "XPages 檔案上傳失效：xspupload 暫存夾被 Windows cleanmgr 清掉的根源與解法（含 14.0 修復）"
description: "XPages 的檔案上傳控制項按了沒反應、使用者端沒錯誤、server console 卻報 IOFileUploadException「The system cannot find the path specified」。根源是 Domino 上傳用的暫存夾 xspupload 不見了——常常是 Windows 的磁碟清理 cleanmgr 在 Domino 執行中把它連同 temp 檔一起清掉。這篇把官方 KB 與實務串起來：症狀與根源、暫存夾為什麼會消失、以及從「每晚上下 http」這種 band-aid 到 notes_tempdir、程式化檢查重建、升級 14.0（defect 已修）的幾種解法。"
pubDate: 2026-09-12T07:30:00+08:00
lang: zh-TW
slug: domino-xspupload-upload-fail
tags:
  - "Domino Designer"
  - "Domino Server"
sources:
  - title: "Attachment upload fail in Xpage when 'xspupload' temp folder doesn't exist（KB0106430, defect）— HCL Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0106430"
  - title: "Windows Cleanmgr deletes temporary application files interrupting HTTP uploads（KB0078234）— HCL Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0078234"
  - title: "XPages file upload 暫存夾自動重建（社群）— dreamjtech"
    url: "https://www.dreamjtech.com/5816/"
relatedJava: []
relatedSsjs: []
---

有一種 XPages 上傳的壞法特別難查：檔案上傳控制項按了**像沒反應**——使用者端沒跳錯、頁面也沒事，就是檔案沒上去。你翻 server console，才看到一行 Java 例外：

```
com.ibm.xsp.http.fileupload.FileUploadBase$IOFileUploadException:
Processing of multipart/form-data request failed.
…\notesXXXXXX\xspupload\upload_XXX_XXX.tmp (The system cannot find the path specified)
```

社群在 11.0.1 上也踩過同一個坑（[StackOverflow：xpages file upload control does nothing in 11.0.1](https://stackoverflow.com/questions/66161300/xpages-file-upload-control-does-nothing-in-11-0-1)）。如果你在 R11 遇過、最後靠「每天晚上把 http 上下重啟一次」硬撐——這篇就是講那到底是什麼、以及有哪些比重啟更好的解法。

---

## 重點摘要

- **根源**：XPages 上傳會在 OS 的 Temp 底下用一個暫存夾 **`xspupload`**（路徑像 `…\notesXXXXXX\xspupload`）。這個夾一旦不見，上傳就失敗、console 報 `IOFileUploadException … The system cannot find the path specified`。
- **這是 defect**：官方 KB0106430 記載，14.0 之前 Domino **不會**在夾被刪後自動重建；**已在 Domino 14.0 修復**（SPR ASHECU5DHW）。
- **暫存夾為什麼會消失**：常見兇手是 Windows 的**磁碟清理 `cleanmgr.exe`**——它在 Domino 執行中把 Temp 夾清掉，連 `xspupload` 一起（KB0078234）。
- **解法從輕到重**：重啟 HTTP task（重建夾，就是那個「每晚上下 http」）→ 用 `notes_tempdir` 把 temp 指到 cleanmgr 不碰的夾 → 關掉 cleanmgr 排程 → 程式化在啟動時檢查並重建 → 升級到 14.0 一勞永逸。

---

## 症狀與根源：`xspupload` 暫存夾不見

先看官方怎麼描述這個 defect。[KB0106430](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0106430)（適用 Domino 9.0.x 以上）講得很清楚：在 XPages 用檔案上傳控制項上傳時，Domino 會在 OS 的 Temp 夾底下建一個 `xspupload` 暫存夾（例如 `notesXXXXXX\xspupload`）；**你把這個 `xspupload` 夾刪掉，附件就上不去了**，console 出現：

```
com.ibm.xsp.http.fileupload.FileUploadBase$IOFileUploadException:
Processing of multipart/form-data request failed.
C:\Windows\TEMP\notesXXXXXX\xspupload\upload_XXX_XXX.tmp (The system cannot find the path specified)
```

官方也點出「應該要有、但沒有」的行為：**Domino 本來應該在夾不存在時自動重建它**，但（14.0 之前）它不會，所以夾一被刪就卡死。KB 的 Workaround 只有一句：「Recreate 'xspupload' folder.」——把夾建回去。這個 defect（SPR ASHECU5DHW）**已在 Release 14.0 修復**：14.0 起 Domino 會在需要時自動重建那個夾。

## 那個暫存夾為什麼會自己消失：Windows `cleanmgr`

暫存夾好端端的，怎麼會自己消失？最常見的兇手是 Windows 內建的磁碟清理工具 **`cleanmgr.exe`**。[KB0078234](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0078234)（適用 Domino 9.0.x、10.0.x、11.0.x 以上）把因果講死：

> 「Windows cleanmgr.exe task deleted all the temp files from the Domino temp folder. These include temporary application files as well which will cause all the applications to fail.」

也就是說，`cleanmgr` 排程在 **Domino 還在跑**的時候，把 Domino temp 夾裡的東西清掉——**連正在使用中的 `xspupload` 一起清**，於是所有 app 的上傳都斷。console 報的還是同一個 `IOFileUploadException … The system cannot find the path specified`。跟 KB0106430 的錯完全一致，只是這裡點出了「誰刪的」。

## 解法：從「每晚重啟」到根治

同一個病，有好幾種藥，從最粗到最徹底：

**① 重啟 HTTP task（band-aid）。** KB0078234 明講：「Restarting the HTTP task will recreate the application when it is loaded again and will workaround the issue.」——重啟 http 會把夾重建回來。**你們在 R11「每天晚上上下 http」就是這一招**：它有效、但治標不治本，只是趕在下次 cleanmgr 之前先把夾補回去。

**② 用 `notes_tempdir` 把 temp 搬到 cleanmgr 不碰的地方。** 同一篇 KB 的第二個 workaround：「create a new folder and use the notes_tempdir parameter to point tmp files to that folder.」——自己建一個資料夾、在 notes.ini 設 `notes_tempdir` 指過去，讓 Domino 的暫存檔不要落在 cleanmgr 會掃的系統 Temp 裡。

**③ 直接關掉 cleanmgr 排程。** 如果不想動 Domino 這邊，KB 也給了：把 Windows server 上那個 `cleanmgr.exe` 排程工作停用即可，源頭不清、夾就不會被刪。

**④ 程式化自癒：啟動時檢查、不在就重建。** 知道根源之後，其實可以讓 app 自己顧。[社群做法](https://www.dreamjtech.com/5816/)是在 XPages 應用的啟動時機（例如 onStart），檢查那個上傳暫存夾在不在、不在就 `mkdirs` 重建並補上讀寫執行權限：

```groovy
import java.io.File
def tmpDirPath = context.getServletContext()
        .getInitParameter('com.ibm.xsp.upload.tmp.dir') ?: 'xspupload'
def tmpDir = new File(tmpDirPath)
if (!tmpDir.exists()) {
    tmpDir.mkdirs()
    tmpDir.setExecutable(true, false)
    tmpDir.setReadable(true, false)
    tmpDir.setWritable(true, false)
}
```

概念很直接：**判斷夾存在否、不存在就重建**。要提醒的是，實際的 `xspupload` 路徑是掛在 `NOTES_TEMPDIR`（或系統 %TEMP%）底下的 `notesXXXXXX\xspupload`，上面這段是社群的一種寫法、把重建動作放進應用生命週期——套用前先在你的環境確認它解析到的路徑真的是那個上傳夾。

**⑤ 一勞永逸：升級到 14.0。** 這本來就是個 defect，14.0 起 Domino 會自動重建那個夾（KB0106430）。環境能升，就不必再跟 cleanmgr 玩貓抓老鼠。

## 小結

XPages 上傳「沒反應」十之八九不是控制項壞了，是它需要的暫存夾 `xspupload` 被清掉了——常常是 Windows `cleanmgr` 在 Domino 執行中順手清掉的。判斷順序：先在 console 認那個 `IOFileUploadException … The system cannot find the path specified`，確認是這個病；短期用重啟 http 或程式化重建撐住、中期用 `notes_tempdir` 或停用 cleanmgr 斷源頭、能升級就升到 14.0 根治。這也呼應[系列前面](/domino-news/posts/domino-attachments-three-ways)講 File Upload Control 時那個前提——**伺服器端要有一個好好的暫存目錄**，附件才落得下來；這篇就是那個目錄出事時的完整排查。

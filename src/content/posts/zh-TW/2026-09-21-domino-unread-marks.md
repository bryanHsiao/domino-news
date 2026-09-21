---
title: "未讀標記的坑：它是「每個使用者各一份」，不是文件的屬性"
description: "文件變粗體、旁邊那顆星號——未讀標記看起來像文件的一個欄位，其實不是。它是 Domino 少數「每個使用者各自一份」的東西：你讀了不代表別人讀了。用 LotusScript 的 MarkRead／MarkUnread 動它時很容易替錯人（agent 以某個 ID 跑，只動到那個 ID 的未讀）；而且未讀標記預設不隨複寫同步，所以 server 上和你本機 replica 的未讀狀態常常對不上。這篇把未讀的機制與三個坑講清楚。"
pubDate: 2026-09-21T07:30:00+08:00
lang: zh-TW
slug: domino-unread-marks
tags:
  - "Domino Designer"
  - "LotusScript"
sources:
  - title: "Identifying unread documents（每人一份）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_IDENTIFYING_UNREAD_DOCUMENTS.html"
  - title: "Replicating unread marks — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.0/admin/admn_replicatingunreadmarks_c.html"
  - title: "MarkRead method (NotesDocument) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_MARKREAD_DOCUMENT.html"
  - title: "MarkUnread method (NotesDocument) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MARKUNREAD_DOCUMENT.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
cover: "/covers/domino-unread-marks.webp"
coverStyle: "paper-craft"
---

文件在 view 裡變粗體、旁邊一顆星號（`*`）——這個「未讀標記」看起來像文件上的一個屬性，於是很多人以為「把它設成已讀」就跟改個欄位一樣。其實不是。未讀標記是 Domino 少數**「每個使用者各自一份」**的東西，而且它預設**不隨複寫同步**。搞不清楚這兩點，用程式動它、或排查「未讀為什麼對不上」時就會鬼打牆。

## 重點摘要

- **未讀是每人一份**：[官方](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_IDENTIFYING_UNREAD_DOCUMENTS.html)——「A set of unread marks are maintained for each user, so even if one person has read a particular document, the asterisk still appears for other users who haven't read it yet.」它不是文件上的欄位。
- **程式怎麼動**：`db.UnreadDocuments`（當前使用者的未讀集合）、`doc.MarkRead([使用者])`／`doc.MarkUnread([使用者])`、collection 的 `MarkAllRead`／`MarkAllUnread`。
- **坑一：替錯人標記**——`MarkRead` 省略名字時是動**當前執行身分**。agent 以某個 ID 跑，只會動到那個 ID 的未讀，不影響其他使用者。
- **坑二：預設不同步**——未讀標記預設不隨複寫傳，所以 server 上與本機 replica 的未讀狀態常常不同；要同步得另外開，且官方**只建議對 mail 這類庫開**。
- **坑三：庫可能根本不維護未讀**（DB 屬性）——設了就沒有未讀可動。

## 未讀是「每個使用者各一份」

這是最該先建立的觀念。[官方](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_ABOUT_IDENTIFYING_UNREAD_DOCUMENTS.html)：

> 「A set of unread marks are maintained for each user, so even if one person has read a particular document, the asterisk still appears for other users who haven't read it yet.」

也就是說，未讀狀態**不是文件的一部分**（不是某個 item、也不是所有人共用的一個旗標），而是**每個使用者各自有一張「我讀過哪些」的表**，存在資料庫層級、以使用者為索引。你把一份文件標成已讀，只改到**你自己**那張表；別人的未讀完全不受影響。

## 程式怎麼動未讀

LotusScript 的介面很直觀：

```lotusscript
' 取當前使用者的未讀文件集合
Dim unread As NotesDocumentCollection
Set unread = db.UnreadDocuments

' 標某份文件為已讀／未讀（省略名字＝當前使用者）
Call doc.MarkRead              ' 已讀
Call doc.MarkUnread            ' 未讀

' 整批
Call unread.MarkAllRead        ' 這批全部已讀
```

`MarkRead`／`MarkUnread` 可以**帶一個使用者名字**：帶了就是替那個人標、省略就是替當前使用者標。這個「可帶名字」正是下一個坑的根源。

## 坑一：agent 替錯人標成已讀

最常見的坑：你寫一個 agent「把某些文件標成已讀」，跑完卻發現**使用者那邊還是未讀**。原因是 `MarkRead` 省略名字時，動的是**當前執行身分**——agent 在伺服器上多半以**簽署者或某個服務 ID** 執行，所以你其實只把那個 ID 的未讀改掉了，跟真正要看的使用者無關。

要替特定使用者標記，就得**明確傳那個人的名字**：`Call doc.MarkRead("CN=Somebody/O=Org")`。（也因為未讀是每人一份，「用程式幫全公司把某封公告標成已讀」本質上要對每個使用者各標一次——沒有一個共用旗標可以一次搞定。）

## 坑二：未讀預設不隨複寫同步

第二個排查噩夢：**同一份文件，在 server 上顯示已讀、在你本機 replica 卻是未讀**（或相反）。這不是 bug——未讀標記**預設不隨複寫傳**。[官方](https://help.hcl-software.com/domino/11.0.0/admin/admn_replicatingunreadmarks_c.html)：

> 「Unread marks can be replicated for selected databases, most notably mail databases, by using the advanced database properties…」——要**特別開**、透過 advanced database properties，而且主要是給 **mail** 用。開了之後「the unread marks are replicated along with the database according to your established replication schedule」。

官方還提醒：**mail 以外、高活動的使用者資料庫不建議開**（效能考量），而且開之前要先把各 replica 的未讀同步好。所以除非你刻意開了複寫未讀，否則「不同 replica 未讀不一樣」是正常的——別花時間去修一個不是壞掉的東西。

## 坑三：這個庫可能根本不維護未讀

還有一種：你想動未讀，卻發現怎麼動都沒效果——因為那個資料庫在屬性裡勾了**「Don't maintain unread marks」**（Database properties 的 Advanced 頁）。基於效能，有些庫會關掉未讀。設計時若要靠未讀做事，先確認這個庫有在維護它。

## 小結

未讀標記最反直覺的一點：**它不是文件的屬性，是每個使用者各自的一張表**。記住這點，三個坑就都通了——用程式標記要注意**替誰標**（省略＝當前執行身分，agent 常常替錯人）；不同 replica 未讀不一樣是因為**預設不複寫**（要同步得特別開、且只建議 mail）；動不了可能是**這個庫根本沒在維護未讀**。把「每人一份」放在心裡，就不會再對著未讀鬼打牆。

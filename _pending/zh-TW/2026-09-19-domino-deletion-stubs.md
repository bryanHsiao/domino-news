---
title: "刪掉的文件為什麼會自己回來：deletion stub、purge interval 與兩個復活原因"
description: "刪掉一份文件，過幾天它又自己冒出來——不是鬧鬼。Domino 刪除不是把文件抹掉，而是留下一個 deletion stub（刪除殘根），讓複寫把「這份被刪了」傳到其他 replica。殘根會依 purge interval（預設 90 天）被清掉。文件「復活」通常是兩個原因：殘根在傳出去之前就被清掉、或同一份在一邊被改一邊被刪時「改贏了刪」。這篇把機制與兩個原因講清楚，並給避免的設定原則。"
pubDate: 2026-09-19T07:30:00+08:00
lang: zh-TW
slug: domino-deletion-stubs
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Deleted documents reappear — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html"
  - title: "Limiting the contents of a replica（purge interval）— HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_limitingthecontentsofareplica_t.html"
  - title: "Deleting inactive documents — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/tune_deletinginactivedocuments_t.html"
relatedJava: []
relatedSsjs: []
---

你刪掉一份文件，過幾天它又自己回來了；或你這邊刪掉的東西，同事那邊還在，一複寫就又冒出來。這不是鬧鬼——是 Domino **刪除的機制**本來就這樣運作。搞懂 deletion stub（刪除殘根）和 purge interval，這種「文件復活」就不再神祕。

## 重點摘要

- **刪除不是抹掉，是留一個殘根**：刪掉文件時，Domino 留下一個 **deletion stub**——一個記著「這份被刪了」的小標記，讓複寫能把刪除傳到其他 replica。
- **殘根有保存期限（purge interval，預設 90 天）**：太舊的殘根會被清掉；Domino 在 **1/3 週期**（預設 30 天）檢查一次、清掉夠舊的。
- **復活原因一：殘根太早被清**——它還沒複寫出去就被清掉，別的 replica 那份沒被刪、一複寫又回來。
- **復活原因二：改贏了刪**——同一份在一邊被改、另一邊被刪，兩次複寫之間，**改的那份勝出**、刪除被蓋掉。
- 避法：**複寫要比 purge interval 頻繁**，別把 purge interval 設太短。

## 刪除留下的「殘根」

[官方](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html)講得很清楚：

> 「When a document is deleted, it leaves behind a deletion stub. When the database replicates, Notes uses the deletion stub to identify and delete the same document in the replica.」

也就是說，刪一份文件不是把它從硬碟抹得一乾二淨，而是留一個 **deletion stub**：一個很小的標記，帶著這份文件的身分（UNID）與時間。它的用途只有一個——讓**複寫**知道「這份被刪了，去把其他 replica 上的同一份也刪掉」。沒有殘根，複寫就沒辦法把「刪除」這個動作傳出去。

## 殘根的保存期限：purge interval

殘根不會永遠留著（不然庫裡會塞滿刪除標記）。它們依 **purge interval** 被清理。[官方](https://help.hcl-software.com/domino/12.0.0/admin/conf_limitingthecontentsofareplica_t.html)：

> 「Deletion stubs are markers that remain from deleted documents so that Domino knows to delete documents in other replicas of the database.」

預設 purge interval 是 **90 天**，而 Domino 是在 **1/3 週期**去檢查清理：

> 「It checks for deletion stubs that require removal at one-third of the purge interval. For example, assuming the default value, 90 days, when a user opens a database, Domino checks if it has been at least 30 days since it removed deletion stubs, and if so it removes any deletion stubs that are at least 90 days old.」

換句話說：預設情況下，一個殘根大約會被保留到 90 天、每隔約 30 天做一次清理。這個「90 天」是有道理的——它要**撐得夠久，讓所有 replica 都有機會把刪除複寫出去**。

## 復活原因一：殘根還沒傳出去就被清掉

第一個、也是最經典的復活原因：**殘根在複寫出去之前，就被 purge 掉了。** [官方](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html)：

> 「If Notes purges the deletion stubs before they replicate, deleted documents can reappear after the next replication.」

想像：A 伺服器刪了文件、留下殘根，但這個庫的 purge interval 被調得很短（或很久沒跟 B 複寫）。殘根被清掉了，A 上那份是真的沒了、也沒有「刪除」的證據。這時 B（還留著那份文件、從沒收到刪除通知）一跟 A 複寫，B 就把那份文件**當成新資料送回 A**——文件就「復活」了。

避免的原則很直接（[官方](https://help.hcl-software.com/domino/12.0.0/admin/conf_limitingthecontentsofareplica_t.html)）：

> 「be sure to replicate more frequently than the purge interval; otherwise, deleted documents can be replicated back to the replica.」

**複寫頻率要比 purge interval 高**。所以那些「離線很久才回來」的 replica、或被人手癢調短 purge interval 的庫，最容易鬧這種復活。

## 復活原因二：改贏了刪

第二個原因跟殘根無關，是**複寫的衝突解決規則**：同一份文件，一邊改、一邊刪，改的會贏。[官方](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WHY_ARE_DELETED_DOCUMENTS_REAPPEARING.html)：

> 「If a document is edited multiple times on one server and deleted on another server between replication sessions, the edited document takes precedence because it underwent the greatest number of changes, even if the deletion was the most recent change.」

甚至只要各動一次、編輯發生在刪除之後也一樣：

> 「If somebody deletes a document on one server and then someone else updates the document on another server once between replication sessions, the edit overrides the deletion because both documents were updated once and the edit occurred after the deletion.」

也就是說：你在 A 刪了它，但同一段時間有人在 B 改了它。下次複寫，Domino 判定「改」的那份較該保留（改的次數較多、或編輯較晚）→ **你的刪除被蓋掉、文件回來了**。這在多人、多 replica 的環境特別容易發生。

## 怎麼設、怎麼避

- **purge interval 別設太短**：它在 Replication Settings（Space Savers）裡；設太短＝殘根活不夠久＝復活風險。預設 90 天多數情況剛好。
- **複寫要夠頻繁**：至少比 purge interval 密，讓刪除有時間傳到每個 replica。
- **長期離線的 replica 要小心**：離線超過 purge interval 才回來的 replica，可能把早就該刪的文件又帶回來——這也是官方[清理不活躍文件](https://help.hcl-software.com/domino/12.0.0/admin/tune_deletinginactivedocuments_t.html)那套機制要注意的地方。

## 小結

刪掉的文件會復活，不是 Domino 壞了，是它的刪除天生靠 **deletion stub + 複寫**運作：殘根負責把「刪除」傳出去、purge interval 決定殘根留多久。復活幾乎都是兩個原因之一——**殘根在傳出去前就被清掉**（複寫太慢／purge interval 太短），或**同一份被改又被刪、改的贏**。把 purge interval 留足、複寫留密，這種鬼打牆就會消失。想了解複寫本身的運作，見 [NotesReplication 與複寫設定](/domino-news/posts/notes-replication)。

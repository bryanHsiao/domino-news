---
title: "DQL Production-Ready：Catalog 維運、權限、與 sessionAsSigner"
description: "把 DQL 上 production 真正會撞牆的兩個問題：Design Catalog 怎麼自動維護（包含全新 NSF 的 bootstrap、設計變更後的 incremental refresh），以及為什麼一般使用者跑會噴「您沒有權限執行此作業」——以及對應的 sessionAsSigner / scheduled agent 解法。本文整理實測 Domino 12 驗證過的最終 pattern + Java production-ready 範例。"
pubDate: 2026-05-03T08:30:00+08:00
lang: zh-TW
slug: dql-production
tags:
  - "DQL"
  - "LotusScript"
  - "Domino Designer"
  - "Performance"
  - "Security"
sources:
  - title: "Domino Query Language overview — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_overview.html"
  - title: "NotesDominoQuery class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOMINOQUERY_CLASS.html"
  - title: "DominoQuery class (Java) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_DOMINOQUERY_CLASS_JAVA.html"
cover: "/covers/dql-production.png"
coverStyle: "low-poly-3d"
---

> 📚 **「DQL 三部曲」系列**
> - **Part 1**：[DQL 實戰指南：類 SQL 語法表面熟悉，Notes 慣例遍地是雷](/domino-news/zh-TW/posts/dql-getting-started)
> - **Part 2**：[DQL 踩雷集：寫 query 時 6 個官方文件不會明說的細節](/domino-news/zh-TW/posts/dql-pitfalls)
> - **Part 3**：DQL Production-Ready（你在這裡）

寫得出能跑的 DQL query 之後，要把它**上 production** 還會遇到兩個官方文件講得很模糊的議題：

1. **Design Catalog 怎麼自動維護** —— 全新 NSF 怎麼 bootstrap、設計變更怎麼自動偵測、為什麼 in-memory cache 是過度設計
2. **權限問題** —— 為什麼一般使用者執行會噴「您沒有權限執行此作業」、`sessionAsSigner` 該怎麼用、為什麼 Java helper 不會自帶 signer 身分

本文用實測 Domino 12 的 production log 驗證每個結論，最後給一份 **production-ready Java helper class** 直接拿去用。

如果你還沒掌握基本語法，先看 [Part 1 DQL 入門](/domino-news/zh-TW/posts/dql-getting-started)；如果你的 query 結果不如預期、噴奇怪錯誤訊息，請先看 [Part 2 踩雷集](/domino-news/zh-TW/posts/dql-pitfalls)。

## 為什麼需要 Design Catalog

DQL 在底層需要知道每個 NSF 裡有哪些 view、view 叫什麼名字、view 裡有哪些直欄 —— 這份「設計索引」就是 **Design Catalog（設計目錄）**。**結論先講**：

| 你的 query 形式 | 需要 Design Catalog 嗎？ |
|---|---|
| `Form = 'Customer'`（裸欄位查詢） | ❌ 不需要。DQL 會直接掃整個 NSF，效能差但能跑 |
| `'Customers'.Country = 'Taiwan'`（view 名稱 + 欄位） | ✅ 必須有，否則噴錯 |
| `in ('Customers') and Country = 'Taiwan'`（用 view 限縮範圍） | ✅ 必須有，否則噴錯 |

**只要 query 裡出現 view 名稱**（單引號包起來的那種），就一定要 Design Catalog —— 因為 catalog 是 DQL **唯一**認得 view 名稱、view 裡有哪些欄位的管道。沒 catalog，DQL 不知道你寫的 `'Customers'` 是什麼鬼。

最常見的踩雷情境：開發者新增了一個叫 `Vtest` 的 view，想用下面這段官方範例語法把查詢限定在這個 view：

```sql
in ('Vtest') and Form = 'Ftest'
```

執行下去就是這個錯誤訊息：

```text
Domino Query 執行錯誤: Unexpected internal error - 驗證錯誤
Error opening view name or named document set - [Vtest] does not exist or open failed
(Call hint: NSFCalls::NSFDbGetNamedObjectID, Core call #0)
```

訊息看起來像「view 不存在」，但 view 明明在 Designer 裡看得到、也能正常開啟 —— 真正的原因是 **這個 NSF 的 Design Catalog 還沒建立 / 還沒更新**。

### 兩個 Server Console 指令

| 時機 | 指令 |
|---|---|
| 第一次啟用 DQL（為這個 NSF 建立 Design Catalog） | `load updall <db路徑> -e` |
| 設計變更後（新增/修改/刪除 view、改 view 名稱、改欄位）| `load updall <db路徑> -d` |

`<db路徑>` 是相對於 `Domino\Data` 的路徑，例如 `apps\crm.nsf`。

### 重點警告：純 console 路線會變成 SOP 雷

這是最容易忘記的地方。情境長這樣：

1. 你已經跑過 `load updall apps\crm.nsf -e`，DQL 一切正常
2. 開發者在 Designer 新增了一個 view 叫 `Vtest`
3. 你用 `in ('Vtest')` 查詢 → 噴 `does not exist or open failed`
4. 卡半天才想起：忘了下 `load updall apps\crm.nsf -d`

**靠管理員手動下 `load updall -d` 通常不可行**：DB 數量多、應用部署頻繁、寫程式的人跟有 server console 權限的人通常還不是同一個。把同步 catalog 的責任丟回給管理員，就是把雷埋在交接縫隙裡。

下面講從程式面解決這個問題的 pattern。

### 版本差異：catalog 存在哪裡

- **Domino 10.x**：Design Catalog 是一個獨立檔案 `GQFdsgn.cat`，跟 NSF 平行擺在資料目錄裡
- **Domino 11 之後**：Design Catalog 移到 NSF 內部，存在隱藏的設計元素裡（Designer 預設看不到）。檔案層級不會再多出 `.cat` 檔，但 `load updall -e` / `-d` 的操作方式完全一樣

升級到 11+ 之後的舊 NSF，第一次仍然要手動跑一次 `load updall <db路徑> -e`，把 catalog 灌進 NSF 內部。

### 進階：把欄位明確標成 DQL 可用

如果你有特定欄位想被 DQL 直接用作查詢條件、走 view 索引，可以在 view 的選取公式（selection formula）加上：

```text
SELECT @IsAvailable($DQLField)
```

這個 view 就會成為 DQL 可用的索引來源，查詢規劃器會優先考慮走這個 view 而不是全表掃描。

## 從程式面同步 catalog（推薦做法）

`NotesDominoQuery` 提供兩個屬性讓 app 自己觸發 catalog 同步：

| 屬性 | 對應 console 指令 | 行為 |
|---|---|---|
| `RefreshDesignCatalog = True` | `load updall <db> -d` | 下次 `Execute` / `Explain` 前**增量同步**catalog |
| `RebuildDesignCatalog = True` | `load updall <db> -e` | 下次 `Execute` / `Explain` 前**完整重建**catalog |

### 三個從實測驗證的關鍵事實（Domino 12.x）

**事實 1：Catalog 是 NSF 內持久 state（Domino 11+）**

Catalog 存在 NSF 內部 hidden design elements 裡，不是 in-memory state。**Server 重啟、HTTP task 重啟、JVM 重啟都還在**。一個 NSF 一輩子只需要建立 catalog 一次，之後永久存在（除非 NSF 被刪掉重建）。

實測 log（server 重啟後第一輪 query，所有 NSF 都直接成功，沒有任何 harvest）：

```
03:23:35  HTTP JVM: DB [dorm] 找到 1 筆
03:23:35  HTTP JVM: DB [docdb] 找到 6 筆
... (12 個 NSF 都直接成功，沒有任何 harvest log)
```

**事實 2：`RefreshDesignCatalog = True` 對最新 catalog ≈ 0ms no-op**

HCL 內部會檢查 catalog 是否需要更新，需要時才實際 harvest。不需要時 console 不會印 `harvested` 訊息，成本接近零 —— 所以可以**每個 query 都大膽的開**。

實測 log（每個 query 都帶 `setRefreshDesignCatalog(true)`，沒有設計變更）：

```
04:06:40  HTTP JVM: DB [dorm] 找到 3 筆
04:06:40  HTTP JVM: DB [law] 找到 14 筆
... (12 個 NSF，零 harvest log，全部接近瞬間完成)
```

**事實 3：`RefreshDesignCatalog` 對 stale catalog 自動 incremental harvest**

設計剛改過的 NSF，下次帶 Refresh 的 query 會自動偵測並更新 —— **不用手動 reset、不用 in-memory cache、不用排程 agent**。

實測 log（剛改了 LAW 跟 EForm 的設計）：

```
04:07:59  CTI\LAW\LCM_Ext2.nsf harvested, ... 278.534 msecs
04:07:59  HTTP JVM: DB [law] 找到 14 筆
04:08:00  CTI\EForm.nsf harvested, ... 468.698 msecs
04:08:00  HTTP JVM: DB [EForm] 找到 4 筆
```

**例外：Refresh 無法 bootstrap 全新 NSF**

從來沒 catalog 過的 NSF，跑 `RefreshDesignCatalog = True` **會失敗**，必須改用 `RebuildDesignCatalog = True` 第一次建立。HCL 文件對 server console `updall -d` 寫「If the catalog doesn't already exist, updall automatically creates it」—— **但 API 行為跟 console 不一致**，Refresh 不會 auto-bootstrap。

實測 log（新增的 workorder.nsf 從未 catalog 過）：

```
04:06:27  HTTP JVM: DQL: catalog 缺失於 [CTI\Safety\workorder.nsf] — 執行 Rebuild 後重試
04:06:28  CTI\Safety\workorder.nsf harvested, ... 963.684 msecs
04:06:28  HTTP JVM: DB [workorder] 找到 0 筆
```

NSF 沒 catalog 時，DQL 會回報含這個 marker phrase 的錯誤訊息：**`needs to be cataloged via updall -e`**。

### Final pattern：always Refresh + catch Rebuild

把上面三個事實 + 一個例外組合起來，最終推薦的 pattern：

```vb
' LotusScript
Function RunDql(db As NotesDatabase, query As String) As NotesDocumentCollection
    Dim dq As NotesDominoQuery

    ' Phase 1: 直接 Refresh + execute（最新 catalog ~0ms / stale 自動 incremental）
    On Error Goto RebuildAndRetry
    Set dq = db.CreateDominoQuery()
    dq.RefreshDesignCatalog = True
    Set RunDql = dq.Execute(query)
    Exit Function

RebuildAndRetry:
    ' Phase 2: 全新 NSF（catalog 不存在）→ Rebuild + retry
    If InStr(Error$, "needs to be cataloged via updall -e") = 0 Then Error Err
    Set dq = db.CreateDominoQuery()
    dq.RebuildDesignCatalog = True
    Set RunDql = dq.Execute(query)
End Function
```

特性：
- ✅ 99% query：~0ms overhead
- ✅ 設計變更：自動 incremental refresh
- ✅ 全新 NSF：catch + Rebuild 一次性 bootstrap
- ✅ **不需要 in-memory cache、不需要 reset、不需要 SOP**

### 鄰居屬性

同個物件還有兩個查詢前同步用的屬性可以一併認識：`RefreshFullText`（查詢前 refresh FT index）、`RefreshViews`（refresh 查詢會用到的 view）。一樣是「設 `True`，下一次 `Execute` 前同步」的 pattern。

## 權限：catalog 操作需要 Designer 等級 ACL

`RefreshDesignCatalog` / `RebuildDesignCatalog` 都會寫進 NSF 內部的 catalog 設計元素，**至少需要 Designer 等級的 ACL**。一般使用者（Reader / Author / Editor）執行會直接噴：

```text
NotesException: DQL 執行失敗 ... cause=[
Domino Query execution error:
您沒有權限執行此作業
]
```

> ⚠️ 上面 Final pattern 看起來沒問題的程式碼，**部署到 production 由一般使用者觸發就會立刻撞牆**。catalog 操作不能用 end-user 身分跑。

### 為什麼有些情境不會撞，有些會：執行身分

Catalog 操作以「**呼叫 DQL 當下的身分**」執行。不同部署模式的當下身分不同：

| 部署模式 | 執行身分 | 權限問題？ |
|---|---|---|
| **Scheduled agent / On-event agent** | agent 的簽署者（通常 admin / server ID） | ✅ OK，agent 自帶提權 |
| **XPages 中由 SSJS 直接呼叫 + 用 sessionAsSigner** | XPages app 的 signer（admin） | ✅ OK，sessionAsSigner 提權 |
| **XPages 中 SSJS 呼叫 Java helper（沒提權）** | **登入使用者** | ⚠️ 一般使用者噴權限錯 ← **本文情境** |
| **Domino REST API task 直接收外部 HTTP** | 外部請求 authenticate 的使用者 | ⚠️ 看 user 權限 |

關鍵觀察：**Java helper class 不會「自帶」signer 身分**。即使 Java code 是開發者寫的、JAR 是被 admin 簽的，被 SSJS 呼叫時還是繼承當下的執行身分（也就是登入使用者）。**提權必須在 SSJS 端用 `sessionAsSigner.getDatabase()` 開 Database 後再傳進 Java**，Java 自己沒辦法提權。

### XPages 解法：`sessionAsSigner`

XPages SSJS 有 `sessionAsSigner` global，回傳簽署這個 XPages app 的 ID 的 Session（通常是 admin / Designer）：

```javascript
var dbPath = "CTI/EForm.nsf";

// 用 signer 身分開啟，catalog 操作會 work
var db = sessionAsSigner.getDatabase("", dbPath);

var util = new service.DQLUtil();
var result = util.executeQuery(db, dqlQuery);
```

**前提**：XPages app 必須由有 Designer / Manager 等級權限的 ID 簽署過。可以在 Domino Designer 的 `File → Application → Properties → Design` tab 確認「Signed by」欄位。

### 安全 caveat：reader fields bypass

⚠️ 用 signer 跑 query 等於用 admin 權限跑 —— **reader fields / ACL 都會被繞過**。如果 NSF 用 reader fields 控管「誰能看到誰的 doc」，使用者可能透過你的 query 看到原本看不到的 doc → **資料外洩**。

防範作法（推薦由上往下）：

1. **Query 自帶身分過濾**（最簡單）：所有 query 加上 `wdocAuthor = 'CN=...'` 之類的明確使用者過濾，不寫「列全部」的 query
2. **雙 DB 架構**：query 用 `session.getDatabase()` 開的 user DB（受 ACL 約束）、catalog 操作用 `sessionAsSigner.getDatabase()` 開的 signer DB。Java 端要拆兩個參數，複雜但安全

### 非 XPages 環境的替代

`sessionAsSigner` 只在 XPages context 內有。其他環境的替代：

- **Scheduled agent**：寫排程 agent，「Run on」設指定 server、用 admin ID 簽署，定時或 on-demand 跑 catalog 維運
- **`NotesFactory.createSessionWithFullAccess()`**：純 Java 取得 admin session，需要 `notes.ini` 設定 `FullAccessAdministrator`，較危險不太推薦

## Java production-ready 範例

把 final pattern + 錯誤訊息 enrichment + `sessionAsSigner` 配合封裝成 helper：

```java
package service;

import lotus.domino.Database;
import lotus.domino.DocumentCollection;
import lotus.domino.DominoQuery;
import lotus.domino.NotesException;

public class DQLUtil {

    /**
     * 執行 DQL 查詢
     * @param db 必須是 sessionAsSigner.getDatabase() 開的 Database（catalog 操作要 Designer ACL）
     * @param dqlQuery DQL 查詢字串
     */
    public DocumentCollection executeQuery(Database db, String dqlQuery) throws NotesException {
        if (db == null) throw new NotesException(0, "DQLUtil: Database 為 null");
        if (!db.isOpen()) throw new NotesException(0, "DQLUtil: Database 未開啟");
        if (dqlQuery == null || dqlQuery.trim().isEmpty()) {
            throw new NotesException(0, "DQLUtil: DQL query 為空");
        }

        String dbPath = safeFilePath(db);

        // Phase 1: Refresh + execute
        DominoQuery dql = null;
        try {
            dql = db.createDominoQuery();
            dql.setRefreshDesignCatalog(true);
            DocumentCollection col = dql.execute(dqlQuery);
            if (col == null) throw new NotesException(0, "DQL execute 回傳 null");
            return col;
        } catch (NotesException firstError) {
            if (!isCatalogMissingError(firstError)) {
                throw rethrowWithContext(firstError, dbPath, dqlQuery);
            }
            System.out.println("DQL: catalog 缺失於 [" + dbPath + "] — 執行 Rebuild 後重試");
        } finally {
            recycle(dql);
        }

        // Phase 2: Rebuild + retry（全新 NSF 才會走到）
        DominoQuery dqlRebuild = null;
        try {
            dqlRebuild = db.createDominoQuery();
            dqlRebuild.setRebuildDesignCatalog(true);
            DocumentCollection col = dqlRebuild.execute(dqlQuery);
            if (col == null) throw new NotesException(0, "DQL execute 回傳 null（Rebuild 後）");
            return col;
        } catch (NotesException secondError) {
            throw rethrowWithContext(secondError, dbPath, dqlQuery);
        } finally {
            recycle(dqlRebuild);
        }
    }

    private static boolean isCatalogMissingError(NotesException ne) {
        String text = ne.text;
        return text != null && text.contains("needs to be cataloged via updall -e");
    }

    private static NotesException rethrowWithContext(NotesException ne, String dbPath, String query) {
        String causeText = (ne.text != null) ? ne.text : "(no text)";
        String enrichedMsg = String.format(
            "DQL 執行失敗 [%s] query=[%s] cause=[%s]", dbPath, query, causeText
        );
        NotesException rethrow = new NotesException(ne.id, enrichedMsg);
        rethrow.setStackTrace(ne.getStackTrace());
        return rethrow;
    }

    private static void recycle(DominoQuery dql) {
        if (dql != null) {
            try { dql.recycle(); } catch (NotesException ignore) {}
        }
    }

    private static String safeFilePath(Database db) {
        try { return db != null ? db.getFilePath() : "null"; }
        catch (NotesException e) { return "<unable to get path>"; }
    }
}
```

SSJS 端呼叫：

```javascript
var db = sessionAsSigner.getDatabase("", "CTI/EForm.nsf");
var util = new service.DQLUtil();
var result = util.executeQuery(db, dqlQuery);
```

## Catalog 維運常見錯誤訊息對照

| 訊息片段 | 意義 | 解法 |
|---|---|---|
| `needs to be cataloged via updall -e` | NSF 從沒 catalog 過 | catch 後改用 `setRebuildDesignCatalog(true)` + retry |
| `您沒有權限執行此作業` / `You don't have permission` | catalog 操作以一般使用者身分執行 | XPages 改用 `sessionAsSigner.getDatabase()`、agent 路線改在 server 上以 admin 身分跑 |
| `Field is not selectable in any view` | DQL 找不到對應 view，會退化成全 NSF scan | 補建 view 或在 selection formula 加 `SELECT @IsAvailable($DQLField)` |

---

> 📚 **看完三部曲了**
>
> - **Part 1**：[DQL 入門](/domino-news/zh-TW/posts/dql-getting-started) — 為什麼用 DQL、基本語法、從各種語言呼叫
> - **Part 2**：[DQL 踩雷集](/domino-news/zh-TW/posts/dql-pitfalls) — 寫 query 時 6 個官方文件不會明說的細節
> - **Part 3**：DQL Production-Ready（你剛看完）—— catalog 維運與權限
>
> 還有踩到本文沒收錄的雷？歡迎回報，我會繼續更新這個系列。

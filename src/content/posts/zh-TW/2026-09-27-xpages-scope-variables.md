---
title: "XPages 四個 scope：各活多久、該放什麼、什麼會爆"
description: "XPages 有 requestScope／viewScope／sessionScope／applicationScope 四個 scope，壽命從「一個請求」到「整個應用」差很多。挑錯 scope，值會莫名消失或跨使用者互相汙染；而最會咬人的是——scope 會被序列化寫到磁碟，把 NotesDocument、NotesView 或 SSJS function 塞進去，遲早噴 NotSerializableException。這篇講清楚四個 scope 各活多久、名稱怎麼由窄到寬解析、什麼能放什麼不能放，以及該存 UNID／view 名而不是物件本身。"
pubDate: 2026-09-27T07:30:00+08:00
lang: zh-TW
slug: xpages-scope-variables
tags:
  - "SSJS"
  - "XPages"
  - "Tutorial"
sources:
  - title: "Server-side scripting（scoped variables 定義）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_scripts_server.html"
  - title: "Do's and Do Not's for XPages Scoped Variables — HCL Domino App Dev Wiki"
    url: "https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/Dos_and_Do_Nots_for_XPages_Scoped_Variables"
  - title: "Scoped Variables, Implicit Variables and Repeat Controls — Intec（Paul Withers）"
    url: "https://www.intec.co.uk/scoped-variables-implicit-variables-repeat-controls/"
relatedJava: []
relatedSsjs: []
cover: "/covers/xpages-scope-variables.webp"
coverStyle: "watercolor"
---

你為了讓一份文件「撐過一次 partial refresh」，把 `database.getDocumentByUNID(...)` 拿到的 `NotesDocument` 塞進 `viewScope`。當下沒事，點幾下之後，頁面突然噴 `java.io.NotSerializableException`——或者更難查的：你在某個 scope 設的值，下次點按鈕就不見了。

這兩種 bug 的根都在同一件事:**XPages 有四個 scope，壽命天差地遠，而且它們會被序列化寫到磁碟**。挑錯 scope、或塞錯東西進去，就會踩到。

這篇把四個 scope 講清楚:各活多久、同名變數怎麼由窄到寬解析、什麼能放什麼不能放。

---

## 重點摘要

- **四個 scope、四種壽命**:`requestScope`(一個請求)、`viewScope`(一個頁面實例)、`sessionScope`(一個瀏覽器 session)、`applicationScope`(整個應用)。
- **名稱由窄到寬解析**:同名變數,越窄的 scope 越優先——所以取值時**明確指定 scope**、別靠隱含解析。
- **最會咬人的雷:scope 會被序列化到磁碟**(「Keep pages on disk」是預設)。放不可序列化的東西——**SSJS function**、**Notes 後端物件**(`NotesDocument`／`NotesView`／`NotesDatabase`)——遲早噴 `NotSerializableException`,或悄悄搞爆 JSF 週期與記憶體。
- **要存就存「原始資訊」**:文件存 **UNID**、視圖存 **view 名**、資料庫存**路徑**,用的時候再重新取，別存物件本身。
- **applicationScope 是全使用者共用**(thread-safety + 記憶體要顧);`sessionScope` 是**瀏覽器 session**、不是 Notes 使用者 session;每個 scope 只在該 NSF 內。

## 四個 scope、四種壽命

官方對這四個 scoped variable 的定義很簡潔:

> These objects allow you to define global variables, where the scope is the duration of one service request, one session (until the user logs out), the life of the application, or the life of the view page.

對應起來:

| Scope | 活多久 | 典型用途 |
|---|---|---|
| `requestScope` | **一個 service request**(含每一次 partial refresh) | 只在這一次請求裡傳遞的暫存值 |
| `viewScope` | **一個 view 頁面實例**（撐過同頁的 refresh，離開頁面就沒） | 這一頁專屬的狀態:目前選取、暫存表單值 |
| `sessionScope` | **一個 session**（到使用者登出／逾時） | 跨頁、單一使用者的狀態:購物車、精靈進度 |
| `applicationScope` | **整個應用的生命**（到 app 卸載／server 重啟） | 全使用者共用、少變動的資料:設定、查表快取 |

兩個容易誤會的點先講:`sessionScope` 指的是**瀏覽器 session**(不是 Notes 使用者 session);而且**每個 scope 都只在當前 NSF 內**——XPages 應用各自有 ClassLoader,`applicationScope` 不會跨 NSF 共享。

## 名稱由窄到寬解析:明確指定 scope

當你在 SSJS 或 EL 裡寫一個沒指定 scope 的變數名,XPages 會**由最窄的 scope 往外找**——`requestScope` → `viewScope` → `sessionScope` → `applicationScope`。也就是說,越窄的 scope 會**遮蔽**外層同名的變數。

實務上這會咬人:你在 `applicationScope` 放了一個 `config`,某頁又不小心在 `viewScope` 放了同名的 `config`,結果那頁讀到的是 viewScope 那個、不是你以為的全域設定。**解法很簡單:讀寫都明確指定 scope**——`applicationScope.get("config")`,不要只寫 `config` 賭它解析到對的地方。

```javascript
// 明確、可預測
sessionScope.put("cartCount", 3);
var n = sessionScope.get("cartCount");

// 也可以用 . 語法（等價）
viewScope.selectedUnid = doc.getUniversalID();
```

## 最會咬人的:序列化——別把 Notes 物件塞進 scope

這是 scope 用起來最容易中招的一關。XPages 預設會把頁面**序列化寫到磁碟**(「Keep pages on disk」自 8.5.2 起是新建 DB 的預設)。官方 wiki 講得很直接:

> XSP server is using serialization to store the page into the disk. So if you have objects that are not serializable in your viewScope, it will fail writing these pages into the disk and throws the error: `java.io.NotSerializableException: 'some object type'`.

哪些東西「不可序列化」、塞進 scope 會出事?

- **SSJS function**——wiki 點名「The most common type of unserializable object is SSJS functions」。把一段 SSJS 函式存進 scope,序列化時就爆。
- **Notes 後端物件**——`NotesDocument`、`NotesView`、`NotesDatabase` 這些。wiki 的原話是它們「storing them into hashmaps will have toxic effects in the JSF cycles and memory management」。它們是 **C 層的物件**(不是純 Java/SSJS)、沒有自動 GC,塞進 scope 對 JSF 週期與記憶體有毒;而且既然不可序列化,序列化那一關一樣過不了(這跟後端物件在 Java 端要 recycle,是同一種「這不是純 Java/SSJS 物件」的問題)。

**正解:scope 裡只放原始、可序列化的資訊,用的時候再重新取物件。** wiki 建議的對應:

- 要記一份文件 → 存它的 **UNID**(字串),要用時 `database.getDocumentByUNID(unid)`。
- 要記一個視圖 → 存 **view 名**,別存 `NotesView`。
- 要記一個資料庫 → 存**檔案路徑**,別存 `NotesDatabase`。

```javascript
// ✗ 別這樣：把 NotesDocument 塞進 viewScope
viewScope.doc = database.getDocumentByUNID(someUnid);   // 遲早 NotSerializableException

// ✓ 這樣：只存 UNID，要用時重新取
viewScope.docUnid = someUnid;
// …之後某個事件裡：
var doc = database.getDocumentByUNID(viewScope.docUnid);
```

（順帶一提:XPages 表單那種「邊改 datasource 邊在後端另存文件」造成的存檔衝突，跟這是不同的坑，見 [XPages 存檔衝突那篇](/domino-news/posts/notes-document-save-conflict)。）

## applicationScope 是全使用者共用的

`applicationScope` 的壽命最長、範圍最大——**同一個 NSF 的所有使用者共用同一份**。這帶來兩個要顧的事:

- **記憶體**:放進去的東西會一直待到 app 卸載或 server 重啟。拿它當「查表快取」很好,但別把會無限成長的東西(例如每個使用者一筆的紀錄)堆進去,那是記憶體洩漏。
- **並行安全(thread-safety)**:多個使用者的請求可能同時讀寫同一個 `applicationScope` 值。放唯讀的設定沒問題;若要當計數器之類會被並行改寫的東西,得自己處理同步。

`sessionScope` 則是每個瀏覽器 session 一份,會隨使用者增加而累積——同樣別把大東西無限往裡堆。原則就一句:**用「最低夠用」的 scope**。只在一頁用 → `viewScope`;一個使用者跨頁用 → `sessionScope`;真的全域共用且少變 → `applicationScope`。

## 怎麼清

scope 就是個 map,清法也就是 map 的操作:

```javascript
sessionScope.remove("cartCount");   // 清單一個 key
sessionScope.clear();               // 清整個 sessionScope
```

`requestScope` 不必手動清(請求結束就沒);`viewScope` 離開頁面就回收;`sessionScope` 到登出／逾時才沒,所以敏感或大的東西該主動 `remove`。

## 同類別在其他語言

scope 是 **XPages 執行期**的概念,不是某個後端類別——所以 LotusScript agent 端**沒有對應**(agent 沒有 request／view／session／application 這種生命週期容器)。而 **Java(在 XPages 裡)用的是同一組 scope**:透過 `facesContext` 的 ExternalContext、或 Extension Library 的 `ExtLibUtil.resolveVariable(...)` 取到同樣的 `requestScope`／`viewScope`／`sessionScope`／`applicationScope`——SSJS 與 Java 存進去的東西彼此看得到,序列化的限制也一模一樣(所以在 Java 端一樣別塞 Domino 後端物件進去)。

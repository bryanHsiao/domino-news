---
title: "XPages 效能：為什麼一次提交你的 computed 被算了好幾遍——#{} vs ${}、rendered vs loaded"
description: "在 XPages 的 computed 值或 rendered 公式裡擺個 println，按一下按鈕，它卻跑了五六遍——這不是 bug，是 XPages 每次提交都跑整輪 JSF 生命週期，而 #{}（compute dynamically）的 value binding 每被讀一次就重算一次、跨多個階段加起來就是好幾遍。這篇講三個把 computed 重算壓下來的旋鈕：#{}（每次重算）vs ${}（載入算一次、靜態），rendered（在 tree 裡、每階段都算）vs loaded（根本不建進 tree、全程跳過），以及它們各自的使用時機與 ${} 的 caveat。"
pubDate: 2026-10-12T07:30:00+08:00
lang: zh-TW
slug: xpages-binding-rendered-loaded-performance
tags:
  - "XPages"
  - "Performance"
sources:
  - title: "Value (control and data binding)（#{} 井號 compute dynamically／${} 錢號 compute on page load）— HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/xpageuser/wpd_controls_pref_value.html"
  - title: "XPages Bindings: When # Runs at Page Load（${} 載入算一次、#{} 延後；兩者不可混用）— Intec（Paul Withers）"
    url: "http://intec.co.uk/xpages-bindings-when-runs-at-page-load/"
  - title: "XPages Tip: Loaded Vs Rendered（loaded 不建進 tree、rendered 建了但每階段仍處理）— Matt White"
    url: "https://qtzar.com/2009/06/15/dslh-7t2l9q/"
  - title: "Understanding Partial Execution: Part Three – JSF Lifecycle（生命週期各階段與 computed／rendered 重算）— Intec（Paul Withers）"
    url: "http://intec.co.uk/understanding-partial-execution-part-three-jsf-lifecycle/"
relatedJava: []
relatedSsjs: []
---

你在一個 computed 值、或某個控制項的 `rendered` 公式裡隨手塞了一行 `print(...)`，然後按一下按鈕——結果 console 裡那行印了五遍、六遍。你只按了一次，它憑什麼算這麼多遍？

這不是 bug。XPages 每次提交都會跑**一整輪 JSF 生命週期**（六個階段），而你用 `#{}` 寫的 value binding，**每被讀取一次就重新算一次**；跨好幾個階段加起來，一次提交就被評估好幾遍。平常不痛不癢，但當那段 computed 裡有 `@DbLookup`、迴圈、或一大串邏輯時，它就成了實打實的效能殺手。

好消息是，這件事有旋鈕可以調——而且不是魔法，是搞懂「什麼時候該算一次、什麼時候才需要每次重算」。這篇講三個最有感的：`#{}` vs `${}`、`rendered` vs `loaded`。（生命週期與 partial refresh／execution 的背景，見[partial refresh vs partial execution](/domino-news/posts/xpages-partial-refresh-execution/)那篇。）

---

## 重點摘要

- **一次提交 = 一整輪 JSF 生命週期**，而 `#{...}`（compute dynamically）的 value binding **每被讀一次就重算一次**，跨多個階段就是好幾遍。
- **`${...}`（compute on page load）只在頁面載入時算一次**，把結果當靜態值烤進去、之後不再重算（官方：井號 `#{}` compute dynamically、錢號 `${}` compute on page load）。值在一次請求裡不會變的，就用 `${}`。
- **caveat**：`${}` 不能參照「生命週期後期才建立的物件」——像 `repeat` 的 row 變數、每請求才載入的 data source 值，載入當下還不存在。這類只能用 `#{}`。
- **`rendered`**（false＝在 component tree 裡、只是不顯示）在**生命週期各階段仍會被評估**；**`loaded`**（false＝根本不建進 tree）則**全程跳過**。可見性在一次請求裡固定的，用 `loaded` 比 `rendered` 省。
- **別把 `${}` 和 `#{}` 混在同一個運算式**——會逼 `#{}` 也在載入時算、結果跟你想的不一樣。

## 一次提交，computed 被算幾遍：JSF 生命週期

XPages 建在 JSF 上，一次提交依序跑六個階段：Restore View → Apply Request Values → Process Validations → Update Model Values → Invoke Application → Render Response。問題在於：**一個屬性（例如某控制項的 `rendered`、或一個 computed 欄位的值）不是只在最後畫面時算一次，而是在過程中被讀好幾次**——每次 JSF 需要那個值，就去跑一次你的 binding。

所以同一段 `#{javascript:...}`，一次按鈕點擊下來可能被評估五、六遍。如果裡面只是個字串拼接，無所謂；如果裡面有 `@DbLookup`、`@DbColumn`、開 view、跑迴圈，那就是「一次點擊、重複做了好幾次重活」。效能問題的根，常常就在這裡。

## `#{}` vs `${}`：每次重算 vs 載入算一次

這兩個符號是 XPages 最常被搞混、但也最有效能槓桿的地方（[官方 Value binding](https://help.hcl-software.com/dom_designer/14.0.0/xpageuser/wpd_controls_pref_value.html)）：

- **`#{...}` = compute dynamically（井號）**：value binding，**每次那個元素被讀取／render 時都重算**。Designer 屬性面板選「Compute Value」出來的就是它，也是預設。
- **`${...}` = compute on page load（錢號）**：load-time binding，**只在頁面第一次載入時算一次**，把結果當成靜態值烤進元件，之後整個生命週期都不再重算（[Intec 的說明](http://intec.co.uk/xpages-bindings-when-runs-at-page-load/)：`${}` 載入時算、`#{}` 延後）。

效能槓桿就在這：**一段 computed 的結果如果在這一次請求裡根本不會變，就用 `${}` 讓它只算一次**，而不是放任 `#{}` 在每個階段重跑。開發初期不必計較，但上了量、或 computed 裡有重活時，把該靜態的改成 `${}` 很有感。

兩個要記住的限制：

- **`${}` 不能參照「還沒建好的東西」**。它在載入時就算，所以如果你的運算式引用 `repeat` 控制項的 row 變數、或某個每請求才載入的 data source 值——那些物件在載入當下根本還不存在，`${}` 會拿到空的或錯的。這類動態資料只能用 `#{}`。
- **`${}` 和 `#{}` 不能混在同一個運算式**。整個 value 屬性是當一個字串丟給底層處理的，一旦混用，會逼 `#{}` 那段也在載入時算掉，行為就跟你預期的不一樣。

## `rendered` vs `loaded`：在不在 component tree 裡

第二個旋鈕關於「控制項存不存在」。`rendered` 和 `loaded` 都能讓一個控制項「不出現」，但代價天差地遠（[Loaded vs Rendered](https://qtzar.com/2009/06/15/dslh-7t2l9q/)）：

- **`rendered="false"`**：控制項**還是被建進 component tree**，只是不顯示。它仍然在生命週期的各階段被處理、它的 binding 仍會被評估、連它要的 dojo／資源都還是會被偵測並塞進 HTML header。
- **`loaded="false"`**：控制項**根本不會被建進 tree**。XPages 直接跳過它——不處理、不評估、不載資源，程式也抓不到它（`getComponent` 拿不到）。

所以：**如果某塊 UI 在一次請求裡要不要出現是固定的（例如依使用者角色、依文件模式決定），用 `loaded` 比 `rendered` 省得多**，因為它把整個控制項連同底下的運算從生命週期裡拿掉。反過來，當你需要那個控制項「還在 tree 裡、只是暫時藏起來、等等 partial refresh 再顯示」或「要用程式去抓它」時，才用 `rendered`。

## 連帶：取值的時機、以及 converter

既然講到生命週期，兩個相關的點順帶記住：

- **早期階段只有 `submittedValue`（字串），第 4 階段 Update Model Values 之後才有轉好型別的 `getValue()`**。所以你在不同階段取同一個欄位，拿到的東西不一樣——這也跟 [`document1.getDocument(true)` 那篇](/domino-news/posts/xpages-getdocument-applychanges/)講的「什麼時候值才進 data source」是同一條生命週期。
- **關掉 validation 不等於跳過 converter**：就算你把驗證停掉，型別轉換（converter）該跑還是跑。別以為「關了驗證就全部省了」。

## 實務：什麼時候用哪個

把上面收成幾條好記的：

- **值在這次請求裡不會變** → `${}`（載入算一次）。會變（每列、每請求的動態資料）→ `#{}`，而且盡量讓裡面的運算便宜。
- **可見性在這次請求裡固定** → `loaded`（整塊從生命週期拿掉）。需要留在 tree 裡、等 partial refresh 或程式操作 → `rendered`。
- **不確定它被算幾遍** → 塞一個計數器或 `print` 進去、按一次看它跳幾下，用數字說話，再決定要不要改成 `${}`／`loaded`。

## 小結

一次提交你的 computed 被算好幾遍，不是 bug，是 `#{}`（compute dynamically）的 value binding 在整輪 JSF 生命週期裡每次被讀都重算。把這次請求裡不會變的值改成 `${}`（compute on page load，只算一次），把可見性固定的控制項從 `rendered` 改成 `loaded`（根本不建進 tree），就能把重複的運算從生命週期裡拿掉。記住 `${}` 的兩個限制（不能參照後期才建的物件、不能跟 `#{}` 混用），再搭一個計數器量一下，效能該省的地方就看得見了。

---
title: "Java 讀寫 Notes item：getItemValue 回的是 Vector，不是你熟的那種陣列"
description: "LotusScript 裡 doc.GetItemValue 回一個 Variant 陣列，你 For 一圈就完事。搬到 Java，同一個呼叫回的是 java.util.Vector，元素型別要自己認、缺欄位不丟例外只回空的、裡面若是 DateTime 還會漏記憶體。這篇把 Java 版 Document 的讀寫 item 講清楚：getItemValue 與那幾個型別化 getter 的回傳與缺欄位行為、replaceItemValue 接受哪些 Java 型別又會自動建 item、appendItemValue 為什麼會默默建出重複 item，以及三個 LotusScript 帶不過來的雷。"
pubDate: 2026-08-14T07:30:00+08:00
lang: zh-TW
slug: java-document-items
tags:
  - "Java"
sources:
  - title: "Document.getItemValue (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD_JAVA.html"
  - title: "Document.replaceItemValue (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACEITEMVALUE_METHOD_JAVA.html"
  - title: "Document.appendItemValue (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDITEMVALUE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
---

LotusScript 裡讀一個欄位，你大概想都不用想：`values = doc.GetItemValue("Categories")`，拿到一個 Variant 陣列，`ForAll` 一圈就完事。同一件事搬到 Java 版的 `lotus.domino` API，表面上呼叫幾乎一樣——`doc.getItemValue("Categories")`——但回來的東西、缺欄位的行為、甚至記憶體的責任歸屬，都跟 LotusScript 不一樣。

這篇把 Java 版 `Document` 的讀寫 item 講清楚：讀進來是什麼型別、缺欄位會怎樣、寫回去接受哪些 Java 型別，以及三個 LotusScript 開發者最容易帶錯直覺的雷。

---

## 重點摘要

- **`getItemValue` 回的是 [`java.util.Vector`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD_JAVA.html)**，不是 LotusScript 的 Variant 陣列。元素型別跟著欄位型別走：文字給 `String`、數字給 `Double`、日期給 `DateTime`。
- **缺欄位不丟例外，只回一個空 Vector**：官方寫得很白——`getItemValue` 找不到欄位時回空 Vector、不拋例外。所以「空」跟「不存在」你分不出來，要用 `hasItem` 判斷。
- **型別化 getter 各自有回傳**：`getItemValueString` 回 `String`、`getItemValueInteger` 回 `int`、`getItemValueDouble` 回 `double`。其中 `getItemValueString` 對缺欄位在 6.55 之後回的是空字串（不是 null）。
- **寫回用 [`replaceItemValue(String, Object)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACEITEMVALUE_METHOD_JAVA.html)**：吃 `String`／`Integer`／`Double`／`DateTime`／`Vector`／`Item`；欄位不存在會自動建，改完一定要 `save`。
- **別用 `appendItemValue` 更新既有欄位**：它不會取代，而是默默建出一個同名的重複 item——官方直說一般情況偏好 `replaceItemValue`。

---

## 讀：getItemValue 回一個 Vector

Java 版的簽章長這樣：

```java
public java.util.Vector getItemValue(String name) throws NotesException
```

回來的 `Vector`，每個元素的型別由欄位的資料型別決定——文字欄位給你一串 `String`、數字欄位給你 `Double`、日期時間欄位給你 `DateTime` 物件。單值欄位就是一個只有一個元素的 Vector。這跟 LotusScript 的 Variant 陣列概念一樣，差別在你現在拿到的是一個**泛型被抹掉的 `Vector`**，實務上是 `Vector`（元素 `Object`），取值得自己認型別轉。

最該記住的一句是缺欄位的行為。官方文件寫得很直接：

> If no item with the specified name exists, this method returns an empty vector. It does not throw an exception.

也就是說，`getItemValue("不存在的欄位")` 不會爆，只是給你一個空 Vector。這跟 LotusScript 一致，但它帶出一個 Java 端要特別小心的模糊地帶：**「這個欄位是空的」和「這個欄位根本不存在」，從回傳值分不出來**。兩者都是空 Vector。要區分，就得先問 `doc.hasItem("...")`。

## 讀：型別化的 getter，與那個空字串的坑

如果你只要一個純量，Java 提供了型別化的捷徑：`getItemValueString` 回 `String`、`getItemValueInteger` 回 `int`、`getItemValueDouble` 回 `double`。多值欄位它們只給你第一個值。

`getItemValueString` 有一個歷史包袱值得知道。對一個缺欄位或非文字的欄位，它的回傳跟版本有關——6.5 及更早回 `null`，**6.55 以後回的是空字串**。今天你遇到的幾乎都是後者。這很方便（不用防 `NullPointerException`），但它跟 `getItemValue` 是同一個陷阱的兩面：**回一個空字串，你依然分不出「欄位存在但空」還是「欄位不存在」**。要精確判斷，`hasItem` 還是唯一可靠的問法。

## 寫：replaceItemValue 吃哪些 Java 型別

寫回去的主力是 `replaceItemValue`，簽章是：

```java
public Item replaceItemValue(String name, Object value) throws NotesException
```

`value` 是 `Object`，實際上它認得這幾種 Java 型別，各自對應到一種 item：

| 你傳的 Java 型別 | 建出來的 item |
|---|---|
| `String` | 文字 |
| `Integer` | 數字 |
| `Double` | 數字 |
| `DateTime` | 日期時間 |
| `Vector`（元素是上面那幾種） | 多值 |
| `Item` | 與來源 Item 同型別 |

多值就是包成一個 `Vector` 丟進去。欄位不存在時，官方寫明它會自動補上：

> If the document does not contain an item with the specified name, this method creates a new item and adds it to the document.

還有一句 LotusScript 老手也常忘、Java 一樣要記的：改完要存。官方直說「you must call save after calling replaceItemValue」——`replaceItemValue` 只改記憶體裡的文件，沒 `save` 就等於沒發生。

## 雷一：appendItemValue 不是「順手加一筆」

Java 的 [`appendItemValue`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDITEMVALUE_METHOD_JAVA.html) 名字聽起來很無害，但它跟 `replaceItemValue` 有一個會咬人的差別。官方講得毫不含糊：

> If the document already has an item called _name,_ appendItemValue does not replace it. Instead, it creates another item of the same name and gives it the value you specify.

一個文件裡出現兩個同名 item，之後多數 API 只讀得到其中一個、另一個變成幾乎存取不到的孤兒。所以官方直接給了結論：一般情況**偏好 `replaceItemValue`**，`appendItemValue` 只在你確定是在建一份全新文件、名字絕不重複時才用得安全。從 LotusScript 過來的人尤其要留意——LotusScript 裡你很少手動 append，這個方法在 Java 程式裡卻很容易被名字誤導著用下去。

## 雷二：Vector 裡的 DateTime 會漏記憶體

`getItemValue` 對一個日期欄位，回給你的是一個裝著 `DateTime` **物件**的 Vector。而 `DateTime` 是重量級的後端物件——它跟 `Document`、`Session` 一樣，背後連著一個垃圾回收看不到的 handle。你在迴圈裡對上萬份文件一直 `getItemValue` 日期欄位，那些 `DateTime` 就會一路堆積、把 agent 記憶體吃垮。

這正是站上 [recycle() 那篇](/domino-news/posts/java-recycle-memory)講的坑，只是換了個入口：你以為只是在讀欄位，卻在不知不覺間製造了一堆要手動回收的後端物件。安全的習慣是——從 item 拿到的 `DateTime`，用完就 `recycle`。

## 雷三：型別要自己認

LotusScript 的 Variant 會幫你把型別的事糊過去；Java 不會。`getItemValue` 給你的是 `Vector`（元素 `Object`），你要嘛先知道欄位型別、直接轉 `String` 或 `Double`，要嘛就得逐一 `instanceof` 判斷。轉錯型別在編譯期不會擋你，會在執行期給你一個 `ClassCastException`。所以在 Java 裡，「這個欄位到底是文字還是數字」不再是可以含糊的事——你的程式碼得替每個欄位講清楚。

## 一個完整的例子

把上面串起來——讀幾個型別、寫幾個回去、存檔：

```java
// 讀
String subject = doc.getItemValueString("Subject");        // 缺欄位 → 空字串
Vector cats = doc.getItemValue("Categories");              // 多值文字 → Vector<String>
double amount = doc.getItemValueDouble("Amount");          // 數字 → double

// 寫
doc.replaceItemValue("Status", "Approved");                // String → 文字
doc.replaceItemValue("Count", Integer.valueOf(cats.size())); // Integer → 數字

Vector reviewers = new Vector();
reviewers.add("Alice");
reviewers.add("Bob");
doc.replaceItemValue("Reviewers", reviewers);              // Vector → 多值

doc.save();                                                // 不存等於沒改
```

沒有 `save` 那一行，前面每個 `replaceItemValue` 都只動了記憶體裡的文件、沒進 NSF。

## 同類別在其他語言

- **LotusScript**：`doc.GetItemValue("x")` 回 Variant 陣列、`doc.ReplaceItemValue "x", v` 寫回。概念一樣，但 Variant 幫你把型別糊掉了，也沒有 `Vector` 裡 `DateTime` 要 recycle 的負擔——LotusScript 的記憶體是自動的。
- **SSJS／XPages**：跟 Java 幾乎一模一樣，因為底層就是同一套 `lotus.domino` 類別——`getItemValue` 一樣回 `java.util.Vector`。想深入多值與 `Vector` 的操作，站上有 [XPages 直接用 java.util.Vector 操作多值](/domino-news/posts/ssjs-vector-multivalue) 那篇。

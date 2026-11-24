---
title: "Java 查 Domino Directory:Directory 給你的不是清單,是三層導覽"
description: "一個 Java agent 要從 Domino Directory(NAB)查某人的 mail server、internet address,或某個群組的成員。你用 Directory 類別:session.getDirectory() 拿到目錄、lookupNames() 查一批名字要哪些欄位,然後——它回給你的不是一個能 for 迴圈的清單,是一個 DirectoryNavigator,一個「名字 × 比對 × 欄位」的三層游標。巢狀層次搞錯,就讀到錯的值或空值。這篇講怎麼拿 Directory、lookupNames/lookupAllNames 的差別、那個三層導覽到底怎麼走,還有一個坑:官方範例頁自己用了跟文件不符的 API,別照抄。"
pubDate: 2026-11-24T07:30:00+08:00
lang: zh-TW
slug: java-directory
tags:
  - "Java"
sources:
  - title: "Directory class (Java)（session.getDirectory、lookupNames/lookupAllNames、child DirectoryNavigator）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS_JAVA.html"
  - title: "DirectoryNavigator class (Java)（findFirstName/findFirstMatch/getFirstItemValue、三層導覽）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS_JAVA.html"
  - title: "lookupNames (Directory - Java)（view、names、items、partialMatches）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOOKUPNAMES_METHOD_DIRECTORY_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass:
  - "Directory"
  - "DirectoryNavigator"
apiLang: "java"
cover: "/covers/java-directory.webp"
coverStyle: "minimalist-mono"
---

一個排程的 Java agent 要從 Domino Directory(names.nsf / NAB)查東西:這個人的 mail server 是哪台、他的 internet address 是什麼、某個群組裡有誰。你不想自己開 `names.nsf`、猜 view 名稱、手刻 `@NameLookup`,於是你找到 `Directory` 類別。

你 `session.getDirectory()` 拿到目錄、`lookupNames()` 丟一批名字進去、說你要哪些欄位,然後準備 for 迴圈跑結果 —— 結果它回給你的**不是一個清單**,是一個 [`DirectoryNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS_JAVA.html)。而且這個 navigator 是**三層**的:名字 → 比對 → 欄位。巢狀搞錯,讀到的就是錯的值、或空的。

這篇講怎麼拿 Directory、`lookupNames` 跟 `lookupAllNames` 的差別、那個三層導覽到底怎麼走,還有一個很實際的坑:官方範例頁自己寫了跟文件不符的 API。

---

## 怎麼拿到 Directory

[`Directory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDIRECTORY_CLASS_JAVA.html) 官方定義是「Represents the Notes directories on a specific server or local computer, each of which is associated with one or more directory navigators to allow directory lookups.」。從 Session 建立:

```java
Directory dir = session.getDirectory();      // 不給參數 = 本機目錄
// session.getDirectory("")        → 當前這台電腦
// session.getDirectory("Mail/Acme") → 指定 server 的目錄
```

- 不給 server name,就用本機目錄(看 `UseContextServer`)。
- **跨 server 查有條件**:官方寫「the current server must have a Trusted relationship with the specified server.」—— 在 server 上查另一台 server 的目錄,兩台要有信任關係,不是填了名字就能查。
- `getDirectory` 是 Release 8.5 才有的。

## lookupNames:給名字、給要哪些欄位,回一個 navigator

[`lookupNames`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOOKUPNAMES_METHOD_DIRECTORY_JAVA.html) 官方一句話是「Looks up designated Items for specified Names contained in the specified View.」。三個必填 + 一個選填:

```java
Vector names = new Vector(); names.add("John Smith");
Vector items = new Vector(); items.add("MailServer"); items.add("InternetAddress");
DirectoryNavigator nav = dir.lookupNames("($Users)", names, items, true);
//                                         view       要查的名字  要哪些欄位  partialMatches
```

- `view` 是你在目錄裡要查的 view 名(例如 `($Users)`)。
- `names` 可以是單一字串或字串陣列。
- `items` 是你要回傳哪些欄位 —— **用該 view 的 column 程式名效能最好**(官方:「For best performance, use column names from the specified view」);也可以給 note 裡的 field 名,或 `$$DbName` 這種 NAMELookup 的計算項,但那些慢。
- 最後的 `partialMatches` 選填,給 `true` 就允許名字部分比對。

另一個方法 [`lookupAllNames(view, items)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOOKUPALLNAMES_METHOD_DIRECTORY_JAVA.html) 不給名字、回整個 view 每一筆的 items。但官方警告:「Large results will be limited by the system, according to settings in Notes.ini. This method is intended for views with limited scopes.」—— 別拿它掃大目錄,會被 Notes.ini 砍掉。

## 招牌坑:navigator 是「名字 × 比對 × 欄位」三層游標

這是最容易寫錯的地方。`lookupNames` 回的不是一個 collection,是一個**三層的游標**,你要照層次走:

1. **名字層** —— `findFirstName()` / `findNextName()`。你查了 N 個名字,這層在這 N 個之間移動;`findFirstName()` 回傳「這個名字有幾筆比對」。
2. **比對層** —— `findFirstMatch()` / `findNextMatch()`。同一個名字可能對到多筆(同名、partial match),這層在這些比對之間移動。
3. **欄位層** —— `getFirstItemValue()` / `getNextItemValue()`。你 `items` 給了幾個欄位,就照順序一個一個拿。

```java
Directory dir = session.getDirectory();
Vector names = new Vector(); names.add("John Smith");
Vector items = new Vector(); items.add("MailServer"); items.add("InternetAddress");
DirectoryNavigator nav = dir.lookupNames("($Users)", names, items, true);

nav.findFirstName();                      // 定位到第一個名字
while (nav.isNameLocated()) {             // NameLocated：找到名字沒
  nav.findFirstMatch();                   // 定位到這個名字的第一筆比對
  while (nav.isMatchLocated()) {          // MatchLocated：這筆比對有效沒
    String mailServer = nav.getFirstItemValue();   // 照 items 順序：第 1 個
    String inetAddr   = nav.getNextItemValue();     // 第 2 個
    System.out.println(nav.getCurrentName() + " → " + mailServer + " / " + inetAddr);
    nav.findNextMatch();
  }
  nav.findNextName();
}
```

搞錯的典型症狀:只跑了名字層、沒進比對層,結果每個名字只讀到第一筆;或是 `getFirstItemValue` / `getNextItemValue` 的順序跟 `items` 不對應,拿到的欄位張冠李戴。記住順序**就是你傳進 `items` 的順序**。

幾個會用到的狀態:`CurrentName`(現在停在哪個名字)、`CurrentMatches`(這個名字幾筆比對)、`CurrentView`。還有 Directory 的 `LimitMatches` 屬性 —— 官方:「Indicates if the results of lookups are limited to fifty entries.」,預設會把結果**砍到 50 筆**,要全撈記得關掉。

## 官方範例別照抄

這是查證時抓到的紅旗:官方的 Directory examples 頁裡那段 agent,用的是 `DirEntryCollection` / `DirEntry` / `getFirstEntry()` / `dir.getName()` —— 這些**在 Directory 跟 DirectoryNavigator 的文件裡根本不存在**。`lookupNames` 文件白紙黑字回傳 `DirectoryNavigator`,不是什麼 `DirEntryCollection`;Directory 有的是 `Server` 屬性,不是 `getName()`。那段範例看起來是更早期的、沒跟著 API 更新的舊樣本(連分號都漏了)。

**別照它寫。** 以 `DirectoryNavigator` 的三層導覽為準。這也是為什麼每篇都要回官方逐條對 —— 連官方範例都會跟自己的 class 文件打架。

## 同類別在其他語言

同一組 `Directory` / `DirectoryNavigator`:

- **LotusScript**:`NotesDirectory` / `NotesDirectoryNavigator`,`CreateNavigator`、`LookupNames`、`FindFirstName` / `FindFirstMatch` / `GetFirstItemValue` 都在,三層導覽的模型一模一樣,不用 recycle。
- **SSJS / XPages**:一樣 `session.getDirectory()`,在 managed bean 或 SSJS 裡查目錄做欄位渲染很常見(例如依登入者查他的部門、mail server)。
- **Java 專屬的**不是 API(方法共用),而是場景:後端 / 排程 Java agent 要批次查一堆名字的目錄資料(對帳、通知、權限同步)時,`lookupNames` + 三層 navigator 是官方給的路;只是要記得它是游標不是清單,而且別信那份官方範例。

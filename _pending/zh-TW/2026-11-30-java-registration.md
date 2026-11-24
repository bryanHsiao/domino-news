---
title: "Java 的 Registration:先把 CertifierIDFile 等屬性設好,再 registerNewUser"
description: "要用程式批次註冊使用者(入職自動化、腳本化佈建),Domino 的 Registration 類別做得到。但它的用法跟別的類別不一樣:官方明寫『The properties are intended to be set before calling the methods.』——你得先把 CertifierIDFile(憑證 ID 路徑)、RegistrationServer、IDType、Expiration、MinPasswordLength 這些屬性設好,registerNewUser 才會成功。而且 registerNewUser 失敗時是回 false、不是丟例外,不檢查回傳值就會以為成功。這篇講這個『先設屬性再呼叫』的節奏、registerNewUser 的參數、CertifierIDFile+憑證密碼這把鑰匙、registerNewCertifier/crossCertify/getUserInfo,以及 createRegistration 不能跑遠端(IIOP)這個坑。"
pubDate: 2026-11-30T07:30:00+08:00
lang: zh-TW
slug: java-registration
tags:
  - "Java"
sources:
  - title: "Registration class (Java)（屬性先設再呼叫、registerNewUser/Certifier/crossCertify/getUserInfo）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS_JAVA.html"
  - title: "registerNewUser (Registration - Java)（參數多、回 boolean）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REGISTERNEWUSER_METHOD_JAVA.html"
  - title: "CertifierIDFile (Registration - Java)（所有註冊/認證前必設）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CERTIFIERIDFILE_PROPERTY_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "Registration"
apiLang: "java"
---

要用程式**批次註冊使用者** —— 入職自動化、腳本化佈建一整批帳號 —— Domino 的 [`Registration`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESREGISTRATION_CLASS_JAVA.html) 類別做得到。官方定義就一句「Represents the creation or administration of an ID file.」。

但它的用法跟你平常那些類別不一樣。你不是把所有東西當參數塞進一個方法 —— 官方明寫「The properties are intended to be set before calling the methods.」。你得**先**把 `CertifierIDFile`、`RegistrationServer`、`IDType`、`Expiration`、`MinPasswordLength` 這些屬性設好,`registerNewUser` 才會成功。而且它失敗時是**回 `false`、不是丟例外** —— 不檢查回傳值,就會以為成功。

這篇講這個「先設屬性、再呼叫方法」的節奏、`registerNewUser` 的參數、`CertifierIDFile` + 憑證密碼這把鑰匙、幾個兄弟方法,以及 `createRegistration` 不能跑遠端的坑。

---

## 招牌節奏:屬性先設好,方法才呼叫

從 Session 建一個 `Registration`,然後**先設屬性**:

```java
Registration reg = session.createRegistration();
reg.setRegistrationServer("AceOne");                      // 要在哪台 server 註冊
reg.setCertifierIDFile("d:\\NotesAdministrator\\cert.id"); // 用哪把憑證 ID
reg.setIDType(Registration.ID_HIERARCHICAL);              // 階層式 ID
reg.setMinPasswordLength(5);                              // 密碼強度
reg.setExpiration(expiry);                                // 到期日（DateTime）
reg.setUpdateAddressBook(true);                           // 順便在 Directory 建 Person
```

官方 Usage 就是這個邏輯。幾個常用屬性:

- `RegistrationServer` —— 在哪台 server 註冊。**不設的話**,方法會對本機 data 目錄的 `names.nsf` 動作。
- `IDType` —— 要建哪種 ID(範例用 `Registration.ID_HIERARCHICAL`)。
- `Expiration` —— ID 到期日。預設值隨操作不同:registerNewUser 預設 2 年、certifier 的 org/OU 預設 100 年、crossCertify 預設 10 年。
- `UpdateAddressBook` —— 建 ID 時要不要在 Directory 同時建 ID 文件。
- `MinPasswordLength` —— 密碼強度。

設完才呼叫 register*。這個順序是用對這個類別的關鍵 —— 屬性沒設好就呼叫,不會幫你補、只會失敗。

## registerNewUser:參數很多,而且回 boolean

[`registerNewUser`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REGISTERNEWUSER_METHOD_JAVA.html) 官方「Creates a user ID and optionally adds it to a Domino Directory.」,有多個 overload,參數從 3 個到一長串。官方範例那一行:

```java
boolean ok = reg.registerNewUser(
    "Yip",                               // lastn   姓
    "d:\\NotesAdministrator\\jyip.id",   // idfile  要建的 ID 檔完整路徑
    "CN=Mail_AceOne/O=AceHardware",      // server  mail server 的 canonical 名
    "Jimmy",                             // firstn  名
    "",                                  // middle  中間名
    "AceHardware",                       // certpw  憑證 ID 的密碼
    "", "",                              // location / comment（Directory 欄位）
    "mail\\jyip.nsf",                    // maildbpath  mail 檔（相對 mail 目錄）
    "",                                  // forward  轉寄 domain
    "AceHardware");                      // userpw  使用者 ID 的密碼
if (!ok) System.out.println("Registration failed");   // ← 一定要檢查回傳值
```

**重點是回傳值**:官方「True if the operation is successful; false otherwise.」—— 它**失敗時回 `false`、不丟例外**。所以不能寫完 `registerNewUser(...)` 就當成功了,要接 `if (!ok)`。(`NotesException` 只在更底層的錯誤才丟。)另外 `certpw` 是**憑證 ID 的密碼**(不是使用者密碼),`userpw` 才是新使用者 ID 的密碼 —— 兩個別搞混。

## CertifierIDFile + 憑證密碼:所有註冊的鑰匙

[`CertifierIDFile`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CERTIFIERIDFILE_PROPERTY_JAVA.html) 官方「The complete file specification of the certifier ID to use when creating IDs.」,而且「Set this property before calling crossCertify, recertify, registerNewCertifier, registerNewServer, or registerNewUser.」—— 幾乎所有建 ID / 認證的方法**都要先設它**(crossCertify 頁更直接:「requires that CertifierIDFile be set」)。

這個設計意味著:**跑這段程式的環境必須拿得到憑證 ID 檔、也要知道它的密碼。** 這是很有威力、也很敏感的操作(等於在發身分),憑證 ID + 密碼就是那把鑰匙 —— 放哪、誰能跑,要當成機敏資料管。

## 兄弟方法

同一個類別上還有:

- `registerNewCertifier(org, idfile, certpw[, country])` —— 建 certifier ID。Expiration org 預設 100 年、而且「cannot be changed for organizations」。
- `registerNewServer(...)` —— 建 server ID。
- `crossCertify(idfile[, certpw][, comment])` —— 交叉認證一個 ID(跨組織信任)。一樣要先設 `CertifierIDFile`。
- `getUserInfo(username, mailserver, mailfile, maildomain, mailsystem, profile)` —— 查一個已註冊使用者的資料。注意它的簽名:「The parameters, except for the first, are return values.」—— **除了第一個 username,其他都是「回傳用」的 `StringBuffer` / `Vector`**(Java 用 out-parameter 這種少見寫法),你要先 new 好空的傳進去、它填值。

## 坑:createRegistration 不能跑遠端(IIOP)

一個會卡住自動化的限制:`createRegistration` 官方標注「This property is illegal for remote (IIOP) calls.」—— **它不能從遠端(IIOP)Java client 跑**。所以這段註冊程式得在**本機 / server agent** 上執行,不能寫成一支連遠端 Domino 的 standalone Java 程式去呼叫。官方範例本身就是一支 `AgentBase` agent。

## 同類別在其他語言

同一個 `Registration`:

- **LotusScript**:`NotesRegistration`,`RegisterNewUser` / `RegisterNewCertifier` / `CrossCertify` / `GetUserInfo`、`CertifierIDFile` 全在,一樣「屬性先設再呼叫」、一樣回傳 Boolean,不用 recycle。
- **SSJS / XPages**:理論上也在 `session.createRegistration()`,但註冊 / 發 ID 這種管理動作幾乎不會放在 XPages 前端跑 —— 憑證 ID + 密碼不該出現在網頁層。
- **Java 專屬的**不是 API(方法共用),而是場景:後端 / 排程的 Java agent 做批次入職、腳本化佈建時,`Registration` 是正解;只要記得「屬性先設好」「檢查 boolean 回傳」「不能跑遠端 IIOP」這三件事,而且把憑證 ID + 密碼當機敏資料看。

---
title: "XPages managed bean：給 SSJS 一個真正的 Java 物件，像 database 一樣直接用"
description: "SSJS 寫在 script library 裡當膠水很方便，但邏輯一多就難維護——沒有真正的型別、難測試、塞進 scope 還有序列化問題。managed bean 讓你在 faces-config.xml 宣告一個 Java class，它就變成 SSJS 與 EL 裡的一個頂層變數，用起來跟 database、session 一樣——bean.method()、#{bean.prop}。這篇講 managed bean 怎麼宣告（name／class／scope 三元素）、class 的三個要件（no-arg 建構子、get/set、Serializable）、scope 的生命週期，以及邏輯什麼時候該從 SSJS 搬進 bean。"
pubDate: 2026-10-03T07:30:00+08:00
lang: zh-TW
slug: xpages-managed-beans
tags:
  - "XPages"
  - "Java"
  - "SSJS"
sources:
  - title: "Creating your first managed bean for XPages — Per Henrik Lausten"
    url: "https://per.lausten.dk/blog/2012/02/creating-your-first-managed-bean-for-xpages.html"
  - title: "Binding controls to managed beans — NotesSensei (Stephan Wissel)"
    url: "https://www.wissel.net/blog/2011/01/binding-controls-to-managed-beans.html"
  - title: "JSF - Managed Beans（JSF 底層 facility）— TutorialsPoint"
    url: "https://www.tutorialspoint.com/jsf/jsf_managed_beans.htm"
relatedJava: []
relatedSsjs: []
---

你把邏輯寫在 SSJS 的 script library 裡當膠水,一開始很順。但邏輯一多就開始難搞:沒有真正的型別、很難單元測試、把東西塞進 `viewScope`／`sessionScope` 還得擔心[序列化](/domino-news/posts/xpages-scope-variables)。

managed bean 就是這時候該登場的東西:**在 `faces-config.xml` 宣告一個 Java class,它就變成 SSJS 與 EL 裡的一個頂層變數**——用起來跟 `database`、`session` 一樣直接。

這篇講 managed bean 怎麼宣告、Java class 要滿足什麼、scope 怎麼決定它的壽命,以及邏輯什麼時候該從 SSJS 搬進 bean。

---

## 重點摘要

- **managed bean = 在 `faces-config.xml` 宣告的 Java class**,三個元素:`<managed-bean-name>`(名字)、`<managed-bean-class>`(完整類別名)、`<managed-bean-scope>`(scope)。
- **名字變成頂層變數**:宣告後,那個名字在 **SSJS 與 EL** 裡就像 `database`／`session`／`context` 一樣可直接用——`bean.someMethod()`、`#{bean.prop}`。
- **Java class 三要件**:① 無參數建構子(no-arg constructor);② 要曝出的屬性給 get/set;③ **view／session／application scope 的 bean 要 `implements Serializable`**(對應「Keep pages on disk」的序列化,跟 scope 變數同一條規則)。
- **scope 決定壽命**:`request`／`view`／`session`／`application`(還有 `none`)——bean 活在它的 scope 裡,scope 過了就自動被丟掉。
- **SSJS vs bean**:膠水、幾行邏輯留 SSJS;有狀態、有型別、要測試、會被多頁共用的邏輯,搬進 managed bean。

## managed bean 是什麼:一段 faces-config 宣告

managed bean 本質是 JSF 內建的 [managed bean facility](https://www.tutorialspoint.com/jsf/jsf_managed_beans.htm) 在 XPages 的用法。在 `WebContent/WEB-INF/faces-config.xml` 加一段([Per Lausten 的範例](https://per.lausten.dk/blog/2012/02/creating-your-first-managed-bean-for-xpages.html)):

```xml
<managed-bean>
  <managed-bean-name>helloWorld</managed-bean-name>
  <managed-bean-class>com.company.HelloWorld</managed-bean-class>
  <managed-bean-scope>session</managed-bean-scope>
</managed-bean>
```

- **name**:你在程式裡用的變數名。
- **class**:完整的 Java 類別名。
- **scope**:這個 bean 存活的範圍。

## Java class 要長什麼樣

就是一個標準 Java class,加三個要件:

```java
public class HelloWorld implements Serializable {
    private static final long serialVersionUID = 1L;
    public HelloWorld() { }                 // 無參數建構子
    private String someVariable;
    public String getSomeVariable() { return someVariable; }
    public void setSomeVariable(String v) { this.someVariable = v; }
}
```

- **無參數建構子**:JSF 要能自己 `new` 出它。
- **get/set**:你想從 XPage／SSJS 存取的屬性,給對應的 getter/setter。
- **`implements Serializable`**:只要 scope 是 view／session／application,bean 就會跟著頁面被序列化到磁碟(「Keep pages on disk」),不實作 `Serializable` 就會踩到跟[把不可序列化物件塞進 scope](/domino-news/posts/xpages-scope-variables) 一樣的雷。

## 從 SSJS／EL 存取:像 database 一樣

宣告好之後,那個名字就是個頂層物件。[Wissel 講得很清楚](https://www.wissel.net/blog/2011/01/binding-controls-to-managed-beans.html):「a new top level object demo is available for use in EL or SSJS in the same way as you can use database, session, context etc.」

```javascript
// SSJS：直接用名字呼叫 bean 的方法
demo.playTune();
var v = helloWorld.getSomeVariable();
```

```
<!-- EL：綁到控制項 -->
#{helloWorld.someVariable}
```

方法名你自己取、SSJS 直接呼叫;屬性用 `#{bean.prop}` 綁進控制項的 value。

## scope 決定壽命(跟 scope 變數同一套)

bean 的 `scope` 就是[那四個 XPages scope](/domino-news/posts/xpages-scope-variables)的生命週期:

- `request`:一個請求。
- `view`:一個頁面實例。
- `session`:一個瀏覽器 session——例中「multiple XPages will see the same content」,scope 過了「the object is automatically discarded」。
- `application`:整個應用,全使用者共用(記憶體與 thread-safety 要顧)。
- (`none`:不存進 scope,每次要用都新建。)

所以「這個 bean 該用哪個 scope」跟「這份資料該放哪個 scope」是同一個判斷:用最低夠用的。

## SSJS 還是 bean?

- **留 SSJS**:頁面事件的膠水、幾行判斷、呼叫一下後端——寫 script library 就好。
- **搬進 managed bean**:有狀態要保存(跨頁、跨請求)、需要真正的 Java 型別與集合、想寫單元測試、同一段邏輯多個 XPage 共用、或你已經在跟序列化與 scope 纏鬥時。bean 給你一個乾淨、有型別、可測試的落點,而且從 SSJS 用起來跟內建物件一樣順。

## 同類別在其他語言

managed bean 是 **XPages／JSF 的建構**,横跨 Java 與 SSJS:

- **Java**:bean 本體就是 Java——這也是把邏輯從 SSJS 搬到強型別 Java 的正規途徑。
- **SSJS**:不是被取代,而是**消費端**——它像用 `database` 一樣用 bean。膠水留 SSJS、重邏輯進 bean 是常見分工。
- **LotusScript**:沒有對應概念。LS agent 是「跑一支程式」的程序式模型,沒有「宣告一個有 scope、被框架管生命週期的物件、讓別處用名字取用」這回事。

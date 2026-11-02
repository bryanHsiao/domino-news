---
title: "Domino 郵件免責聲明:為什麼最好在 client 端加"
description: "很多公司要在每封外寄信末尾自動補一段法律免責聲明。Domino 內建就能做,但設定橫跨兩份文件、而且有個大坑:在伺服器端加,會弄壞已經簽章或加密的信。這篇講兩份文件怎麼分工(免責聲明的文字、位置、格式放在 mail policy settings 文件;伺服器的開關在 Configuration Settings 文件的 Router/SMTP → Message Disclaimers 分頁)、只會加在外寄 SMTP 信(不加進站信)、位置可選 append 或 prepend、由 client 或伺服器或兩者加,以及最關鍵的一點:伺服器是在訊息簽章「之後」才加免責聲明,所以會破壞 S/MIME 簽章與加密——官方建議盡量用 Notes client 加(client 在簽章「之前」加,簽章仍然有效),這對有簽章需求、或會寄中文等多位元組字集的環境尤其重要。最後:policy 改動靠 AdminP 套用(預設每 12 小時,或 tell adminp process mail policy 立即)。"
pubDate: 2026-11-02T07:30:00+08:00
lang: zh-TW
slug: domino-message-disclaimers
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Setting up and using message disclaimers(兩份文件分工、只加外寄 SMTP、client/server/兩者、伺服器簽章後加會壞 S/MIME 故建議 client 加、AdminP 套用)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_settingupandusingmessagedisclaimers_t.html"
  - title: "Creating a mail policy settings document(免責聲明的文字、位置 append/prepend、格式放在 mail policy settings 文件)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.0/admin/conf_creatingamailpolicysettingsdocument_t.html"
  - title: "Adding a disclaimer to outgoing iNotes messages(iNotes/client 端加免責聲明)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_addingadisclaimertooutgoingmessages_t.html"
relatedJava: []
relatedSsjs: []
---

很多公司有這個需求:每封**往外寄**的信,末尾自動補一段法律免責聲明(「本郵件僅供收件人使用…」那種)。Domino 內建就能做——但它的設定**橫跨兩份文件**,而且有一個大坑:**在伺服器端加,會弄壞已經簽章或加密的信**。這篇把兩份文件怎麼分工、以及為什麼官方建議「能用 client 加就用 client 加」講清楚。

---

## 重點摘要

- **兩份文件分工**:免責聲明的**文字、位置、格式**放在 **mail policy settings 文件**(就是上次[policy 那篇](/domino-news/posts/domino-policies/)講的那種 settings 文件);**伺服器的總開關**在 **Configuration Settings 文件 → Router/SMTP → Message Disclaimers** 分頁。
- **只加外寄**:官方——**「Message disclaimers are not added to incoming SMTP messages; they are only added to outgoing SMTP messages.」** 進站信不會被加。
- **位置與格式**:位置可選 **Append**(加在信**末**)或 **Prepend**(加在信**首**);格式可 plain text 或 HTML。
- **誰來加**:可由 **Notes client**、**伺服器**、或**兩者**加。兩者都開時,通常**由 client 加**(比較快);兩者都關就不加。
- **大坑(最重要)**:**伺服器是在訊息「簽章之後」才加免責聲明**,所以會**破壞 S/MIME 簽章與加密**——官方直接建議:**「Whenever possible, use the Notes client to add disclaimers instead of adding them from the server.」** client 在**簽章之前**加,簽章仍然有效。
- **policy 生效**:改了 mail policy 要等 **AdminP** 套用,**預設每 12 小時**跑一次;要立刻套用用 `tell adminp process mail policy`。

## 兩份文件怎麼分工

免責聲明這件事,Domino 拆成**兩份文件**([官方:設定與使用 message disclaimers](https://help.hcl-software.com/domino/11.0.1/admin/conf_settingupandusingmessagedisclaimers_t.html)):

- **mail policy settings 文件**:放**免責聲明的內容**——你在 **Disclaimer text** 欄位打的那段文字,就是會被加進信裡的免責聲明。位置(append/prepend)與格式(plain/HTML)也在這份文件的 Message Disclaimers 分頁設([官方:建立 mail policy settings 文件](https://help.hcl-software.com/domino/11.0.0/admin/conf_creatingamailpolicysettingsdocument_t.html))。
- **Configuration Settings 文件**:放**伺服器的開關**——官方:「You enable and disable message disclaimers for the server using the server Configuration Settings document」,在 **Router/SMTP → Message Disclaimers** 分頁。

所以「文字放哪、要不要加」是分開的:內容與位置在 policy 文件,伺服器開不開在 Configuration Settings 文件。

## 只加外寄、位置可選

兩個基本行為先記住:

- **只加外寄 SMTP 信**:官方明講進站信不會被加——免責聲明是給「寄出去給外部」的信用的,不是給你收到的信。
- **append 或 prepend**:**Append** 把免責聲明放信**末**(最常見)、**Prepend** 放信**首**;格式可純文字或 HTML。

## 誰來加:client、伺服器、還是兩者

免責聲明可以由 **Notes client**、**伺服器**、或**兩者**加([官方:在 iNotes 外寄信加免責聲明](https://help.hcl-software.com/domino/11.0.1/admin/conf_addingadisclaimertooutgoingmessages_t.html)也是 client 這一側):

- **兩者都開**:通常**由 client 加**(較快的路徑),不會重複加。
- **只開伺服器**:由伺服器加;**只開 client**:由 Notes 加。
- **兩者都關**:任何信都不會被加免責聲明。

## 大坑:伺服器端加會弄壞簽章

這是整篇最要記的一點。**伺服器加免責聲明的時機,是在訊息「已經被簽章」之後**——等於在簽好名的信上又改了內容,於是**簽章就不再有效、加密的信也會出問題**。(技術上伺服器還是**加得上去**——官方說它連簽章/加密的信都能加;問題是加完之後那個簽章就壞了。)官方寫得很明白:**「S/MIME signed and encrypted messages are not handled well by Notes」**,並直接建議:

> **「Whenever possible, use the Notes client to add disclaimers instead of adding them from the server.」**

為什麼 client 加就沒事?因為 **client 是在簽章「之前」就把免責聲明加好**,之後才簽章——簽章涵蓋了已含免責聲明的完整內容,所以**簽章仍然有效**。這是「盡量用 client 加」的根本原因:不是偏好問題,是**伺服器端加會破壞簽章**。

## 多語字集:中文環境要注意

還有一個對**會寄中文(或其他多位元組字集)**的環境特別相關的點:**伺服器端**加免責聲明時,字集由伺服器的 Multilingual Internet mail 設定決定——用 **Use Best Match** 時,表達不了的字可能變成 **`?`** 之類的替代字;用 **Use Unicode (UTF-8)** 則會把訊息與免責聲明都重新編成 UTF-8。而 **client 端**加時,外寄字集是由 Notes client 決定的,**就沒有這個字集問題**——又是一個「用 client 加」比較省心的理由。

## policy 什麼時候生效

免責聲明的文字住在 mail policy settings 文件裡,所以改了之後**不是立刻生效**:要等 **Administration Process(AdminP)** 把 policy 變更套出去,**預設每 12 小時**跑一次。等不及就在主控台打 **`tell adminp process mail policy`** 立刻套用。

## 小結

- **兩份文件**:文字/位置/格式在 mail policy settings 文件;伺服器開關在 Configuration Settings 文件的 Router/SMTP → Message Disclaimers 分頁。
- **只加外寄**:進站 SMTP 信不加;位置 append(末)/prepend(首),格式 plain/HTML。
- **誰加**:client / 伺服器 / 兩者;兩者開時通常 client 加,都關則不加。
- **大坑**:伺服器在簽章**後**加 → 破壞 S/MIME 簽章/加密;官方建議盡量用 **client** 加(簽章前加、仍有效)。
- **多語字集**:伺服器端加要注意 Best Match(可能變 `?`)vs UTF-8;client 加沒這問題。
- **生效**:改 mail policy 靠 AdminP 套用,預設每 12 小時;`tell adminp process mail policy` 可立即。

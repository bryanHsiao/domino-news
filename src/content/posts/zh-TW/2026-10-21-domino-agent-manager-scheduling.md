---
title: "排程 agent 為什麼沒跑、或跑太慢"
description: "你排了一個 agent 每小時跑,結果它沒跑、跑很慢、或跑到一半被砍——多半不是 agent 本身壞了,是 Agent Manager(AMgr)這個 server task 的設定在管它。這篇講 AMgr 怎麼排程:Server 文件的日/夜兩個時段(預設日 8AM–8PM、夜 8PM–8AM)以及最常見的陷阱——兩段之間若留了 gap,那段時間 AMgr 根本不跑排程 agent;Max concurrent agents(1–10,預設日 1 夜 2)與 Max LotusScript/Java execution time(預設日 10 分、夜 15 分,超過就被砍並記進 Agent Log);文件/郵件觸發為什麼不是即時(AMgr_DocUpdateEventDelay、AMgr_DocUpdateAgentMinInterval 預設 30 分等 notes.ini 節流);「Agent scheduling is paused」是什麼意思;以及用 Tell Amgr Schedule / Tell Amgr Status 從主控台查「它到底排了沒」。最後給一張「排程 agent 沒跑」的逐項排查清單。"
pubDate: 2026-10-21T07:30:00+08:00
lang: zh-TW
slug: domino-agent-manager-scheduling
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Server Tasks - Agent Manager tab(日/夜時段、Max concurrent agents、Max LS/Java execution time、Refresh agent cache 的預設值與 gap 行為)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/othr_servertasksagentmanagertab_r.html"
  - title: "Improving Agent Manager performance(並行=Agent Executive、AMgr_SchedulingInterval/DocUpdateEventDelay/DocUpdateAgentMinInterval 等 notes.ini、Agent scheduling is paused)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/tune_improvingagentmanagerperformance_c.html"
  - title: "Agent Manager Tell commands(Tell Amgr Schedule / Tell Amgr Status 等主控台診斷指令)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_agentmanagertellcommands_r.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-agent-manager-scheduling.webp"
coverStyle: "minimalist-mono"
---

你排了一個 agent 每小時跑,結果它**沒跑**、**跑很慢**、或**跑到一半被砍**。第一直覺是「agent 寫壞了」,但在伺服器上,排程 agent 的生死其實掌握在另一個 server task 手裡——**Agent Manager(AMgr)**。它決定什麼時段能跑、同時能跑幾個、每個最多跑多久。看懂 AMgr 的設定,「為什麼沒跑」通常幾分鐘就查得出來。

---

## 重點摘要

- **AMgr 是什麼**:負責在伺服器上執行**排程(scheduled)與事件觸發(event-triggered)** agent 的 server task。它的**排程器週期性輪詢**(`AMgr_SchedulingInterval` 預設 **1 分鐘**跑一次看誰到點),agent 按你設定的**間隔**跑、不是精準到某個時刻;官方提醒排太密(例如每 5 分鐘)會拖效能。
- **日/夜兩個時段**:AMgr 的設定分**daytime / nighttime** 兩套,預設 **日 8:00 AM–8:00 PM、夜 8:00 PM–8:00 AM**。**最常見的陷阱**:兩段若沒接好、中間留了 **gap**,那段時間 AMgr **根本不跑排程 agent**(官方例:日從 8AM 開始、夜在 5AM 結束,則 **5AM–8AM 之間沒有 agent 會跑**)。
- **並行數**:**Max concurrent agents** 1–10,預設**日 1、夜 2**;每個並行名額由一個 **Agent Executive** 執行。排太多、跑不完,主控台會出現 **「AMgr: Agent scheduling is paused」**,直到佇列消化完才再排。
- **執行時間上限**:**Max LotusScript/Java execution time** 預設**日 10 分、夜 15 分**;超過就被**終止**、並記進 **Agent Log**——「跑到一半不見了」常常就是這個。
- **診斷**:主控台 `Tell Amgr Schedule`(列出今天排了哪些)、`Tell Amgr Status`(佇列與設定快照)。
- **Web agent 是另一回事**:瀏覽器觸發的 agent 由 **Domino Web Engine** 的「Run Web agents concurrently?」(notes.ini `DominoAsynchronizeAgents`,預設關)控制,**跟排程 agent 的設定無關**。

## AMgr 在做什麼

**Agent Manager(AMgr)** 是負責跑 agent 的 server task——具體說是**排程型**(每小時/每天/依間隔)與**事件觸發型**(新信到、文件變更)的 agent。它的運作是**輪詢式**的:週期性地看哪些 agent 到點了、把它們排進佇列、再交給執行緒去跑。

兩個觀念先建立:AMgr 的排程器是**週期性輪詢**的(`AMgr_SchedulingInterval` 預設 **1 分鐘**跑一次),agent 按你設的**間隔**跑、而不是精準到某個鐘點;官方也提醒**排太密(例如每 5 分鐘)會拖累伺服器效能**,所以別把排程 agent 當即時工具。至於**文件建立/修改觸發**的 agent,也**不是即時**——依伺服器負載,通常有 **5 到 30 分鐘**的延遲。

## 最常見的陷阱:日/夜時段的 gap

AMgr 的設定在 **Server 文件 → Server Tasks → Agent Manager 分頁**,而且**分日、夜兩套**([官方欄位表](https://help.hcl-software.com/domino/12.0.0/admin/othr_servertasksagentmanagertab_r.html)):

- **Daytime / Nighttime 時段**:預設 **日 8:00 AM–8:00 PM、夜 8:00 PM–8:00 AM**——預設是**剛好接起來、沒有空隙**的。
- **但如果你改了時間、兩段沒接好**:官方講得很直接——中間那段 gap,**AMgr 不會跑排程 agent**。官方的例子:日從 8:00 AM 開始、夜在 5:00 AM 結束,那麼 **5:00 AM 到 8:00 AM 之間,沒有任何 agent 會跑**。

這就是「我的 agent 排了但某個時段就是不動」最常見的原因之一:不是它壞了,是它落在兩個時段的 gap 裡。排查時,**先確認日/夜時段的結束/開始時間有沒有對齊**。

## 並行數與執行時間上限

同一分頁還有兩組關鍵的日/夜數字:

- **Max concurrent agents**:同時能跑幾個 agent,**1–10**,預設**日 1、夜 2**。每個並行名額由一個 **Agent Executive** 負責。這也解釋了為什麼白天 agent 容易「排隊」——預設只有 1 個能同時跑。如果 agent 排得比跑得快,主控台會出現 **「AMgr: Agent scheduling is paused」**,在佇列消化完之前不再排新的。
- **Max LotusScript/Java execution time**:單一 LS/Java agent 最長能跑多久,預設**日 10 分、夜 15 分**。**超過就被終止**,而且這個終止會**記進 Agent Log**。所以「agent 跑到一半就不見了、也沒報錯」,第一個要看的就是它是不是超時被砍——答案通常就在 Agent Log 裡。

(分頁上還有 **Refresh agent cache**,預設 **12:00 AM**,控制 AMgr 每天什麼時候重建當日的 agent 快取;以及 **Max % busy before delay**,那個只對 R4.6 以前的伺服器有效,現在可以不管。)

## 事件/排程為什麼不是即時:notes.ini 節流

事件觸發 agent「新信到就跑/文件一改就跑」聽起來像即時,其實 AMgr 有一組 notes.ini 在**刻意節流**,避免一點風吹草動就狂跑 agent([官方:調校 Agent Manager](https://help.hcl-software.com/domino/11.0.1/admin/tune_improvingagentmanagerperformance_c.html)):

- **`AMgr_SchedulingInterval`**:排程器多久跑一次,預設 **1 分鐘**(1–60)。
- **`AMgr_DocUpdateEventDelay`**:文件更新事件觸發後,延遲多久才跑,預設 **5 分鐘**。
- **`AMgr_DocUpdateAgentMinInterval`**:同一個「文件更新」agent **兩次執行之間的最小間隔**,預設 **30 分鐘**——這常是「我改了文件、agent 怎麼沒馬上跑」的真正答案:它被這個最小間隔壓著。
- **`AMgr_NewMailEventDelay`** 預設 1 分鐘、**`AMgr_NewMailAgentMinInterval`** 預設 0,是新信事件那一組的對應設定。

看到事件觸發 agent「反應很慢」,先別改 agent,先看這幾個值。

## 怎麼查:Tell Amgr

與其猜,不如直接問 AMgr([官方:Agent Manager Tell 指令](https://help.hcl-software.com/domino/11.0.1/admin/admn_agentmanagertellcommands_r.html)):

- **`Tell Amgr Schedule`**:列出**今天**所有排定要跑的 agent。你的 agent 沒出現在這裡,就表示它根本沒被排進去——該回頭查它是不是被停用、或所在資料庫停了背景 agent。
- **`Tell Amgr Status`**:AMgr 佇列的快照,外加它從 Server 文件讀到的設定。

## 「排程 agent 沒跑」逐項排查

把上面的拼起來,一個 agent「沒跑」時依序看:

1. **它被啟用了嗎?** 所在資料庫有沒有停掉背景 agent?
2. **`Tell Amgr Schedule` 有列到它嗎?** 沒有 → 沒被排進去,回到第 1 點。
3. **現在這個時間落在日/夜 gap 裡嗎?** 兩段沒接好的話,gap 內不跑。
4. **是不是在排隊?** 白天 Max concurrent 預設 1,量大就會塞;看有沒有「scheduling is paused」。
5. **是不是超時被砍?** 去 **Agent Log** 看有沒有超過 Max execution time 的終止紀錄。
6. **事件觸發反應慢?** 看 `AMgr_DocUpdateAgentMinInterval`(預設 30 分)等節流值。

## 小結

- **AMgr** 跑排程與事件觸發 agent,排程器預設 1 分鐘輪詢一次;排太密(如每 5 分鐘)官方說會傷效能;文件觸發不是即時、依負載有 5–30 分延遲。
- **日/夜時段**預設日 8AM–8PM、夜 8PM–8AM;**兩段沒接好的 gap 內不跑**——最常見的「某時段不動」原因。
- **並行**:Max concurrent 1–10(日 1/夜 2),排不贏會「scheduling is paused」。
- **執行上限**:Max LS/Java execution time 日 10 分/夜 15 分,超過被砍、記 Agent Log。
- **節流**:`AMgr_DocUpdateAgentMinInterval` 預設 30 分等 notes.ini 決定事件觸發的反應速度。
- **診斷**:`Tell Amgr Schedule`/`Status`;Web agent 由 Domino Web Engine 另管、與排程 agent 無關。

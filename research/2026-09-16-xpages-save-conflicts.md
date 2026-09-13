---
slug: xpages-save-conflicts
title: "XPages 存檔衝突（混用 datasource 與後端 Document）"
lang: [zh-TW, en]
pubDate: 2026-09-16
status: draft（draft:true；R12/14.5.1 實測結論待補後才移除 draft、正式排程）
tags: [Domino Designer, XPages, Tutorial]
requester: 使用者 (bryan，看 assono 那篇覺得有趣、想確認 R12/14.5.1 現況)
author_model: claude-opus-4-8
review_model: (待跑，實測補完後)
created: 2026-09-13
updated: 2026-09-13
---

# 研究軌跡 — xpages-save-conflicts

承 [[xpages-attachment-multi-delete]]（那篇警告「別掉到後端 `getDocument().remove()`，會撞存檔衝突」）。使用者看了 assono
那篇 2013 的存檔衝突文覺得有趣，想寫一篇——**原創價值＝那是老文，R12/14.5.1 現在還會不會這樣，我們實測**。

## 目前狀態（重要）

- **雙語草稿已寫**（`_pending`，且 `draft: true`）——**不依賴 R12 結果的部分**（hook「單人卻跳存檔衝突」、官方機制、assono 主菜致謝、成因/避法）都寫好了。
- **「R12 / 14.5.1 還會這樣嗎」那段是填空**（HTML 註解佔位）——**待使用者用下面的重現 XPage 在兩台各跑一次**，把「有沒有生 conflict、要不要 sleep、兩版是否一致」填進去、補截圖。
- 使用者當下沒空，晚點做。已放 spawn_task 待辦卡片 + 本 sidecar 保存重現碼。

## 官方骨幹（已 WebFetch 第一手驗）

- **存檔衝突機制**（[admin doc](https://help.hcl-software.com/domino/11.0.0/admin/admn_replicationorsaveconflicts_c.html)）：
  「The document edited and saved the most times becomes the main document; other documents become Replication or Save
  Conflict documents.」「Domino uses the `$Revisions` field, which tracks the date and time of each document editing
  session…」→ 判定跟「幾個人」無關，只看「是否接在磁碟現版之後」。
- **`concurrencyMode`**（[dominoDocument data source doc](https://help.hcl-software.com/dom_designer/12.0.2/xpageuser/wpd_controls_pref_data.html)）：
  「Specifies the handling of concurrent updates if multiple users update a document at the same time.」值＝
  `createResponse` / `fail` / `exception` / `force`。
- **assono（社群, 2013）**：混用 `dominoDocument` save + 後端 `Document` save，中間 `Thread.sleep` 穩定重現；解＝少存那次
  / 只用後端。已在文中明標「社群、2013」並致謝。
- NotebookLM 未再嘗試（上次 overlay/登入問題）；此篇官方骨幹用 WebFetch 直驗已足。

## 重現碼（保存：`conflictTest.xsp`，兩台跑同一支）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xp:view xmlns:xp="http://www.ibm.com/xsp/core">
  <xp:this.data>
    <xp:dominoDocument var="doc" formName="fmConflictTest" />
  </xp:this.data>
  <xp:panel style="max-width:640px;font-family:-apple-system,system-ui,sans-serif;padding:16px">
    <p style="font-weight:700;font-size:16px">存檔衝突重現測試</p>
    <xp:messages style="color:#c00" />
    <p>Note 欄位：<xp:inputText value="#{doc.Note}" /></p>
    <xp:button value="跑重現（save → 改後端 → 再 save）" id="btnRepro" style="background:#0b6b60;color:#fff;border:none;border-radius:8px;padding:10px 18px;cursor:pointer">
      <xp:eventHandler event="onclick" submit="true" refreshMode="complete">
        <xp:this.action><![CDATA[#{javascript:
          try {
            doc.save();
            java.lang.Thread.sleep(3000);
            var backend = doc.getDocument();
            backend.replaceItemValue("Note", "back end " + new java.util.Date());
            backend.save();
            java.lang.Thread.sleep(3000);
            doc.save();
            requestScope.msg = "跑完。UNID = " + doc.getDocument().getUniversalID();
          } catch (e) { requestScope.msg = "例外：" + e.toString(); }
        }]]></xp:this.action>
      </xp:eventHandler>
    </xp:button>
    <xp:button value="檢查衝突（掃 $Conflict）" id="btnCheck" style="margin-left:8px;padding:10px 18px;cursor:pointer">
      <xp:eventHandler event="onclick" submit="false" refreshMode="complete">
        <xp:this.action><![CDATA[#{javascript:
          var dc = database.getAllDocuments();
          var conflicts = 0, total = 0;
          var d = dc.getFirstDocument();
          while (d != null) { total++; if (d.hasItem("$Conflict")) { conflicts++; } var nd = dc.getNextDocument(d); d.recycle(); d = nd; }
          requestScope.msg = "全庫 " + total + " 份，帶 $Conflict 的 " + conflicts + " 份。";
        }]]></xp:this.action>
      </xp:eventHandler>
    </xp:button>
    <p style="margin-top:12px;color:#0b6b60;font-weight:600"><xp:text value="#{requestScope.msg}" /></p>
  </xp:panel>
</xp:view>
```

## 待辦 checklist（finalize 時）

- [ ] 使用者在 **12.0.2** 與 **14.5.1** 各跑 `conflictTest.xsp`：有無生 conflict？要不要 sleep？兩版一致否？→ 填「R12/14.5.1 還會這樣嗎」段 + 截圖
- [ ] 填完後**移除 `draft: true`**、確認 pubDate（若已過就改今日或 Path-B 直發）
- [ ] 雙語 build 驗證（暫拷 posts/）
- [ ] inline-link diversity（目前 3 相異 URL：admin save-conflict / data-source concurrencyMode / assono，各 1~2 次；加截圖不影響）
- [ ] humanizer-zh-tw 自審
- [ ] 獨立 fact-check subagent
- [ ] 交叉連 [[xpages-attachment-multi-delete]] 已在文中

## 異動日誌

- 2026-09-13 WebFetch 驗官方（save-conflict $Revisions 機制、concurrencyMode 值）、雙語草稿（R12/14.5.1 段留空）、
  重現 XPage、sidecar；加 `draft: true` 安全存底。**待使用者實測兩版後 finalize**。（Opus 4.8）

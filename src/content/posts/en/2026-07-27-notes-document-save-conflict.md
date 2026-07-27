---
title: "Save(True, False) or Save(False, True): the Two Booleans That Decide Who Loses Data"
description: "Two processes touch the same document — a web agent and a user with the form open, or a scheduled agent and a replica. One save wins, the other's edit either vanishes or turns into a mysterious $Conflict. Which one happens is decided entirely by the two booleans you passed to NotesDocument.Save. A field report on force and createResponse: last-write-wins vs the conflict document the replicator makes, why Save(True, False) quietly loses data, and how to pick on purpose."
pubDate: 2026-07-27T07:30:00+08:00
lang: en
slug: notes-document-save-conflict
tags:
  - "LotusScript"
sources:
  - title: "Save (NotesDocument, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html"
  - title: "NotesDocument (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "MakeResponse (NotesDocument, LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html"
relatedJava: ["Document"]
relatedSsjs: ["Document"]
cover: "/covers/notes-document-save-conflict.webp"
coverStyle: "minimalist-mono"
---

A scheduled agent walks a view and updates order documents. While it runs, a user has one of those orders open in the client and clicks Save. Both write the same note. One of the two writes silently disappears — or a `$Conflict` document quietly appears in the view and nobody notices for a week. Which of those two outcomes you get isn't luck. It's the two booleans you passed to [`NotesDocument.Save`](/domino-news/en/posts/notes-document), and most code passes them without thinking.

This is a field report on `Save(force, createResponse)` — the truth table behind concurrent writes, why the common `Save(True, False)` is a data-loss decision dressed up as a convenience, and how to choose the pair on purpose.

---

## TL;DR

- `Save`'s first two parameters are `force` and `createResponse`, and together they decide what happens when the note changed underneath you between open and save.
- **`Save(True, False)`** — force. "The last version of the document that was saved wins; the earlier version is discarded." The other write is gone, silently. No error, no conflict doc.
- **`Save(False, True)`** — don't force, make a response. If the note changed under you, your save "becomes a response to the original document — this is what the replicator does when there's a replication conflict." Both versions survive as a `$Conflict`.
- **`Save(False, False)`** — don't force, don't respond. The save is cancelled; you have to detect that and decide what to do, or your change is lost too.
- Pass them explicitly. The right pair depends on whether losing the *other* edit or keeping *both* is the lesser evil for that document.

## The two booleans, precisely

The [`Save`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html) documentation is unusually blunt about the collision case, so read it literally.

`force` (first parameter): "If True, the document is saved even if someone else edits and saves the document while the script is running. The last version of the document that was saved wins; the earlier version is discarded." If False, and someone else saved in the meantime, the second parameter takes over.

`createResponse` (second parameter): "If True, the current document becomes a response to the original document (this is what the replicator does when there's a replication conflict). If the force parameter is True, the createResponse parameter has no effect."

So the collision behaviour is a small truth table:

| Call | If the note changed underneath you |
|---|---|
| `Save(True, False)` | Your version overwrites theirs. Their edit is discarded, silently. |
| `Save(False, True)` | Your version is saved as a **response** conflict doc; both survive. |
| `Save(False, False)` | The save is **cancelled**; your edit doesn't land unless you handle it. |

Note the third column of `createResponse` is dead when `force` is True — that's why `Save(True, True)` is just `Save(True, False)` with a misleading second argument.

## Why Save(True, False) is the dangerous default

`Save(True, False)` is what most examples reach for, because it "just works" — no error, no cancelled save, the write always lands. That's exactly the problem. *Always landing* means it always overwrites, and the doc it overwrites might carry an edit a user made two seconds ago. There's no signal that anything was lost; the discarded version doesn't go to a conflict, doesn't raise an error, doesn't leave a trace. On a low-contention document it's fine for years. On a hot document — an order many people touch, a counter, a status field a web form and an agent both write — it's a silent data-loss machine.

Reach for `Save(True, False)` only when *your* write is authoritative by design: you computed the field from scratch and genuinely want to clobber whatever was there. If the document holds user-entered data that another writer might also have changed, forcing is the wrong call.

## Save(False, True): let the conflict be visible

`Save(False, True)` trades silence for a visible artifact. When your write collides, it doesn't win and it doesn't vanish — it lands as a [response document](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html) flagged with `$Conflict`, exactly the mechanism the replicator uses for two replicas that both changed a note. Both versions are now in the database, the conflict one nested under the main one, and a human (or a cleanup agent) can reconcile them.

That's the right choice when losing an edit is worse than surfacing a mess. The cost is that `$Conflict` documents pile up if nobody watches for them, and they can confuse view logic that doesn't expect responses. You can soften this at the design level: a form's **Merge Replication/Save Conflicts** property auto-merges conflicts whose edits touched *different* fields, so only genuine same-field collisions become visible `$Conflict` docs. Turning that on is often the single highest-leverage change for a document that conflicts a lot.

## Save(False, False) and handling the cancel

`Save(False, False)` is the strict option: don't force, don't make a conflict — if the note moved under you, the save is cancelled. The trap is treating `Save` as fire-and-forget. If you call it and walk away, a cancelled save means your change is quietly gone, same net result as being on the losing side of a force. The honest pattern is to treat a collision as a retry: re-fetch the [document](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html), re-apply your change to the fresh copy, and save again — a small loop that turns "I lost the race" into "I merged my change into the current version." For a back-end writer that must not lose data and must not spawn conflicts, that re-read-and-retry loop is the correct shape, and it's worth the few extra lines.

## What about Java and SSJS?

This one ports cleanly, which is rare. The Java `Document.save(boolean force, boolean createResponse)` takes the same two booleans with the same collision semantics, and SSJS `document.save()` in XPages sits on the same back-end call. So the truth table above is language-independent — the decision about whether to overwrite, branch to a conflict, or cancel is a property of the document store, not of the API surface. If you're moving a save-heavy routine between LotusScript, Java, and SSJS, the one thing to carry across isn't syntax; it's the deliberate choice of those two booleans.

---
title: "@Prompt and @PickList: Formula Dialogs to Ask the User — Client-Only, Not on the Web"
description: "Want a button to pop 'Are you sure you want to delete?', or let the user pick a customer from a view? In Formula that's @Prompt and @PickList. @Prompt has a whole set of styles (Ok / YesNo / OkCancelList / Password / LocalBrowse…); @PickList opens a modal to select documents from a view and returns a column value, or to pick names from the Directory. But run the same formula on the web, or in a scheduled agent, and it silently does nothing — HCL states plainly, 'You cannot use this function in Web applications.' This covers the styles and return values, the client-only boundary, and which to use."
pubDate: 2026-10-02T07:30:00+08:00
lang: en
slug: formula-prompt-picklist
tags:
  - "Formula"
  - "Notes UI"
sources:
  - title: "@Prompt (Formula Language) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PROMPT.html"
  - title: "@PickList (Formula Language) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PICKLIST.html"
  - title: "@Command (Formula Language) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/formula-prompt-picklist.webp"
coverStyle: "paper-craft"
---

You want a button to pop "Are you sure you want to delete?" for a Yes/No, or a list to let the user pick one customer record from a view — in Formula those are `@Prompt` and `@PickList`.

They're handy, but there's a boundary people trip on: **these are front-end client dialogs, so on the web or in a scheduled agent they silently do nothing.** Both function pages say it in black and white: "You cannot use this function in Web applications."

This piece covers `@Prompt`'s styles, how `@PickList` selects documents from a view, and the client-only line.

---

## TL;DR

- **`@Prompt` — ask, confirm, choose**: HCL calls it "useful for prompting a user for information and determining a course of action based on the user's input." Many styles: `[Ok]`, `[YesNo]`, `[YesNoCancel]`, `[OkCancelEdit]`, `[OkCancelList]`, `[OkCancelCombo]`, `[OkCancelEditCombo]`, `[OkCancelListMult]`, `[Password]`, `[LocalBrowse]`, `[ChooseDatabase]`. Return value depends on the style (`[YesNo]` returns 1/0).
- **`@PickList` — a modal to pick documents or names**: `[Custom]` selects one or more documents from a view you specify and **returns a column value**; `[Name]` picks from the Domino Directory; also `[Room]` / `[Resource]` / `[Folders]`. `[Single]` restricts to single selection; it returns a **text list**.
- **The client-only boundary**: both "cannot be used in Web applications"; `@Prompt` also **does not work in column, selection, mail agent, or scheduled agent** formulas. UI dialogs belong in front-end events only.
- **Pairing**: once the dialog returns the user's choice, hand the actual UI action to [`@Command` / `@PostedCommand`](/domino-news/en/posts/formula-command-postedcommand).

## @Prompt: ask, confirm, choose

The [official @Prompt](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PROMPT.html) syntax:

```
@Prompt( [ style ] : [NoSort] ; title ; prompt ; defaultChoice ; choiceList ; filetype )
```

Common styles:

| Style | What it does | Returns |
|---|---|---|
| `[Ok]` | show a message, one OK button | 1 |
| `[YesNo]` | Yes / No | 1 or 0 |
| `[YesNoCancel]` | Yes / No / Cancel | 1 / 0 / -1 |
| `[OkCancelEdit]` | text input box | the entered string |
| `[OkCancelList]` | single select from a list | the chosen value |
| `[OkCancelCombo]` | single select from a dropdown | the chosen value |
| `[OkCancelEditCombo]` | dropdown or type your own | chosen or typed value |
| `[OkCancelListMult]` | multi-select from a list | a text list |
| `[Password]` | password entry (hidden) | the entered string |
| `[LocalBrowse]` | local file browser | selected file name |

Example — a confirmation:

```
@If(@Prompt([YesNo]; "Confirm"; "Submit this request?") = 1;
    @Command([FileSave]);
    "")
```

## @PickList: pick documents from a view, or names from the Directory

`@PickList` opens a modal. HCL defines it as showing "A view you specify from which the user can select one or more documents. @PickList returns a column value from the selected document(s)," or "A dialog box, displaying information from all available Domino Directories."

The [official @PickList](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PICKLIST.html) two main forms:

```
@PickList( [CUSTOM] : [SINGLE] ; server : file ; view ; title ; prompt ; column ; categoryname )
@PickList( [NAME] : [SINGLE] [; selectedoptions ] )
```

- `[CUSTOM]`: select documents from `view` in the `server:file` DB, returning column `column` (1-based).
- `[NAME]`: pick from the Domino Directory.
- `[SINGLE]`: single selection only (omit for multi-select).
- Returns: a **text list** of the selected documents' column values.

Example — let the user pick from the "Customers" view, returning column 1:

```
sel := @PickList([CUSTOM] : [SINGLE]; "" : "crm.nsf"; "Customers";
                 "Choose a customer"; "Pick one"; 1);
@If(sel = ""; @Return(""); "");
FIELD Customer := sel
```

## Client-only — keep them off the web and out of scheduled agents

This is the boundary people miss. Both function pages carry the same line: **"You cannot use this function in Web applications."** And `@Prompt` adds one more restriction: it **doesn't work in column, selection, mail agent, or scheduled agent** formulas.

The reason is direct: these are dialogs that need **a person sitting at the Notes client** to respond. Put them in something that runs in the background or on a schedule (no UI, no one to click) and there's nothing to pop — so they silently do nothing or error. To "ask the user" on the web or in the background, use another mechanism (a form or XPages dialog on the web; background logic shouldn't prompt at all — use a default or a parameter).

## Which to use

- **Just confirm, or show a message** → `@Prompt([YesNo])` / `[Ok]`.
- **Ask for a line of text** → `@Prompt([OkCancelEdit])`; masked → `[Password]`.
- **Choose from fixed options** → `@Prompt([OkCancelList])` / `[OkCancelCombo]`; multi → `[OkCancelListMult]`.
- **Pick one or more documents from existing data (a view)** → `@PickList([Custom])` — it returns the column value directly, no need to build a choiceList yourself.
- **Pick a person** → `@PickList([Name])`.
- After you have the choice, hand the UI action to [`@Command` / `@PostedCommand`](/domino-news/en/posts/formula-command-postedcommand) — mind the execution order covered there.

## What about LotusScript and SSJS?

`@Prompt` / `@PickList` are a **Formula mechanism for Notes front-end dialogs**:

- **LotusScript**: the counterparts are `NotesUIWorkspace`'s `Prompt`, `PickListStrings` / `PickListCollection`, and `DialogBox` — also front-end-only, likewise unavailable in a server agent.
- **SSJS / web**: there's no `@Prompt`. To "ask the user," you build it yourself — an XPages dialog control, or client-side JavaScript — not this Formula dialog set.

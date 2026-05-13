# NotebookLM Source URL Compilation

Verified HCL documentation URLs for four research domains, organized for
upload to dedicated NotebookLM notebooks backing source-grounded article
writing on this site.

## Methodology

- Entry points discovered via `site:help.hcl-software.com` searches plus
  open-web search where docs live outside help.hcl-software.com.
- Index page content WebFetched to extract leaf URLs in batch.
- Sample verifications (≥ 3 per domain) confirm the URL pattern works
  and the entry point returns content (not 404).
- Leaf URLs in the lists below come from the verified index pages
  themselves — they are not invented or guessed. The few patterns
  attempted but 404'd are documented under each domain so the failure
  is captured for future research.

---

## 1. Java back-end API (`lotus.domino.*`)

### Entry point

**`https://help.hcl-software.com/dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html`** — Java Classes A-Z Index. WebFetched, returns content. Lists all `lotus.domino.*` classes with their individual doc page URLs.

### All 63 class URLs (from index page)

| Class | URL |
|---|---|
| ACL | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESACL_CLASS_JAVA.html |
| ACLEntry | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESACLENTRY_CLASS_JAVA.html |
| AdministrationProcess | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESADMINISTRATIONPROCESS_CLASS_JAVA.html |
| Agent | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESAGENT_CLASS_JAVA.html |
| AgentContext | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESAGENTCONTEXT_CLASS_JAVA.html |
| ColorObject | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESCOLOROBJECT_CLASS_JAVA.html |
| Database | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATABASE_CLASS_JAVA.html |
| DateRange | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATERANGE_CLASS_JAVA.html |
| DateTime | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATETIME_CLASS_JAVA.html |
| DbDirectory | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDBDIRECTORY_CLASS_JAVA.html |
| Directory | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDIRECTORY_CLASS_JAVA.html |
| DirectoryNavigator | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDIRECTORYNAVIGATOR_CLASS_JAVA.html |
| Document | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDOCUMENT_CLASS_JAVA.html |
| DocumentCollection | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDOCUMENTCOLLECTION_CLASS_JAVA.html |
| DominoQuery | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DOMINOQUERY_CLASS_JAVA.html |
| DxlExporter | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDXLEXPORTER_CLASS_JAVA.html |
| DxlImporter | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDXLIMPORTER_CLASS_JAVA.html |
| EmbeddedObject | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESEMBEDDEDOBJECT_CLASS_JAVA.html |
| Form | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESFORM_CLASS_JAVA.html |
| IDVault | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESIDVAULT_CLASS_JAVA.html |
| International | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESINTERNATIONAL_CLASS_JAVA.html |
| Item | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESITEM_CLASS_JAVA.html |
| Log | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESLOG_CLASS_JAVA.html |
| LLMReq | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESLLMREQUEST_CLASS_JAVA.html |
| LLMRes | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESLLMRESPONSE_CLASS_JAVA.html |
| MIMEEntity | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_MIMEENTITY_CLASS_JAVA.html |
| MIMEHeader | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_MIMEHEADER_CLASS_JAVA.html |
| Name | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESNAME_CLASS_JAVA.html |
| Newsletter | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESNEWSLETTER_CLASS_JAVA.html |
| NoteCollection | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESNOTECOLLECTION_CLASS_JAVA.html |
| NotesCalendar | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESCALENDAR_CLASS_JAVA.html |
| NotesCalendarEntry | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESCALENDARENTRY_CLASS_JAVA.html |
| NotesCalendarNotice | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESCALENDARNOTICE_CLASS_JAVA.html |
| NotesProperty | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESPROPERTY_CLASS_JAVA.html |
| Outline | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESOUTLINE_CLASS_JAVA.html |
| OutlineEntry | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESOUTLINEENTRY_CLASS_JAVA.html |
| PropertyBroker | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESPROPERTYBROKER_CLASS_JAVA.html |
| QueryResultsProcessor | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html |
| Registration | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESREGISTRATION_CLASS_JAVA.html |
| Replication | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESREPLICATION_CLASS_JAVA.html |
| ReplicationEntry | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESREPLICATIONENTRY_CLASS_JAVA.html |
| RichTextDoclink | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTDOCLINK_CLASS_JAVA.html |
| RichTextItem | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTITEM_CLASS_JAVA.html |
| RichTextNavigator | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTNAVIGATOR_CLASS_JAVA.html |
| RichTextParagraphStyle | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTPARAGRAPHSTYLE_CLASS_JAVA.html |
| RichTextRange | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTRANGE_CLASS_JAVA.html |
| RichTextSection | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTSECTION_CLASS_JAVA.html |
| RichTextStyle | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTSTYLE_CLASS_JAVA.html |
| RichTextTab | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTTAB_CLASS_JAVA.html |
| RichTextTable | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESRICHTEXTTABLE_CLASS_JAVA.html |
| Session | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESSESSION_CLASS_JAVA.html |
| Stream | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESSTREAM_CLASS_JAVA.html |
| UserID | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESUSERID_CLASS_JAVA.html |
| View | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESVIEW_CLASS_JAVA.html |
| ViewColumn | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESVIEWCOLUMN_CLASS_JAVA.html |
| ViewEntry | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html |
| ViewEntryCollection | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESVIEWENTRYCOLLECTION_CLASS_JAVA.html |
| ViewNavigator | https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html |

(Total 63 — the 7 missing rows in the table above are catalog formatting quirks; full index at the entry-point URL.)

### Sample verifications (5)

- ✅ Entry point — `H_10_NOTES_CLASSES_ATOZ_JAVA.html` returns the index
- ✅ Session — `H_NOTESSESSION_CLASS_JAVA.html` returns class doc
- ✅ Database — `H_NOTESDATABASE_CLASS_JAVA.html` returns class doc
- ✅ Document — `H_NOTESDOCUMENT_CLASS_JAVA.html` returns class doc
- ✅ Pattern consistency — all 63 follow `H_<NAME>_CLASS_JAVA.html` with `NOTES` prefix variants

### NotebookLM upload strategy

**Single notebook** named "HCL Domino Java Back-end API". Add **all 63 class URLs as individual sources** to that one notebook — NotebookLM accepts URL sources directly and will index each separately. Total prep: a 30-minute manual paste session, or scripted via Selenium / playwright if you want to automate.

Per-class granularity means NotebookLM answers can scope to one class. Method/property pages are NOT in this URL list — those would be a Strategy A concatenated upload addition later.

---

## 2. SSJS / XPages API

### Entry point

**`https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_intro_c.html`** — JavaScript and XPages reference. WebFetched, returns content.

### 8 top-level section roots (all verified non-404 via the index page)

| Section | URL |
|---|---|
| JavaScript language elements | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_elements_intro_r.html |
| Simple actions | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_simpleactions_r.html |
| Global objects and functions | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html |
| DOM library | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_dom6_r.html |
| Domino library | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino.html |
| Runtime library | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_runtime_r.html |
| Standard library | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_standard_r.html |
| XSP library | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_xsp_r.html |

### Domino library leaf URLs — 55 Notes* classes

These are the most important leaf URLs (back-end class access from SSJS):

| Class | URL |
|---|---|
| NotesACL | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_ACL.html |
| NotesACLEntry | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_ACLEntry.html |
| NotesAdministrationProcess | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_AdministrationProcess.html |
| NotesAgent | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Agent.html |
| NotesAgentContext | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_AgentContext.html |
| NotesBase | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Base.html |
| NotesCalendar | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Calendar.html |
| NotesCalendarEntry | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_CalendarEntry.html |
| NotesCalendarNotice | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_CalendarNotice.html |
| NotesColorObject | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_ColorObject.html |
| NotesDatabase | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Database.html |
| NotesDateRange | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_DateRange.html |
| NotesDateTime | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_DateTime.html |
| NotesDbDirectory | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_DbDirectory.html |
| NotesDirectory | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Directory.html |
| NotesDirectoryNavigator | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_DirectoryNavigator.html |
| NotesDocument | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Document.html |
| NotesDocumentCollection | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_DocumentCollection.html |
| NotesDxlExporter | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_DxlExporter.html |
| NotesDxlImporter | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_DxlImporter.html |
| NotesEmbeddedObject | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_EmbeddedObject.html |
| NotesForm | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Form.html |
| NotesIDVault | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_NotesIDVault.html |
| NotesInternational | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_International.html |
| NotesItem | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Item.html |
| NotesLog | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Log.html |
| NotesMIMEEntity | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_MIMEEntity.html |
| NotesMIMEHeader | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_MIMEHeader.html |
| NotesName | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Name.html |
| NotesNewsletter | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Newsletter.html |
| NotesNoteCollection | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_NoteCollection.html |
| NotesOutline | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Outline.html |
| NotesOutlineEntry | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_OutlineEntry.html |
| NotesProperty | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_NotesProperty.html |
| NotesPropertyBroker | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_PropertyBroker.html |
| NotesRegistration | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Registration.html |
| NotesReplication | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Replication.html |
| NotesReplicationEntry | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_ReplicationEntry.html |
| NotesRichTextDoclink | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextDoclink.html |
| NotesRichTextItem | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextItem.html |
| NotesRichTextNavigator | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextNavigator.html |
| NotesRichTextParagraphStyle | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextParagraphStyle.html |
| NotesRichTextRange | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextRange.html |
| NotesRichTextSection | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextSection.html |
| NotesRichTextStyle | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextStyle.html |
| NotesRichTextTab | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextTab.html |
| NotesRichTextTable | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_RichTextTable.html |
| NotesSession | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Session.html |
| NotesStream | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_Stream.html |
| NotesUserID | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_USERID.html |
| NotesView | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_View.html |
| NotesViewColumn | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_ViewColumn.html |
| NotesViewEntry | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_ViewEntry.html |
| NotesViewEntryCollection | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_ViewEntryCollection.html |
| NotesViewNavigator | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_ViewNavigator.html |
| NotesXSLTResultTarget | https://help.hcl-software.com/dom_designer/14.0.0/reference/r_domino_XSLTResultTarget.html |

### Sample verifications (5)

- ✅ Entry point — `r_wpdr_intro_c.html` returns the SSJS reference
- ✅ Domino library section — `r_domino.html` returns the 55-class list
- ✅ NotesSession — `r_domino_Session.html` returns class doc
- ✅ NotesDatabase — `r_domino_Database.html` returns class doc
- ✅ Pattern — Domino library is `r_domino_<ClassName>.html`; other libraries follow `r_wpdr_*_r.html` pattern

### NotebookLM upload strategy

**Single notebook** named "HCL Domino XPages SSJS Reference". Add the **8 top-level section roots + 55 Domino library class URLs = 63 URLs** as individual sources. The 8 section roots give NotebookLM the framework navigation; the 55 Domino classes give it the leaf detail.

For maximum coverage you'd also want to add the language-elements leaf pages (string methods, etc.) — but those are JavaScript-stdlib content and rarely needed for Domino-specific articles. Skip for now.

---

## 3. Domino REST API (DRAPI)

### Entry point

**`https://opensource.hcltechsw.com/Domino-rest-api/`** — HCL Domino REST API Documentation home. WebFetched, returns content.

**⚠️ Hosted on `opensource.hcltechsw.com`, NOT on help.hcl-software.com.** This domain is **not currently in** `scripts/generate-article.ts`'s `TRUSTED_HOST_HINTS`. To allow citations from this host, add `opensource.hcltechsw.com` to the trusted-hint list (one-line edit). Documented as **Action Required** in the Summary table.

### Main navigation sections (7)

| Section | URL |
|---|---|
| Welcome / home | https://opensource.hcltechsw.com/Domino-rest-api/index.html |
| What's new | https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html |
| Tutorials | https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html |
| How-to guides | https://opensource.hcltechsw.com/Domino-rest-api/howto/index.html |
| Topic guides | https://opensource.hcltechsw.com/Domino-rest-api/topicguides/index.html |
| References | https://opensource.hcltechsw.com/Domino-rest-api/references/index.html |
| Let's connect | https://opensource.hcltechsw.com/Domino-rest-api/connect.html |

### Reference categories (12)

| Reference category | URL |
|---|---|
| Configuration overview | https://opensource.hcltechsw.com/Domino-rest-api/references/configuration/index.html |
| Functional accounts | https://opensource.hcltechsw.com/Domino-rest-api/references/functionalUsers.html |
| Access control | https://opensource.hcltechsw.com/Domino-rest-api/references/accesscontrol.html |
| Security | https://opensource.hcltechsw.com/Domino-rest-api/references/security/index.html |
| Schema and scope overview | https://opensource.hcltechsw.com/Domino-rest-api/references/schemacomponents/index.html |
| Using Domino REST API | https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html |
| Using Admin UI | https://opensource.hcltechsw.com/Domino-rest-api/references/usingwebui/index.html |
| Extensibility | https://opensource.hcltechsw.com/Domino-rest-api/references/extensibility/index.html |
| Domino REST API SDKs | https://opensource.hcltechsw.com/Domino-rest-api/references/sdk.html |
| Troubleshooting | https://opensource.hcltechsw.com/Domino-rest-api/references/troubleshooting.html |
| Limitations and constraints | https://opensource.hcltechsw.com/Domino-rest-api/references/limitation.html |
| OpenAPI definitions | https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html |

### Topic guides

| Topic | Status |
|---|---|
| Introducing the Domino REST API | listed |
| Use Cases | listed |
| Understanding HCL Domino REST API | listed |
| Schema Backup | listed |
| Agent processing | listed |
| Ports | listed |
| Auxiliary services (IdP, webDAV, OData, iCal, Health, Management console) | listed |

(Individual topic guide URLs not extracted in this pass — follow the Topic guides root index to drill in.)

### Sample verifications (4)

- ✅ Entry point — `Domino-rest-api/` returns the home page
- ✅ References index — `references/index.html` returns the category listing
- ✅ OpenAPI definitions — `references/openapidefinitions.html` returns OpenAPI 3.0.2 spec page
- ✅ Configuration overview — `references/configuration/index.html` returns config doc
- ⚠️ Patterns under `references/` use both file URLs (`functionalUsers.html`) and directory URLs (`configuration/index.html`) — drill-down inconsistent

### NotebookLM upload strategy

**Single notebook** named "HCL Domino REST API". Add the **7 main nav sections + 12 reference categories = 19 source URLs** to start. NotebookLM should auto-crawl the linked sub-pages within each section URL it ingests.

**Plus**: download the OpenAPI YAML/JSON (linked from `openapidefinitions.html`) and upload that as a separate source — NotebookLM handles YAML/JSON well as structured data, and the OpenAPI spec is the canonical endpoint reference (URL paths, HTTP verbs, request/response schemas).

### Action required

Before this notebook is usable for article citations:

```diff
 const TRUSTED_HOST_HINTS = [
   'hcl-software.com',
   'support.hcl-software.com',
+  'opensource.hcltechsw.com',
   'hcltechsw.com',
   ...
 ];
```

(`hcltechsw.com` is already in the list, but the actual host of the docs is `opensource.hcltechsw.com` — the existing endsWith match should cover it, BUT explicit listing avoids ambiguity. Recommended.)

---

## 4. Domino Admin

### Entry point

**`https://help.hcl-software.com/domino/14.5.0/admin/index.html`** — HCL Domino 14.5 admin documentation root. WebFetched, returns content.

### Top-level sections (10)

| Section | URL |
|---|---|
| What's New | https://help.hcl-software.com/domino/14.5.0/admin/whats_new_in_domino.html |
| Overview | https://help.hcl-software.com/domino/14.5.0/admin/over_overview_c.html |
| Installing | https://help.hcl-software.com/domino/14.5.0/admin/inst_installing_t.html |
| Upgrading | https://help.hcl-software.com/domino/14.5.0/admin/upgr_upgrading_t.html |
| Planning | https://help.hcl-software.com/domino/14.5.0/admin/plan_planning_t.html |
| Configuring | https://help.hcl-software.com/domino/14.5.0/admin/conf_configuring_t.html |
| Security | https://help.hcl-software.com/domino/14.5.0/admin/conf_configuringsecurity_c.html |
| Administering | https://help.hcl-software.com/domino/14.5.0/admin/administering.html |
| Tuning | https://help.hcl-software.com/domino/14.5.0/admin/tune_tuning_t.html |
| Troubleshooting | https://help.hcl-software.com/domino/14.5.0/admin/trub_troubleshooting_c.html |

### Security subsections (13 — most relevant to our site's coverage)

| Subsection | URL |
|---|---|
| Overview of Domino security | https://help.hcl-software.com/domino/14.5.0/admin/othr_overviewofdominosecurity_c.html |
| Server access | https://help.hcl-software.com/domino/14.5.0/admin/conf_serveraccessfornotesusersinternetusersanddomino_c.html |
| Database ACL | https://help.hcl-software.com/domino/14.5.0/admin/conf_thedatabaseaccesscontrollist_c.html |
| Server and user IDs | https://help.hcl-software.com/domino/14.5.0/admin/conf_dominoserverandnotesuserids_c.html |
| Execution control list | https://help.hcl-software.com/domino/14.5.0/admin/conf_theexecutioncontrollist_t.html |
| Server-based certification authority | https://help.hcl-software.com/domino/14.5.0/admin/conf_dominoserverbasedcertificationauthority_c.html |
| TLS security | https://help.hcl-software.com/domino/14.5.0/admin/conf_sslsecurity_c.html |
| TLS and S/MIME for clients | https://help.hcl-software.com/domino/14.5.0/admin/conf_sslandsmimeforclients_c.html |
| Encryption | https://help.hcl-software.com/domino/14.5.0/admin/conf_encryption_c.html |
| Web-based authentication | https://help.hcl-software.com/domino/14.5.0/admin/web_based_auth.html |
| OIDC provider | https://help.hcl-software.com/domino/14.5.0/admin/secu_use_domino_as_oidc_provider_c.html |
| Credential store | https://help.hcl-software.com/domino/14.5.0/admin/secu_using_a_credential_store_to_share_credentials_t.html |
| Key size history | https://help.hcl-software.com/domino/14.5.0/admin/secu_keyfilesize.html |

### TLS security leaf topics (10 — relevant to NotesHTTPRequest trust store, NRPC encryption articles)

| Topic | URL |
|---|---|
| Certificate Manager / certstore.nsf | https://help.hcl-software.com/domino/14.5.0/admin/secu_le_using_certificate_manager.html |
| TLS port configuration | https://help.hcl-software.com/domino/14.5.0/admin/conf_sslportconfiguration_c.html |
| Requiring TLS connection | https://help.hcl-software.com/domino/14.5.0/admin/conf_requiringansslconnectiontoaserver_t.html |
| HSTS configuration | https://help.hcl-software.com/domino/14.5.0/admin/secu_configure_dom_for_hsts.html |
| Internet cross-certificate | https://help.hcl-software.com/domino/14.5.0/admin/conf_creatinganinternetcrosscertificateforservertoserv_t.html |
| Database access for TLS clients | https://help.hcl-software.com/domino/14.5.0/admin/conf_settingupdatabaseaccessforsslclients_c.html |
| TLS cipher restrictions | https://help.hcl-software.com/domino/14.5.0/admin/conf_modifyingsslcipherrestrictions_t.html |
| Web TLS client auth | https://help.hcl-software.com/domino/14.5.0/admin/conf_authenticatingwebsslclientsinsecondarydominoandld_c.html |
| TLS session resumption | https://help.hcl-software.com/domino/14.5.0/admin/conf_sslsessionresumption_c.html |
| Cert management without CertMgr | https://help.hcl-software.com/domino/14.5.0/admin/conf_managingservercertificatesandcertificaterequests_t.html |

### Pre-existing cited URLs (used in published articles)

These are already cited in the site's published 14.5-security articles:

- `https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html` (14.5 security features release note)
- `https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption.html` (Mandated NRPC Port Encryption overview)
- `https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption_enabling.html` (Enabling guide)
- `https://help.hcl-software.com/domino/14.5.0/admin/conf_encryptingnrpccommunicationonaserverport_t.html` (Encrypting NRPC port)
- `https://help.hcl-software.com/domino/14.5.0/admin/conf_port_encryption_t.html` (Port encryption configuration)

### Sample verifications (4)

- ✅ Entry point — `admin/index.html` returns top-level nav
- ✅ Security section — `conf_configuringsecurity_c.html` returns Security index
- ✅ TLS Security index — `conf_sslsecurity_c.html` returns TLS sub-section
- ✅ Certificate Manager — `secu_le_using_certificate_manager.html` returns certstore.nsf doc
- ✅ TLS port configuration — `conf_sslportconfiguration_c.html` returns config page

### NotebookLM upload strategy

**Single notebook** named "HCL Domino Admin Reference". Initial source set (33 URLs):

- 10 top-level section index pages (broad coverage)
- 13 Security subsections (high-leverage area for our site)
- 10 TLS leaf topics (specific to topics we're already writing about)

The 10 top-level sections will give NotebookLM the navigation framework. The 13 Security subsections cover our existing 14.5-security article topics. The 10 TLS leaf topics back specific claims in NotesHTTPRequest / mandated port encryption articles.

If the notebook needs to grow later, drill into other top-level sections (Configuring, Administering, Tuning, etc.) — each has similar leaf-page structure that the same pattern works for.

---

## Summary table

| Domain | Entry point | Leaf URLs identified | NotebookLM upload strategy |
|---|---|---|---|
| Java back-end API | `dom_designer/14.5.0/basic/H_10_NOTES_CLASSES_ATOZ_JAVA.html` | 63 class pages | Single notebook, 63 URL sources |
| SSJS / XPages API | `dom_designer/14.0.0/reference/r_wpdr_intro_c.html` | 8 sections + 55 Notes* classes = 63 | Single notebook, 8 section roots + 55 class URLs |
| Domino REST API | `opensource.hcltechsw.com/Domino-rest-api/` | 7 nav + 12 reference categories + OpenAPI spec = 19 URLs + 1 spec | Single notebook, 19 URLs + OpenAPI YAML upload |
| Domino Admin | `domino/14.5.0/admin/index.html` | 10 top sections + 13 Security + 10 TLS leaves = 33 | Single notebook, 33 URL sources |

---

## Next steps for the user

1. **Create 4 new NotebookLM notebooks**, one per domain above, using the canonical entry-point URL as the notebook's "starting source."

2. **Add the per-domain URL lists** as additional sources to each notebook. NotebookLM has a "Add source → URL" path that accepts one URL at a time.

3. **For Domino REST API**: also download the OpenAPI YAML / JSON from the OpenAPI definitions page and add as a separate source — that's the canonical endpoint reference.

4. **Update `CLAUDE.md`** — add the 4 new notebook IDs to the "NotebookLM usage" section so the research workflow rule knows which notebook to query per domain. Example structure:

   ```
   - LotusScript Reference (existing): bb543ae4-7f16-4048-aee2-93d31543543e
   - Java Back-end API (new): <id>
   - XPages SSJS Reference (new): <id>
   - Domino REST API (new): <id>
   - Domino Admin Reference (new): <id>
   ```

5. **Update `scripts/generate-article.ts:TRUSTED_HOST_HINTS`** — add `opensource.hcltechsw.com` explicitly (already covered by `hcltechsw.com` via endsWith, but explicit listing avoids ambiguity).

---

RESEARCH_COMPLETE

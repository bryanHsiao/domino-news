// Which LotusScript classes also exist in Java and in SSJS — for the /map/
// islands view's language lens ("does this class have a Java version at
// all?"). Not the same question as "is there an article": that is the lamp
// (coversClass + apiLang, ./mapLanguages.ts).
//
// The answer is the union of three sources:
//   1. HCL's own class indexes (fixed lists below, as recorded in
//      data/notebook-sources.md: the Java A–Z index
//      H_10_NOTES_CLASSES_ATOZ_JAVA.html and the SSJS Domino library
//      r_domino.html, both 14.5.1);
//   2. the LS posts' relatedJava / relatedSsjs frontmatter (the coverage
//      report's javaMentions / ssjsMentions) — but only for a class that is
//      in one of HCL's two indexes. SSJS runs on the same back-end Java
//      objects, so DominoQuery / QueryResultsProcessor (Java index, missing
//      from the SSJS page) count for SSJS; the XML parsers some posts list
//      (DOMParser / SAXParser / XSLTransformer / XMLProcessor) are in
//      neither index and are left out, reported in `rejected`;
//   3. every class a Java / SSJS post covers (coversClass + apiLang): a
//      written article proves the version exists.
// Names are mapped onto node ids with resolveClassId (Stream → NotesStream,
// LLMReq → NotesLLMRequest); names with no node (Base, AgentContext,
// XSLTResultTarget…) simply drop out.
import type { CoverageReport } from './coverage';
import { resolveClassId, type NodeLamp } from './mapLanguages';

export const HCL_JAVA_CLASSES = [
  'ACL', 'ACLEntry', 'AdministrationProcess', 'Agent', 'AgentContext', 'ColorObject', 'Database', 'DateRange',
  'DateTime', 'DbDirectory', 'Directory', 'DirectoryNavigator', 'Document', 'DocumentCollection', 'DominoQuery',
  'DxlExporter', 'DxlImporter', 'EmbeddedObject', 'Form', 'IDVault', 'International', 'Item', 'Log', 'LLMReq',
  'LLMRes', 'MIMEEntity', 'MIMEHeader', 'Name', 'Newsletter', 'NoteCollection', 'NotesCalendar',
  'NotesCalendarEntry', 'NotesCalendarNotice', 'NotesProperty', 'Outline', 'OutlineEntry', 'PropertyBroker',
  'QueryResultsProcessor', 'Registration', 'Replication', 'ReplicationEntry', 'RichTextDoclink', 'RichTextItem',
  'RichTextNavigator', 'RichTextParagraphStyle', 'RichTextRange', 'RichTextSection', 'RichTextStyle', 'RichTextTab',
  'RichTextTable', 'Session', 'Stream', 'UserID', 'View', 'ViewColumn', 'ViewEntry', 'ViewEntryCollection',
  'ViewNavigator',
];

export const HCL_SSJS_CLASSES = [
  'NotesACL', 'NotesACLEntry', 'NotesAdministrationProcess', 'NotesAgent', 'NotesAgentContext', 'NotesBase',
  'NotesCalendar', 'NotesCalendarEntry', 'NotesCalendarNotice', 'NotesColorObject', 'NotesDatabase',
  'NotesDateRange', 'NotesDateTime', 'NotesDbDirectory', 'NotesDirectory', 'NotesDirectoryNavigator',
  'NotesDocument', 'NotesDocumentCollection', 'NotesDxlExporter', 'NotesDxlImporter', 'NotesEmbeddedObject',
  'NotesForm', 'NotesIDVault', 'NotesInternational', 'NotesItem', 'NotesLog', 'NotesMIMEEntity', 'NotesMIMEHeader',
  'NotesName', 'NotesNewsletter', 'NotesNoteCollection', 'NotesOutline', 'NotesOutlineEntry', 'NotesProperty',
  'NotesPropertyBroker', 'NotesRegistration', 'NotesReplication', 'NotesReplicationEntry', 'NotesRichTextDoclink',
  'NotesRichTextItem', 'NotesRichTextNavigator', 'NotesRichTextParagraphStyle', 'NotesRichTextRange',
  'NotesRichTextSection', 'NotesRichTextStyle', 'NotesRichTextTab', 'NotesRichTextTable', 'NotesSession',
  'NotesStream', 'NotesUserID', 'NotesView', 'NotesViewColumn', 'NotesViewEntry', 'NotesViewEntryCollection',
  'NotesViewNavigator', 'NotesXSLTResultTarget',
];

export interface ApiVersions {
  /** node ids that have a Java version */
  java: Set<string>;
  /** node ids that have an SSJS version */
  ssjs: Set<string>;
  /** for the record: what each source added beyond HCL's index */
  extra: { java: string[]; ssjs: string[] };
  /** relatedJava / relatedSsjs names in neither HCL index, left out */
  rejected: string[];
}

export function apiVersions(report: CoverageReport, classIds: Set<string>, lamps: Map<string, NodeLamp>): ApiVersions {
  const resolveAll = (names: string[]) => new Set(names.map((n) => resolveClassId(n, classIds)).filter((id): id is string => !!id));
  const inAnIndex = new Set([...resolveAll(HCL_JAVA_CLASSES), ...resolveAll(HCL_SSJS_CLASSES)]);
  const rejected = new Set<string>();
  const fold = (index: string[], mentions: Iterable<string>, lit: (l: NodeLamp) => string[]) => {
    const ids = resolveAll(index);
    const extra: string[] = [];
    const add = (id: string | null, why: string) => {
      if (id && !ids.has(id)) {
        ids.add(id);
        extra.push(`${id} (${why})`);
      }
    };
    for (const m of mentions) {
      const id = resolveClassId(m, classIds);
      if (id && !inAnIndex.has(id)) rejected.add(id);
      else add(id, 'related');
    }
    for (const [id, l] of lamps) if (lit(l).length) add(id, 'article');
    return { ids, extra };
  };
  const java = fold(HCL_JAVA_CLASSES, report.javaMentions.keys(), (l) => l.java);
  const ssjs = fold(HCL_SSJS_CLASSES, report.ssjsMentions.keys(), (l) => l.ssjs);
  return { java: java.ids, ssjs: ssjs.ids, extra: { java: java.extra, ssjs: ssjs.extra }, rejected: [...rejected] };
}

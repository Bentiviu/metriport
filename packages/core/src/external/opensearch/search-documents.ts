import { DocumentReference } from "@medplum/fhirtypes";
import { isCommonwellExtension } from "../commonwell/extension";
import { isCarequalityExtension } from "../carequality/extension";
import { isMetriportExtension } from "../fhir/shared/extensions/metriport";
import { uniqBy } from "lodash";
import { isDocStatusReady } from ".";
import { Config } from "../../util/config";
import { capture } from "../../util/notifications";
import { makeSearchServiceQuery } from "../opensearch/file-search-connector-factory";
import { getDocuments } from "../fhir/document/get-documents";

/* Warning! This function is duplicated in api/src/external/fhir/document/search-documents.ts.
 * Ticket to fix this: https://github.com/metriport/metriport-internal/issues/1801
 */
export async function searchDocuments({
  cxId,
  patientId,
  dateRange: { from, to } = {},
  contentFilter,
}: {
  cxId: string;
  patientId: string;
  dateRange?: { from?: string; to?: string };
  contentFilter?: string;
}): Promise<DocumentReference[]> {
  const fhirDocs = await getDocuments({ cxId, patientId, from, to });

  const docs = await Promise.allSettled([
    searchOnCCDAFiles(fhirDocs, cxId, patientId, contentFilter),
    searchOnDocumentReferences(fhirDocs, contentFilter),
  ]);

  const success = [...docs.flatMap(d => (d.status === "fulfilled" ? d.value : []))];
  const failure = [...docs.flatMap(d => (d.status === "rejected" ? d.reason : []))];
  if (failure.length) {
    console.log(`[searchDocuments] Failure searching: ${failure.join("; ")}`);
    capture.message(`Failure searching`, { extra: { failures: failure.join("; ") } });
  }

  const unique = uniqBy(success, "id");
  const ready = unique.filter(isDocStatusReady);
  return ready;
}

async function searchOnDocumentReferences(
  docs: DocumentReference[],
  contentFilter?: string
): Promise<DocumentReference[]> {
  const checkContent = (d: DocumentReference) =>
    contentFilter ? JSON.stringify(d).toLocaleLowerCase().includes(contentFilter) : true;
  const result = docs.filter(d => checkExtensions(d) && checkContent(d));
  return result;
}

function checkExtensions(doc: DocumentReference) {
  // skip this check for sandbox as we don't have extensions in the sandbox doc refs
  // to be removed in #895
  if (Config.isSandbox()) return true;
  const extensions = doc.extension;
  if (!extensions) return false;
  const metriport = extensions.find(isMetriportExtension);
  const cw = extensions.find(isCommonwellExtension);
  const cq = extensions.find(isCarequalityExtension);
  if (!metriport && !cw && !cq) return false;
  return true;
}

async function searchOnCCDAFiles(
  docs: DocumentReference[],
  cxId: string,
  patientId: string,
  contentFilter?: string
): Promise<DocumentReference[]> {
  if (!contentFilter) return [];
  const searchService = makeSearchServiceQuery();
  const searchResult = await searchService.search({ query: contentFilter, cxId, patientId });
  const searchResultIds = searchResult.map(r => r.entryId);
  // only return documents that match both the search result and the documents we got from the FHIR server (using date filter)
  const result = docs.filter(d => d.id && searchResultIds.includes(d.id));
  return result;
}

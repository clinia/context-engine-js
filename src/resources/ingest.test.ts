import { HttpClient } from "../http-client";
import { IngestResource } from "./ingest";
import { describe, expect, it } from "vitest";

/**
 * The request shapes the generator has to get right on its own, none of which the type
 * checker can see through: a body that is not JSON, a multipart body assembled from an
 * object, and a query parameter whose type sits behind a `$ref`.
 */
function capture() {
  const sent: Request[] = [];
  const http = new HttpClient({
    baseUrl: "http://engine.test",
    fetch: async (input, init) => {
      sent.push(new Request(input, init));
      return new Response("{}", { status: 202, headers: { "Content-Type": "application/json" } });
    },
  });
  return { ingest: new IngestResource(http), sent };
}

describe("IngestResource", () => {
  it("posts a CDA document as XML rather than as a JSON string", async () => {
    const xml = '<?xml version="1.0"?><ClinicalDocument/>';
    const { ingest, sent } = capture();

    await ingest.ingestCdaR2("patient-1", xml);

    const [request] = sent;
    expect(request?.headers.get("Content-Type")).toBe("application/cda+xml");
    // The default serializer would send `"<?xml …/>"` — quoted, escaped, and
    // unparseable as a document.
    expect(await request?.text()).toBe(xml);
  });

  it("sends several CDA documents as one multipart part each", async () => {
    const first = "<ClinicalDocument>a</ClinicalDocument>";
    const second = "<ClinicalDocument>b</ClinicalDocument>";
    const { ingest, sent } = capture();

    await ingest.ingestCdaR2Multipart("patient-1", { documents: [first, second] });

    const [request] = sent;
    // The boundary is the runtime's to choose, so only the media type is ours to assert.
    expect(request?.headers.get("Content-Type")).toMatch(/^multipart\/form-data; ?boundary=/);
    const parts = (await request!.formData()).getAll("documents");
    expect(parts).toEqual([first, second]);
  });

  it("posts the same path whichever way the documents are sent", async () => {
    const { ingest, sent } = capture();

    await ingest.ingestCdaR2("patient-1", "<ClinicalDocument/>");
    await ingest.ingestCdaR2Multipart("patient-1", { documents: ["<ClinicalDocument/>"] });

    const paths = sent.map((request) => new URL(request.url).pathname);
    expect(paths).toEqual([
      "/v1/patients/patient-1/ingestions/cda/r2",
      "/v1/patients/patient-1/ingestions/cda/r2",
    ]);
  });

  it("omits a field the caller left undefined", async () => {
    const { ingest, sent } = capture();

    await ingest.ingestCdaR2Multipart("patient-1", {});

    // An omitted field must not arrive as the string "undefined", which the server would
    // read as a document.
    expect([...(await sent[0]!.formData()).keys()]).toEqual([]);
  });

  it("sends every requested status on the ingestions filter", async () => {
    const { ingest, sent } = capture();

    await ingest.listIngestions("patient-1", {
      query: { status: ["pending", "processing"], perPage: 1 },
    });

    const query = new URL(sent[0]?.url ?? "").searchParams;
    expect(query.getAll("status")).toEqual(["pending", "processing"]);
    expect(query.get("perPage")).toBe("1");
  });
});

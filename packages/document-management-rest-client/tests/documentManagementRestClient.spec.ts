// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	IAuditableItemGraphVertex,
	IAuditableItemGraphVertexList
} from "@twin.org/auditable-item-graph-models";
import {
	AuditableItemGraphContexts,
	AuditableItemGraphTypes
} from "@twin.org/auditable-item-graph-models";
import { GuardError } from "@twin.org/core";
import type {
	IDocumentBase,
	IDocumentHydrated,
	IDocumentList
} from "@twin.org/document-management-models";
import { DocumentContexts, DocumentTypes } from "@twin.org/document-management-models";
import { SchemaOrgContexts, SchemaOrgTypes } from "@twin.org/standards-schema-org";
import { UneceDocumentCodeList } from "@twin.org/standards-unece";
import { HttpMethod } from "@twin.org/web";
import { DocumentManagementRestClient } from "../src/documentManagementRestClient.js";
import {
	createdResponse,
	jsonResponse,
	noContentResponse,
	setupFetchMock,
	teardownFetchMock
} from "./helpers/restClientTestHelpers.js";

// OpenAPI spec: ../../document-management-service/docs/open-api/spec.json
const ENDPOINT = "http://localhost:8080";
const PREFIX = "document-management";

const DOC_URN = "urn:dm:doc001";
const DOC_ID = "DOC-2024-001";
const REVISION = 1;

const TEST_DOCUMENT_BASE: IDocumentBase = {
	documentId: DOC_ID,
	documentCode: UneceDocumentCodeList.CommercialInvoice
};

const TEST_DOCUMENT: IDocumentHydrated = {
	"@context": [SchemaOrgContexts.Context, DocumentContexts.Context, DocumentContexts.ContextCommon],
	type: DocumentTypes.Document,
	id: DOC_URN,
	documentId: DOC_ID,
	documentCode: UneceDocumentCodeList.CommercialInvoice,
	documentRevision: REVISION,
	blobStorageId: "blob:storage:001",
	integrity: "sha256:abc123",
	dateCreated: "2024-01-01T00:00:00Z"
};

const TEST_DOCUMENT_LIST: IDocumentList = {
	"@context": [SchemaOrgContexts.Context, DocumentContexts.Context, DocumentContexts.ContextCommon],
	type: SchemaOrgTypes.ItemList,
	[SchemaOrgTypes.ItemListElement]: [TEST_DOCUMENT]
};

const TEST_VERTEX: IAuditableItemGraphVertex = {
	"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
	id: "urn:aig:vertex001",
	type: AuditableItemGraphTypes.Vertex
};

const TEST_VERTEX_LIST: IAuditableItemGraphVertexList = {
	"@context": [SchemaOrgContexts.Context, AuditableItemGraphContexts.Context],
	type: [SchemaOrgTypes.ItemList, AuditableItemGraphTypes.VertexList],
	[SchemaOrgTypes.ItemListElement]: [TEST_VERTEX]
};

const fetchMock = vi.fn();

describe("DocumentManagementRestClient", () => {
	let client: DocumentManagementRestClient;

	beforeEach(() => {
		setupFetchMock(fetchMock);
		client = new DocumentManagementRestClient({ endpoint: ENDPOINT });
	});

	afterEach(() => {
		teardownFetchMock(fetchMock);
	});

	describe("create", () => {
		test("throws when documentId is empty", async () => {
			await expect(
				client.create({ ...TEST_DOCUMENT_BASE, documentId: "" }, "dGVzdA==")
			).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends POST to /{prefix}", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(DOC_URN));

			await client.create(TEST_DOCUMENT_BASE, "dGVzdA==");

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}`);
			expect(options.method).toBe(HttpMethod.POST);
		});

		test("sends document and string blob in the request body", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(DOC_URN));

			await client.create(TEST_DOCUMENT_BASE, "dGVzdA==");

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.document.documentId).toBe(DOC_ID);
			expect(body.document.documentCode).toBe(UneceDocumentCodeList.CommercialInvoice);
			expect(body.blob).toBe("dGVzdA==");
		});

		test("converts Uint8Array blob to a base64 string in the request body", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(DOC_URN));

			await client.create(TEST_DOCUMENT_BASE, new Uint8Array([116, 101, 115, 116]));

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(typeof body.blob).toBe("string");
			expect(body.blob.length).toBeGreaterThan(0);
		});

		test("sends auditableItemGraphEdges in the request body when provided", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(DOC_URN));
			const edges = [{ targetId: "urn:aig:vertex001" }];

			await client.create(TEST_DOCUMENT_BASE, "dGVzdA==", edges);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.auditableItemGraphEdges).toEqual(edges);
		});

		test("returns the Location header value as the new document id", async () => {
			fetchMock.mockResolvedValueOnce(createdResponse(DOC_URN));

			const id = await client.create(TEST_DOCUMENT_BASE, "dGVzdA==");

			expect(id).toBe(DOC_URN);
		});
	});

	describe("updatePartial", () => {
		test("throws when auditableItemGraphDocumentId is not a URN", async () => {
			await expect(client.updatePartial("not-a-urn")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.urn"
			});
		});

		test("sends PATCH to /{prefix}/:id", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.updatePartial(DOC_URN);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/${DOC_URN}`);
			expect(options.method).toBe(HttpMethod.PATCH);
		});

		test("sends document properties in the request body", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());
			const docUpdate = { documentCode: UneceDocumentCodeList.CreditNote };

			await client.updatePartial(DOC_URN, docUpdate);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.document.documentCode).toBe(UneceDocumentCodeList.CreditNote);
		});

		test("sends blob in the request body", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.updatePartial(DOC_URN, undefined, "bmV3QmxvYg==");

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.blob).toBe("bmV3QmxvYg==");
		});

		test("sends edge delta in the request body", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());
			const edges = { add: [{ targetId: "urn:aig:vertex002" }], remove: ["urn:aig:vertex001"] };

			await client.updatePartial(DOC_URN, undefined, undefined, edges);

			const [, options] = fetchMock.mock.calls[0];
			const body = JSON.parse(options.body);
			expect(body.auditableItemGraphEdges.add).toEqual(edges.add);
			expect(body.auditableItemGraphEdges.remove).toEqual(edges.remove);
		});

		test("resolves without a return value", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			const result = await client.updatePartial(DOC_URN);

			expect(result).toBeUndefined();
		});
	});

	describe("get", () => {
		test("throws when auditableItemGraphDocumentId is not a URN", async () => {
			await expect(client.get("not-a-urn")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.urn"
			});
		});

		test("sends GET to /{prefix}/:id", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT_LIST));

			await client.get(DOC_URN);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/${DOC_URN}`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("returns the document list from the response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT_LIST));

			const result = await client.get(DOC_URN);

			expect(result.entries).toEqual(TEST_DOCUMENT_LIST);
		});

		test("returns undefined cursor when no Link header is present", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT_LIST));

			const result = await client.get(DOC_URN);

			expect(result.cursor).toBeUndefined();
		});

		test("extracts cursor from the Link next relation header", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({
					"content-type": "application/json",
					link: `<${ENDPOINT}/${PREFIX}/${DOC_URN}?cursor=page2>; rel="next"`
				}),
				json: async () => TEST_DOCUMENT_LIST
			});

			const result = await client.get(DOC_URN);

			expect(result.cursor).toBe("page2");
		});

		test("includes includeBlobStorageMetadata as a query parameter when true", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT_LIST));

			await client.get(DOC_URN, { includeBlobStorageMetadata: true });

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("includeBlobStorageMetadata=true");
		});

		test("includes includeBlobStorageData as a query parameter when true", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT_LIST));

			await client.get(DOC_URN, { includeBlobStorageData: true });

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("includeBlobStorageData=true");
		});

		test("includes limit as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT_LIST));

			await client.get(DOC_URN, undefined, undefined, 5);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("limit=5");
		});

		test("includes cursor as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT_LIST));

			await client.get(DOC_URN, undefined, "page1");

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("cursor=page1");
		});
	});

	describe("getRevision", () => {
		test("throws when auditableItemGraphDocumentId is not a URN", async () => {
			await expect(client.getRevision("not-a-urn", REVISION)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.urn"
			});
		});

		test("throws when revision is not an integer", async () => {
			await expect(client.getRevision(DOC_URN, 1.5)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.integer"
			});
		});

		test("sends GET to /{prefix}/:id/:revision", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT));

			await client.getRevision(DOC_URN, REVISION);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/${DOC_URN}/${REVISION}`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("returns the document from the response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT));

			const result = await client.getRevision(DOC_URN, REVISION);

			expect(result).toEqual(TEST_DOCUMENT);
		});

		test("includes includeBlobStorageMetadata as a query parameter when true", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT));

			await client.getRevision(DOC_URN, REVISION, { includeBlobStorageMetadata: true });

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("includeBlobStorageMetadata=true");
		});

		test("includes includeBlobStorageData as a query parameter when true", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_DOCUMENT));

			await client.getRevision(DOC_URN, REVISION, { includeBlobStorageData: true });

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("includeBlobStorageData=true");
		});
	});

	describe("removeRevision", () => {
		test("throws when auditableItemGraphDocumentId is not a URN", async () => {
			await expect(client.removeRevision("not-a-urn", REVISION)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.urn"
			});
		});

		test("throws when revision is not an integer", async () => {
			await expect(client.removeRevision(DOC_URN, 1.5)).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.integer"
			});
		});

		test("sends DELETE to /{prefix}/:id/:revision", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			await client.removeRevision(DOC_URN, REVISION);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}/${DOC_URN}/${REVISION}`);
			expect(options.method).toBe(HttpMethod.DELETE);
		});

		test("resolves without a return value", async () => {
			fetchMock.mockResolvedValueOnce(noContentResponse());

			const result = await client.removeRevision(DOC_URN, REVISION);

			expect(result).toBeUndefined();
		});
	});

	describe("query", () => {
		test("throws when documentId is empty", async () => {
			await expect(client.query("")).rejects.toMatchObject({
				name: GuardError.CLASS_NAME,
				message: "guard.stringEmpty"
			});
		});

		test("sends GET to /{prefix}", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_VERTEX_LIST));

			await client.query(DOC_ID);

			const [url, options] = fetchMock.mock.calls[0];
			expect(url).toBe(`${ENDPOINT}/${PREFIX}?documentId=${DOC_ID}`);
			expect(options.method).toBe(HttpMethod.GET);
		});

		test("returns the vertex list from the response body", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_VERTEX_LIST));

			const result = await client.query(DOC_ID);

			expect(result.entries).toEqual(TEST_VERTEX_LIST);
		});

		test("returns undefined cursor when no Link header is present", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_VERTEX_LIST));

			const result = await client.query(DOC_ID);

			expect(result.cursor).toBeUndefined();
		});

		test("extracts cursor from the Link next relation header", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({
					"content-type": "application/json",
					link: `<${ENDPOINT}/${PREFIX}?cursor=page2>; rel="next"`
				}),
				json: async () => TEST_VERTEX_LIST
			});

			const result = await client.query(DOC_ID);

			expect(result.cursor).toBe("page2");
		});

		test("includes cursor as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_VERTEX_LIST));

			await client.query(DOC_ID, "page1");

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("cursor=page1");
		});

		test("includes limit as a query parameter when provided", async () => {
			fetchMock.mockResolvedValueOnce(jsonResponse(TEST_VERTEX_LIST));

			await client.query(DOC_ID, undefined, 10);

			const [url] = fetchMock.mock.calls[0];
			expect(url).toContain("limit=10");
		});
	});
});

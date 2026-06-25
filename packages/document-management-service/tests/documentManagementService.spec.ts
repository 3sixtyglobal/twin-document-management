// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { TenantIdContextIdHandler } from "@twin.org/api-tenant-processor";
import { NftAttestationConnector } from "@twin.org/attestation-connector-nft";
import { AttestationConnectorFactory } from "@twin.org/attestation-models";
import { AttestationService } from "@twin.org/attestation-service";
import {
	AuditableItemGraphContexts,
	AuditableItemGraphTypes
} from "@twin.org/auditable-item-graph-models";
import {
	type AuditableItemGraphChangeset,
	AuditableItemGraphService,
	type AuditableItemGraphVertex,
	initSchema as initSchemaAuditableItemGraph
} from "@twin.org/auditable-item-graph-service";
import {
	type BackgroundTask,
	BackgroundTaskService,
	initSchema as initSchemaBackgroundTask
} from "@twin.org/background-task-service";
import { MemoryBlobStorageConnector } from "@twin.org/blob-storage-connector-memory";
import { BlobStorageConnectorFactory } from "@twin.org/blob-storage-models";
import {
	type BlobStorageEntry,
	BlobStorageService,
	initSchema as initSchemaBlobStorage
} from "@twin.org/blob-storage-service";
import {
	ContextIdHandlerFactory,
	ContextIdKeys,
	ContextIdStore,
	type IContextIds
} from "@twin.org/context";
import { ComponentFactory, Converter, RandomHelper, SharedStore } from "@twin.org/core";
import { JsonConverterConnector } from "@twin.org/data-processing-converters";
import { JsonPathExtractorConnector } from "@twin.org/data-processing-extractors";
import {
	DataConverterConnectorFactory,
	DataExtractorConnectorFactory
} from "@twin.org/data-processing-models";
import {
	DataProcessingService,
	type ExtractionRuleGroup,
	initSchema as initSchemaDataProcessing
} from "@twin.org/data-processing-service";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { DidContextIdHandler } from "@twin.org/identity-models";
import {
	type ImmutableProof,
	ImmutableProofService,
	initSchema as initSchemaImmutableProof
} from "@twin.org/immutable-proof-service";
import { ModuleHelper } from "@twin.org/modules";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageNftConnector,
	initSchema as initSchemaNft,
	type Nft
} from "@twin.org/nft-connector-entity-storage";
import { NftConnectorFactory } from "@twin.org/nft-models";
import {
	EntityStorageNotarizationConnector,
	initSchema as initSchemaNotarization,
	type Notarization
} from "@twin.org/notarization-connector-entity-storage";
import { NotarizationConnectorFactory } from "@twin.org/notarization-models";
import { UneceDocumentCodeList } from "@twin.org/standards-unece";
import {
	EntityStorageVerifiableStorageConnector,
	initSchema as initSchemaVerifiableStorage,
	type VerifiableItem
} from "@twin.org/verifiable-storage-connector-entity-storage";
import { VerifiableStorageConnectorFactory } from "@twin.org/verifiable-storage-models";
import { MimeTypes } from "@twin.org/web";
import {
	setupTestEnv,
	TEST_NODE_IDENTITY,
	TEST_ORGANIZATION_IDENTITY,
	TEST_TENANT_IDENTITY,
	TEST_USER_IDENTITY
} from "./setupTestEnv.js";
import { DocumentManagementService } from "../src/documentManagementService.js";

let verifiableItemEntityStorage: MemoryEntityStorageConnector<VerifiableItem>;
let verifiableStorageConnector: EntityStorageVerifiableStorageConnector;
let immutableProofEntityStorage: MemoryEntityStorageConnector<ImmutableProof>;
let immutableProofComponent: ImmutableProofService;
let nftEntityStorage: MemoryEntityStorageConnector<Nft>;
let nftConnector: EntityStorageNftConnector;
let backgroundTaskStorage: MemoryEntityStorageConnector<BackgroundTask>;
let backgroundTaskService: BackgroundTaskService;
let blobEntryEntityStorage: MemoryEntityStorageConnector<BlobStorageEntry>;
let blobStorageConnector: MemoryBlobStorageConnector;
let blobStorageComponent: BlobStorageService;
let attestationComponent: AttestationService;
let attestationConnector: NftAttestationConnector;
let auditableItemGraphComponent: AuditableItemGraphService;
let vertexEntityStorage: MemoryEntityStorageConnector<AuditableItemGraphVertex>;
let changesetEntityStorage: MemoryEntityStorageConnector<AuditableItemGraphChangeset>;
let extractionRuleGroupEntityStorage: MemoryEntityStorageConnector<ExtractionRuleGroup>;
let dataProcessingComponent: DataProcessingService;
let notarizationStorage: MemoryEntityStorageConnector<Notarization>;

describe("document-management-service", async () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	beforeEach(async () => {
		initSchemaVerifiableStorage();
		initSchemaImmutableProof();
		initSchemaNotarization();
		initSchemaBackgroundTask();
		initSchemaAuditableItemGraph();
		initSchemaNft();
		initSchemaBlobStorage();
		initSchemaDataProcessing();

		verifiableItemEntityStorage = new MemoryEntityStorageConnector({
			entitySchema: nameof<VerifiableItem>(),
			config: { storageKey: "verifiable-item" }
		});
		EntityStorageConnectorFactory.register("verifiable-item", () => verifiableItemEntityStorage);

		verifiableStorageConnector = new EntityStorageVerifiableStorageConnector();
		VerifiableStorageConnectorFactory.register(
			"verifiable-storage",
			() => verifiableStorageConnector
		);

		backgroundTaskStorage = new MemoryEntityStorageConnector<BackgroundTask>({
			entitySchema: "BackgroundTask",
			config: { storageKey: "background-task" }
		});
		EntityStorageConnectorFactory.register("background-task", () => backgroundTaskStorage);

		backgroundTaskService = new BackgroundTaskService();
		ComponentFactory.register("background-task", () => backgroundTaskService);
		await backgroundTaskService.start();

		immutableProofEntityStorage = new MemoryEntityStorageConnector({
			entitySchema: "ImmutableProof",
			config: { storageKey: "immutable-proof" }
		});
		EntityStorageConnectorFactory.register("immutable-proof", () => immutableProofEntityStorage);

		notarizationStorage = new MemoryEntityStorageConnector<Notarization>({
			entitySchema: nameof<Notarization>(),
			config: { storageKey: "notarization" }
		});
		EntityStorageConnectorFactory.register("notarization", () => notarizationStorage);
		NotarizationConnectorFactory.register(
			"notarization",
			() => new EntityStorageNotarizationConnector()
		);

		immutableProofComponent = new ImmutableProofService();
		ComponentFactory.register("immutable-proof", () => immutableProofComponent);

		vertexEntityStorage = new MemoryEntityStorageConnector<AuditableItemGraphVertex>({
			entitySchema: "AuditableItemGraphVertex",
			config: { storageKey: "auditable-item-graph-vertex" }
		});
		EntityStorageConnectorFactory.register(
			"auditable-item-graph-vertex",
			() => vertexEntityStorage
		);

		changesetEntityStorage = new MemoryEntityStorageConnector<AuditableItemGraphChangeset>({
			entitySchema: "AuditableItemGraphChangeset",
			config: { storageKey: "auditable-item-graph-changeset" }
		});

		EntityStorageConnectorFactory.register(
			"auditable-item-graph-changeset",
			() => changesetEntityStorage
		);

		auditableItemGraphComponent = new AuditableItemGraphService();
		ComponentFactory.register("auditable-item-graph", () => auditableItemGraphComponent);

		blobEntryEntityStorage = new MemoryEntityStorageConnector<BlobStorageEntry>({
			entitySchema: "BlobStorageEntry",
			config: { storageKey: "blob-storage-entry" }
		});
		EntityStorageConnectorFactory.register("blob-storage-entry", () => blobEntryEntityStorage);

		blobStorageConnector = new MemoryBlobStorageConnector();
		BlobStorageConnectorFactory.register("memory", () => blobStorageConnector);

		blobStorageComponent = new BlobStorageService();
		ComponentFactory.register("blob-storage", () => blobStorageComponent);

		nftEntityStorage = new MemoryEntityStorageConnector<Nft>({
			entitySchema: "Nft",
			config: { storageKey: "nft" }
		});
		EntityStorageConnectorFactory.register("nft", () => nftEntityStorage);

		nftConnector = new EntityStorageNftConnector();
		NftConnectorFactory.register("nft", () => nftConnector);

		attestationConnector = new NftAttestationConnector();
		AttestationConnectorFactory.register("nft", () => attestationConnector);

		attestationComponent = new AttestationService();
		ComponentFactory.register("attestation", () => attestationComponent);

		extractionRuleGroupEntityStorage = new MemoryEntityStorageConnector<ExtractionRuleGroup>({
			entitySchema: "ExtractionRuleGroup",
			config: { storageKey: "extraction-rule-group" }
		});
		EntityStorageConnectorFactory.register(
			"extraction-rule-group",
			() => extractionRuleGroupEntityStorage
		);

		const jsonPathExtractor = new JsonPathExtractorConnector();
		DataExtractorConnectorFactory.register("json-path", () => jsonPathExtractor);

		const jsonConverterConnector = new JsonConverterConnector();
		DataConverterConnectorFactory.register(MimeTypes.Json, () => jsonConverterConnector);

		dataProcessingComponent = new DataProcessingService();
		ComponentFactory.register("data-processing", () => dataProcessingComponent);

		// Mock the module helper to execute the method in the same thread, so we don't have to create an engine
		ModuleHelper.execModuleMethodThreadMessage = vi
			.fn()
			.mockImplementation((module, completed) => ({
				executeMethod: async (method: string, args?: unknown, contextIds?: IContextIds) => {
					const res = await ModuleHelper.execModuleMethod(module, method, args as unknown[]);
					completed(method, res);
				}
			}));

		// Mock Date.now so that timestamps always return the same value
		const BASE_TICK = 1724300000000;
		Date.now = vi.fn().mockImplementation(() => BASE_TICK);

		// Reset RandomHelper counter for deterministic IDs
		let randCounter = 1;
		RandomHelper.generate = vi
			.fn()
			.mockImplementation(length => new Uint8Array(length).fill(randCounter++));

		ContextIdHandlerFactory.register(ContextIdKeys.Node, () => new DidContextIdHandler());
		ContextIdHandlerFactory.register(ContextIdKeys.Tenant, () => new TenantIdContextIdHandler());
		ContextIdHandlerFactory.register(ContextIdKeys.Organization, () => new DidContextIdHandler());
		ContextIdHandlerFactory.register(ContextIdKeys.User, () => new DidContextIdHandler());

		ContextIdStore.getContextIds = vi.fn().mockImplementation(() => ({
			[ContextIdKeys.Node]: TEST_NODE_IDENTITY,
			[ContextIdKeys.Tenant]: TEST_TENANT_IDENTITY,
			[ContextIdKeys.Organization]: TEST_ORGANIZATION_IDENTITY,
			[ContextIdKeys.User]: TEST_USER_IDENTITY
		}));
	});

	afterEach(async () => {
		await verifiableItemEntityStorage.teardown();
		await immutableProofEntityStorage.teardown();
		await notarizationStorage.teardown();
		await backgroundTaskStorage.teardown();
		await vertexEntityStorage.teardown();
		await changesetEntityStorage.teardown();
		await blobEntryEntityStorage.teardown();
		await extractionRuleGroupEntityStorage.teardown();
		await nftEntityStorage.teardown();
	});

	test("can create the service", async () => {
		const service = new DocumentManagementService();
		expect(service).toBeDefined();
	});

	test("can create a simple document as an AIG vertex", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAlias: false
			}
		);
		expect(documentId).toEqual("aig:01917849fb0071018101010101010101");

		const nftStore = await nftEntityStorage.getStore();
		expect(nftStore).toEqual([]);

		const blobStore = await blobEntryEntityStorage.getStore();
		expect(blobStore).toEqual([
			{
				blobSize: 11,
				integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
				dateCreated: "2024-08-22T04:13:20.000Z",
				encodingFormat: "text/plain",
				fileExtension: "txt",
				id: "blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
				isEncrypted: false
			}
		]);

		const aigStore = await vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "01917849fb0071018101010101010101",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "||document||",
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.org",
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/"
							],
							type: "Document",
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							documentId: "test-doc-id:aaa",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0,
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							dateCreated: "2024-08-22T04:13:20.000Z",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						}
					}
				],
				version: 0
			}
		]);
	});

	test("can create a document as an AIG vertex with alias, annotation, attestation and edges", async () => {
		const aigId1 = await auditableItemGraphComponent.create({
			"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
			type: AuditableItemGraphTypes.Vertex
		});

		const aigId2 = await auditableItemGraphComponent.create({
			"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
			type: AuditableItemGraphTypes.Vertex
		});

		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentIdFormat: "foo",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "bill-of-lading"
				}
			},
			Converter.utf8ToBytes("Hello World"),
			[
				{
					targetId: aigId1,
					includeAlias: true,
					aliasAnnotationObject: {
						"@context": "https://schema.org",
						type: "Thing",
						description: "an alias"
					}
				},
				{
					targetId: aigId2
				}
			],
			{
				includeAttestation: true
			}
		);
		expect(documentId).toEqual("aig:01917849fb007a0a8a0a0a0a0a0a0a0a");

		const nftStore = await nftEntityStorage.getStore();
		expect(nftStore).toEqual([
			{
				id: "0909090909090909090909090909090909090909090909090909090909090909",
				immutableMetadata: {
					proof:
						"eyJraWQiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyI2F0dGVzdGF0aW9uLWFzc2VydGlvbiIsInR5cCI6IkpXVCIsImFsZyI6IkVkRFNBIn0.eyJpc3MiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyIiwibmJmIjoxNzI0MzAwMDAwLCJzdWIiOiJkb2N1bWVudDpyd1FVcnpfYUx0dm1ZV2pJb2xMVTFQTkhEVFhkMjRSVVZKSDE0SkRlNUs4OjAiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc2NoZW1hLm9yZyIsImh0dHBzOi8vc2NoZW1hLnR3aW5kZXYub3JnL2RvY3VtZW50cy8iLCJodHRwczovL3NjaGVtYS50d2luZGV2Lm9yZy9jb21tb24vIl0sInR5cGUiOiJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsImNyZWRlbnRpYWxTdWJqZWN0Ijp7InR5cGUiOiJEb2N1bWVudEF0dGVzdGF0aW9uIiwiZG9jdW1lbnRJZCI6InRlc3QtZG9jLWlkOmFhYSIsImRvY3VtZW50Q29kZSI6InVuZWNlOkRvY3VtZW50Q29kZUxpc3QjNzA1IiwiZG9jdW1lbnRSZXZpc2lvbiI6MCwiZGF0ZUNyZWF0ZWQiOiIyMDI0LTA4LTIyVDA0OjEzOjIwLjAwMFoiLCJpbnRlZ3JpdHkiOiJzaGEyNTYtcFpHbTFBdjBJRUJLQVJjeno3ZXhrTllzWmI4THphTXJWN0ozMmEyZkZHND0ifX19.IGBqgKp8OJeQHSgpWRdUGpgKOoHlvMqLDDcVpnqPnm9bSxkq9mHxsiV9MmHRBmzyGz1n9g0El9fGrwDVFeEQAw",
					version: "1"
				},
				issuer: TEST_ORGANIZATION_IDENTITY,
				metadata: {},
				owner: TEST_ORGANIZATION_IDENTITY,
				tag: "TWIN-ATTESTATION"
			}
		]);

		const blobStore = await blobEntryEntityStorage.getStore();
		expect(blobStore).toEqual([
			{
				blobSize: 11,
				integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
				dateCreated: "2024-08-22T04:13:20.000Z",
				encodingFormat: "text/plain",
				fileExtension: "txt",
				id: "blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
				isEncrypted: false
			}
		]);

		const aigStore = await vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "01917849fb0071018101010101010101",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						annotationObject: {
							"@context": "https://schema.org",
							description: "an alias",
							type: "Thing"
						},
						dateCreated: "2024-08-22T04:13:20.000Z"
					}
				],
				edges: [
					{
						id: "01917849fb0070109010101010101010",
						targetId: "aig:01917849fb007a0a8a0a0a0a0a0a0a0a",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				version: 1
			},
			{
				id: "01917849fb0075058505050505050505",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				edges: [
					{
						id: "01917849fb0074149414141414141414",
						targetId: "aig:01917849fb007a0a8a0a0a0a0a0a0a0a",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				version: 1
			},
			{
				id: "01917849fb007a0a8a0a0a0a0a0a0a0a",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "||document||",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						dateCreated: "2024-08-22T04:13:20.000Z"
					}
				],
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.org",
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/"
							],
							type: "Document",
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							documentId: "test-doc-id:aaa",
							documentIdFormat: "foo",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0,
							integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							annotationObject: {
								"@context": "https://schema.org",
								type: "DigitalDocument",
								name: "bill-of-lading"
							},
							dateCreated: "2024-08-22T04:13:20.000Z",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDk=",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						}
					}
				],
				edges: [
					{
						id: "01917849fb007b0b8b0b0b0b0b0b0b0b",
						targetId: "aig:01917849fb0071018101010101010101",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "01917849fb007c0c8c0c0c0c0c0c0c0c",
						targetId: "aig:01917849fb0075058505050505050505",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				version: 0
			}
		]);
	});

	test("can update a documents annotation object without creating a new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "bill-of-lading"
				}
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: true,
				includeAlias: true,
				aliasAnnotationObject: {
					"@context": ["https://schema.org"],
					type: "DigitalDocument",
					name: "foo"
				}
			}
		);

		const docs = await service.get(documentId, undefined, undefined, 100);
		expect(docs.entries.itemListElement.length).toEqual(1);
		expect(docs.entries.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading");

		await service.updatePartial(documentId, {
			annotationObject: {
				"@context": "https://schema.org",
				type: "DigitalDocument",
				name: "bill-of-lading-2"
			}
		});

		const docs2 = await service.get(documentId, undefined, undefined, 100);
		expect(docs2.entries.itemListElement.length).toEqual(1);
		expect(docs2.entries.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading-2");

		const aigStore = await vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "01917849fb0072028202020202020202",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "||document||",
				aliases: [
					{
						id: "test-doc-id:aaa",
						dateCreated: "2024-08-22T04:13:20.000Z",
						annotationObject: {
							"@context": ["https://schema.org"],
							type: "DigitalDocument",
							name: "foo"
						}
					}
				],
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.org",
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/"
							],
							type: "Document",
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							documentId: "test-doc-id:aaa",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0,
							annotationObject: {
								"@context": "https://schema.org",
								type: "DigitalDocument",
								name: "bill-of-lading-2"
							},
							integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							dateCreated: "2024-08-22T04:13:20.000Z",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDE=",
							dateModified: "2024-08-22T04:13:20.000Z",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						},
						dateModified: "2024-08-22T04:13:20.000Z"
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "||test-doc-id:aaa||",
				version: 1
			}
		]);
	});

	test("can update a documents blob data and create a new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "bill-of-lading"
				}
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: true
			}
		);

		const docs = await service.get(documentId, undefined, undefined, 100);
		expect(docs.entries.itemListElement.length).toEqual(1);
		expect(docs.entries.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading");

		await service.updatePartial(
			documentId,
			{
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "bill-of-lading-2"
				}
			},
			Converter.utf8ToBytes("Hello World2")
		);

		const docs2 = await service.get(documentId, undefined, undefined, 100);
		expect(docs2.entries.itemListElement.length).toEqual(2);
		expect(docs2.entries.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading-2");
		expect(docs2.entries.itemListElement[1].annotationObject?.name).toEqual("bill-of-lading");
	});

	test("can create a document with edges and update them", async () => {
		const aigId1 = await auditableItemGraphComponent.create({
			"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
			type: AuditableItemGraphTypes.Vertex
		});

		const aigId2 = await auditableItemGraphComponent.create({
			"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
			type: AuditableItemGraphTypes.Vertex
		});

		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentIdFormat: "foo",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "bill-of-lading"
				}
			},
			Converter.utf8ToBytes("Hello World"),
			[
				{
					targetId: aigId1,
					includeAlias: true,
					aliasAnnotationObject: {
						"@context": "https://schema.org",
						type: "Thing",
						description: "an alias"
					}
				},
				{
					targetId: aigId2,
					includeAlias: true,
					aliasAnnotationObject: {
						"@context": "https://schema.org",
						type: "Thing",
						description: "an alias 2"
					}
				}
			],
			{
				includeAttestation: true
			}
		);

		const aigStore = await vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "01917849fb0071018101010101010101",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						dateCreated: "2024-08-22T04:13:20.000Z",
						annotationObject: {
							"@context": "https://schema.org",
							type: "Thing",
							description: "an alias"
						}
					}
				],
				edges: [
					{
						id: "01917849fb0070109010101010101010",
						targetId: "aig:01917849fb007a0a8a0a0a0a0a0a0a0a",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				version: 1
			},
			{
				id: "01917849fb0075058505050505050505",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						dateCreated: "2024-08-22T04:13:20.000Z",
						annotationObject: {
							"@context": "https://schema.org",
							type: "Thing",
							description: "an alias 2"
						}
					}
				],
				edges: [
					{
						id: "01917849fb0074149414141414141414",
						targetId: "aig:01917849fb007a0a8a0a0a0a0a0a0a0a",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				version: 1
			},
			{
				id: "01917849fb007a0a8a0a0a0a0a0a0a0a",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "||document||",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						dateCreated: "2024-08-22T04:13:20.000Z"
					}
				],
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.org",
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/"
							],
							type: "Document",
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							documentId: "test-doc-id:aaa",
							documentIdFormat: "foo",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0,
							annotationObject: {
								"@context": "https://schema.org",
								type: "DigitalDocument",
								name: "bill-of-lading"
							},
							integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							dateCreated: "2024-08-22T04:13:20.000Z",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDk=",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						}
					}
				],
				edges: [
					{
						id: "01917849fb007b0b8b0b0b0b0b0b0b0b",
						targetId: "aig:01917849fb0071018101010101010101",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "01917849fb007c0c8c0c0c0c0c0c0c0c",
						targetId: "aig:01917849fb0075058505050505050505",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				version: 0
			}
		]);

		const aigId3 = await auditableItemGraphComponent.create({
			"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
			type: AuditableItemGraphTypes.Vertex
		});

		const docs = await service.get(documentId);

		const allEdges = docs.entries.edges ?? [];
		const removedEdge = allEdges.splice(1, 1)[0];

		await service.updatePartial(documentId, undefined, undefined, {
			add: [{ targetId: aigId3, includeAlias: true }],
			remove: [removedEdge]
		});
		const aigStore2 = await vertexEntityStorage.getStore();
		expect(aigStore2).toEqual([
			{
				id: "01917849fb0071018101010101010101",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						dateCreated: "2024-08-22T04:13:20.000Z",
						annotationObject: {
							"@context": "https://schema.org",
							type: "Thing",
							description: "an alias"
						}
					}
				],
				edges: [
					{
						id: "01917849fb0070109010101010101010",
						targetId: "aig:01917849fb007a0a8a0a0a0a0a0a0a0a",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				version: 1
			},
			{
				id: "01917849fb0075058505050505050505",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						dateCreated: "2024-08-22T04:13:20.000Z",
						annotationObject: {
							"@context": "https://schema.org",
							type: "Thing",
							description: "an alias 2"
						},
						dateDeleted: "2024-08-22T04:13:20.000Z"
					}
				],
				edges: [
					{
						id: "01917849fb0074149414141414141414",
						targetId: "aig:01917849fb007a0a8a0a0a0a0a0a0a0a",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"],
						dateDeleted: "2024-08-22T04:13:20.000Z"
					}
				],
				version: 2
			},
			{
				id: "01917849fb007a0a8a0a0a0a0a0a0a0a",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "||document||",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						dateCreated: "2024-08-22T04:13:20.000Z"
					}
				],
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.org",
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/"
							],
							type: "Document",
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							documentId: "test-doc-id:aaa",
							documentIdFormat: "foo",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0,
							annotationObject: {
								"@context": "https://schema.org",
								type: "DigitalDocument",
								name: "bill-of-lading"
							},
							integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							dateCreated: "2024-08-22T04:13:20.000Z",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDkwOTA5MDk=",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						}
					}
				],
				edges: [
					{
						id: "01917849fb007b0b8b0b0b0b0b0b0b0b",
						targetId: "aig:01917849fb0071018101010101010101",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "01917849fb007c0c8c0c0c0c0c0c0c0c",
						targetId: "aig:01917849fb0075058505050505050505",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"],
						dateDeleted: "2024-08-22T04:13:20.000Z"
					},
					{
						id: "01917849fb007c1c9c1c1c1c1c1c1c1c",
						targetId: "aig:01917849fb0078189818181818181818",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				version: 1
			},
			{
				id: "01917849fb0078189818181818181818",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				aliases: [
					{
						id: "test-doc-id:aaa",
						aliasFormat: "foo",
						dateCreated: "2024-08-22T04:13:20.000Z"
					}
				],
				edges: [
					{
						id: "01917849fb007020a020202020202020",
						targetId: "aig:01917849fb007a0a8a0a0a0a0a0a0a0a",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				version: 1
			}
		]);
	});

	test("can get a document from an AIG", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "bill-of-lading"
				}
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: true
			}
		);
		expect(documentId).toEqual("aig:01917849fb0072028202020202020202");

		const docs = await service.get(documentId);
		expect(docs.entries).toEqual({
			"@context": [
				"https://schema.org",
				"https://schema.twindev.org/documents/",
				"https://schema.twindev.org/common/"
			],
			type: "ItemList",
			itemListElement: [
				{
					id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
					documentId: "test-doc-id:aaa",
					type: "Document",
					dateCreated: "2024-08-22T04:13:20.000Z",
					annotationObject: {
						"@context": "https://schema.org",
						type: "DigitalDocument",
						name: "bill-of-lading"
					},
					integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
					organizationIdentity: TEST_ORGANIZATION_IDENTITY,
					userIdentity: TEST_USER_IDENTITY,
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDE=",
					blobStorageId:
						"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
					documentCode: "unece:DocumentCodeList#705",
					documentRevision: 0
				}
			]
		});
	});

	test("can get a document from an AIG with blob metadata", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "bill-of-lading"
				}
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: true
			}
		);
		expect(documentId).toEqual("aig:01917849fb0072028202020202020202");

		const docs = await service.get(documentId, { includeBlobStorageMetadata: true });
		expect(docs.entries).toEqual({
			"@context": [
				"https://schema.org",
				"https://schema.twindev.org/documents/",
				"https://schema.twindev.org/common/",
				"https://schema.twindev.org/blob-storage/"
			],
			type: "ItemList",
			itemListElement: [
				{
					id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
					documentId: "test-doc-id:aaa",
					type: "Document",
					annotationObject: {
						"@context": "https://schema.org",
						type: "DigitalDocument",
						name: "bill-of-lading"
					},
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDE=",
					integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
					blobStorageId:
						"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
					documentCode: "unece:DocumentCodeList#705",
					documentRevision: 0,
					dateCreated: "2024-08-22T04:13:20.000Z",
					organizationIdentity: TEST_ORGANIZATION_IDENTITY,
					userIdentity: TEST_USER_IDENTITY,
					blobStorageEntry: {
						type: "BlobStorageEntry",
						id: "blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
						blobSize: 11,
						integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
						dateCreated: "2024-08-22T04:13:20.000Z",
						encodingFormat: "text/plain",
						fileExtension: "txt",
						isEncrypted: false
					}
				}
			]
		});
	});

	test("can get a document from an AIG with blob metadata and content", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: true
			}
		);
		expect(documentId).toEqual("aig:01917849fb0072028202020202020202");

		const doc = await service.get(documentId, {
			includeBlobStorageMetadata: true,
			includeBlobStorageData: true
		});
		expect(doc.entries).toEqual({
			"@context": [
				"https://schema.org",
				"https://schema.twindev.org/documents/",
				"https://schema.twindev.org/common/",
				"https://schema.twindev.org/blob-storage/"
			],
			type: "ItemList",
			itemListElement: [
				{
					id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
					documentId: "test-doc-id:aaa",
					type: "Document",
					annotationObject: {
						type: "DigitalDocument",
						name: "bill-of-lading"
					},
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDE=",
					integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
					blobStorageId:
						"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
					documentCode: "unece:DocumentCodeList#705",
					documentRevision: 0,
					dateCreated: "2024-08-22T04:13:20.000Z",
					organizationIdentity: TEST_ORGANIZATION_IDENTITY,
					userIdentity: TEST_USER_IDENTITY,
					blobStorageEntry: {
						type: "BlobStorageEntry",
						id: "blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
						blobSize: 11,
						integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
						dateCreated: "2024-08-22T04:13:20.000Z",
						encodingFormat: "text/plain",
						fileExtension: "txt",
						blob: "SGVsbG8gV29ybGQ=",
						isEncrypted: false
					}
				}
			]
		});
	});

	test("can get a document from an AIG with blob metadata, content and attestation", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: true
			}
		);
		expect(documentId).toEqual("aig:01917849fb0072028202020202020202");

		const docs = await service.get(documentId, {
			includeBlobStorageMetadata: true,
			includeBlobStorageData: true,
			includeAttestation: true
		});
		expect(docs.entries).toEqual({
			"@context": [
				"https://schema.org",
				"https://schema.twindev.org/documents/",
				"https://schema.twindev.org/common/",
				"https://schema.twindev.org/blob-storage/"
			],
			type: "ItemList",
			itemListElement: [
				{
					id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
					type: "Document",
					dateCreated: "2024-08-22T04:13:20.000Z",
					documentId: "test-doc-id:aaa",
					annotationObject: {
						type: "DigitalDocument",
						name: "bill-of-lading"
					},
					integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
					organizationIdentity: TEST_ORGANIZATION_IDENTITY,
					userIdentity: TEST_USER_IDENTITY,
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDE=",
					attestationInformation: {
						id: "attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDE=",
						type: "Information",
						dateCreated: "2024-08-22T04:13:20.000Z",
						ownerIdentity: TEST_ORGANIZATION_IDENTITY,
						proof: {
							type: "JwtProof",
							value:
								"eyJraWQiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyI2F0dGVzdGF0aW9uLWFzc2VydGlvbiIsInR5cCI6IkpXVCIsImFsZyI6IkVkRFNBIn0.eyJpc3MiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyIiwibmJmIjoxNzI0MzAwMDAwLCJzdWIiOiJkb2N1bWVudDpyd1FVcnpfYUx0dm1ZV2pJb2xMVTFQTkhEVFhkMjRSVVZKSDE0SkRlNUs4OjAiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc2NoZW1hLm9yZyIsImh0dHBzOi8vc2NoZW1hLnR3aW5kZXYub3JnL2RvY3VtZW50cy8iLCJodHRwczovL3NjaGVtYS50d2luZGV2Lm9yZy9jb21tb24vIl0sInR5cGUiOiJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsImNyZWRlbnRpYWxTdWJqZWN0Ijp7InR5cGUiOiJEb2N1bWVudEF0dGVzdGF0aW9uIiwiZG9jdW1lbnRJZCI6InRlc3QtZG9jLWlkOmFhYSIsImRvY3VtZW50Q29kZSI6InVuZWNlOkRvY3VtZW50Q29kZUxpc3QjNzA1IiwiZG9jdW1lbnRSZXZpc2lvbiI6MCwiZGF0ZUNyZWF0ZWQiOiIyMDI0LTA4LTIyVDA0OjEzOjIwLjAwMFoiLCJpbnRlZ3JpdHkiOiJzaGEyNTYtcFpHbTFBdjBJRUJLQVJjeno3ZXhrTllzWmI4THphTXJWN0ozMmEyZkZHND0ifX19.IGBqgKp8OJeQHSgpWRdUGpgKOoHlvMqLDDcVpnqPnm9bSxkq9mHxsiV9MmHRBmzyGz1n9g0El9fGrwDVFeEQAw"
						},
						attestationObject: {
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							type: "DocumentAttestation",
							dateCreated: "2024-08-22T04:13:20.000Z",
							documentId: "test-doc-id:aaa",
							integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0
						},
						verified: true
					},
					blobStorageEntry: {
						id: "blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
						type: "BlobStorageEntry",
						blob: "SGVsbG8gV29ybGQ=",
						dateCreated: "2024-08-22T04:13:20.000Z",
						encodingFormat: "text/plain",
						blobSize: 11,
						fileExtension: "txt",
						integrity: "sha256-pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
						isEncrypted: false
					},
					blobStorageId:
						"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
					documentCode: "unece:DocumentCodeList#705",
					documentRevision: 0
				}
			]
		});
	});

	test("can get the most recent document from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: false
			}
		);

		for (let i = 0; i < 5; i++) {
			await service.updatePartial(
				documentId,
				{ annotationObject: { type: "DigitalDocument", name: "bill-of-lading" } },
				Converter.utf8ToBytes(`Hello World${i}`)
			);
		}

		const docs = await service.get(documentId);
		expect(docs.entries.itemListElement.length).toEqual(1);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(5);
	});

	test("can get a document from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: false
			}
		);

		for (let i = 0; i < 5; i++) {
			await service.updatePartial(
				documentId,
				{ annotationObject: { type: "DigitalDocument", name: "bill-of-lading" } },
				Converter.utf8ToBytes(`Hello World${i}`)
			);
		}

		const docs = await service.get(documentId, undefined, undefined, 100);
		expect(docs.entries.itemListElement.length).toEqual(6);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(5);
		expect(docs.entries.itemListElement[1].documentRevision).toEqual(4);
		expect(docs.entries.itemListElement[2].documentRevision).toEqual(3);
		expect(docs.entries.itemListElement[3].documentRevision).toEqual(2);
		expect(docs.entries.itemListElement[4].documentRevision).toEqual(1);
		expect(docs.entries.itemListElement[5].documentRevision).toEqual(0);
	});

	test("can get a document from an AIG with multiple revisions and cursors", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: false
			}
		);

		for (let i = 0; i < 30; i++) {
			await service.updatePartial(
				documentId,
				{ annotationObject: { type: "DigitalDocument", name: "bill-of-lading" } },
				Converter.utf8ToBytes(`Hello World${i}`)
			);
		}

		let docs = await service.get(documentId, undefined, undefined, 10);
		expect(docs.entries.itemListElement.length).toEqual(10);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(30);
		expect(docs.entries.itemListElement[9].documentRevision).toEqual(21);
		expect(docs.cursor).toEqual("10");

		docs = await service.get(documentId, undefined, docs.cursor, 10);
		expect(docs.entries.itemListElement.length).toEqual(10);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(20);
		expect(docs.entries.itemListElement[9].documentRevision).toEqual(11);
		expect(docs.cursor).toEqual("20");

		docs = await service.get(documentId, undefined, docs.cursor, 10);
		expect(docs.entries.itemListElement.length).toEqual(10);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(10);
		expect(docs.entries.itemListElement[9].documentRevision).toEqual(1);
		expect(docs.cursor).toEqual("30");

		docs = await service.get(documentId, undefined, docs.cursor, 10);
		expect(docs.entries.itemListElement.length).toEqual(1);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(0);
		expect(docs.cursor).toBeUndefined();
	});

	test("can get a document revision from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: false
			}
		);

		for (let i = 0; i < 5; i++) {
			await service.updatePartial(
				documentId,
				{ annotationObject: { type: "DigitalDocument", name: "bill-of-lading" } },
				Converter.utf8ToBytes(`Hello World${i}`)
			);
		}

		const revision = await service.getRevision(documentId, 2);
		expect(revision.documentRevision).toEqual(2);
	});

	test("can remove a specific revision document from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: false
			}
		);

		for (let i = 0; i < 5; i++) {
			await service.updatePartial(
				documentId,
				{ annotationObject: { type: "DigitalDocument", name: "bill-of-lading" } },
				Converter.utf8ToBytes(`Hello World${i}`)
			);
		}

		await service.removeRevision(documentId, 2);

		const docs = await service.get(documentId, undefined, undefined, 20);
		expect(docs.entries.itemListElement.length).toEqual(5);

		const docWithDeleted = await service.get(
			documentId,
			{
				includeRemoved: true
			},
			undefined,
			20
		);
		expect(docWithDeleted.entries.itemListElement.length).toEqual(6);
	});

	test("can remove a revision an add new revisions keeping revision count incrementing", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			{
				documentId: "test-doc-id:aaa",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes("Hello World"),
			undefined,
			{
				includeAttestation: false
			}
		);

		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Hello World2"));

		const docs = await service.get(documentId, undefined, undefined, 20);
		expect(docs.entries.itemListElement.length).toEqual(2);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(1);
		expect(docs.entries.itemListElement[1].documentRevision).toEqual(0);

		await service.removeRevision(documentId, 1);

		const docs2 = await service.get(documentId, undefined, undefined, 20);
		expect(docs2.entries.itemListElement.length).toEqual(1);
		expect(docs2.entries.itemListElement[0].documentRevision).toEqual(0);

		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Hello World3"));

		const docs3 = await service.get(documentId, undefined, undefined, 20);

		expect(docs3.entries.itemListElement.length).toEqual(2);
		expect(docs3.entries.itemListElement[0].documentRevision).toEqual(2);
		expect(docs3.entries.itemListElement[1].documentRevision).toEqual(0);

		const docWithDeleted = await service.get(
			documentId,
			{
				includeRemoved: true
			},
			undefined,
			20
		);
		expect(docWithDeleted.entries.itemListElement.length).toEqual(3);
		expect(docWithDeleted.entries.itemListElement[0].documentRevision).toEqual(2);
		expect(docWithDeleted.entries.itemListElement[1].documentRevision).toEqual(1);
		expect(docWithDeleted.entries.itemListElement[2].documentRevision).toEqual(0);
	});

	test("can query for documents from the aig", async () => {
		const service = new DocumentManagementService();

		for (let i = 0; i < 5; i++) {
			await service.create(
				{
					documentId: `test-id-${i}`,
					documentCode: UneceDocumentCodeList.BillOfLading,
					annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
				},
				Converter.utf8ToBytes(`Hello World${i}`),
				undefined,
				{
					includeAttestation: false
				}
			);
		}

		const vertices = await service.query("test-id");

		expect(vertices.entries.itemListElement.length).toEqual(5);
	});

	test("can extract data from a document with no blob data returned", async () => {
		const service = new DocumentManagementService();

		const docId = await service.create(
			{
				documentId: "test-id",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			undefined,
			{
				includeAttestation: false
			}
		);

		await extractionRuleGroupEntityStorage.set({
			id: "my-rules",
			label: "My Rules",
			rules: [
				{
					source: "$.address.line1",
					target: "address.firstLine"
				}
			]
		});

		const result = await service.get(docId, { extractRuleGroupId: "my-rules" });

		expect(result.entries.itemListElement[0].blobStorageEntry).toBeUndefined();
		expect(result.entries.itemListElement[0].extractedData).toEqual({
			address: {
				firstLine: "bar"
			}
		});
	});

	test("can extract data from a document and get the blob metadata", async () => {
		const service = new DocumentManagementService();

		const docId = await service.create(
			{
				documentId: "test-id",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			undefined,
			{
				includeAttestation: false
			}
		);

		await extractionRuleGroupEntityStorage.set({
			id: "my-rules",
			label: "My Rules",
			rules: [
				{
					source: "$.address.line1",
					target: "address.firstLine"
				}
			]
		});

		const result = await service.get(docId, {
			extractRuleGroupId: "my-rules",
			includeBlobStorageMetadata: true
		});

		expect(result.entries.itemListElement[0].blobStorageEntry).toBeDefined();
		expect(result.entries.itemListElement[0].blobStorageEntry?.blob).toBeUndefined();
		expect(result.entries.itemListElement[0].extractedData).toEqual({
			address: {
				firstLine: "bar"
			}
		});
	});

	test("can extract data from a document and get the blob metadata and blob data", async () => {
		const service = new DocumentManagementService();

		const docId = await service.create(
			{
				documentId: "test-id",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "DigitalDocument", name: "bill-of-lading" }
			},
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			undefined,
			{
				includeAttestation: false
			}
		);

		await extractionRuleGroupEntityStorage.set({
			id: "my-rules",
			label: "My Rules",
			rules: [
				{
					source: "$.address.line1",
					target: "address.firstLine"
				}
			]
		});

		const result = await service.get(docId, {
			extractRuleGroupId: "my-rules",
			includeBlobStorageMetadata: true,
			includeBlobStorageData: true
		});

		expect(result.entries.itemListElement[0].blobStorageEntry).toBeDefined();
		expect(result.entries.itemListElement[0].blobStorageEntry?.blob).toBeDefined();
		expect(result.entries.itemListElement[0].extractedData).toEqual({
			address: {
				firstLine: "bar"
			}
		});
	});

	test("can create a document with custom document ID format", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "DOC-2024-12345",
				documentIdFormat: "custom-doc-format",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { type: "Invoice", name: "test-invoice" }
			},
			Converter.utf8ToBytes("Invoice data")
		);
		expect(documentId).toBeDefined();
		expect(documentId).toMatch(/^aig:/);

		const docs = await service.get(documentId);
		expect(docs.entries.itemListElement[0].documentId).toEqual("DOC-2024-12345");
		expect(docs.entries.itemListElement[0].documentIdFormat).toEqual("custom-doc-format");
	});

	test("can update a document that creates multiple revisions", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "multi-rev-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Version 1")
		);

		// Update with new blob data - creates revision 1
		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Version 2"));

		// Update with new blob data - creates revision 2
		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Version 3"));

		const docs = await service.get(documentId, undefined, undefined, 10);
		expect(docs.entries.itemListElement).toHaveLength(3);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(2);
		expect(docs.entries.itemListElement[1].documentRevision).toEqual(1);
		expect(docs.entries.itemListElement[2].documentRevision).toEqual(0);
	});

	test("can get a document with removed flag when includeRemoved is true", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "remove-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Original"),
			undefined,
			{ includeAttestation: false }
		);

		// Create a second revision
		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Updated"));

		// Remove the first revision
		await service.removeRevision(documentId, 0);

		// Get without includeRemoved - should only get revision 1
		const docsWithout = await service.get(documentId, undefined, undefined, 10);
		expect(docsWithout.entries.itemListElement).toHaveLength(1);
		expect(docsWithout.entries.itemListElement[0].documentRevision).toEqual(1);

		// Get with includeRemoved - should get both revisions
		const docsWith = await service.get(documentId, { includeRemoved: true }, undefined, 10);
		expect(docsWith.entries.itemListElement).toHaveLength(2);
		expect(docsWith.entries.itemListElement[0].dateDeleted).toBeUndefined();
		expect(docsWith.entries.itemListElement[1].dateDeleted).toBeDefined();
	});

	test("can query for multiple documents with the same document id", async () => {
		const service = new DocumentManagementService();

		// Create first document with shared ID
		const doc1Id = await service.create(
			{
				documentId: "shared-doc-id",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Document 1")
		);

		// Create second document with same ID
		const doc2Id = await service.create(
			{
				documentId: "shared-doc-id",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Document 2")
		);

		expect(doc1Id).not.toEqual(doc2Id);

		const result = await service.query("shared-doc-id");
		expect(result.entries.itemListElement).toHaveLength(2);
	});

	test("can handle documents with large annotation objects", async () => {
		const service = new DocumentManagementService();
		const largeAnnotation = {
			type: "DigitalDocument",
			name: "complex-document",
			metadata: {
				tags: Array.from({ length: 100 }, (v, i) => `tag-${i}`),
				properties: Object.fromEntries(
					Array.from({ length: 50 }, (v, i) => [`prop${i}`, `value${i}`])
				),
				nestedData: {
					level1: {
						level2: {
							level3: {
								data: "deep nested value"
							}
						}
					}
				}
			}
		};

		const documentId = await service.create(
			{
				documentId: "large-annotation-test",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: largeAnnotation
			},
			Converter.utf8ToBytes("Test data")
		);

		const docs = await service.get(documentId);
		expect(docs.entries.itemListElement[0].annotationObject).toEqual(largeAnnotation);
	});

	test("verifies blob storage entry context is removed after retrieval", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "context-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Test")
		);

		const docs = await service.get(documentId, { includeBlobStorageMetadata: true });

		// Verify blobStorageEntry exists but doesn't have @context
		expect(docs.entries.itemListElement[0].blobStorageEntry).toBeDefined();
		expect(docs.entries.itemListElement[0].blobStorageEntry?.["@context"]).toBeUndefined();

		// Verify the BlobStorageContexts.Context is in the top-level
		expect(docs.entries["@context"]).toContain("https://schema.twindev.org/blob-storage/");
	});

	test("verifies attestation information context is removed after retrieval", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "attestation-context-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Test"),
			undefined,
			{ includeAttestation: true }
		);

		const docs = await service.get(documentId, { includeAttestation: true });

		// Verify attestationInformation exists but doesn't have @context
		expect(docs.entries.itemListElement[0].attestationInformation).toBeDefined();
		expect(docs.entries.itemListElement[0].attestationInformation?.["@context"]).toBeUndefined();
	});

	test("can update edges by removing all connections", async () => {
		const service = new DocumentManagementService();

		// Create target vertices
		const targetId1 = await service.create(
			{
				documentId: "target-doc-1",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Target 1")
		);

		const targetId2 = await service.create(
			{
				documentId: "target-doc-2",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Target 2")
		);

		// Create document with edges
		const documentId = await service.create(
			{
				documentId: "source-doc",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Source"),
			[{ targetId: targetId1 }, { targetId: targetId2 }]
		);

		// Verify edges exist
		let docs = await service.get(documentId);
		expect(docs.entries.edges).toHaveLength(2);

		// Remove all edges by explicitly listing them in the remove delta
		await service.updatePartial(documentId, undefined, undefined, {
			remove: docs.entries.edges ?? []
		});

		// Verify edges are removed
		docs = await service.get(documentId);
		expect(docs.entries.edges).toBeUndefined();
	});

	test("maintains revision counter after removing middle revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "revision-counter-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Rev 0")
		);

		// Create revisions 1 and 2
		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Rev 1"));
		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Rev 2"));

		// Remove middle revision
		await service.removeRevision(documentId, 1);

		// Create new revision - should be revision 3, not 2
		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Rev 3"));

		const docs = await service.get(documentId, undefined, undefined, 10);
		const revisions = docs.entries.itemListElement.map(doc => doc.documentRevision).sort();
		expect(revisions).toEqual([0, 2, 3]);
	});

	test("can create and retrieve multiple documents with different document IDs", async () => {
		const service = new DocumentManagementService();
		const docIds = ["doc-001", "doc-002", "doc-003", "doc-004"];

		const documentIds = [];
		for (const docId of docIds) {
			const id = await service.create(
				{
					documentId: docId,
					documentCode: UneceDocumentCodeList.BillOfLading
				},
				Converter.utf8ToBytes(`Document with ID ${docId}`)
			);
			documentIds.push(id);
		}

		// Verify each document has correct ID
		for (let i = 0; i < documentIds.length; i++) {
			const docs = await service.get(documentIds[i]);
			expect(docs.entries.itemListElement[0].documentId).toEqual(docIds[i]);
			expect(docs.entries.itemListElement[0].documentCode).toContain("705");
		}
	});

	describe("create() cleans up on edge write failure", () => {
		beforeEach(() => {
			SharedStore.set("mutexLocks", {});
		});

		test("blob is removed from storage when create fails due to missing target vertex", async () => {
			const service = new DocumentManagementService();

			await expect(
				service.create(
					{
						documentId: "cleanup-blob-test",
						documentCode: UneceDocumentCodeList.BillOfLading
					},
					Converter.utf8ToBytes("Cleanup blob test"),
					[{ targetId: "aig:does-not-exist-blob-cleanup" }]
				)
			).rejects.toSatisfy((e: Error) => e.name === "NotFoundError");

			// The blob created during the attempt must have been removed.
			expect(await blobEntryEntityStorage.getStore()).toHaveLength(0);
		});

		test("document vertex resource is soft-deleted when create fails due to missing target vertex", async () => {
			const service = new DocumentManagementService();

			await expect(
				service.create(
					{
						documentId: "cleanup-resource-test",
						documentCode: UneceDocumentCodeList.BillOfLading
					},
					Converter.utf8ToBytes("Cleanup resource test"),
					[{ targetId: "aig:does-not-exist-resource-cleanup" }]
				)
			).rejects.toSatisfy((e: Error) => e.name === "NotFoundError");

			// The created document vertex must exist but its resource must be soft-deleted.
			const aigStore = await vertexEntityStorage.getStore();
			const docVertex = aigStore.find(v => v.resourceTypeIndex?.includes("document"));
			expect(docVertex).toBeDefined();
			expect(docVertex?.resources?.[0]?.dateDeleted).toBeDefined();
		});
	});

	test("updating with the same blob as a soft-deleted revision restores it instead of creating a new one", async () => {
		const service = new DocumentManagementService();
		const blobV1 = Converter.utf8ToBytes("Restore content");

		const documentId = await service.create(
			{
				documentId: "restore-rev-test",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: { "@context": "https://schema.org", type: "DigitalDocument", name: "v1" }
			},
			blobV1,
			undefined,
			{ includeAttestation: false }
		);

		// Create a second revision.
		await service.updatePartial(
			documentId,
			{
				annotationObject: { "@context": "https://schema.org", type: "DigitalDocument", name: "v2" }
			},
			Converter.utf8ToBytes("Different content")
		);

		// Soft-delete revision 1.
		await service.removeRevision(documentId, 1);

		let docs = await service.get(documentId, undefined, undefined, 100);
		expect(docs.entries.itemListElement).toHaveLength(1);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(0);

		// Push blob matching the deleted revision 1 → should restore it, not create revision 2.
		await service.updatePartial(
			documentId,
			{
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "restored"
				}
			},
			Converter.utf8ToBytes("Different content")
		);

		docs = await service.get(documentId, undefined, undefined, 100);
		expect(docs.entries.itemListElement).toHaveLength(2);
		// Restored revision 1 is first (highest revision number).
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(1);
		expect(docs.entries.itemListElement[0].dateDeleted).toBeUndefined();
		expect(docs.entries.itemListElement[0].annotationObject?.name).toEqual("restored");
	});

	describe("update path back-edge writes are best-effort", () => {
		beforeEach(() => {
			SharedStore.set("mutexLocks", {});
		});

		test("updatePartial does not throw when a back-edge write to a non-existent vertex fails", async () => {
			const service = new DocumentManagementService();

			const validTarget = await auditableItemGraphComponent.create({
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				type: AuditableItemGraphTypes.Vertex
			});

			const documentId = await service.create(
				{
					documentId: "best-effort-edge-test",
					documentCode: UneceDocumentCodeList.BillOfLading
				},
				Converter.utf8ToBytes("Best-effort edge test")
			);

			// Adding one valid and one non-existent target — the failed back-edge is swallowed.
			await expect(
				service.updatePartial(documentId, undefined, undefined, {
					add: [{ targetId: validTarget }, { targetId: "aig:does-not-exist-best-effort" }]
				})
			).resolves.toBeUndefined();

			// The valid vertex must have received its back-edge.
			const connected = await auditableItemGraphComponent.get(validTarget);
			const activeEdges = (connected.edges ?? []).filter(e => !e.dateDeleted);
			expect(activeEdges.some(e => e.targetId === documentId)).toBe(true);
		});
	});

	test("updating blob without annotationObject preserves the existing annotation on the new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "annotation-preserve-test",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: {
					"@context": "https://schema.org",
					type: "DigitalDocument",
					name: "keep-this"
				}
			},
			Converter.utf8ToBytes("Version 1"),
			undefined,
			{ includeAttestation: false }
		);

		// Update blob only — annotationObject is undefined (no change intended).
		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Version 2"));

		const docs = await service.get(documentId, undefined, undefined, 10);
		expect(docs.entries.itemListElement).toHaveLength(2);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(1);
		// The annotation from revision 0 must be carried forward to revision 1.
		expect(docs.entries.itemListElement[0].annotationObject?.name).toEqual("keep-this");
	});

	test("get excludes soft-deleted edges by default and returns them with includeDeletedEdges", async () => {
		const service = new DocumentManagementService();

		const targetId = await auditableItemGraphComponent.create({
			"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
			type: AuditableItemGraphTypes.Vertex
		});

		const documentId = await service.create(
			{
				documentId: "include-deleted-edges-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Include deleted edges test"),
			[{ targetId }]
		);

		// Edge is visible before removal.
		let docs = await service.get(documentId);
		expect(docs.entries.edges).toHaveLength(1);

		// Soft-delete the edge.
		await service.updatePartial(documentId, undefined, undefined, { remove: [targetId] });

		// Default: soft-deleted edges are excluded.
		docs = await service.get(documentId);
		expect(docs.entries.edges).toBeUndefined();

		// With includeDeletedEdges: soft-deleted edge is returned.
		docs = await service.get(documentId, { includeDeletedEdges: true });
		expect(docs.entries.edges).toHaveLength(1);
	});

	test("removing an edge to a vertex that was connected without includeAlias succeeds without error", async () => {
		const service = new DocumentManagementService();

		// Create a target vertex — it will NOT receive an alias when connected.
		const targetId = await auditableItemGraphComponent.create({
			"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
			type: AuditableItemGraphTypes.Vertex
		});

		const documentId = await service.create(
			{
				documentId: "no-alias-remove-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("No alias remove test"),
			[{ targetId }] // includeAlias is not set — no alias on targetId
		);

		// Removing the edge must not throw even though there is no alias to remove.
		await expect(
			service.updatePartial(documentId, undefined, undefined, { remove: [targetId] })
		).resolves.toBeUndefined();

		const docs = await service.get(documentId);
		expect(docs.entries.edges).toBeUndefined();
	});

	test("removeRevision throws a GuardError when revision is not an integer", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "integer-guard-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Integer guard test"),
			undefined,
			{ includeAttestation: false }
		);

		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Version 2"));

		await expect(service.removeRevision(documentId, 1.5)).rejects.toSatisfy(
			(e: Error) => e.name === "GuardError"
		);
	});

	describe("edge re-linking after soft-delete", () => {
		beforeEach(() => {
			SharedStore.set("mutexLocks", {});
		});

		test("re-linking a previously removed edge persists on both document and connected vertex", async () => {
			const service = new DocumentManagementService();

			const consignmentVertexId = await auditableItemGraphComponent.create({
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				type: AuditableItemGraphTypes.Vertex
			});

			// Step 1: create document linked to consignment
			const documentVertexId = await service.create(
				{
					documentId: "relink-test-doc",
					documentCode: UneceDocumentCodeList.BillOfLading
				},
				Converter.utf8ToBytes("Relink test"),
				[{ targetId: consignmentVertexId }]
			);

			// Step 2: update removing the edge (soft-delete)
			await service.updatePartial(documentVertexId, undefined, undefined, {
				remove: [consignmentVertexId]
			});

			// Step 3: update re-adding the same edge
			await service.updatePartial(documentVertexId, undefined, undefined, {
				add: [{ targetId: consignmentVertexId }]
			});

			// Step 4: check the document vertex has an active edge to consignment
			const docVertex = await auditableItemGraphComponent.get(documentVertexId);
			const activeDocEdges = (docVertex.edges ?? []).filter(e => !e.dateDeleted);
			expect(activeDocEdges.some(e => e.targetId === consignmentVertexId)).toBe(true);

			// Step 5: check the consignment vertex has an active back-edge to the document
			const consignment = await auditableItemGraphComponent.get(consignmentVertexId);
			const activeBackEdges = (consignment.edges ?? []).filter(e => !e.dateDeleted);
			expect(activeBackEdges.some(e => e.targetId === documentVertexId)).toBe(true);
		});
	});

	describe("update() keeps unchanged edges without duplicating back-edges", () => {
		beforeEach(() => {
			SharedStore.set("mutexLocks", {});
		});

		test("connected vertex has exactly one back-edge after update() that keeps it connected", async () => {
			const service = new DocumentManagementService();

			const consignmentVertexId = await auditableItemGraphComponent.create({
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				type: AuditableItemGraphTypes.Vertex
			});

			const warehouseVertexId = await auditableItemGraphComponent.create({
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				type: AuditableItemGraphTypes.Vertex
			});

			// Step 1: create document linked to both vertices
			const documentVertexId = await service.create(
				{
					documentId: "no-dup-test-doc",
					documentCode: UneceDocumentCodeList.BillOfLading
				},
				Converter.utf8ToBytes("No-dup test"),
				[{ targetId: consignmentVertexId }, { targetId: warehouseVertexId }]
			);

			// Step 2: update keeping only consignment (drop warehouse)
			await service.updatePartial(documentVertexId, undefined, undefined, {
				remove: [warehouseVertexId]
			});

			// Step 3: consignment should have exactly ONE active back-edge to the document
			const consignment = await auditableItemGraphComponent.get(consignmentVertexId);
			const consignmentBackEdges = (consignment.edges ?? []).filter(
				e => !e.dateDeleted && e.targetId === documentVertexId
			);
			expect(consignmentBackEdges).toHaveLength(1);

			// Step 4: warehouse should have no active back-edge to the document
			const warehouse = await auditableItemGraphComponent.get(warehouseVertexId);
			const warehouseBackEdges = (warehouse.edges ?? []).filter(
				e => !e.dateDeleted && e.targetId === documentVertexId
			);
			expect(warehouseBackEdges).toHaveLength(0);
		});
	});

	describe("create() with a non-existent connected vertex rolls back and throws", () => {
		beforeEach(() => {
			SharedStore.set("mutexLocks", {});
		});

		test("throws NotFoundError when a target vertex does not exist", async () => {
			const service = new DocumentManagementService();
			const nonExistentVertexId = "aig:does-not-exist-00000000000000000000";

			await expect(
				service.create(
					{
						documentId: "rollback-test-doc",
						documentCode: UneceDocumentCodeList.BillOfLading
					},
					Converter.utf8ToBytes("Rollback test"),
					[{ targetId: nonExistentVertexId }]
				)
			).rejects.toSatisfy((e: Error) => e.name === "NotFoundError");
		});

		test("rolls back back-edges on already-written vertices when a later target is missing", async () => {
			const service = new DocumentManagementService();

			const goodVertexId = await auditableItemGraphComponent.create({
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				type: AuditableItemGraphTypes.Vertex
			});
			const badVertexId = "aig:does-not-exist-00000000000000000001";

			await expect(
				service.create(
					{
						documentId: "rollback-test-multi",
						documentCode: UneceDocumentCodeList.BillOfLading
					},
					Converter.utf8ToBytes("Multi rollback"),
					[{ targetId: goodVertexId }, { targetId: badVertexId }]
				)
			).rejects.toSatisfy((e: Error) => e.name === "NotFoundError");

			// The back-edge on the good vertex must have been rolled back.
			const goodVertex = await auditableItemGraphComponent.get(goodVertexId);
			const activeEdges = (goodVertex.edges ?? []).filter(e => !e.dateDeleted);
			expect(activeEdges).toHaveLength(0);
		});
	});

	test("updatePartial with only includeAttestation:true adds attestation without changing any other properties", async () => {
		const service = new DocumentManagementService();
		const originalBlob = Converter.utf8ToBytes("Attestation upgrade test");
		const originalAnnotation = {
			"@context": "https://schema.org",
			type: "DigitalDocument",
			name: "no-attestation-doc"
		};

		const documentId = await service.create(
			{
				documentId: "attest-upgrade-test",
				documentCode: UneceDocumentCodeList.BillOfLading,
				annotationObject: originalAnnotation
			},
			originalBlob,
			undefined,
			{ includeAttestation: false }
		);

		// Verify no attestation on the original document.
		const before = await service.get(documentId, undefined, undefined, 10);
		expect(before.entries.itemListElement).toHaveLength(1);
		const revBefore = before.entries.itemListElement[0];
		expect(revBefore.attestationId).toBeUndefined();
		expect(revBefore.documentRevision).toEqual(0);

		// Call updatePartial with only the includeAttestation flag — no blob, no annotation, no edges.
		await service.updatePartial(documentId, undefined, undefined, undefined, {
			includeAttestation: true
		});

		// Fetch again and verify attestation was added.
		const after = await service.get(documentId, undefined, undefined, 10);

		// Still only one revision — no new revision was created.
		expect(after.entries.itemListElement).toHaveLength(1);

		const revAfter = after.entries.itemListElement[0];

		// Attestation is now present.
		expect(revAfter.attestationId).toBeDefined();
		expect(revAfter.attestationId).toMatch(/^attestation:/);

		// All other properties are unchanged.
		expect(revAfter.documentRevision).toEqual(revBefore.documentRevision);
		expect(revAfter.documentId).toEqual(revBefore.documentId);
		expect(revAfter.documentCode).toEqual(revBefore.documentCode);
		expect(revAfter.integrity).toEqual(revBefore.integrity);
		expect(revAfter.blobStorageId).toEqual(revBefore.blobStorageId);
		expect(revAfter.annotationObject).toEqual(revBefore.annotationObject);
		expect(revAfter.dateCreated).toEqual(revBefore.dateCreated);
	});

	describe("concurrent document create — shared connected vertex", () => {
		const PARALLEL_CREATE_COUNT = 10;

		beforeEach(() => {
			// Force a fresh mutex key for each test so the TOCTOU window in
			// Mutex.getOrFetchLock is exercised — mirroring the AIG regression tests.
			SharedStore.set("mutexLocks", {});
		});

		test("all parallel create() calls resolve without throwing", async () => {
			const service = new DocumentManagementService();

			const consignmentVertexId = await auditableItemGraphComponent.create({
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				type: AuditableItemGraphTypes.Vertex
			});

			const results = await Promise.allSettled(
				Array.from({ length: PARALLEL_CREATE_COUNT }, async (unused, i) =>
					service.create(
						{
							documentId: `concurrent-doc-${i}`,
							documentCode: UneceDocumentCodeList.BillOfLading
						},
						Converter.utf8ToBytes(`Document ${i}`),
						[{ targetId: consignmentVertexId }]
					)
				)
			);

			const failures = results.filter(r => r.status === "rejected");
			expect(failures).toHaveLength(0);
		});

		test("all parallel create() calls persist their back-edge on the shared connected vertex", async () => {
			const service = new DocumentManagementService();

			const consignmentVertexId = await auditableItemGraphComponent.create({
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				type: AuditableItemGraphTypes.Vertex
			});

			const documentVertexIds = await Promise.all(
				Array.from({ length: PARALLEL_CREATE_COUNT }, async (unused, i) =>
					service.create(
						{
							documentId: `concurrent-doc-edge-${i}`,
							documentCode: UneceDocumentCodeList.BillOfLading
						},
						Converter.utf8ToBytes(`Document ${i}`),
						[{ targetId: consignmentVertexId }]
					)
				)
			);

			const consignment = await auditableItemGraphComponent.get(consignmentVertexId);
			const activeEdges = (consignment.edges ?? []).filter(e => !e.dateDeleted);

			expect(activeEdges).toHaveLength(PARALLEL_CREATE_COUNT);

			const edgeTargetIds = new Set(activeEdges.map(e => e.targetId));
			for (const docVertexId of documentVertexIds) {
				expect(edgeTargetIds.has(docVertexId)).toBe(true);
			}
		});
	});

	test("updatePartial updates documentIdFormat in-place without creating a new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "format-update-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Format update test"),
			undefined,
			{ includeAttestation: false, includeAlias: false }
		);

		await service.updatePartial(documentId, { documentIdFormat: "updated-format" });

		const docs = await service.get(documentId, undefined, undefined, 10);
		expect(docs.entries.itemListElement).toHaveLength(1);
		expect(docs.entries.itemListElement[0].documentIdFormat).toEqual("updated-format");
	});

	test("updatePartial updates documentCode in-place without creating a new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "code-update-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Code update test"),
			undefined,
			{ includeAttestation: false, includeAlias: false }
		);

		await service.updatePartial(documentId, {
			documentCode: UneceDocumentCodeList.CommercialInvoice
		});

		const docs = await service.get(documentId, undefined, undefined, 10);
		expect(docs.entries.itemListElement).toHaveLength(1);
		expect(docs.entries.itemListElement[0].documentCode).toContain("380");
	});

	test("updatePartial with options.includeAlias true adds alias to the AIG vertex", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "alias-add-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Alias add test"),
			undefined,
			{ includeAttestation: false, includeAlias: false }
		);

		const storeBefore = await vertexEntityStorage.getStore();
		const vertexBefore = storeBefore.find(v => v.resourceTypeIndex?.includes("document"));
		expect((vertexBefore?.aliases ?? []).filter(a => !a.dateDeleted)).toHaveLength(0);

		await service.updatePartial(documentId, undefined, undefined, undefined, {
			includeAlias: true
		});

		const storeAfter = await vertexEntityStorage.getStore();
		const vertexAfter = storeAfter.find(v => v.resourceTypeIndex?.includes("document"));
		const activeAliases = (vertexAfter?.aliases ?? []).filter(a => !a.dateDeleted);
		expect(activeAliases).toHaveLength(1);
		expect(activeAliases[0].id).toEqual("alias-add-test");
	});

	test("updatePartial with options.includeAlias false removes alias from the AIG vertex", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "alias-remove-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Alias remove test"),
			undefined,
			{ includeAttestation: false, includeAlias: true }
		);

		const storeBefore = await vertexEntityStorage.getStore();
		const vertexBefore = storeBefore.find(v => v.resourceTypeIndex?.includes("document"));
		expect((vertexBefore?.aliases ?? []).filter(a => !a.dateDeleted)).toHaveLength(1);

		await service.updatePartial(documentId, undefined, undefined, undefined, {
			includeAlias: false
		});

		const storeAfter = await vertexEntityStorage.getStore();
		const vertexAfter = storeAfter.find(v => v.resourceTypeIndex?.includes("document"));
		expect((vertexAfter?.aliases ?? []).filter(a => !a.dateDeleted)).toHaveLength(0);
	});

	test("updatePartial with options.aliasAnnotationObject sets annotation on the added alias", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "alias-annotation-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Alias annotation test"),
			undefined,
			{ includeAttestation: false, includeAlias: false }
		);

		const aliasAnnotation = {
			"@context": "https://schema.org",
			type: "Thing",
			name: "alias-annotation"
		};

		await service.updatePartial(documentId, undefined, undefined, undefined, {
			includeAlias: true,
			aliasAnnotationObject: aliasAnnotation
		});

		const storeAfter = await vertexEntityStorage.getStore();
		const vertexAfter = storeAfter.find(v => v.resourceTypeIndex?.includes("document"));
		const activeAliases = (vertexAfter?.aliases ?? []).filter(a => !a.dateDeleted);
		expect(activeAliases).toHaveLength(1);
		expect(activeAliases[0].annotationObject).toEqual(aliasAnnotation);
	});

	test("getRevision with includeBlobStorageMetadata returns blob storage entry without data", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "get-revision-blob-meta-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Revision blob metadata test"),
			undefined,
			{ includeAttestation: false }
		);

		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Version 2"));

		const revision = await service.getRevision(documentId, 0, {
			includeBlobStorageMetadata: true
		});
		expect(revision.documentRevision).toEqual(0);
		expect(revision.blobStorageEntry).toBeDefined();
		expect(revision.blobStorageEntry?.blob).toBeUndefined();
	});

	test("getRevision with includeBlobStorageData returns blob content", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "get-revision-blob-data-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Revision blob data test"),
			undefined,
			{ includeAttestation: false }
		);

		await service.updatePartial(documentId, undefined, Converter.utf8ToBytes("Version 2"));

		const revision = await service.getRevision(documentId, 0, {
			includeBlobStorageMetadata: true,
			includeBlobStorageData: true
		});
		expect(revision.documentRevision).toEqual(0);
		expect(revision.blobStorageEntry).toBeDefined();
		expect(revision.blobStorageEntry?.blob).toBeDefined();
	});

	test("getRevision with includeAttestation returns attestation information", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "get-revision-attest-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Revision attestation test"),
			undefined,
			{ includeAttestation: true }
		);

		const revision = await service.getRevision(documentId, 0, {
			includeAttestation: true
		});
		expect(revision.documentRevision).toEqual(0);
		expect(revision.attestationInformation).toBeDefined();
	});

	test("getRevision with extractRuleGroupId returns extracted data", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			{
				documentId: "get-revision-extract-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes(JSON.stringify({ city: "Berlin" })),
			undefined,
			{ includeAttestation: false }
		);

		await extractionRuleGroupEntityStorage.set({
			id: "rev-rules",
			label: "Rev Rules",
			rules: [{ source: "$.city", target: "location" }]
		});

		const revision = await service.getRevision(documentId, 0, {
			extractRuleGroupId: "rev-rules"
		});
		expect(revision.documentRevision).toEqual(0);
		expect(revision.extractedData).toEqual({ location: "Berlin" });
	});

	// ── blob: string (blobStorageId) paths ──────────────────────────────────

	test("can create a document using an existing blob storage entry id", async () => {
		const service = new DocumentManagementService();

		// Upload a blob externally to obtain its storage ID.
		const blobStorageId = await blobStorageComponent.create(
			Converter.bytesToBase64(Converter.utf8ToBytes("Hello World"))
		);

		const documentId = await service.create(
			{
				documentId: "string-blob-create-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			blobStorageId,
			undefined,
			{ includeAlias: false }
		);

		expect(documentId).toMatch(/^aig:/);

		// Only one blob entry — we referenced, not uploaded.
		const blobStore = await blobEntryEntityStorage.getStore();
		expect(blobStore).toHaveLength(1);
		expect(blobStore[0].id).toEqual(blobStorageId);

		// The stored document references the same blobStorageId and its integrity.
		const docs = await service.get(documentId);
		expect(docs.entries.itemListElement[0].blobStorageId).toEqual(blobStorageId);
		expect(docs.entries.itemListElement[0].integrity).toEqual(blobStore[0].integrity);
	});

	test("can update a document using an existing blob storage entry id creating a new revision", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			{
				documentId: "string-blob-update-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Original content"),
			undefined,
			{ includeAlias: false }
		);

		// Upload a new blob externally, then pass its ID to updatePartial.
		const newBlobStorageId = await blobStorageComponent.create(
			Converter.bytesToBase64(Converter.utf8ToBytes("New content"))
		);

		await service.updatePartial(documentId, undefined, newBlobStorageId);

		const docs = await service.get(documentId, undefined, undefined, 10);
		expect(docs.entries.itemListElement).toHaveLength(2);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(1);
		expect(docs.entries.itemListElement[0].blobStorageId).toEqual(newBlobStorageId);
	});

	test("updatePartial with the same blobStorageId does not create a new revision", async () => {
		const service = new DocumentManagementService();

		const blobStorageId = await blobStorageComponent.create(
			Converter.bytesToBase64(Converter.utf8ToBytes("Same content"))
		);

		const documentId = await service.create(
			{
				documentId: "same-blob-no-revision-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			blobStorageId,
			undefined,
			{ includeAlias: false }
		);

		// Pass the same blobStorageId back — must be a no-op for revisions.
		await service.updatePartial(documentId, undefined, blobStorageId);

		const docs = await service.get(documentId, undefined, undefined, 10);
		expect(docs.entries.itemListElement).toHaveLength(1);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(0);
		expect(docs.entries.itemListElement[0].blobStorageId).toEqual(blobStorageId);
	});

	describe("create() with string blobStorageId on edge write failure", () => {
		beforeEach(() => {
			SharedStore.set("mutexLocks", {});
		});

		test("does not remove the referenced blob when create fails due to missing target vertex", async () => {
			const service = new DocumentManagementService();

			// Upload a blob externally.
			const blobStorageId = await blobStorageComponent.create(
				Converter.bytesToBase64(Converter.utf8ToBytes("Rollback string blob"))
			);

			await expect(
				service.create(
					{
						documentId: "string-blob-rollback-test",
						documentCode: UneceDocumentCodeList.BillOfLading
					},
					blobStorageId,
					[{ targetId: "aig:does-not-exist-string-blob-rollback" }]
				)
			).rejects.toSatisfy((e: Error) => e.name === "NotFoundError");

			// The blob we only referenced must NOT have been deleted.
			const blobStore = await blobEntryEntityStorage.getStore();
			expect(blobStore).toHaveLength(1);
			expect(blobStore[0].id).toEqual(blobStorageId);
		});
	});

	test("updatePartial with string blobStorageId restores a soft-deleted revision", async () => {
		const service = new DocumentManagementService();

		// Create revision 0 using a pre-uploaded blob.
		const blobV0Id = await blobStorageComponent.create(
			Converter.bytesToBase64(Converter.utf8ToBytes("Restore via blob id"))
		);

		const documentId = await service.create(
			{
				documentId: "string-blob-restore-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			blobV0Id,
			undefined,
			{ includeAlias: false }
		);

		// Soft-delete the only revision.
		await service.removeRevision(documentId, 0);

		// Pass the same blobStorageId via string — the matching blob on the deleted revision
		// should be restored rather than creating a new revision.
		await service.updatePartial(documentId, undefined, blobV0Id);

		const docs = await service.get(documentId, undefined, undefined, 10);
		expect(docs.entries.itemListElement).toHaveLength(1);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(0);
		expect(docs.entries.itemListElement[0].dateDeleted).toBeUndefined();
		expect(docs.entries.itemListElement[0].blobStorageId).toEqual(blobV0Id);
	});

	// ── includeAttestation: false (remove attestation) ─────────────────────

	test("updatePartial with includeAttestation false removes attestation without creating a new revision", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			{
				documentId: "remove-attest-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Test content"),
			undefined,
			{ includeAttestation: true }
		);

		const before = await service.get(documentId);
		expect(before.entries.itemListElement[0].attestationId).toBeDefined();

		await service.updatePartial(documentId, undefined, undefined, undefined, {
			includeAttestation: false
		});

		const after = await service.get(documentId);
		expect(after.entries.itemListElement).toHaveLength(1);
		expect(after.entries.itemListElement[0].documentRevision).toEqual(0);
		expect(after.entries.itemListElement[0].attestationId).toBeUndefined();
	});

	test("updatePartial with includeAttestation false removes attestation on a new revision when blob also changes", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			{
				documentId: "remove-attest-new-rev-test",
				documentCode: UneceDocumentCodeList.BillOfLading
			},
			Converter.utf8ToBytes("Version 1"),
			undefined,
			{ includeAttestation: true }
		);

		const before = await service.get(documentId);
		expect(before.entries.itemListElement[0].attestationId).toBeDefined();

		await service.updatePartial(
			documentId,
			undefined,
			Converter.utf8ToBytes("Version 2"),
			undefined,
			{ includeAttestation: false }
		);

		const after = await service.get(documentId, undefined, undefined, 10);
		expect(after.entries.itemListElement).toHaveLength(2);
		expect(after.entries.itemListElement[0].documentRevision).toEqual(1);
		expect(after.entries.itemListElement[0].attestationId).toBeUndefined();
		// Original revision 0 still has its attestation.
		expect(after.entries.itemListElement[1].attestationId).toBeDefined();
	});
});

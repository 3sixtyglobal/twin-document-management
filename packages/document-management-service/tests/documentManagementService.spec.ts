// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { TenantIdContextIdHandler } from "@twin.org/api-tenant-processor";
import { NftAttestationConnector } from "@twin.org/attestation-connector-nft";
import { AttestationConnectorFactory } from "@twin.org/attestation-models";
import { AttestationService } from "@twin.org/attestation-service";
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
import { ComponentFactory, Converter } from "@twin.org/core";
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

describe("document-management-service", async () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	beforeEach(async () => {
		initSchemaVerifiableStorage();
		initSchemaImmutableProof();
		initSchemaBackgroundTask();
		initSchemaAuditableItemGraph();
		initSchemaNft();
		initSchemaBlobStorage();
		initSchemaDataProcessing();

		verifiableItemEntityStorage = new MemoryEntityStorageConnector({
			entitySchema: nameof<VerifiableItem>()
		});
		EntityStorageConnectorFactory.register("verifiable-item", () => verifiableItemEntityStorage);

		verifiableStorageConnector = new EntityStorageVerifiableStorageConnector();
		VerifiableStorageConnectorFactory.register(
			"verifiable-storage",
			() => verifiableStorageConnector
		);

		backgroundTaskStorage = new MemoryEntityStorageConnector<BackgroundTask>({
			entitySchema: "BackgroundTask"
		});
		EntityStorageConnectorFactory.register("background-task", () => backgroundTaskStorage);

		backgroundTaskService = new BackgroundTaskService();
		ComponentFactory.register("background-task", () => backgroundTaskService);
		await backgroundTaskService.start();

		immutableProofEntityStorage = new MemoryEntityStorageConnector({
			entitySchema: "ImmutableProof"
		});
		EntityStorageConnectorFactory.register("immutable-proof", () => immutableProofEntityStorage);

		immutableProofComponent = new ImmutableProofService();
		ComponentFactory.register("immutable-proof", () => immutableProofComponent);

		vertexEntityStorage = new MemoryEntityStorageConnector<AuditableItemGraphVertex>({
			entitySchema: "AuditableItemGraphVertex"
		});
		EntityStorageConnectorFactory.register(
			"auditable-item-graph-vertex",
			() => vertexEntityStorage
		);

		changesetEntityStorage = new MemoryEntityStorageConnector<AuditableItemGraphChangeset>({
			entitySchema: "AuditableItemGraphChangeset"
		});

		EntityStorageConnectorFactory.register(
			"auditable-item-graph-changeset",
			() => changesetEntityStorage
		);

		auditableItemGraphComponent = new AuditableItemGraphService();
		ComponentFactory.register("auditable-item-graph", () => auditableItemGraphComponent);

		blobEntryEntityStorage = new MemoryEntityStorageConnector<BlobStorageEntry>({
			entitySchema: "BlobStorageEntry"
		});
		EntityStorageConnectorFactory.register("blob-storage-entry", () => blobEntryEntityStorage);

		blobStorageConnector = new MemoryBlobStorageConnector();
		BlobStorageConnectorFactory.register("memory", () => blobStorageConnector);

		blobStorageComponent = new BlobStorageService();
		ComponentFactory.register("blob-storage", () => blobStorageComponent);

		nftEntityStorage = new MemoryEntityStorageConnector<Nft>({
			entitySchema: "Nft"
		});
		EntityStorageConnectorFactory.register("nft", () => nftEntityStorage);

		nftConnector = new EntityStorageNftConnector();
		NftConnectorFactory.register("nft", () => nftConnector);

		attestationConnector = new NftAttestationConnector();
		AttestationConnectorFactory.register("nft", () => attestationConnector);

		attestationComponent = new AttestationService();
		ComponentFactory.register("attestation", () => attestationComponent);

		extractionRuleGroupEntityStorage = new MemoryEntityStorageConnector<ExtractionRuleGroup>({
			entitySchema: "ExtractionRuleGroup"
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

	test("can create the service", async () => {
		const service = new DocumentManagementService();
		expect(service).toBeDefined();
	});

	test("can create a simple document as an AIG vertex", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			undefined,
			undefined,
			{
				addAlias: false
			}
		);
		expect(documentId).toEqual(
			"aig:0606060606060606060606060606060606060606060606060606060606060606"
		);

		const nftStore = nftEntityStorage.getStore();
		expect(nftStore).toEqual([]);

		const blobStore = blobEntryEntityStorage.getStore();
		expect(blobStore).toEqual([
			{
				blobSize: 11,
				blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
				dateCreated: "2024-08-22T04:13:20.000Z",
				encodingFormat: "text/plain",
				fileExtension: "txt",
				id: "blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
				isEncrypted: false
			}
		]);

		const aigStore = vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "0606060606060606060606060606060606060606060606060606060606060606",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "||document||",
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/",
								"https://schema.org"
							],
							type: "Document",
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							documentId: "test-doc-id:aaa",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0,
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							dateCreated: "2024-08-22T04:13:20.000Z",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						}
					}
				]
			}
		]);
	});

	test("can create a document as an AIG vertex with alias, annotation, attestation and edges", async () => {
		const aigId1 = await auditableItemGraphComponent.create({});

		const aigId2 = await auditableItemGraphComponent.create({});

		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			"foo",
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			[
				{
					targetId: aigId1,
					addAlias: true,
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
				createAttestation: true
			}
		);
		expect(documentId).toEqual(
			"aig:1313131313131313131313131313131313131313131313131313131313131313"
		);

		const nftStore = nftEntityStorage.getStore();
		expect(nftStore).toEqual([
			{
				id: "1212121212121212121212121212121212121212121212121212121212121212",
				immutableMetadata: {
					proof:
						"eyJraWQiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyI2F0dGVzdGF0aW9uLWFzc2VydGlvbiIsInR5cCI6IkpXVCIsImFsZyI6IkVkRFNBIn0.eyJpc3MiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyIiwibmJmIjoxNzI0MzAwMDAwLCJzdWIiOiJkb2N1bWVudDpyd1FVcnpfYUx0dm1ZV2pJb2xMVTFQTkhEVFhkMjRSVVZKSDE0SkRlNUs4OjAiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc2NoZW1hLnR3aW5kZXYub3JnL2RvY3VtZW50cy8iLCJodHRwczovL3NjaGVtYS50d2luZGV2Lm9yZy9jb21tb24vIiwiaHR0cHM6Ly9zY2hlbWEub3JnIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJEb2N1bWVudEF0dGVzdGF0aW9uIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImRvY3VtZW50SWQiOiJ0ZXN0LWRvYy1pZDphYWEiLCJkb2N1bWVudENvZGUiOiJ1bmVjZTpEb2N1bWVudENvZGVMaXN0IzcwNSIsImRvY3VtZW50UmV2aXNpb24iOjAsImRhdGVDcmVhdGVkIjoiMjAyNC0wOC0yMlQwNDoxMzoyMC4wMDBaIiwiYmxvYkhhc2giOiJzaGEyNTY6cFpHbTFBdjBJRUJLQVJjeno3ZXhrTllzWmI4THphTXJWN0ozMmEyZkZHND0ifX19.VDohWlas1kwYXsLEqrI9n0jG-4lxwWLj-doaQsj1GkowJSKDTHCxGLFM8zeVBOxuqusdyKPJKgVbdd-OFXERDQ",
					version: "1"
				},
				issuer: TEST_ORGANIZATION_IDENTITY,
				metadata: {},
				owner: TEST_ORGANIZATION_IDENTITY,
				tag: "TWIN-ATTESTATION"
			}
		]);

		const blobStore = blobEntryEntityStorage.getStore();
		expect(blobStore).toEqual([
			{
				blobSize: 11,
				blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
				dateCreated: "2024-08-22T04:13:20.000Z",
				encodingFormat: "text/plain",
				fileExtension: "txt",
				id: "blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
				isEncrypted: false
			}
		]);

		const aigStore = vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a",
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
						id: "1919191919191919191919191919191919191919191919191919191919191919",
						targetId: "aig:1313131313131313131313131313131313131313131313131313131313131313",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||"
			},
			{
				id: "0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				edges: [
					{
						id: "1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d",
						targetId: "aig:1313131313131313131313131313131313131313131313131313131313131313",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				]
			},
			{
				id: "1313131313131313131313131313131313131313131313131313131313131313",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "||document||",
				aliases: [
					{ id: "test-doc-id:aaa", aliasFormat: "foo", dateCreated: "2024-08-22T04:13:20.000Z" }
				],
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/",
								"https://schema.org"
							],
							type: "Document",
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							documentId: "test-doc-id:aaa",
							documentIdFormat: "foo",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0,
							blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							annotationObject: {
								"@context": "https://schema.org",
								type: "DigitalDocument",
								name: "bill-of-lading"
							},
							dateCreated: "2024-08-22T04:13:20.000Z",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTI=",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						}
					}
				],
				edges: [
					{
						id: "1414141414141414141414141414141414141414141414141414141414141414",
						targetId: "aig:0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "1515151515151515151515151515151515151515151515151515151515151515",
						targetId: "aig:0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||"
			}
		]);
	});

	test("can update a documents annotation object without creating a new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true,
				addAlias: true,
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

		await service.update(documentId, undefined, {
			"@context": "https://schema.org",
			type: "DigitalDocument",
			name: "bill-of-lading-2"
		});

		const docs2 = await service.get(documentId, undefined, undefined, 100);
		expect(docs2.entries.itemListElement.length).toEqual(1);
		expect(docs2.entries.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading-2");

		const aigStore = vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "2222222222222222222222222222222222222222222222222222222222222222",
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
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/",
								"https://schema.org"
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
							blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							dateCreated: "2024-08-22T04:13:20.000Z",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjEyMTIxMjE=",
							dateModified: "2024-08-22T04:13:20.000Z",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						},
						dateModified: "2024-08-22T04:13:20.000Z"
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "||test-doc-id:aaa||"
			}
		]);
	});

	test("can update a documents blob data and create a new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			}
		);

		const docs = await service.get(documentId, undefined, undefined, 100);
		expect(docs.entries.itemListElement.length).toEqual(1);
		expect(docs.entries.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading");

		await service.update(documentId, Converter.utf8ToBytes("Hello World2"), {
			"@context": "https://schema.org",
			type: "DigitalDocument",
			name: "bill-of-lading-2"
		});

		const docs2 = await service.get(documentId, undefined, undefined, 100);
		expect(docs2.entries.itemListElement.length).toEqual(2);
		expect(docs2.entries.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading-2");
		expect(docs2.entries.itemListElement[1].annotationObject?.name).toEqual("bill-of-lading");
	});

	test("can create a document with edges and update them", async () => {
		const aigId1 = await auditableItemGraphComponent.create({});

		const aigId2 = await auditableItemGraphComponent.create({});

		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			"foo",
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			[
				{
					targetId: aigId1,
					addAlias: true,
					aliasAnnotationObject: {
						"@context": "https://schema.org",
						type: "Thing",
						description: "an alias"
					}
				},
				{
					targetId: aigId2,
					addAlias: true,
					aliasAnnotationObject: {
						"@context": "https://schema.org",
						type: "Thing",
						description: "an alias 2"
					}
				}
			],
			{
				createAttestation: true
			}
		);

		const aigStore = vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "3232323232323232323232323232323232323232323232323232323232323232",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
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
						id: "4141414141414141414141414141414141414141414141414141414141414141",
						targetId: "aig:3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "||test-doc-id:aaa||"
			},
			{
				id: "3636363636363636363636363636363636363636363636363636363636363636",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
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
						id: "4545454545454545454545454545454545454545454545454545454545454545",
						targetId: "aig:3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "||test-doc-id:aaa||"
			},
			{
				id: "3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				aliases: [
					{ id: "test-doc-id:aaa", aliasFormat: "foo", dateCreated: "2024-08-22T04:13:20.000Z" }
				],
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/",
								"https://schema.org"
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
							blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							dateCreated: "2024-08-22T04:13:20.000Z",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2E=",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						}
					}
				],
				edges: [
					{
						id: "3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c",
						targetId: "aig:3232323232323232323232323232323232323232323232323232323232323232",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d",
						targetId: "aig:3636363636363636363636363636363636363636363636363636363636363636",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "||test-doc-id:aaa||",
				resourceTypeIndex: "||document||"
			}
		]);

		const aigId3 = await auditableItemGraphComponent.create({});

		const docs = await service.get(documentId);

		const existingEdges = docs.entries.edges ?? [];
		existingEdges.splice(1, 1);

		await service.update(documentId, undefined, undefined, [
			...existingEdges.map(edge => ({ targetId: edge })),
			{
				targetId: aigId3,
				addAlias: true
			}
		]);
		const aigStore2 = vertexEntityStorage.getStore();
		expect(aigStore2).toEqual([
			{
				id: "3232323232323232323232323232323232323232323232323232323232323232",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
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
						id: "4141414141414141414141414141414141414141414141414141414141414141",
						targetId: "aig:3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "||test-doc-id:aaa||"
			},
			{
				id: "3636363636363636363636363636363636363636363636363636363636363636",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
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
						id: "4545454545454545454545454545454545454545454545454545454545454545",
						targetId: "aig:3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"],
						dateDeleted: "2024-08-22T04:13:20.000Z"
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z"
			},
			{
				id: "3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				aliases: [
					{ id: "test-doc-id:aaa", aliasFormat: "foo", dateCreated: "2024-08-22T04:13:20.000Z" }
				],
				resources: [
					{
						dateCreated: "2024-08-22T04:13:20.000Z",
						resourceObject: {
							"@context": [
								"https://schema.twindev.org/documents/",
								"https://schema.twindev.org/common/",
								"https://schema.org"
							],
							type: "Document",
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							documentId: "test-doc-id:aaa",
							documentIdFormat: "foo",
							documentCode: "unece:DocumentCodeList#705",
							documentRevision: 0,
							blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
							blobStorageId:
								"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
							dateCreated: "2024-08-22T04:13:20.000Z",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2EzYTNhM2E=",
							dateModified: "2024-08-22T04:13:20.000Z",
							organizationIdentity: TEST_ORGANIZATION_IDENTITY,
							userIdentity: TEST_USER_IDENTITY
						},
						dateModified: "2024-08-22T04:13:20.000Z"
					}
				],
				edges: [
					{
						id: "3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c",
						targetId: "aig:3232323232323232323232323232323232323232323232323232323232323232",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d",
						targetId: "aig:3636363636363636363636363636363636363636363636363636363636363636",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"],
						dateDeleted: "2024-08-22T04:13:20.000Z"
					},
					{
						id: "4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d",
						targetId: "aig:4949494949494949494949494949494949494949494949494949494949494949",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				resourceTypeIndex: "||document||",
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "||test-doc-id:aaa||"
			},
			{
				id: "4949494949494949494949494949494949494949494949494949494949494949",
				organizationIdentity: TEST_ORGANIZATION_IDENTITY,
				dateCreated: "2024-08-22T04:13:20.000Z",
				aliases: [
					{ id: "test-doc-id:aaa", aliasFormat: "foo", dateCreated: "2024-08-22T04:13:20.000Z" }
				],
				edges: [
					{
						id: "5151515151515151515151515151515151515151515151515151515151515151",
						targetId: "aig:3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "||test-doc-id:aaa||"
			}
		]);
	});

	test("can get a document from an AIG", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			}
		);
		expect(documentId).toEqual(
			"aig:5959595959595959595959595959595959595959595959595959595959595959"
		);

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
					blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
					organizationIdentity: TEST_ORGANIZATION_IDENTITY,
					userIdentity: TEST_USER_IDENTITY,
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjU4NTg1ODU4NTg1ODU4NTg1ODU4NTg1ODU4NTg1ODU4NTg1ODU4NTg1ODU4NTg1ODU4NTg1ODU4NTg1ODU4NTg=",
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
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			}
		);
		expect(documentId).toEqual(
			"aig:5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e"
		);

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
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjVkNWQ1ZDVkNWQ1ZDVkNWQ1ZDVkNWQ1ZDVkNWQ1ZDVkNWQ1ZDVkNWQ1ZDVkNWQ1ZDVkNWQ1ZDVkNWQ1ZDVkNWQ=",
					blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
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
						blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
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
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			}
		);
		expect(documentId).toEqual(
			"aig:6363636363636363636363636363636363636363636363636363636363636363"
		);

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
						"@context": "https://schema.org",
						type: "DigitalDocument",
						name: "bill-of-lading"
					},
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjYyNjI2MjYyNjI2MjYyNjI2MjYyNjI2MjYyNjI2MjYyNjI2MjYyNjI2MjYyNjI2MjYyNjI2MjYyNjI2MjYyNjI=",
					blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
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
						blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
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
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			}
		);
		expect(documentId).toEqual(
			"aig:6868686868686868686868686868686868686868686868686868686868686868"
		);

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
				"https://schema.twindev.org/blob-storage/",
				"https://schema.twindev.org/attestation/"
			],
			type: "ItemList",
			itemListElement: [
				{
					id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
					type: "Document",
					dateCreated: "2024-08-22T04:13:20.000Z",
					documentId: "test-doc-id:aaa",
					annotationObject: {
						"@context": "https://schema.org",
						type: "DigitalDocument",
						name: "bill-of-lading"
					},
					blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
					organizationIdentity: TEST_ORGANIZATION_IDENTITY,
					userIdentity: TEST_USER_IDENTITY,
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc=",
					attestationInformation: {
						id: "attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc2NzY3Njc=",
						type: "Information",
						dateCreated: "2024-08-22T04:13:20.000Z",
						holderIdentity: TEST_ORGANIZATION_IDENTITY,
						ownerIdentity: TEST_ORGANIZATION_IDENTITY,
						proof: {
							type: "JwtProof",
							value:
								"eyJraWQiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyI2F0dGVzdGF0aW9uLWFzc2VydGlvbiIsInR5cCI6IkpXVCIsImFsZyI6IkVkRFNBIn0.eyJpc3MiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyMDIwMjAyIiwibmJmIjoxNzI0MzAwMDAwLCJzdWIiOiJkb2N1bWVudDpyd1FVcnpfYUx0dm1ZV2pJb2xMVTFQTkhEVFhkMjRSVVZKSDE0SkRlNUs4OjAiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc2NoZW1hLnR3aW5kZXYub3JnL2RvY3VtZW50cy8iLCJodHRwczovL3NjaGVtYS50d2luZGV2Lm9yZy9jb21tb24vIiwiaHR0cHM6Ly9zY2hlbWEub3JnIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJEb2N1bWVudEF0dGVzdGF0aW9uIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImRvY3VtZW50SWQiOiJ0ZXN0LWRvYy1pZDphYWEiLCJkb2N1bWVudENvZGUiOiJ1bmVjZTpEb2N1bWVudENvZGVMaXN0IzcwNSIsImRvY3VtZW50UmV2aXNpb24iOjAsImRhdGVDcmVhdGVkIjoiMjAyNC0wOC0yMlQwNDoxMzoyMC4wMDBaIiwiYmxvYkhhc2giOiJzaGEyNTY6cFpHbTFBdjBJRUJLQVJjeno3ZXhrTllzWmI4THphTXJWN0ozMmEyZkZHND0ifX19.VDohWlas1kwYXsLEqrI9n0jG-4lxwWLj-doaQsj1GkowJSKDTHCxGLFM8zeVBOxuqusdyKPJKgVbdd-OFXERDQ"
						},
						attestationObject: {
							id: "document:rwQUrz_aLtvmYWjIolLU1PNHDTXd24RUVJH14JDe5K8:0",
							type: "DocumentAttestation",
							dateCreated: "2024-08-22T04:13:20.000Z",
							documentId: "test-doc-id:aaa",
							blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
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
						blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
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
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			}
		);

		for (let i = 0; i < 5; i++) {
			await service.update(documentId, Converter.utf8ToBytes(`Hello World${i}`), {
				"@context": "https://schema.org",
				type: "DigitalDocument",
				name: "bill-of-lading"
			});
		}

		const docs = await service.get(
			"aig:6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c"
		);
		expect(docs.entries.itemListElement.length).toEqual(1);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(5);
	});

	test("can get a document from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			}
		);

		for (let i = 0; i < 5; i++) {
			await service.update(documentId, Converter.utf8ToBytes(`Hello World${i}`), {
				"@context": "https://schema.org",
				type: "DigitalDocument",
				name: "bill-of-lading"
			});
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
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			}
		);

		for (let i = 0; i < 30; i++) {
			await service.update(documentId, Converter.utf8ToBytes(`Hello World${i}`), {
				"@context": "https://schema.org",
				type: "DigitalDocument",
				name: "bill-of-lading"
			});
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
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			}
		);

		for (let i = 0; i < 5; i++) {
			await service.update(documentId, Converter.utf8ToBytes(`Hello World${i}`), {
				"@context": "https://schema.org",
				type: "DigitalDocument",
				name: "bill-of-lading"
			});
		}

		const revision = await service.getRevision(documentId, 2);
		expect(revision.documentRevision).toEqual(2);
	});

	test("can remove a specific revision document from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			}
		);

		for (let i = 0; i < 5; i++) {
			await service.update(documentId, Converter.utf8ToBytes(`Hello World${i}`), {
				"@context": "https://schema.org",
				type: "DigitalDocument",
				name: "bill-of-lading"
			});
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
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			}
		);

		await service.update(documentId, Converter.utf8ToBytes("Hello World2"));

		const docs = await service.get(documentId, undefined, undefined, 20);
		expect(docs.entries.itemListElement.length).toEqual(2);
		expect(docs.entries.itemListElement[0].documentRevision).toEqual(1);
		expect(docs.entries.itemListElement[1].documentRevision).toEqual(0);

		await service.removeRevision(documentId, 1);

		const docs2 = await service.get(documentId, undefined, undefined, 20);
		expect(docs2.entries.itemListElement.length).toEqual(1);
		expect(docs2.entries.itemListElement[0].documentRevision).toEqual(0);

		await service.update(documentId, Converter.utf8ToBytes("Hello World3"));

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
				`test-id-${i}`,
				undefined,
				UneceDocumentCodeList.BillOfLading,
				Converter.utf8ToBytes(`Hello World${i}`),
				{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
				undefined,
				{
					createAttestation: false
				}
			);
		}

		const vertices = await service.query("test-id");

		expect(vertices.entries.itemListElement.length).toEqual(5);
	});

	test("can extract data from a document with no blob data returned", async () => {
		const service = new DocumentManagementService();

		const docId = await service.create(
			"test-id",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
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
			"test-id",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
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
			"test-id",
			undefined,
			UneceDocumentCodeList.BillOfLading,
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
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
});

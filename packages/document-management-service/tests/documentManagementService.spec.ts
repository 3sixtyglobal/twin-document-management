// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
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
	EntityStorageBackgroundTaskConnector,
	initSchema as initSchemaBackgroundTask
} from "@twin.org/background-task-connector-entity-storage";
import { BackgroundTaskConnectorFactory } from "@twin.org/background-task-models";
import { MemoryBlobStorageConnector } from "@twin.org/blob-storage-connector-memory";
import { BlobStorageConnectorFactory } from "@twin.org/blob-storage-models";
import {
	type BlobStorageEntry,
	BlobStorageService,
	initSchema as initSchemaBlobStorage
} from "@twin.org/blob-storage-service";
import { ComponentFactory, Converter } from "@twin.org/core";
import { JsonConverterConnector } from "@twin.org/data-processing-converters";
import { JsonPathExtractorConnector } from "@twin.org/data-processing-extractors";
import {
	DataConverterConnectorFactory,
	DataExtractorConnectorFactory
} from "@twin.org/data-processing-models";
import {
	DataProcessingService,
	initSchema as initSchemaDataProcessing,
	type ExtractionRuleGroup
} from "@twin.org/data-processing-service";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
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
import { UneceDocumentCodes } from "@twin.org/standards-unece";
import {
	EntityStorageVerifiableStorageConnector,
	initSchema as initSchemaVerifiableStorage,
	type VerifiableItem
} from "@twin.org/verifiable-storage-connector-entity-storage";
import { VerifiableStorageConnectorFactory } from "@twin.org/verifiable-storage-models";
import { MimeTypes } from "@twin.org/web";
import { setupTestEnv, TEST_NODE_IDENTITY, TEST_USER_IDENTITY } from "./setupTestEnv";
import { DocumentManagementService } from "../src/documentManagementService";

let verifiableItemEntityStorage: MemoryEntityStorageConnector<VerifiableItem>;
let verifiableStorageConnector: EntityStorageVerifiableStorageConnector;
let immutableProofEntityStorage: MemoryEntityStorageConnector<ImmutableProof>;
let immutableProofComponent: ImmutableProofService;
let nftEntityStorage: MemoryEntityStorageConnector<Nft>;
let nftConnector: EntityStorageNftConnector;
let backgroundTaskStorage: MemoryEntityStorageConnector<BackgroundTask>;
let backgroundTaskConnector: EntityStorageBackgroundTaskConnector;
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

		backgroundTaskConnector = new EntityStorageBackgroundTaskConnector();
		BackgroundTaskConnectorFactory.register("background-task", () => backgroundTaskConnector);
		await backgroundTaskConnector.start(TEST_NODE_IDENTITY);

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
		// and the background tasks will run in this thread
		ModuleHelper.execModuleMethodThread = vi
			.fn()
			.mockImplementation(async (module, method, args) =>
				ModuleHelper.execModuleMethod(module, method, args)
			);

		// Mock Date.now so that timestamps always return the same value
		const BASE_TICK = 1724300000000;
		Date.now = vi.fn().mockImplementation(() => BASE_TICK);
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
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			undefined,
			undefined,
			{
				addAlias: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(documentId).toEqual(
			"aig:0505050505050505050505050505050505050505050505050505050505050505"
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
				id: "0505050505050505050505050505050505050505050505050505050505050505",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "document",
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
							nodeIdentity:
								"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
							userIdentity:
								"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404"
						}
					}
				]
			}
		]);
	});

	test("can create a document as an AIG vertex with alias, annotation, attestation and edges", async () => {
		const aigId1 = await auditableItemGraphComponent.create(
			{},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const aigId2 = await auditableItemGraphComponent.create(
			{},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			"foo",
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			[
				{
					id: aigId1,
					addAlias: true,
					aliasAnnotationObject: {
						"@context": "https://schema.org",
						type: "Thing",
						description: "an alias"
					}
				},
				{
					id: aigId2
				}
			],
			{
				createAttestation: true
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(documentId).toEqual(
			"aig:1212121212121212121212121212121212121212121212121212121212121212"
		);

		const nftStore = nftEntityStorage.getStore();
		expect(nftStore).toEqual([
			{
				id: "1111111111111111111111111111111111111111111111111111111111111111",
				immutableMetadata: {
					proof:
						"eyJraWQiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxI2F0dGVzdGF0aW9uLWFzc2VydGlvbiIsInR5cCI6IkpXVCIsImFsZyI6IkVkRFNBIn0.eyJpc3MiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxIiwibmJmIjoxNzI0MzAwMDAwLCJzdWIiOiJkb2N1bWVudDpyd1FVcnpfYUx0dm1ZV2pJb2xMVTFQTkhEVFhkMjRSVVZKSDE0SkRlNUs4OjAiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3NjaGVtYS50d2luZGV2Lm9yZy9kb2N1bWVudHMvIiwiaHR0cHM6Ly9zY2hlbWEudHdpbmRldi5vcmcvY29tbW9uLyIsImh0dHBzOi8vc2NoZW1hLm9yZyJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRG9jdW1lbnRBdHRlc3RhdGlvbiJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJkb2N1bWVudElkIjoidGVzdC1kb2MtaWQ6YWFhIiwiZG9jdW1lbnRDb2RlIjoidW5lY2U6RG9jdW1lbnRDb2RlTGlzdCM3MDUiLCJkb2N1bWVudFJldmlzaW9uIjowLCJkYXRlQ3JlYXRlZCI6IjIwMjQtMDgtMjJUMDQ6MTM6MjAuMDAwWiIsImJsb2JIYXNoIjoic2hhMjU2OnBaR20xQXYwSUVCS0FSY3p6N2V4a05Zc1piOEx6YU1yVjdKMzJhMmZGRzQ9In19fQ.BVhqtBBobNS4D6zOj0XIRDoKiMoDNwUmmrdqRgG0LfDXN9wigGC4iM-ADNGuBTKrwHfNiYCKWD1wdBe2JLe8AQ",
					version: "1"
				},
				issuer:
					"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
				metadata: {},
				owner:
					"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
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
				id: "0909090909090909090909090909090909090909090909090909090909090909",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
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
						id: "aig:1212121212121212121212121212121212121212121212121212121212121212",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "test-doc-id:aaa"
			},
			{
				id: "0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
				dateCreated: "2024-08-22T04:13:20.000Z",
				dateModified: "2024-08-22T04:13:20.000Z",
				edges: [
					{
						id: "aig:1212121212121212121212121212121212121212121212121212121212121212",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				]
			},
			{
				id: "1212121212121212121212121212121212121212121212121212121212121212",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "document",
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
							nodeIdentity:
								"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
							userIdentity:
								"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE="
						}
					}
				],
				edges: [
					{
						id: "aig:0909090909090909090909090909090909090909090909090909090909090909",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "aig:0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "test-doc-id:aaa"
			}
		]);
	});

	test("can update a documents annotation object without creating a new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodes.BillOfLading,
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
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const docs = await service.get(documentId, undefined, undefined, 100);
		expect(docs.itemListElement.length).toEqual(1);
		expect(docs.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading");

		await service.update(
			documentId,
			undefined,
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading-2" },
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const docs2 = await service.get(documentId, undefined, undefined, 100);
		expect(docs2.itemListElement.length).toEqual(1);
		expect(docs2.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading-2");

		const aigStore = vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
				dateCreated: "2024-08-22T04:13:20.000Z",
				resourceTypeIndex: "document",
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
							nodeIdentity:
								"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
							userIdentity:
								"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjFjMWMxYzFjMWMxYzFjMWMxYzFjMWMxYzFjMWMxYzFjMWMxYzFjMWMxYzFjMWMxYzFjMWMxYzFjMWMxYzFjMWM=",
							dateModified: "2024-08-22T04:13:20.000Z"
						},
						dateModified: "2024-08-22T04:13:20.000Z"
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "test-doc-id:aaa"
			}
		]);
	});

	test("can update a documents blob data and create a new revision", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const docs = await service.get(documentId, undefined, undefined, 100);
		expect(docs.itemListElement.length).toEqual(1);
		expect(docs.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading");

		await service.update(
			documentId,
			Converter.utf8ToBytes("Hello World2"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading-2" },
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const docs2 = await service.get(documentId, undefined, undefined, 100);
		expect(docs2.itemListElement.length).toEqual(2);
		expect(docs2.itemListElement[0].annotationObject?.name).toEqual("bill-of-lading-2");
		expect(docs2.itemListElement[1].annotationObject?.name).toEqual("bill-of-lading");
	});

	test("can create a document with edges and update them", async () => {
		const aigId1 = await auditableItemGraphComponent.create(
			{},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const aigId2 = await auditableItemGraphComponent.create(
			{},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			"foo",
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			[
				{
					id: aigId1,
					addAlias: true,
					aliasAnnotationObject: {
						"@context": "https://schema.org",
						type: "Thing",
						description: "an alias"
					}
				},
				{
					id: aigId2,
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
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const aigStore = vertexEntityStorage.getStore();
		expect(aigStore).toEqual([
			{
				id: "2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
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
						id: "aig:3636363636363636363636363636363636363636363636363636363636363636",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "test-doc-id:aaa"
			},
			{
				id: "3131313131313131313131313131313131313131313131313131313131313131",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
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
						id: "aig:3636363636363636363636363636363636363636363636363636363636363636",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "test-doc-id:aaa"
			},
			{
				id: "3636363636363636363636363636363636363636363636363636363636363636",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
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
							nodeIdentity:
								"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
							userIdentity:
								"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzU="
						}
					}
				],
				edges: [
					{
						id: "aig:2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "aig:3131313131313131313131313131313131313131313131313131313131313131",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				aliasIndex: "test-doc-id:aaa",
				resourceTypeIndex: "document"
			}
		]);

		const aigId3 = await auditableItemGraphComponent.create(
			{},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const docs = await service.get(documentId);

		const existingEdges = docs.edges ?? [];
		existingEdges.splice(1, 1);

		await service.update(
			documentId,
			undefined,
			undefined,
			[
				...existingEdges.map(edge => ({ id: edge })),
				{
					id: aigId3,
					addAlias: true
				}
			],
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		const aigStore2 = vertexEntityStorage.getStore();
		expect(aigStore2).toEqual([
			{
				id: "2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
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
						id: "aig:3636363636363636363636363636363636363636363636363636363636363636",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "test-doc-id:aaa"
			},
			{
				id: "3131313131313131313131313131313131313131313131313131313131313131",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
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
						id: "aig:3636363636363636363636363636363636363636363636363636363636363636",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"],
						dateDeleted: "2024-08-22T04:13:20.000Z"
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z"
			},
			{
				id: "3636363636363636363636363636363636363636363636363636363636363636",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
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
							nodeIdentity:
								"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
							userIdentity:
								"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
							attestationId:
								"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzUzNTM1MzU=",
							dateModified: "2024-08-22T04:13:20.000Z"
						},
						dateModified: "2024-08-22T04:13:20.000Z"
					}
				],
				edges: [
					{
						id: "aig:2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					},
					{
						id: "aig:3131313131313131313131313131313131313131313131313131313131313131",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"],
						dateDeleted: "2024-08-22T04:13:20.000Z"
					},
					{
						id: "aig:4040404040404040404040404040404040404040404040404040404040404040",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				resourceTypeIndex: "document",
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "test-doc-id:aaa"
			},
			{
				id: "4040404040404040404040404040404040404040404040404040404040404040",
				nodeIdentity:
					"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
				dateCreated: "2024-08-22T04:13:20.000Z",
				aliases: [
					{ id: "test-doc-id:aaa", aliasFormat: "foo", dateCreated: "2024-08-22T04:13:20.000Z" }
				],
				edges: [
					{
						id: "aig:3636363636363636363636363636363636363636363636363636363636363636",
						dateCreated: "2024-08-22T04:13:20.000Z",
						edgeRelationships: ["document"]
					}
				],
				dateModified: "2024-08-22T04:13:20.000Z",
				aliasIndex: "test-doc-id:aaa"
			}
		]);
	});

	test("can get a document from an AIG", async () => {
		const service = new DocumentManagementService();
		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(documentId).toEqual(
			"aig:4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e"
		);

		const docs = await service.get(
			documentId,
			undefined,
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docs).toEqual({
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
					nodeIdentity:
						"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
					userIdentity:
						"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjRkNGQ0ZDRkNGQ0ZDRkNGQ0ZDRkNGQ0ZDRkNGQ0ZDRkNGQ0ZDRkNGQ0ZDRkNGQ0ZDRkNGQ0ZDRkNGQ0ZDRkNGQ=",
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
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(documentId).toEqual(
			"aig:5353535353535353535353535353535353535353535353535353535353535353"
		);

		const docs = await service.get(
			documentId,
			{ includeBlobStorageMetadata: true },
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docs).toEqual({
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
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjUyNTI1MjUyNTI1MjUyNTI1MjUyNTI1MjUyNTI1MjUyNTI1MjUyNTI1MjUyNTI1MjUyNTI1MjUyNTI1MjUyNTI=",
					blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
					blobStorageId:
						"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
					documentCode: "unece:DocumentCodeList#705",
					documentRevision: 0,
					dateCreated: "2024-08-22T04:13:20.000Z",
					nodeIdentity:
						"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
					userIdentity:
						"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
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
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(documentId).toEqual(
			"aig:5858585858585858585858585858585858585858585858585858585858585858"
		);

		const doc = await service.get(
			documentId,
			{ includeBlobStorageMetadata: true, includeBlobStorageData: true },
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(doc).toEqual({
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
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjU3NTc1NzU3NTc1NzU3NTc1NzU3NTc1NzU3NTc1NzU3NTc1NzU3NTc1NzU3NTc1NzU3NTc1NzU3NTc1NzU3NTc=",
					blobHash: "sha256:pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=",
					blobStorageId:
						"blob:memory:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
					documentCode: "unece:DocumentCodeList#705",
					documentRevision: 0,
					dateCreated: "2024-08-22T04:13:20.000Z",
					nodeIdentity:
						"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
					userIdentity:
						"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
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
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: true
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(documentId).toEqual(
			"aig:5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d"
		);

		const docs = await service.get(
			documentId,
			{ includeBlobStorageMetadata: true, includeBlobStorageData: true, includeAttestation: true },
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docs).toEqual({
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
					nodeIdentity:
						"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
					userIdentity:
						"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404",
					attestationId:
						"attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM=",
					attestationInformation: {
						id: "attestation:nft:bmZ0OmVudGl0eS1zdG9yYWdlOjVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM1YzVjNWM=",
						type: "Information",
						dateCreated: "2024-08-22T04:13:20.000Z",
						holderIdentity:
							"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
						ownerIdentity:
							"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
						proof: {
							type: "JwtProof",
							value:
								"eyJraWQiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxI2F0dGVzdGF0aW9uLWFzc2VydGlvbiIsInR5cCI6IkpXVCIsImFsZyI6IkVkRFNBIn0.eyJpc3MiOiJkaWQ6ZW50aXR5LXN0b3JhZ2U6MHgwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxIiwibmJmIjoxNzI0MzAwMDAwLCJzdWIiOiJkb2N1bWVudDpyd1FVcnpfYUx0dm1ZV2pJb2xMVTFQTkhEVFhkMjRSVVZKSDE0SkRlNUs4OjAiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3NjaGVtYS50d2luZGV2Lm9yZy9kb2N1bWVudHMvIiwiaHR0cHM6Ly9zY2hlbWEudHdpbmRldi5vcmcvY29tbW9uLyIsImh0dHBzOi8vc2NoZW1hLm9yZyJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRG9jdW1lbnRBdHRlc3RhdGlvbiJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJkb2N1bWVudElkIjoidGVzdC1kb2MtaWQ6YWFhIiwiZG9jdW1lbnRDb2RlIjoidW5lY2U6RG9jdW1lbnRDb2RlTGlzdCM3MDUiLCJkb2N1bWVudFJldmlzaW9uIjowLCJkYXRlQ3JlYXRlZCI6IjIwMjQtMDgtMjJUMDQ6MTM6MjAuMDAwWiIsImJsb2JIYXNoIjoic2hhMjU2OnBaR20xQXYwSUVCS0FSY3p6N2V4a05Zc1piOEx6YU1yVjdKMzJhMmZGRzQ9In19fQ.BVhqtBBobNS4D6zOj0XIRDoKiMoDNwUmmrdqRgG0LfDXN9wigGC4iM-ADNGuBTKrwHfNiYCKWD1wdBe2JLe8AQ"
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
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		for (let i = 0; i < 5; i++) {
			await service.update(
				documentId,
				Converter.utf8ToBytes(`Hello World${i}`),
				{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
				undefined,
				TEST_USER_IDENTITY,
				TEST_NODE_IDENTITY
			);
		}

		const docs = await service.get(
			"aig:6161616161616161616161616161616161616161616161616161616161616161",
			undefined,
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docs.itemListElement.length).toEqual(1);
		expect(docs.itemListElement[0].documentRevision).toEqual(5);
	});

	test("can get a document from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		for (let i = 0; i < 5; i++) {
			await service.update(
				documentId,
				Converter.utf8ToBytes(`Hello World${i}`),
				{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
				undefined,
				TEST_USER_IDENTITY,
				TEST_NODE_IDENTITY
			);
		}

		const docs = await service.get(
			documentId,
			undefined,
			undefined,
			100,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docs.itemListElement.length).toEqual(6);
		expect(docs.itemListElement[0].documentRevision).toEqual(5);
		expect(docs.itemListElement[1].documentRevision).toEqual(4);
		expect(docs.itemListElement[2].documentRevision).toEqual(3);
		expect(docs.itemListElement[3].documentRevision).toEqual(2);
		expect(docs.itemListElement[4].documentRevision).toEqual(1);
		expect(docs.itemListElement[5].documentRevision).toEqual(0);
	});

	test("can get a document revision from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		for (let i = 0; i < 5; i++) {
			await service.update(
				documentId,
				Converter.utf8ToBytes(`Hello World${i}`),
				{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
				undefined,
				TEST_USER_IDENTITY,
				TEST_NODE_IDENTITY
			);
		}

		const revision = await service.getRevision(
			documentId,
			2,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(revision.documentRevision).toEqual(2);
	});

	test("can remove a specific revision document from an AIG with multiple revisions", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		for (let i = 0; i < 5; i++) {
			await service.update(
				documentId,
				Converter.utf8ToBytes(`Hello World${i}`),
				{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
				undefined,
				TEST_USER_IDENTITY,
				TEST_NODE_IDENTITY
			);
		}

		await service.removeRevision(documentId, 2, TEST_USER_IDENTITY, TEST_NODE_IDENTITY);

		const docs = await service.get(
			documentId,
			undefined,
			undefined,
			20,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docs.itemListElement.length).toEqual(5);

		const docWithDeleted = await service.get(
			documentId,
			{
				includeRemoved: true
			},
			undefined,
			20,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docWithDeleted.itemListElement.length).toEqual(6);
	});

	test("can remove a revision an add new revisions keeping revision count incrementing", async () => {
		const service = new DocumentManagementService();

		const documentId = await service.create(
			"test-doc-id:aaa",
			undefined,
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes("Hello World"),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		await service.update(
			documentId,
			Converter.utf8ToBytes("Hello World2"),
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const docs = await service.get(
			documentId,
			undefined,
			undefined,
			20,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docs.itemListElement.length).toEqual(2);
		expect(docs.itemListElement[0].documentRevision).toEqual(1);
		expect(docs.itemListElement[1].documentRevision).toEqual(0);

		await service.removeRevision(documentId, 1, TEST_USER_IDENTITY, TEST_NODE_IDENTITY);

		const docs2 = await service.get(
			documentId,
			undefined,
			undefined,
			20,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docs2.itemListElement.length).toEqual(1);
		expect(docs2.itemListElement[0].documentRevision).toEqual(0);

		await service.update(
			documentId,
			Converter.utf8ToBytes("Hello World3"),
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const docs3 = await service.get(
			documentId,
			undefined,
			undefined,
			20,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		expect(docs3.itemListElement.length).toEqual(2);
		expect(docs3.itemListElement[0].documentRevision).toEqual(2);
		expect(docs3.itemListElement[1].documentRevision).toEqual(0);

		const docWithDeleted = await service.get(
			documentId,
			{
				includeRemoved: true
			},
			undefined,
			20,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(docWithDeleted.itemListElement.length).toEqual(3);
		expect(docWithDeleted.itemListElement[0].documentRevision).toEqual(2);
		expect(docWithDeleted.itemListElement[1].documentRevision).toEqual(1);
		expect(docWithDeleted.itemListElement[2].documentRevision).toEqual(0);
	});

	test("can query for documents from the aig", async () => {
		const service = new DocumentManagementService();

		for (let i = 0; i < 5; i++) {
			await service.create(
				`test-id-${i}`,
				undefined,
				UneceDocumentCodes.BillOfLading,
				Converter.utf8ToBytes(`Hello World${i}`),
				{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
				undefined,
				{
					createAttestation: false
				},
				TEST_USER_IDENTITY,
				TEST_NODE_IDENTITY
			);
		}

		const vertices = await service.query(
			"test-id",
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		expect(vertices.itemListElement.length).toEqual(5);
	});

	test("can extract data from a document with no blob data returned", async () => {
		const service = new DocumentManagementService();

		const docId = await service.create(
			"test-id",
			undefined,
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
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

		const result = await service.get(
			docId,
			{ extractRuleGroupId: "my-rules" },
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		expect(result.itemListElement[0].blobStorageEntry).toBeUndefined();
		expect(result.itemListElement[0].extractedData).toEqual({
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
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
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

		const result = await service.get(
			docId,
			{ extractRuleGroupId: "my-rules", includeBlobStorageMetadata: true },
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		expect(result.itemListElement[0].blobStorageEntry).toBeDefined();
		expect(result.itemListElement[0].blobStorageEntry?.blob).toBeUndefined();
		expect(result.itemListElement[0].extractedData).toEqual({
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
			UneceDocumentCodes.BillOfLading,
			Converter.utf8ToBytes(JSON.stringify({ address: { line1: "bar" } })),
			{ "@context": "https://schema.org", type: "DigitalDocument", name: "bill-of-lading" },
			undefined,
			{
				createAttestation: false
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
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

		const result = await service.get(
			docId,
			{
				extractRuleGroupId: "my-rules",
				includeBlobStorageMetadata: true,
				includeBlobStorageData: true
			},
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		expect(result.itemListElement[0].blobStorageEntry).toBeDefined();
		expect(result.itemListElement[0].blobStorageEntry?.blob).toBeDefined();
		expect(result.itemListElement[0].extractedData).toEqual({
			address: {
				firstLine: "bar"
			}
		});
	});
});

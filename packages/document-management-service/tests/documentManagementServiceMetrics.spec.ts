// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { TenantIdContextIdHandler } from "@twin.org/api-tenant-processor";
import { NftAttestationConnector } from "@twin.org/attestation-connector-nft";
import { AttestationConnectorFactory } from "@twin.org/attestation-models";
import { AttestationService } from "@twin.org/attestation-service";
import {
	AuditableItemGraphService,
	initSchema as initSchemaAuditableItemGraph,
	type AuditableItemGraphChangeset,
	type AuditableItemGraphVertex
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
import { AlreadyExistsError, ComponentFactory, Converter, RandomHelper } from "@twin.org/core";
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
import { DocumentManagementMetricIds } from "@twin.org/document-management-models";
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
	MetricType,
	type ITelemetryComponent,
	type ITelemetryMetric
} from "@twin.org/telemetry-models";
import {
	EntityStorageVerifiableStorageConnector,
	initSchema as initSchemaVerifiableStorage,
	type VerifiableItem
} from "@twin.org/verifiable-storage-connector-entity-storage";
import { VerifiableStorageConnectorFactory } from "@twin.org/verifiable-storage-models";
import {
	setupTestEnv,
	TEST_NODE_IDENTITY,
	TEST_ORGANIZATION_IDENTITY,
	TEST_TENANT_IDENTITY,
	TEST_USER_IDENTITY
} from "./setupTestEnv.js";
import { DocumentManagementService } from "../src/documentManagementService.js";

const BLOB_V0 = Converter.utf8ToBytes("doc-content-v0");
const BLOB_V1 = Converter.utf8ToBytes("doc-content-v1");
const DOC_ID = "test-doc-id:metrics";
const DOC_CODE = UneceDocumentCodeList.BillOfLading;

interface MetricValueEntry {
	id: string;
	value: "inc" | "dec" | number;
	customData?: { [key: string]: unknown };
}

function makeMockTelemetry(): {
	component: ITelemetryComponent;
	created: ITelemetryMetric[];
	values: MetricValueEntry[];
} {
	const created: ITelemetryMetric[] = [];
	const values: MetricValueEntry[] = [];
	const component: ITelemetryComponent = {
		className: () => "MockTelemetry",
		start: async () => {},
		stop: async () => {},
		createMetric: async m => {
			created.push({ ...m });
		},
		getMetric: async () => ({ metric: {} as never, value: {} as never }),
		updateMetric: async () => {},
		addMetricValue: async (id, value, customData) => {
			values.push({ id, value, customData });
			return "v";
		},
		getMetricValue: async (id, valueId) => ({
			id: valueId,
			metricId: id,
			value: 0,
			ts: Date.now()
		}),
		removeMetric: async () => {},
		query: async () => ({ entities: [] }),
		queryValues: async () => ({ metric: {} as never, entities: [] })
	};
	return { component, created, values };
}

describe("DocumentManagementService — metrics", () => {
	beforeAll(async () => {
		await setupTestEnv();

		initSchemaVerifiableStorage();
		initSchemaImmutableProof();
		initSchemaNotarization();
		initSchemaBackgroundTask();
		initSchemaAuditableItemGraph();
		initSchemaNft();
		initSchemaBlobStorage();
		initSchemaDataProcessing();

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

		ModuleHelper.execModuleMethodThreadMessage = vi
			.fn()
			.mockImplementation((module, completed) => ({
				executeMethod: async (method: string, args?: unknown, contextIds?: IContextIds) => {
					const res = await ModuleHelper.execModuleMethod(module, method, args as unknown[]);
					completed(method, res);
				}
			}));
	});

	beforeEach(async () => {
		const verifiableItemStorage = new MemoryEntityStorageConnector<VerifiableItem>({
			entitySchema: nameof<VerifiableItem>(),
			config: { storageKey: "verifiable-item" }
		});
		EntityStorageConnectorFactory.register("verifiable-item", () => verifiableItemStorage);

		VerifiableStorageConnectorFactory.register(
			"verifiable-storage",
			() => new EntityStorageVerifiableStorageConnector()
		);

		const backgroundTaskStorage = new MemoryEntityStorageConnector<BackgroundTask>({
			entitySchema: "BackgroundTask",
			config: { storageKey: "background-task" }
		});
		EntityStorageConnectorFactory.register("background-task", () => backgroundTaskStorage);

		const backgroundTaskService = new BackgroundTaskService();
		ComponentFactory.register("background-task", () => backgroundTaskService);
		await backgroundTaskService.start();

		const immutableProofStorage = new MemoryEntityStorageConnector<ImmutableProof>({
			entitySchema: "ImmutableProof",
			config: { storageKey: "immutable-proof" }
		});
		EntityStorageConnectorFactory.register("immutable-proof", () => immutableProofStorage);

		const notarizationStorage = new MemoryEntityStorageConnector<Notarization>({
			entitySchema: nameof<Notarization>(),
			config: { storageKey: "notarization" }
		});
		EntityStorageConnectorFactory.register("notarization", () => notarizationStorage);
		NotarizationConnectorFactory.register(
			"notarization",
			() => new EntityStorageNotarizationConnector()
		);

		const immutableProofService = new ImmutableProofService();
		ComponentFactory.register("immutable-proof", () => immutableProofService);
		await immutableProofService.start();

		const vertexStorage = new MemoryEntityStorageConnector<AuditableItemGraphVertex>({
			entitySchema: "AuditableItemGraphVertex",
			config: { storageKey: "auditable-item-graph-vertex" }
		});
		EntityStorageConnectorFactory.register("auditable-item-graph-vertex", () => vertexStorage);

		const changesetStorage = new MemoryEntityStorageConnector<AuditableItemGraphChangeset>({
			entitySchema: "AuditableItemGraphChangeset",
			config: { storageKey: "auditable-item-graph-changeset" }
		});
		EntityStorageConnectorFactory.register(
			"auditable-item-graph-changeset",
			() => changesetStorage
		);

		const auditableItemGraphService = new AuditableItemGraphService();
		ComponentFactory.register("auditable-item-graph", () => auditableItemGraphService);

		const blobEntryStorage = new MemoryEntityStorageConnector<BlobStorageEntry>({
			entitySchema: "BlobStorageEntry",
			config: { storageKey: "blob-storage-entry" }
		});
		EntityStorageConnectorFactory.register("blob-storage-entry", () => blobEntryStorage);

		BlobStorageConnectorFactory.register("memory", () => new MemoryBlobStorageConnector());

		const blobStorageService = new BlobStorageService();
		ComponentFactory.register("blob-storage", () => blobStorageService);

		const nftStorage = new MemoryEntityStorageConnector<Nft>({
			entitySchema: "Nft",
			config: { storageKey: "nft" }
		});
		EntityStorageConnectorFactory.register("nft", () => nftStorage);

		NftConnectorFactory.register("nft", () => new EntityStorageNftConnector());
		AttestationConnectorFactory.register("nft", () => new NftAttestationConnector());

		const attestationService = new AttestationService();
		ComponentFactory.register("attestation", () => attestationService);

		const extractionRuleGroupStorage = new MemoryEntityStorageConnector<ExtractionRuleGroup>({
			entitySchema: "ExtractionRuleGroup",
			config: { storageKey: "extraction-rule-group" }
		});
		EntityStorageConnectorFactory.register(
			"extraction-rule-group",
			() => extractionRuleGroupStorage
		);

		DataExtractorConnectorFactory.register("json-path", () => new JsonPathExtractorConnector());
		DataConverterConnectorFactory.register("application/json", () => new JsonConverterConnector());

		const dataProcessingService = new DataProcessingService();
		ComponentFactory.register("data-processing", () => dataProcessingService);

		const BASE_TICK = 1724300000000;
		Date.now = vi.fn().mockImplementation(() => BASE_TICK);

		let randCounter = 1;
		RandomHelper.generate = vi
			.fn()
			.mockImplementation(length => new Uint8Array(length).fill(randCounter++));
	});

	test("start() registers all 5 counters with type Counter", async () => {
		const { component, created } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });
		await service.start();

		expect(created).toHaveLength(5);
		for (const m of created) {
			expect(m.type).toBe(MetricType.Counter);
		}

		const ids = created.map(m => m.id);
		expect(ids).toContain(DocumentManagementMetricIds.DocumentsCreated);
		expect(ids).toContain(DocumentManagementMetricIds.DocumentsUpdated);
		expect(ids).toContain(DocumentManagementMetricIds.RevisionsCreated);
		expect(ids).toContain(DocumentManagementMetricIds.RevisionsRemoved);
		expect(ids).toContain(DocumentManagementMetricIds.AttestationsCreated);
	});

	test("start() is idempotent — AlreadyExistsError is swallowed", async () => {
		let callCount = 0;
		const component: ITelemetryComponent = {
			...makeMockTelemetry().component,
			createMetric: async () => {
				if (callCount++ > 0) {
					throw new AlreadyExistsError("test", "metric", "id");
				}
			}
		};
		ComponentFactory.register("test-telemetry-idempotent", () => component);

		const service = new DocumentManagementService({
			telemetryComponentType: "test-telemetry-idempotent"
		});
		await service.start();
		await expect(service.start()).resolves.toBeUndefined();
	});

	test("create() without attestation emits dm_documents_created with hasAttestation: false", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });

		await service.create({ documentId: DOC_ID, documentCode: DOC_CODE }, BLOB_V0, undefined, {
			includeAlias: false
		});

		const created = values.filter(v => v.id === DocumentManagementMetricIds.DocumentsCreated);
		expect(created).toHaveLength(1);
		expect(created[0].value).toBe("inc");
		expect(created[0].customData?.hasAttestation).toBe(false);

		expect(
			values.filter(v => v.id === DocumentManagementMetricIds.AttestationsCreated)
		).toHaveLength(0);
	});

	test("create() with includeAttestation: true emits dm_documents_created (hasAttestation: true) and dm_attestations_created", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });

		await service.create({ documentId: DOC_ID, documentCode: DOC_CODE }, BLOB_V0, undefined, {
			includeAlias: false,
			includeAttestation: true
		});

		const created = values.filter(v => v.id === DocumentManagementMetricIds.DocumentsCreated);
		expect(created).toHaveLength(1);
		expect(created[0].customData?.hasAttestation).toBe(true);

		const attestations = values.filter(
			v => v.id === DocumentManagementMetricIds.AttestationsCreated
		);
		expect(attestations).toHaveLength(1);
		expect(attestations[0].value).toBe("inc");
	});

	test("update() with new blob emits dm_revisions_created (hasAttestation: false) and dm_documents_updated (hasNewRevision: true)", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });

		const vertexId = await service.create(
			{ documentId: DOC_ID, documentCode: DOC_CODE },
			BLOB_V0,
			undefined,
			{ includeAlias: false }
		);

		values.length = 0;

		await service.updatePartial(vertexId, undefined, BLOB_V1);

		const revisions = values.filter(v => v.id === DocumentManagementMetricIds.RevisionsCreated);
		expect(revisions).toHaveLength(1);
		expect(revisions[0].value).toBe("inc");
		expect(revisions[0].customData?.hasAttestation).toBe(false);

		const updated = values.filter(v => v.id === DocumentManagementMetricIds.DocumentsUpdated);
		expect(updated).toHaveLength(1);
		expect(updated[0].value).toBe("inc");
		expect(updated[0].customData?.hasNewRevision).toBe(true);
	});

	test("update() of attested document with new blob emits dm_revisions_created (hasAttestation: true), dm_attestations_created, and dm_documents_updated (hasNewRevision: true)", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });

		const vertexId = await service.create(
			{ documentId: DOC_ID, documentCode: DOC_CODE },
			BLOB_V0,
			undefined,
			{ includeAlias: false, includeAttestation: true }
		);

		values.length = 0;

		await service.updatePartial(vertexId, undefined, BLOB_V1);

		const revisions = values.filter(v => v.id === DocumentManagementMetricIds.RevisionsCreated);
		expect(revisions).toHaveLength(1);
		expect(revisions[0].customData?.hasAttestation).toBe(true);

		const attestations = values.filter(
			v => v.id === DocumentManagementMetricIds.AttestationsCreated
		);
		expect(attestations).toHaveLength(1);

		const updated = values.filter(v => v.id === DocumentManagementMetricIds.DocumentsUpdated);
		expect(updated).toHaveLength(1);
		expect(updated[0].customData?.hasNewRevision).toBe(true);
	});

	test("update() with annotation-only change emits only dm_documents_updated (hasNewRevision: false)", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });

		const vertexId = await service.create(
			{ documentId: DOC_ID, documentCode: DOC_CODE },
			BLOB_V0,
			undefined,
			{ includeAlias: false }
		);

		values.length = 0;

		await service.updatePartial(vertexId, {
			annotationObject: {
				"@context": "https://schema.org",
				"@type": "Thing",
				name: "updated-annotation"
			}
		});

		expect(values.filter(v => v.id === DocumentManagementMetricIds.RevisionsCreated)).toHaveLength(
			0
		);

		const updated = values.filter(v => v.id === DocumentManagementMetricIds.DocumentsUpdated);
		expect(updated).toHaveLength(1);
		expect(updated[0].value).toBe("inc");
		expect(updated[0].customData?.hasNewRevision).toBe(false);
	});

	test("updatePartial() no-op (same blob hash, same annotation, no edges) emits no counters", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });

		const vertexId = await service.create(
			{ documentId: DOC_ID, documentCode: DOC_CODE },
			BLOB_V0,
			undefined,
			{ includeAlias: false }
		);

		values.length = 0;

		await service.updatePartial(vertexId, undefined, undefined, undefined);

		expect(values).toHaveLength(0);
	});

	test("removeRevision() emits dm_revisions_removed", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });

		const vertexId = await service.create(
			{ documentId: DOC_ID, documentCode: DOC_CODE },
			BLOB_V0,
			undefined,
			{ includeAlias: false }
		);

		values.length = 0;

		await service.removeRevision(vertexId, 0);

		const removed = values.filter(v => v.id === DocumentManagementMetricIds.RevisionsRemoved);
		expect(removed).toHaveLength(1);
		expect(removed[0].value).toBe("inc");
	});

	test("removeRevision() of non-existent revision throws and emits no counter", async () => {
		const { component, values } = makeMockTelemetry();
		ComponentFactory.register("test-telemetry", () => component);

		const service = new DocumentManagementService({ telemetryComponentType: "test-telemetry" });

		const vertexId = await service.create(
			{ documentId: DOC_ID, documentCode: DOC_CODE },
			BLOB_V0,
			undefined,
			{ includeAlias: false }
		);

		values.length = 0;

		await expect(service.removeRevision(vertexId, 99)).rejects.toThrow();

		expect(values.filter(v => v.id === DocumentManagementMetricIds.RevisionsRemoved)).toHaveLength(
			0
		);
	});

	test("service without telemetryComponentType — all operations succeed, no errors thrown", async () => {
		const service = new DocumentManagementService();

		const vertexId = await service.create(
			{ documentId: DOC_ID, documentCode: DOC_CODE },
			BLOB_V0,
			undefined,
			{ includeAlias: false }
		);
		expect(vertexId).toBeDefined();

		await service.updatePartial(vertexId, undefined, BLOB_V1);

		await service.updatePartial(vertexId, {
			annotationObject: {
				"@context": "https://schema.org",
				"@type": "Thing",
				name: "no-telemetry-annotation"
			}
		});

		await service.removeRevision(vertexId, 1);
	});
});

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IAttestationComponent } from "@twin.org/attestation-models";
import {
	AuditableItemGraphContexts,
	AuditableItemGraphTypes,
	type IAuditableItemGraphVertexList,
	type IAuditableItemGraphComponent,
	type IAuditableItemGraphEdge,
	type IAuditableItemGraphPartialVertex,
	type IAuditableItemGraphResource,
	type IAuditableItemGraphVertex
} from "@twin.org/auditable-item-graph-models";
import type { IBlobStorageComponent } from "@twin.org/blob-storage-models";
import { BlobStorageContexts } from "@twin.org/blob-storage-models";
import { ContextIdKeys, ContextIdStore } from "@twin.org/context";
import {
	BaseError,
	Coerce,
	ComponentFactory,
	Converter,
	GeneralError,
	Guards,
	Is,
	Mutex,
	NotFoundError,
	ObjectHelper,
	Urn
} from "@twin.org/core";
import { IntegrityAlgorithm, IntegrityHelper, Sha256 } from "@twin.org/crypto";
import { JsonLdHelper, JsonLdProcessor, type IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { IDataProcessingComponent } from "@twin.org/data-processing-models";
import {
	DocumentContexts,
	DocumentManagementMetricIds,
	DocumentManagementMetrics,
	DocumentTypes,
	type IDocumentManagementEdgeEntry,
	type IDocument,
	type IDocumentAttestation,
	type IDocumentList,
	type IDocumentManagementComponent
} from "@twin.org/document-management-models";
import { nameof } from "@twin.org/nameof";
import {
	SchemaOrgContexts,
	SchemaOrgDataTypes,
	SchemaOrgTypes
} from "@twin.org/standards-schema-org";
import { UneceDocumentCodeList } from "@twin.org/standards-unece";
import { MetricHelper, type ITelemetryComponent } from "@twin.org/telemetry-models";
import type { IDocumentManagementServiceConstructorOptions } from "./models/IDocumentManagementStorageServiceConstructorOptions.js";

/**
 * Service for performing document management operations.
 */
export class DocumentManagementService implements IDocumentManagementComponent {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DocumentManagementService>();

	/**
	 * The component for the auditable item graph.
	 * @internal
	 */
	private readonly _auditableItemGraphComponent: IAuditableItemGraphComponent;

	/**
	 * The connector for the blob component.
	 * @internal
	 */
	private readonly _blobStorageComponent: IBlobStorageComponent;

	/**
	 * The connector for the attestation.
	 * @internal
	 */
	private readonly _attestationComponent: IAttestationComponent;

	/**
	 * The connector for the data processing.
	 * @internal
	 */
	private readonly _dataProcessingComponent: IDataProcessingComponent;

	/**
	 * The optional telemetry component used for event metrics.
	 * @internal
	 */
	private readonly _telemetryComponent?: ITelemetryComponent;

	/**
	 * The timeout in milliseconds for acquiring a mutex lock.
	 * @internal
	 */
	private readonly _mutexTimeoutMs?: number;

	/**
	 * Create a new instance of DocumentManagementService.
	 * @param options The options for the service.
	 */
	constructor(options?: IDocumentManagementServiceConstructorOptions) {
		this._auditableItemGraphComponent = ComponentFactory.get<IAuditableItemGraphComponent>(
			options?.auditableItemGraphComponentType ?? "auditable-item-graph"
		);
		this._blobStorageComponent = ComponentFactory.get<IBlobStorageComponent>(
			options?.blobStorageComponentType ?? "blob-storage"
		);
		this._attestationComponent = ComponentFactory.get<IAttestationComponent>(
			options?.attestationComponentType ?? "attestation"
		);
		this._dataProcessingComponent = ComponentFactory.get<IDataProcessingComponent>(
			options?.dataProcessingComponentType ?? "data-processing"
		);
		this._telemetryComponent = ComponentFactory.getIfExists<ITelemetryComponent>(
			options?.telemetryComponentType
		);
		this._mutexTimeoutMs = Coerce.integer(options?.config?.mutexTimeoutMs);

		SchemaOrgDataTypes.registerRedirects();
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DocumentManagementService.CLASS_NAME;
	}

	/**
	 * Register all document management metrics with the telemetry component.
	 * @returns A promise that resolves when metrics have been registered.
	 */
	public async start(): Promise<void> {
		if (Is.undefined(this._telemetryComponent)) {
			return;
		}
		await MetricHelper.createMetrics(this._telemetryComponent, DocumentManagementMetrics);
	}

	/**
	 * Store a document as an auditable item graph vertex and add its content to blob storage.
	 * If the document id already exists and the blob data is different a new revision will be created.
	 * For any other changes the current revision will be updated.
	 * @param documentId The document id to create.
	 * @param documentIdFormat The format of the document identifier.
	 * @param documentCode The code for the document type.
	 * @param blob The data to create the document with.
	 * @param annotationObject Additional information to associate with the document.
	 * @param auditableItemGraphEdges The auditable item graph vertices to connect the document to.
	 * @param options Additional options for the set operation.
	 * @param options.createAttestation Flag to create an attestation for the document, defaults to false.
	 * @param options.addAlias Flag to add the document id as an alias to the aig vertex, defaults to true.
	 * @param options.aliasAnnotationObject Annotation object for the alias.
	 * @returns The auditable item graph vertex created for the document including its revision.
	 */
	public async create(
		documentId: string,
		documentIdFormat: string | undefined,
		documentCode: UneceDocumentCodeList,
		blob: Uint8Array,
		annotationObject?: IJsonLdNodeObject,
		auditableItemGraphEdges?: IDocumentManagementEdgeEntry[],
		options?: {
			createAttestation?: boolean;
			addAlias?: boolean;
			aliasAnnotationObject?: IJsonLdNodeObject;
		}
	): Promise<string> {
		Guards.stringValue(DocumentManagementService.CLASS_NAME, nameof(documentId), documentId);
		Guards.arrayOneOf(
			DocumentManagementService.CLASS_NAME,
			nameof(documentCode),
			documentCode,
			Object.values(UneceDocumentCodeList)
		);
		Guards.uint8Array(DocumentManagementService.CLASS_NAME, nameof(blob), blob);

		const contextIds = await ContextIdStore.getContextIds();

		try {
			const documentVertex: Omit<IAuditableItemGraphVertex, "id"> = {
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				type: AuditableItemGraphTypes.Vertex
			};

			if (options?.addAlias ?? true) {
				documentVertex.aliases ??= [];
				documentVertex.aliases.push({
					"@context": AuditableItemGraphContexts.Context,
					type: AuditableItemGraphTypes.Alias,
					id: documentId,
					aliasFormat: documentIdFormat,
					annotationObject: options?.aliasAnnotationObject
				});
			}

			// Add the blob to blob storage
			const blobStorageId = await this._blobStorageComponent.create(Converter.bytesToBase64(blob));

			const currentRevision: IDocument & IJsonLdNodeObject = {
				"@context": [
					SchemaOrgContexts.Context,
					DocumentContexts.Context,
					DocumentContexts.ContextCommon
				],
				type: DocumentTypes.Document,
				id: this.createDocumentId(documentId, 0),
				documentId,
				documentIdFormat,
				documentCode,
				documentRevision: 0,
				annotationObject,
				integrity: IntegrityHelper.generate(IntegrityAlgorithm.Sha256, blob),
				blobStorageId,
				dateCreated: new Date(Date.now()).toISOString(),
				organizationIdentity: contextIds?.[ContextIdKeys.Organization],
				userIdentity: contextIds?.[ContextIdKeys.User]
			};

			if (options?.createAttestation ?? false) {
				currentRevision.attestationId = await this.createAttestation(currentRevision);
			}

			// Add the new revision in to the vertex
			documentVertex.resources ??= [];
			documentVertex.resources.push({
				"@context": AuditableItemGraphContexts.Context,
				type: AuditableItemGraphTypes.Resource,
				resourceObject: currentRevision
			});

			// Add the outgoing edges from the document vertex to each connected item
			if (Is.arrayValue(auditableItemGraphEdges)) {
				documentVertex.edges ??= [];
				for (const aigEdge of auditableItemGraphEdges) {
					documentVertex.edges.push({
						"@context": AuditableItemGraphContexts.Context,
						type: AuditableItemGraphTypes.Edge,
						targetId: aigEdge.targetId,
						edgeRelationships: ["document"]
					});
				}
			}

			// And create the vertex
			const vertexId = await this._auditableItemGraphComponent.create(
				ObjectHelper.removeEmptyProperties(documentVertex)
			);

			// Now add the edges to the connected vertices.
			// isCreatePath = true enables fail-fast + rollback if a target vertex is missing.
			const failingVertexId = await this.updateConnectedEdges(
				vertexId,
				auditableItemGraphEdges ?? [],
				[],
				documentId,
				documentIdFormat,
				true
			);

			if (Is.stringValue(failingVertexId)) {
				// At least one connected vertex was missing. Back-edges already written have been
				// rolled back by updateConnectedEdges. Best-effort cleanup: remove the orphaned
				// blob and soft-delete the document resource so the vertex is left empty.
				try {
					await this._blobStorageComponent.remove(blobStorageId);
				} catch {}
				try {
					await this._auditableItemGraphComponent.updatePartial({
						"@context": [
							AuditableItemGraphContexts.Context,
							AuditableItemGraphContexts.ContextCommon
						],
						id: vertexId,
						resourcePatches: { remove: [currentRevision.id] }
					});
				} catch {}
				throw new NotFoundError(
					DocumentManagementService.CLASS_NAME,
					"connectedVertexNotFound",
					failingVertexId
				);
			}

			await MetricHelper.metricIncrement(
				this._telemetryComponent,
				DocumentManagementMetricIds.DocumentsCreated,
				{ hasAttestation: Is.stringValue(currentRevision.attestationId) }
			);

			return vertexId;
		} catch (error) {
			if (BaseError.someErrorName(error, nameof<NotFoundError>())) {
				throw error;
			}
			throw new GeneralError(
				DocumentManagementService.CLASS_NAME,
				"createFailed",
				undefined,
				error
			);
		}
	}

	/**
	 * Update a document as an auditable item graph vertex and add its content to blob storage.
	 * If the blob data is different a new revision will be created.
	 * For any other changes the current revision will be updated.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param blob The data to update the document with.
	 * @param annotationObject Additional information to associate with the document.
	 * @param auditableItemGraphEdges Explicit edge delta to apply. If undefined, existing connections
	 * are retained unchanged. Use `add` to create new connections and `remove` to disconnect existing
	 * ones by their target vertex id. To update alias metadata on an already-connected vertex, include
	 * it in `add` with the updated `aliasAnnotationObject` — AIG's alias patch is an upsert, so the
	 * alias is updated in place without creating a duplicate back-edge.
	 * @param auditableItemGraphEdges.add Connections to add; each creates a back-edge on the connected vertex.
	 * @param auditableItemGraphEdges.remove Target vertex IDs to disconnect; their back-edges are removed.
	 * @returns A promise that resolves when the document has been updated.
	 */
	public async updatePartial(
		auditableItemGraphDocumentId: string,
		blob?: Uint8Array,
		annotationObject?: IJsonLdNodeObject,
		auditableItemGraphEdges?: {
			add?: IDocumentManagementEdgeEntry[];
			remove?: string[];
		}
	): Promise<void> {
		Urn.guard(
			DocumentManagementService.CLASS_NAME,
			nameof(auditableItemGraphDocumentId),
			auditableItemGraphDocumentId
		);

		await Mutex.lock(auditableItemGraphDocumentId, {
			throwOnTimeout: true,
			timeoutMs: this._mutexTimeoutMs
		});
		try {
			const documentVertex = await this._auditableItemGraphComponent.get(
				auditableItemGraphDocumentId,
				{ includeDeleted: true }
			);

			if (Is.empty(documentVertex.resources)) {
				throw new NotFoundError(DocumentManagementService.CLASS_NAME, "documentRevisionNone");
			}

			const documents = await this.getDocumentsFromVertex(documentVertex);
			const latestRevision: IDocument | undefined = documents.entries.itemListElement[0];

			documentVertex.resources = documentVertex.resources.filter(r => Is.empty(r.dateDeleted));

			if (Is.empty(latestRevision)) {
				throw new NotFoundError(DocumentManagementService.CLASS_NAME, "documentRevisionNone");
			}

			// If auditableItemGraphEdges is undefined we are not updating the edges
			// an empty array can be passed to remove all edges

			const resourcePatchesAdd: IAuditableItemGraphResource[] = [];
			let blobRevisionCreated = false;
			let newRevisionHasAttestation = false;

			// If the blob is set and its hash has changed then we create a new revision
			if (Is.uint8Array(blob)) {
				const newIntegrity = IntegrityHelper.generate(IntegrityAlgorithm.Sha256, blob);

				if (latestRevision.integrity !== newIntegrity) {
					// Add the blob to blob storage
					const blobStorageId = await this._blobStorageComponent.create(
						Converter.bytesToBase64(blob)
					);

					const newRevision = ObjectHelper.clone(latestRevision);

					newRevision.documentRevision++;
					newRevision.id = this.createDocumentId(
						newRevision.documentId,
						newRevision.documentRevision
					);
					newRevision.integrity = newIntegrity;
					newRevision.blobStorageId = blobStorageId;
					if (!Is.empty(annotationObject)) {
						newRevision.annotationObject = annotationObject;
					}

					if (Is.stringValue(latestRevision.attestationId)) {
						newRevision.attestationId = await this.createAttestation(newRevision);
					}

					resourcePatchesAdd.push({
						"@context": AuditableItemGraphContexts.Context,
						type: AuditableItemGraphTypes.Resource,
						resourceObject: JsonLdHelper.toNodeObject(newRevision)
					});

					newRevisionHasAttestation = Is.stringValue(newRevision.attestationId);
					blobRevisionCreated = true;
				} else if (Is.stringValue(latestRevision.dateDeleted)) {
					// Same content as the most recent (soft-deleted) revision — restore it.
					const restoredRevision = ObjectHelper.clone(latestRevision);
					delete restoredRevision.dateDeleted;
					if (!Is.empty(annotationObject)) {
						restoredRevision.annotationObject = annotationObject;
					}
					resourcePatchesAdd.push({
						"@context": AuditableItemGraphContexts.Context,
						type: AuditableItemGraphTypes.Resource,
						resourceObject: JsonLdHelper.toNodeObject(restoredRevision)
					});
					blobRevisionCreated = true;
				}
			}

			// If the blob wasn't updated but the annotation object was explicitly provided and has
			// changed, update the current revision instead of creating a new one.
			// Undefined means "no change" in patch semantics — it does not clear the annotation.
			if (
				!blobRevisionCreated &&
				!Is.empty(annotationObject) &&
				!ObjectHelper.equal(latestRevision.annotationObject, annotationObject)
			) {
				latestRevision.annotationObject = annotationObject;
				latestRevision.dateModified = new Date(Date.now()).toISOString();
				resourcePatchesAdd.push(
					ObjectHelper.removeEmptyProperties({
						"@context": AuditableItemGraphContexts.Context,
						type: AuditableItemGraphTypes.Resource,
						resourceObject: JsonLdHelper.toNodeObject(latestRevision)
					})
				);
			}

			// Build document-vertex edge patches directly from the explicit delta.
			const edgesToAdd = auditableItemGraphEdges?.add ?? [];
			const edgeTargetIdsToRemove = auditableItemGraphEdges?.remove ?? [];
			const hasEdgeChanges =
				!Is.empty(auditableItemGraphEdges) &&
				(edgesToAdd.length > 0 || edgeTargetIdsToRemove.length > 0);

			const documentEdgePatchesAdd: IAuditableItemGraphEdge[] = edgesToAdd.map(aigEdge => ({
				"@context": AuditableItemGraphContexts.Context,
				type: AuditableItemGraphTypes.Edge,
				targetId: aigEdge.targetId,
				edgeRelationships: ["document"]
			}));

			// Resolve remove targetIds to stored edge IDs for the document vertex patch.
			const documentEdgePatchesRemove: string[] = edgeTargetIdsToRemove
				.map(
					targetId =>
						documentVertex.edges?.find(e => e.targetId === targetId && Is.empty(e.dateDeleted))?.id
				)
				.filter((id): id is string => Is.stringValue(id));

			if (resourcePatchesAdd.length > 0 || hasEdgeChanges) {
				const partial: IAuditableItemGraphPartialVertex = {
					"@context": [
						AuditableItemGraphContexts.Context,
						AuditableItemGraphContexts.ContextCommon
					],
					id: auditableItemGraphDocumentId
				};
				if (resourcePatchesAdd.length > 0) {
					partial.resourcePatches = { add: resourcePatchesAdd };
				}
				if (hasEdgeChanges) {
					partial.edgePatches = {
						...(documentEdgePatchesAdd.length > 0 ? { add: documentEdgePatchesAdd } : {}),
						...(documentEdgePatchesRemove.length > 0 ? { remove: documentEdgePatchesRemove } : {})
					};
				}
				await this._auditableItemGraphComponent.updatePartial(partial);
			}

			if (hasEdgeChanges) {
				await this.updateConnectedEdges(
					auditableItemGraphDocumentId,
					edgesToAdd,
					edgeTargetIdsToRemove,
					latestRevision.documentId,
					latestRevision.documentIdFormat
				);
			}

			const updatedVertex = resourcePatchesAdd.length > 0 || hasEdgeChanges;
			if (blobRevisionCreated) {
				await MetricHelper.metricIncrement(
					this._telemetryComponent,
					DocumentManagementMetricIds.RevisionsCreated,
					{ hasAttestation: newRevisionHasAttestation }
				);
			}
			if (updatedVertex) {
				await MetricHelper.metricIncrement(
					this._telemetryComponent,
					DocumentManagementMetricIds.DocumentsUpdated,
					{ hasNewRevision: blobRevisionCreated }
				);
			}
		} catch (error) {
			if (BaseError.someErrorName(error, nameof<NotFoundError>())) {
				throw error;
			}
			throw new GeneralError(
				DocumentManagementService.CLASS_NAME,
				"updateFailed",
				undefined,
				error
			);
		} finally {
			Mutex.unlock(auditableItemGraphDocumentId);
		}
	}

	/**
	 * Get a document using it's auditable item graph vertex id and optional revision.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param options Additional options for the get operation.
	 * @param options.includeBlobStorageMetadata Flag to include the blob storage metadata for the document, defaults to false.
	 * @param options.includeBlobStorageData Flag to include the blob storage data for the document, defaults to false.
	 * @param options.includeAttestation Flag to include the attestation information for the document, defaults to false.
	 * @param options.includeRemoved Flag to include deleted documents, defaults to false.
	 * @param options.includeDeletedEdges Flag to include soft-deleted edges in the response, defaults to false.
	 * @param options.extractRuleGroupId If provided will extract data from the document using the specified rule group id.
	 * @param options.extractMimeType By default extraction will auto detect the mime type of the document, this can be used to override the detection.
	 * @param cursor The cursor to get the next chunk of revisions.
	 * @param limit Limit the number of items to return, defaults to 1 so only most recent is returned.
	 * @returns The documents and revisions if requested, ordered by revision descending, cursor is set if there are more document revisions.
	 */
	public async get(
		auditableItemGraphDocumentId: string,
		options?: {
			includeBlobStorageMetadata?: boolean;
			includeBlobStorageData?: boolean;
			includeAttestation?: boolean;
			includeRemoved?: boolean;
			includeDeletedEdges?: boolean;
			extractRuleGroupId?: string;
			extractMimeType?: string;
		},
		cursor?: string,
		limit?: number
	): Promise<{
		entries: IDocumentList;
		cursor?: string;
	}> {
		Urn.guard(
			DocumentManagementService.CLASS_NAME,
			nameof(auditableItemGraphDocumentId),
			auditableItemGraphDocumentId
		);

		try {
			const documentVertex = await this._auditableItemGraphComponent.get(
				auditableItemGraphDocumentId,
				{
					includeDeleted:
						(options?.includeRemoved ?? false) || (options?.includeDeletedEdges ?? false)
				}
			);

			// If we fetched deleted items to expose edges but the caller did not ask for deleted
			// documents, strip the deleted resources so they don't appear in the output.
			if ((options?.includeDeletedEdges ?? false) && !(options?.includeRemoved ?? false)) {
				documentVertex.resources = documentVertex.resources?.filter(r => Is.empty(r.dateDeleted));
			}

			// Populate the document and revisions with the options set
			const documents = await this.getDocumentsFromVertex(documentVertex, options, cursor, limit);

			const result = await JsonLdProcessor.compact(
				documents.entries,
				documents.entries["@context"]
			);
			return {
				entries: result,
				cursor: documents.cursor
			};
		} catch (error) {
			if (BaseError.someErrorName(error, nameof<NotFoundError>())) {
				throw error;
			}
			throw new GeneralError(DocumentManagementService.CLASS_NAME, "getFailed", undefined, error);
		}
	}

	/**
	 * Get a document revision using it's auditable item graph vertex id.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param revision The revision id for the document.
	 * @param options Additional options for the get operation.
	 * @param options.includeBlobStorageMetadata Flag to include the blob storage metadata for the document, defaults to false.
	 * @param options.includeBlobStorageData Flag to include the blob storage data for the document, defaults to false.
	 * @param options.includeAttestation Flag to include the attestation information for the document, defaults to false.
	 * @param options.extractRuleGroupId If provided will extract data from the document using the specified rule group id.
	 * @param options.extractMimeType By default extraction will auto detect the mime type of the document, this can be used to override the detection.
	 * @returns The document for the specified revision.
	 */
	public async getRevision(
		auditableItemGraphDocumentId: string,
		revision: number,
		options?: {
			includeBlobStorageMetadata?: boolean;
			includeBlobStorageData?: boolean;
			includeAttestation?: boolean;
			extractRuleGroupId?: string;
			extractMimeType?: string;
		}
	): Promise<IDocument> {
		Urn.guard(
			DocumentManagementService.CLASS_NAME,
			nameof(auditableItemGraphDocumentId),
			auditableItemGraphDocumentId
		);
		Guards.integer(DocumentManagementService.CLASS_NAME, nameof(revision), revision);

		try {
			const documentVertex = await this._auditableItemGraphComponent.get(
				auditableItemGraphDocumentId,
				{ includeDeleted: true }
			);

			if (Is.empty(documentVertex.resources)) {
				throw new NotFoundError(DocumentManagementService.CLASS_NAME, "documentRevisionNone");
			}

			documentVertex.resources = documentVertex.resources.filter(
				d => d.resourceObject?.documentRevision === revision
			);

			if (documentVertex.resources.length === 0) {
				throw new NotFoundError(
					DocumentManagementService.CLASS_NAME,
					"documentRevisionNotFound",
					revision.toString()
				);
			}

			// Populate the document and revisions with the options set
			const docList = await this.getDocumentsFromVertex(documentVertex, options);

			const result = await JsonLdProcessor.compact(
				docList.entries.itemListElement[0],
				docList.entries.itemListElement[0]["@context"]
			);
			return result;
		} catch (error) {
			if (BaseError.someErrorName(error, nameof<NotFoundError>())) {
				throw error;
			}
			throw new GeneralError(
				DocumentManagementService.CLASS_NAME,
				"getRevisionFailed",
				undefined,
				error
			);
		}
	}

	/**
	 * Remove an auditable item graph vertex using it's id.
	 * The document dateDeleted will be set, but can still be queried with the includeRemoved flag.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param revision The revision of the document to remove.
	 * @returns A promise that resolves when the revision has been removed.
	 */
	public async removeRevision(
		auditableItemGraphDocumentId: string,
		revision: number
	): Promise<void> {
		Urn.guard(
			DocumentManagementService.CLASS_NAME,
			nameof(auditableItemGraphDocumentId),
			auditableItemGraphDocumentId
		);
		Guards.integer(DocumentManagementService.CLASS_NAME, nameof(revision), revision);

		await Mutex.lock(auditableItemGraphDocumentId, {
			throwOnTimeout: true,
			timeoutMs: this._mutexTimeoutMs
		});
		try {
			const documentVertex = await this._auditableItemGraphComponent.get(
				auditableItemGraphDocumentId
			);

			if (Is.empty(documentVertex.resources)) {
				throw new NotFoundError(DocumentManagementService.CLASS_NAME, "documentRevisionNone");
			}

			const docRevisionIndex = documentVertex.resources.findIndex(
				d => d.resourceObject?.documentRevision === revision
			);

			if (docRevisionIndex === -1) {
				throw new NotFoundError(
					DocumentManagementService.CLASS_NAME,
					"documentRevisionNotFound",
					revision.toString()
				);
			}

			const revisionResourceId =
				(documentVertex.resources[docRevisionIndex].resourceObject?.id as string | undefined) ??
				(documentVertex.resources[docRevisionIndex].resourceObject?.["@id"] as string | undefined);

			if (!Is.stringValue(revisionResourceId)) {
				// The revision exists but its stored resource-id is unresolvable — integrity anomaly.
				throw new GeneralError(DocumentManagementService.CLASS_NAME, "documentRevisionMissingId", {
					revision
				});
			}

			await this._auditableItemGraphComponent.updatePartial({
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				id: auditableItemGraphDocumentId,
				resourcePatches: { remove: [revisionResourceId] }
			});
			await MetricHelper.metricIncrement(
				this._telemetryComponent,
				DocumentManagementMetricIds.RevisionsRemoved
			);
		} catch (error) {
			if (BaseError.someErrorName(error, nameof<NotFoundError>())) {
				throw error;
			}
			throw new GeneralError(
				DocumentManagementService.CLASS_NAME,
				"removeRevisionFailed",
				undefined,
				error
			);
		} finally {
			Mutex.unlock(auditableItemGraphDocumentId);
		}
	}

	/**
	 * Find all the document with a specific id.
	 * @param documentId The document id to find in the graph.
	 * @param cursor The cursor to get the next chunk of documents.
	 * @param limit The limit to get the next chunk of documents.
	 * @returns The graph vertices that contain documents referencing the specified document id.
	 */
	public async query(
		documentId: string,
		cursor?: string,
		limit?: number
	): Promise<{
		entries: IAuditableItemGraphVertexList;
		cursor?: string;
	}> {
		Guards.stringValue(DocumentManagementService.CLASS_NAME, nameof(documentId), documentId);

		try {
			const result = await this._auditableItemGraphComponent.query(
				{
					id: documentId,
					idMode: "both",
					resourceTypes: [DocumentTypes.Document]
				},
				undefined,
				undefined,
				undefined,
				["id", "dateCreated", "dateModified", "aliases", "annotationObject", "resources", "edges"],
				cursor,
				limit
			);
			return result;
		} catch (error) {
			if (BaseError.someErrorName(error, nameof<NotFoundError>())) {
				throw error;
			}
			throw new GeneralError(DocumentManagementService.CLASS_NAME, "queryFailed", undefined, error);
		}
	}

	/**
	 * Update the edges on connected vertices using non-destructive patch operations.
	 * Uses updatePartial so AIG's per-vertex Mutex serialises concurrent callers.
	 *
	 * On the **create path** (`isCreatePath = true`) the method is fail-fast:
	 * if any back-edge write fails (target vertex does not exist), all back-edges
	 * already written in this call are removed (best-effort rollback) and the
	 * failing target vertex ID is returned so the caller can surface a meaningful error.
	 *
	 * On the **update path** each missing vertex is caught individually; the remaining
	 * updates continue and `undefined` is always returned.
	 * @param auditableItemGraphDocumentId The document id to use.
	 * @param edgesToAdd Connections to add — each connected vertex receives a new back-edge.
	 * @param edgeTargetIdsToRemove Target vertex IDs to disconnect — their back-edges are removed.
	 * @param documentId The document identifier.
	 * @param documentIdFormat The format of the document identifier.
	 * @param isCreatePath When true, enables fail-fast + rollback semantics.
	 * @returns The failing target vertex ID when `isCreatePath` is true and a write fails;
	 * `undefined` on success or when called from the update path.
	 * @internal
	 */
	private async updateConnectedEdges(
		auditableItemGraphDocumentId: string,
		edgesToAdd: IDocumentManagementEdgeEntry[],
		edgeTargetIdsToRemove: string[],
		documentId: string,
		documentIdFormat: string | undefined,
		isCreatePath: boolean = false
	): Promise<string | undefined> {
		// Track which target IDs received a successful back-edge write so we can roll back
		// if a later write fails (create path only).
		const writtenTargetIds: string[] = [];

		// Add back-edges to each newly connected vertex.
		for (const aigEdge of edgesToAdd) {
			const partial: IAuditableItemGraphPartialVertex = {
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				id: aigEdge.targetId,
				edgePatches: {
					add: [
						{
							"@context": AuditableItemGraphContexts.Context,
							type: AuditableItemGraphTypes.Edge,
							targetId: auditableItemGraphDocumentId,
							edgeRelationships: ["document"]
						}
					]
				}
			};

			if (aigEdge.addAlias) {
				partial.aliasPatches = {
					add: [
						{
							"@context": AuditableItemGraphContexts.Context,
							type: AuditableItemGraphTypes.Alias,
							id: documentId,
							aliasFormat: documentIdFormat,
							annotationObject: aigEdge.aliasAnnotationObject
						}
					]
				};
			}

			if (isCreatePath) {
				try {
					await this._auditableItemGraphComponent.updatePartial(partial);
					writtenTargetIds.push(aigEdge.targetId);
				} catch {
					// Rollback all back-edges already written before this failure.
					await this.rollbackConnectedEdges(
						auditableItemGraphDocumentId,
						writtenTargetIds,
						documentId
					);
					return aigEdge.targetId;
				}
			} else {
				try {
					await this._auditableItemGraphComponent.updatePartial(partial);
				} catch {
					// Best-effort on the update path — swallow to avoid interrupting remaining back-edge writes.
				}
			}
		}

		// Remove back-edges from disconnected vertices.
		for (const staleTargetId of edgeTargetIdsToRemove) {
			// Fetch to resolve the stored edge ID; the write is still Mutex-protected.
			const connected = await this._auditableItemGraphComponent.get(staleTargetId);

			const edgeId = connected.edges?.find(
				e => Is.empty(e.dateDeleted) && e.targetId === auditableItemGraphDocumentId
			)?.id;

			const hasAlias =
				Is.arrayValue(connected.aliases) &&
				connected.aliases.some(a => Is.empty(a.dateDeleted) && a.id === documentId);

			const partial: IAuditableItemGraphPartialVertex = {
				"@context": [AuditableItemGraphContexts.Context, AuditableItemGraphContexts.ContextCommon],
				id: staleTargetId
			};

			if (hasAlias) {
				partial.aliasPatches = { remove: [documentId] };
			}

			if (Is.stringValue(edgeId)) {
				partial.edgePatches = { remove: [edgeId] };
			}

			if (hasAlias || Is.stringValue(edgeId)) {
				await this._auditableItemGraphComponent.updatePartial(partial);
			}
		}

		return undefined;
	}

	/**
	 * Best-effort removal of back-edges that were written during a failed create operation.
	 * Errors are silently swallowed to avoid masking the original failure.
	 * @param auditableItemGraphDocumentId The document vertex whose back-edges should be removed.
	 * @param targetIds The connected vertex IDs that received a back-edge.
	 * @param documentId The document identifier used for alias cleanup.
	 * @internal
	 */
	private async rollbackConnectedEdges(
		auditableItemGraphDocumentId: string,
		targetIds: string[],
		documentId: string
	): Promise<void> {
		for (const targetId of targetIds) {
			try {
				const connected = await this._auditableItemGraphComponent.get(targetId);

				const edgeId = connected.edges?.find(
					e => Is.empty(e.dateDeleted) && e.targetId === auditableItemGraphDocumentId
				)?.id;

				const hasAlias =
					Is.arrayValue(connected.aliases) &&
					connected.aliases.some(a => Is.empty(a.dateDeleted) && a.id === documentId);

				const partial: IAuditableItemGraphPartialVertex = {
					"@context": [
						AuditableItemGraphContexts.Context,
						AuditableItemGraphContexts.ContextCommon
					],
					id: targetId
				};

				if (hasAlias) {
					partial.aliasPatches = { remove: [documentId] };
				}

				if (Is.stringValue(edgeId)) {
					partial.edgePatches = { remove: [edgeId] };
				}

				if (hasAlias || Is.stringValue(edgeId)) {
					await this._auditableItemGraphComponent.updatePartial(partial);
				}
			} catch {
				// Best-effort — do not let cleanup errors mask the original failure.
			}
		}
	}

	/**
	 * Get the documents from the auditable item graph vertex.
	 * @param documentVertex The vertex containing the documents.
	 * @param options Additional options for the get operation.
	 * @param options.includeBlobStorageMetadata Flag to include the blob storage metadata for the document, defaults to false.
	 * @param options.includeBlobStorageData Flag to include the blob storage data for the document, defaults to false.
	 * @param options.includeAttestation Flag to include the attestation information for the document, defaults to false.
	 * @param options.includeDeletedEdges Flag to include soft-deleted edges in the response, defaults to false.
	 * @param options.extractRuleGroupId If provided will extract data from the document using the specified rule group id.
	 * @param options.extractMimeType By default extraction will auto detect the mime type of the document, this can be used to override the detection.
	 * @param cursor The cursor to get the next chunk of revisions.
	 * @param limit Limit the number of items to return, defaults to 1 so only most recent is returned.
	 * @returns The finalised list of documents.
	 * @internal
	 */
	private async getDocumentsFromVertex(
		documentVertex: IAuditableItemGraphVertex,
		options?: {
			includeBlobStorageMetadata?: boolean;
			includeBlobStorageData?: boolean;
			includeAttestation?: boolean;
			includeDeletedEdges?: boolean;
			extractRuleGroupId?: string;
			extractMimeType?: string;
		},
		cursor?: string,
		limit?: number
	): Promise<{
		entries: IDocumentList;
		cursor?: string;
	}> {
		const docList: IDocumentList = {
			"@context": [
				SchemaOrgContexts.Context,
				DocumentContexts.Context,
				DocumentContexts.ContextCommon
			],
			type: SchemaOrgTypes.ItemList,
			[SchemaOrgTypes.ItemListElement]: []
		};

		let nextCursor: string | undefined;

		if (Is.arrayValue(documentVertex.resources)) {
			// Sort by newest revision first
			documentVertex.resources.sort(
				(a, b) =>
					(Coerce.number(b.resourceObject?.documentRevision) ?? 0) -
					(Coerce.number(a.resourceObject?.documentRevision) ?? 0)
			);

			const startIndex = Coerce.integer(cursor) ?? 0;
			const endIndex = Math.min(startIndex + (limit ?? 1), documentVertex.resources.length);
			const slicedResources = documentVertex.resources.slice(startIndex, endIndex);
			nextCursor = documentVertex.resources.length > endIndex ? endIndex.toString() : undefined;

			const includeBlobStorageMetadata = options?.includeBlobStorageMetadata ?? false;
			const includeBlobStorageData = options?.includeBlobStorageData ?? false;
			const includeAttestation = options?.includeAttestation ?? false;
			const extractData = Is.stringValue(options?.extractRuleGroupId);

			for (let i = 0; i < slicedResources.length; i++) {
				const document = slicedResources[i].resourceObject as unknown as IDocument;
				if (Is.object(document)) {
					document.dateDeleted = slicedResources[i].dateDeleted;

					docList[SchemaOrgTypes.ItemListElement].push(document);

					const blobRequired = includeBlobStorageMetadata || includeBlobStorageData;
					if (blobRequired || extractData) {
						const blobEntry = await this._blobStorageComponent.get(document.blobStorageId, {
							includeContent: includeBlobStorageData || extractData
						});

						if (blobRequired) {
							document.blobStorageEntry = blobEntry;
							if (Is.object(document.blobStorageEntry)) {
								ObjectHelper.propertyDelete(document.blobStorageEntry, "@context");
							}

							if (!docList["@context"].includes(BlobStorageContexts.Context)) {
								docList["@context"].push(BlobStorageContexts.Context);
							}
						}

						if (Is.stringValue(options?.extractRuleGroupId) && Is.stringValue(blobEntry.blob)) {
							const binaryBlob = Converter.base64ToBytes(blobEntry.blob);
							document.extractedData = await this._dataProcessingComponent.extract(
								options.extractRuleGroupId,
								binaryBlob,
								undefined,
								options?.extractMimeType
							);
						}

						// If we have the blob data due to extraction but we weren't asked for it
						// then we remove it from the document
						if (!blobRequired) {
							delete document.blobStorageEntry;
						} else if (!includeBlobStorageData) {
							delete document.blobStorageEntry?.blob;
						}
					}

					if (includeAttestation && Is.stringValue(document.attestationId)) {
						const attestationInformation = await this._attestationComponent.get(
							document.attestationId
						);
						document.attestationInformation = attestationInformation;
						if (Is.object(document.attestationInformation)) {
							ObjectHelper.propertyDelete(document.attestationInformation, "@context");
						}
					}
				}
			}
		}

		if (Is.arrayValue(documentVertex.edges)) {
			docList.edges ??= [];

			for (const edge of documentVertex.edges) {
				if (
					Is.object(edge) &&
					((options?.includeDeletedEdges ?? false) || Is.empty(edge.dateDeleted))
				) {
					docList.edges.push(edge.targetId);
				}
			}
		}

		return {
			entries: docList,
			cursor: nextCursor
		};
	}

	/**
	 * Create an attestation for the document.
	 * @param document The document to create the attestation for.
	 * @returns The attestation identifier.
	 * @internal
	 */
	private async createAttestation(document: IDocument): Promise<string> {
		const documentAttestation: IDocumentAttestation & IJsonLdNodeObject = {
			"@context": [
				SchemaOrgContexts.Context,
				DocumentContexts.Context,
				DocumentContexts.ContextCommon
			],
			type: DocumentTypes.DocumentAttestation,
			id: document.id,
			documentId: document.documentId,
			documentCode: document.documentCode,
			documentRevision: document.documentRevision,
			dateCreated: document.dateCreated,
			integrity: document.integrity
		};
		const attestationId = await this._attestationComponent.create(documentAttestation);
		await MetricHelper.metricIncrement(
			this._telemetryComponent,
			DocumentManagementMetricIds.AttestationsCreated
		);
		return attestationId;
	}

	/**
	 * Create a document id from the document id and revision.
	 * @param documentId The document id to create.
	 * @param revision The revision of the document.
	 * @returns The document id.
	 * @internal
	 */
	private createDocumentId(documentId: string, revision: number): string {
		const documentIdHash = Converter.bytesToBase64Url(
			Sha256.sum256(Converter.utf8ToBytes(documentId))
		);
		return `document:${documentIdHash}:${revision}`;
	}
}

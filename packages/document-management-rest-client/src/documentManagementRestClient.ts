// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import type {
	IBaseRestClientConfig,
	ICreatedResponse,
	INoContentResponse
} from "@twin.org/api-models";
import type { IAuditableItemGraphVertexList } from "@twin.org/auditable-item-graph-models";
import { Coerce, Converter, Guards, Is, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type {
	IDocument,
	IDocumentList,
	IDocumentManagementComponent,
	IDocumentManagementCreateRequest,
	IDocumentManagementGetRequest,
	IDocumentManagementGetResponse,
	IDocumentManagementGetRevisionRequest,
	IDocumentManagementGetRevisionResponse,
	IDocumentManagementQueryRequest,
	IDocumentManagementQueryResponse,
	IDocumentManagementRemoveRequest,
	IDocumentManagementUpdateRequest
} from "@twin.org/document-management-models";
import { nameof } from "@twin.org/nameof";
import { DocumentCodeList } from "@twin.org/standards-unece";

/**
 * Client for performing document management through to REST endpoints.
 */
export class DocumentManagementRestClient
	extends BaseRestClient
	implements IDocumentManagementComponent
{
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DocumentManagementRestClient>();

	/**
	 * Create a new instance of DocumentManagementRestClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(DocumentManagementRestClient.CLASS_NAME, config, "document-management");
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DocumentManagementRestClient.CLASS_NAME;
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
		documentCode: DocumentCodeList,
		blob: Uint8Array,
		annotationObject?: IJsonLdNodeObject,
		auditableItemGraphEdges?: {
			targetId: string;
			addAlias?: boolean;
			aliasAnnotationObject?: IJsonLdNodeObject;
		}[],
		options?: {
			createAttestation?: boolean;
			addAlias?: boolean;
			aliasAnnotationObject?: IJsonLdNodeObject;
		}
	): Promise<string> {
		Guards.stringValue(DocumentManagementRestClient.CLASS_NAME, nameof(documentId), documentId);
		Guards.arrayOneOf(
			DocumentManagementRestClient.CLASS_NAME,
			nameof(documentCode),
			documentCode,
			Object.values(DocumentCodeList)
		);
		Guards.uint8Array(DocumentManagementRestClient.CLASS_NAME, nameof(blob), blob);

		const response = await this.fetch<IDocumentManagementCreateRequest, ICreatedResponse>(
			"/",
			"POST",
			{
				body: {
					documentId,
					documentIdFormat,
					documentCode,
					blob: Converter.bytesToBase64(blob),
					annotationObject,
					auditableItemGraphEdges,
					createAttestation: options?.createAttestation,
					addAlias: options?.addAlias,
					aliasAnnotationObject: options?.aliasAnnotationObject
				}
			}
		);

		return response.headers.location;
	}

	/**
	 * Update a document as an auditable item graph vertex and add its content to blob storage.
	 * If the blob data is different a new revision will be created.
	 * For any other changes the current revision will be updated.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param blob The data to update the document with.
	 * @param annotationObject Additional information to associate with the document.
	 * @param auditableItemGraphEdges The auditable item graph vertices to connect the document to, if undefined retains current connections.
	 * @returns Nothing.
	 */
	public async update(
		auditableItemGraphDocumentId: string,
		blob?: Uint8Array,
		annotationObject?: IJsonLdNodeObject,
		auditableItemGraphEdges?: {
			targetId: string;
			addAlias?: boolean;
			aliasAnnotationObject?: IJsonLdNodeObject;
		}[]
	): Promise<void> {
		Urn.guard(
			DocumentManagementRestClient.CLASS_NAME,
			nameof(auditableItemGraphDocumentId),
			auditableItemGraphDocumentId
		);

		await this.fetch<IDocumentManagementUpdateRequest, INoContentResponse>(
			"/:auditableItemGraphDocumentId",
			"PUT",
			{
				pathParams: {
					auditableItemGraphDocumentId
				},
				body: {
					blob: Is.uint8Array(blob) ? Converter.bytesToBase64(blob) : undefined,
					annotationObject,
					auditableItemGraphEdges
				}
			}
		);
	}

	/**
	 * Get a document using it's auditable item graph vertex id and optional revision.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param options Additional options for the get operation.
	 * @param options.includeBlobStorageMetadata Flag to include the blob storage metadata for the document, defaults to false.
	 * @param options.includeBlobStorageData Flag to include the blob storage data for the document, defaults to false.
	 * @param options.includeAttestation Flag to include the attestation information for the document, defaults to false.
	 * @param options.includeRemoved Flag to include deleted documents, defaults to false.
	 * @param options.extractRuleGroupId If provided will extract data from the document using the specified rule group id.
	 * @param options.extractMimeType By default extraction will auto detect the mime type of the document, this can be used to override the detection.
	 * @param cursor The cursor to get the next chunk of revisions.
	 * @param limit The limit of items to return, defaults to 1 so only most recent is returned.
	 * @returns The documents and revisions if requested, ordered by revision descending, cursor is set if there are more document revisions.
	 */
	public async get(
		auditableItemGraphDocumentId: string,
		options?: {
			includeBlobStorageMetadata?: boolean;
			includeBlobStorageData?: boolean;
			includeAttestation?: boolean;
			includeRemoved?: boolean;
			extractRuleGroupId?: string;
			extractMimeType?: string;
		},
		cursor?: string,
		limit?: number
	): Promise<IDocumentList> {
		Urn.guard(
			DocumentManagementRestClient.CLASS_NAME,
			nameof(auditableItemGraphDocumentId),
			auditableItemGraphDocumentId
		);

		const response = await this.fetch<
			IDocumentManagementGetRequest,
			IDocumentManagementGetResponse
		>("/:auditableItemGraphDocumentId", "GET", {
			pathParams: {
				auditableItemGraphDocumentId
			},
			query: {
				includeBlobStorageMetadata: Coerce.string(options?.includeBlobStorageMetadata),
				includeBlobStorageData: Coerce.string(options?.includeBlobStorageData),
				includeAttestation: Coerce.string(options?.includeAttestation),
				includeRemoved: Coerce.string(options?.includeRemoved),
				extractRuleGroupId: options?.extractRuleGroupId,
				extractMimeType: options?.extractMimeType,
				cursor,
				limit: Coerce.string(limit)
			}
		});

		return response.body;
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
	 * @returns The documents and revisions if requested, ordered by revision descending, cursor is set if there are more document revisions.
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
			DocumentManagementRestClient.CLASS_NAME,
			nameof(auditableItemGraphDocumentId),
			auditableItemGraphDocumentId
		);
		Guards.integer(DocumentManagementRestClient.CLASS_NAME, nameof(revision), revision);

		const response = await this.fetch<
			IDocumentManagementGetRevisionRequest,
			IDocumentManagementGetRevisionResponse
		>("/:auditableItemGraphDocumentId/:revision", "GET", {
			pathParams: {
				auditableItemGraphDocumentId,
				revision: revision.toString()
			},
			query: {
				includeBlobStorageMetadata: Coerce.string(options?.includeBlobStorageMetadata),
				includeBlobStorageData: Coerce.string(options?.includeBlobStorageData),
				includeAttestation: Coerce.string(options?.includeAttestation),
				extractRuleGroupId: options?.extractRuleGroupId,
				extractMimeType: options?.extractMimeType
			}
		});

		return response.body;
	}

	/**
	 * Remove an auditable item graph vertex using it's id.
	 * The document dateDeleted will be set, but can still be queried with the includeRemoved flag.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param revision The revision of the document to remove.
	 * @returns Nothing.
	 */
	public async removeRevision(
		auditableItemGraphDocumentId: string,
		revision: number
	): Promise<void> {
		Urn.guard(
			DocumentManagementRestClient.CLASS_NAME,
			nameof(auditableItemGraphDocumentId),
			auditableItemGraphDocumentId
		);
		Guards.number(DocumentManagementRestClient.CLASS_NAME, nameof(revision), revision);

		await this.fetch<IDocumentManagementRemoveRequest, INoContentResponse>(
			"/:auditableItemGraphDocumentId/:revision",
			"DELETE",
			{
				pathParams: {
					auditableItemGraphDocumentId,
					revision: revision.toString()
				}
			}
		);
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
	): Promise<IAuditableItemGraphVertexList> {
		Guards.stringValue(DocumentManagementRestClient.CLASS_NAME, nameof(documentId), documentId);

		const response = await this.fetch<
			IDocumentManagementQueryRequest,
			IDocumentManagementQueryResponse
		>("/", "GET", {
			query: {
				documentId,
				cursor,
				limit: Coerce.string(limit)
			}
		});

		return response.body;
	}
}

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IAuditableItemGraphVertexList } from "@twin.org/auditable-item-graph-models";
import type { IComponent } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { UneceDocumentCodes } from "@twin.org/standards-unece";
import type { IDocument } from "./IDocument";
import type { IDocumentList } from "./IDocumentList";

/**
 * Interface describing an document management contract.
 */
export interface IDocumentManagementComponent extends IComponent {
	/**
	 * Create a document as an auditable item graph vertex and add its content to blob storage.
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
	 * @param userIdentity The identity to perform the auditable item graph operation with.
	 * @param nodeIdentity The node identity to use for vault operations.
	 * @returns The auditable item graph vertex created for the document including its revision.
	 */
	create(
		documentId: string,
		documentIdFormat: string | undefined,
		documentCode: UneceDocumentCodes,
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
		},
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<string>;

	/**
	 * Update a document as an auditable item graph vertex and add its content to blob storage.
	 * If the blob data is different a new revision will be created.
	 * For any other changes the current revision will be updated.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param blob The data to update the document with.
	 * @param annotationObject Additional information to associate with the document.
	 * @param auditableItemGraphEdges The auditable item graph vertices to connect the document to, if undefined retains current connections.
	 * @param userIdentity The identity to perform the auditable item graph operation with.
	 * @param nodeIdentity The node identity to use for vault operations.
	 * @returns Nothing.
	 */
	update(
		auditableItemGraphDocumentId: string,
		blob?: Uint8Array,
		annotationObject?: IJsonLdNodeObject,
		auditableItemGraphEdges?: {
			targetId: string;
			addAlias?: boolean;
			aliasAnnotationObject?: IJsonLdNodeObject;
		}[],
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<void>;

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
	 * @param pageSize Page size of items to return, defaults to 1 so only most recent is returned.
	 * @param userIdentity The identity to perform the auditable item graph operation with.
	 * @param nodeIdentity The node identity to use for vault operations.
	 * @returns The documents and revisions if requested, ordered by revision descending, cursor is set if there are more document revisions.
	 */
	get(
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
		pageSize?: number,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<IDocumentList>;

	/**
	 * Get a document revision using it's auditable item graph vertex id.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param revision The revision id of the document to get.
	 * @param options Additional options for the get operation.
	 * @param options.includeBlobStorageMetadata Flag to include the blob storage metadata for the document, defaults to false.
	 * @param options.includeBlobStorageData Flag to include the blob storage data for the document, defaults to false.
	 * @param options.includeAttestation Flag to include the attestation information for the document, defaults to false.
	 * @param options.extractRuleGroupId If provided will extract data from the document using the specified rule group id.
	 * @param options.extractMimeType By default extraction will auto detect the mime type of the document, this can be used to override the detection.
	 * @param userIdentity The identity to perform the auditable item graph operation with.
	 * @param nodeIdentity The node identity to use for vault operations.
	 * @returns The documents and revisions if requested, ordered by revision descending, cursor is set if there are more document revisions.
	 */
	getRevision(
		auditableItemGraphDocumentId: string,
		revision: number,
		options?: {
			includeBlobStorageMetadata?: boolean;
			includeBlobStorageData?: boolean;
			includeAttestation?: boolean;
			extractRuleGroupId?: string;
			extractMimeType?: string;
		},
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<IDocument>;

	/**
	 * Remove an auditable item graph vertex using it's id.
	 * The document dateDeleted will be set, but can still be queried with the includeRemoved flag.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param revision The revision of the document to remove.
	 * @param userIdentity The identity to perform the auditable item graph operation with.
	 * @param nodeIdentity The node identity to use for vault operations.
	 * @returns Nothing.
	 */
	removeRevision(
		auditableItemGraphDocumentId: string,
		revision: number,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<void>;

	/**
	 * Find all the document with a specific id.
	 * @param documentId The document id to find in the graph.
	 * @param cursor The cursor to get the next chunk of documents.
	 * @param pageSize The page size to get the next chunk of documents.
	 * @param userIdentity The identity to perform the auditable item graph operation with.
	 * @param nodeIdentity The node identity to use for vault operations.
	 * @returns The graph vertices that contain documents referencing the specified document id.
	 */
	query(
		documentId: string,
		cursor?: string,
		pageSize?: number,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<IAuditableItemGraphVertexList>;
}

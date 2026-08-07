// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IAuditableItemGraphVertexList } from "@twin.org/auditable-item-graph-models";
import type { IComponent } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { IDocumentBase } from "./IDocumentBase.js";
import type { IDocumentHydrated } from "./IDocumentHydrated.js";
import type { IDocumentList } from "./IDocumentList.js";
import type { IDocumentManagementEdgeEntry } from "./IDocumentManagementEdgeEntry.js";

/**
 * Interface describing a document management contract.
 */
export interface IDocumentManagementComponent extends IComponent {
	/**
	 * Create a document as an auditable item graph vertex and add its content to blob storage.
	 * If the document id already exists and the blob data is different a new revision will be created.
	 * For any other changes the current revision will be updated.
	 * @param document The document base properties.
	 * @param blob The data to create the document with as bytes, or an existing blob storage entry id.
	 * @param auditableItemGraphEdges The auditable item graph vertices to connect the document to.
	 * @param options Additional options for the set operation.
	 * @param options.includeAttestation Flag to create an attestation for the document, defaults to false.
	 * @param options.includeAlias Flag to add the document id as an alias to the aig vertex, defaults to true.
	 * @param options.aliasAnnotationObject Annotation object for the alias.
	 * @returns The auditable item graph vertex created for the document including its revision.
	 */
	create(
		document: IDocumentBase,
		blob: Uint8Array | string,
		auditableItemGraphEdges?: IDocumentManagementEdgeEntry[],
		options?: {
			includeAttestation?: boolean;
			includeAlias?: boolean;
			aliasAnnotationObject?: IJsonLdNodeObject;
		}
	): Promise<string>;

	/**
	 * Update a document as an auditable item graph vertex and add its content to blob storage.
	 * If the blob data is different a new revision will be created.
	 * For any other changes the current revision will be updated.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param document The document base properties to update. annotationObject, documentIdFormat and documentCode are applied in-place to the current revision.
	 * @param blob The data to update the document with as bytes, or an existing blob storage entry id.
	 * @param auditableItemGraphEdges Explicit edge delta to apply. If undefined, existing connections
	 * are retained unchanged. Use `add` to create new connections and `remove` to disconnect existing
	 * ones by their target vertex id. To update alias metadata on an already-connected vertex, include
	 * it in `add` with the updated `aliasAnnotationObject` - AIG's alias patch is an upsert, so the
	 * alias is updated in place without creating a duplicate back-edge.
	 * @param auditableItemGraphEdges.add Connections to add; each creates a back-edge on the connected vertex.
	 * @param auditableItemGraphEdges.remove Target vertex IDs to disconnect; their back-edges are removed.
	 * @param options Additional options for the update operation.
	 * @param options.includeAttestation Set to true to start attesting the document (even if originally created without attestation), or false to remove the existing attestation. Omit (undefined) to leave attestation state unchanged.
	 * @param options.includeAlias Set to true to add the document id as an alias on the aig vertex, or false to remove it. Omit to leave alias state unchanged.
	 * @param options.aliasAnnotationObject Annotation object for the alias when adding.
	 * @returns A promise that resolves when the document has been updated.
	 */
	updatePartial(
		auditableItemGraphDocumentId: string,
		document?: Partial<
			Pick<IDocumentBase, "annotationObject" | "documentIdFormat" | "documentCode">
		>,
		blob?: Uint8Array | string,
		auditableItemGraphEdges?: {
			add?: IDocumentManagementEdgeEntry[];
			remove?: string[];
		},
		options?: {
			includeAttestation?: boolean;
			includeAlias?: boolean;
			aliasAnnotationObject?: IJsonLdNodeObject;
		}
	): Promise<void>;

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
	get(
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
	}>;

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
	 * @returns The document for the specified revision.
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
		}
	): Promise<IDocumentHydrated>;

	/**
	 * Remove an auditable item graph vertex using it's id.
	 * The document dateDeleted will be set, but can still be queried with the includeRemoved flag.
	 * @param auditableItemGraphDocumentId The auditable item graph vertex id which contains the document.
	 * @param revision The revision of the document to remove.
	 * @returns A promise that resolves when the revision has been removed.
	 */
	removeRevision(auditableItemGraphDocumentId: string, revision: number): Promise<void>;

	/**
	 * Find all the document with a specific id.
	 * @param documentId The document id to find in the graph.
	 * @param cursor The cursor to get the next chunk of documents.
	 * @param limit The limit to get the next chunk of documents.
	 * @returns The graph vertices that contain documents referencing the specified document id.
	 */
	query(
		documentId: string,
		cursor?: string,
		limit?: number
	): Promise<{
		entries: IAuditableItemGraphVertexList;
		cursor?: string;
	}>;
}

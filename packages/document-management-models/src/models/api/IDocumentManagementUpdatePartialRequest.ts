// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { IDocumentBase } from "../IDocumentBase.js";
import type { IDocumentManagementEdgeEntry } from "../IDocumentManagementEdgeEntry.js";

/**
 * Request to partially update a document as an auditable item graph vertex.
 */
export interface IDocumentManagementUpdatePartialRequest {
	/**
	 * The path parameters.
	 */
	pathParams: {
		/**
		 * The full id of the document to update.
		 */
		auditableItemGraphDocumentId: string;
	};

	/**
	 * The body parameters.
	 */
	body: {
		/**
		 * The document base properties to update. annotationObject, documentIdFormat and documentCode are applied in-place to the current revision.
		 */
		document?: Partial<
			Pick<IDocumentBase, "annotationObject" | "documentIdFormat" | "documentCode">
		>;

		/**
		 * The data to update the document with, either as base64-encoded content or an existing blob storage entry id.
		 */
		blob?: string;

		/**
		 * Explicit edge delta to apply. Use `add` to create new connections and `remove` to
		 * disconnect existing ones by their target vertex id.
		 */
		auditableItemGraphEdges?: {
			/**
			 * Connections to add; each entry creates a back-edge on the connected vertex.
			 */
			add?: IDocumentManagementEdgeEntry[];

			/**
			 * Target vertex IDs to disconnect; their back-edges are removed.
			 */
			remove?: string[];
		};

		/**
		 * Additional options for the update operation.
		 */
		options?: {
			/**
			 * Set to true to start attesting the document (even if originally created without attestation), or false to remove the existing attestation. Omit to leave attestation state unchanged.
			 */
			includeAttestation?: boolean;

			/**
			 * Set to true to add the document id as an alias on the aig vertex, or false to remove it. Omit to leave alias state unchanged.
			 */
			includeAlias?: boolean;

			/**
			 * Annotation object for the alias when adding.
			 */
			aliasAnnotationObject?: IJsonLdNodeObject;
		};
	};
}

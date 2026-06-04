// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
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
		 * The data to update the document with, in base64.
		 */
		blob?: string;

		/**
		 * Additional information to associate with the document.
		 */
		annotationObject?: IJsonLdNodeObject;

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
	};
}

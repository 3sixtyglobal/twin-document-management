// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Request to update a document as an auditable item graph vertex.
 */
export interface IDocumentManagementUpdateRequest {
	/**
	 * The path parameters.
	 */
	pathParams: {
		/**
		 * The full id of the document to get.
		 */
		auditableItemGraphDocumentId: string;
	};

	/**
	 * The body parameters.
	 */
	body: {
		/**
		 * The data to create the document with, in base64.
		 */
		blob?: string;

		/**
		 * Additional information to associate with the document.
		 */
		annotationObject?: IJsonLdNodeObject;

		/**
		 * The auditable item graph vertices to connect the document to.
		 */
		auditableItemGraphEdges?: {
			targetId: string;
			addAlias?: boolean;
			aliasAnnotationObject?: IJsonLdNodeObject;
		}[];
	};
}

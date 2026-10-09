// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@3sixty/data-json-ld";
import type { IDocumentBase } from "../IDocumentBase.js";
import type { IDocumentManagementEdgeEntry } from "../IDocumentManagementEdgeEntry.js";

/**
 * Request to create a document as an auditable item graph vertex.
 */
export interface IDocumentManagementCreateRequest {
	/**
	 * The body parameters.
	 */
	body: {
		/**
		 * The document base properties.
		 */
		document: IDocumentBase;

		/**
		 * The data to create the document with, either as base64-encoded content or an existing blob storage entry id.
		 */
		blob: string;

		/**
		 * The auditable item graph vertices to connect the document to.
		 */
		auditableItemGraphEdges?: IDocumentManagementEdgeEntry[];

		/**
		 * Additional options for the create operation.
		 */
		options?: {
			/**
			 * Flag to create an attestation for the document, defaults to false.
			 */
			includeAttestation?: boolean;

			/**
			 * Flag to add the document id as an alias to the aig vertex, defaults to true.
			 */
			includeAlias?: boolean;

			/**
			 * Annotation object for the alias.
			 */
			aliasAnnotationObject?: IJsonLdNodeObject;
		};
	};
}

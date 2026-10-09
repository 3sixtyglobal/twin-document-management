// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, MimeTypes } from "@3sixty/web";

/**
 * Request to get a document revision from an auditable item graph vertex.
 */
export interface IDocumentManagementGetRevisionRequest {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.Accept]: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
	};

	/**
	 * The path parameters.
	 */
	pathParams: {
		/**
		 * The full id of the document to get.
		 */
		auditableItemGraphDocumentId: string;

		/**
		 * The revision of the document to get.
		 */
		revision: string;
	};

	/**
	 * The query parameters.
	 */
	query?: {
		/**
		 * Include the blob storage metadata in the response.
		 * @default false
		 */
		includeBlobStorageMetadata?: string;

		/**
		 * Include the blob storage data in the response.
		 * @default false
		 */
		includeBlobStorageData?: string;

		/**
		 * Include the attestation information in the response.
		 * @default false
		 */
		includeAttestation?: string;

		/**
		 * If provided will extract data from the document using the specified rule group id.
		 */
		extractRuleGroupId?: string;

		/**
		 * By default extraction will auto detect the mime type of the document, this can be used to override the detection.
		 */
		extractMimeType?: string;
	};
}

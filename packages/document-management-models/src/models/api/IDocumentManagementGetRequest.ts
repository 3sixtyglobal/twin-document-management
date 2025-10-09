// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, MimeTypes } from "@twin.org/web";

/**
 * Request to get a document from an auditable item graph vertex.
 */
export interface IDocumentManagementGetRequest {
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
	};

	/**
	 * The query parameters.
	 */
	query?: {
		/**
		 * Include the blob storage metadata in the response.
		 * @default false
		 */
		includeBlobStorageMetadata?: boolean | string;

		/**
		 * Include the blob storage data in the response.
		 * @default false
		 */
		includeBlobStorageData?: boolean | string;

		/**
		 * Include the attestation information in the response.
		 * @default false
		 */
		includeAttestation?: boolean | string;

		/**
		 * Include deleted documents in the response.
		 * @default false
		 */
		includeRemoved?: boolean | string;

		/**
		 * If provided will extract data from the document using the specified rule group id.
		 */
		extractRuleGroupId?: string;

		/**
		 * By default extraction will auto detect the mime type of the document, this can be used to override the detection.
		 */
		extractMimeType?: string;

		/**
		 * PLimit the number of items to return, defaults to 1 so only most recent is returned.
		 * @default 1
		 */
		limit?: string;

		/**
		 * The cursor to get the next chunk of revisions.
		 */
		cursor?: string;
	};
}

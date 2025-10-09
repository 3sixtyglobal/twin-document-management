// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, MimeTypes } from "@twin.org/web";

/**
 * Request to get a list of document from an auditable item graph vertex.
 */
export interface IDocumentManagementQueryRequest {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.Accept]: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
	};

	/**
	 * The query parameters.
	 */
	query: {
		/**
		 * The id of the document id we are trying to find.
		 */
		documentId: string;

		/**
		 * The cursor to get the next chunk of documents.
		 */
		cursor?: string;

		/**
		 * The number of documents to return.
		 */
		limit?: string;
	};
}

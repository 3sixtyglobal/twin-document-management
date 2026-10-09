// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, MimeTypes } from "@3sixty/web";
import type { IDocument } from "../IDocument.js";

/**
 * Response to get a document revision from an auditable item graph vertex.
 */
export interface IDocumentManagementGetRevisionResponse {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.ContentType]: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
	};

	/**
	 * The body parameters.
	 */
	body: IDocument;
}

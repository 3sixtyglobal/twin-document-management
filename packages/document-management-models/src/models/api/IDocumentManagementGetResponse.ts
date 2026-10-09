// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, MimeTypes } from "@3sixty/web";
import type { IDocumentList } from "../IDocumentList.js";

/**
 * Response to get a document and optionally revisions from an auditable item graph vertex.
 */
export interface IDocumentManagementGetResponse {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.ContentType]: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
		[HeaderTypes.Link]?: string | string[];
	};

	/**
	 * The body parameters.
	 */
	body: IDocumentList;
}

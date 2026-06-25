// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IAuditableItemGraphVertexList } from "@twin.org/auditable-item-graph-models";
import type { HeaderTypes, MimeTypes } from "@twin.org/web";

/**
 * Response to query the documents from an auditable item graph vertex.
 */
export interface IDocumentManagementQueryResponse {
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
	body: IAuditableItemGraphVertexList;
}

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type { SchemaOrgContexts, SchemaOrgTypes } from "@twin.org/standards-schema-org";
import type { DocumentContexts } from "./documentContexts.js";
import type { IDocument } from "./IDocument.js";

/**
 * Interface describing a list of document entries.
 */
export interface IDocumentList {
	/**
	 * JSON-LD Context.
	 */
	"@context": [
		typeof SchemaOrgContexts.ContextRoot,
		typeof DocumentContexts.ContextRoot,
		typeof DocumentContexts.ContextRootCommon,
		...IJsonLdContextDefinitionElement[]
	];

	/**
	 * JSON-LD Type.
	 */
	type: typeof SchemaOrgTypes.ItemList;

	/**
	 * The list of documents.
	 */
	[SchemaOrgTypes.ItemListElement]: IDocument[];

	/**
	 * The ids of the other vertices which are connected to the document.
	 */
	edges?: string[];

	/**
	 * The cursor to get the next chunk of documents.
	 */
	[SchemaOrgTypes.NextItem]?: string;
}

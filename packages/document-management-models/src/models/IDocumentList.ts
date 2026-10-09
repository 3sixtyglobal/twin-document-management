// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdContextDefinitionElement } from "@3sixty/data-json-ld";
import type { SchemaOrgContexts, SchemaOrgTypes } from "@3sixty/standards-schema-org";
import type { DocumentContexts } from "./documentContexts.js";
import type { IDocumentHydrated } from "./IDocumentHydrated.js";

/**
 * Interface describing a list of document entries.
 */
export interface IDocumentList {
	/**
	 * JSON-LD Context.
	 */
	"@context": [
		typeof SchemaOrgContexts.Context,
		typeof DocumentContexts.Context,
		typeof DocumentContexts.ContextCommon,
		...IJsonLdContextDefinitionElement[]
	];

	/**
	 * JSON-LD Type.
	 */
	type: typeof SchemaOrgTypes.ItemList;

	/**
	 * The list of documents.
	 * @json-ld namespace:schema
	 */
	[SchemaOrgTypes.ItemListElement]: IDocumentHydrated[];

	/**
	 * The ids of the other vertices which are connected to the document.
	 * @json-ld container:set
	 */
	edges?: string[];
}

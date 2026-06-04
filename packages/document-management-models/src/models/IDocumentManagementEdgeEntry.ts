// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * A single edge entry used when connecting a document to an AIG vertex.
 */
export interface IDocumentManagementEdgeEntry {
	/**
	 * The target AIG vertex id to connect to.
	 */
	targetId: string;

	/**
	 * Whether to add the document id as an alias on the connected vertex, defaults to false.
	 */
	addAlias?: boolean;

	/**
	 * Annotation object for the alias, if addAlias is true.
	 */
	aliasAnnotationObject?: IJsonLdNodeObject;
}

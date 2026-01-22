// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The contexts of document management objects.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DocumentContexts = {
	/**
	 * The canonical RDF namespace URI for Document Management.
	 */
	Namespace: "https://schema.twindev.org/documents/",

	/**
	 * The value to use in context for Document Management.
	 */
	Context: "https://schema.twindev.org/documents/",

	/**
	 * The JSON-LD Context URL for Document Management.
	 */
	JsonLdContext: "https://schema.twindev.org/documents/types.jsonld",

	/**
	 * The canonical RDF namespace URI for TWIN Common.
	 */
	NamespaceCommon: "https://schema.twindev.org/common/",

	/**
	 * The value to use in JSON-LD context for TWIN Common.
	 */
	ContextCommon: "https://schema.twindev.org/common/",

	/**
	 * The JSON-LD Context URL for TWIN Common.
	 */
	JsonLdContextCommon: "https://schema.twindev.org/common/types.jsonld"
} as const;

/**
 * The contexts of document management objects.
 */
export type DocumentContexts = (typeof DocumentContexts)[keyof typeof DocumentContexts];

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
	Namespace: "https://schema.3sixty.global/documents/",

	/**
	 * The value to use in context for Document Management.
	 */
	Context: "https://schema.3sixty.global/documents/",

	/**
	 * The JSON-LD Context URL for Document Management.
	 */
	JsonLdContext: "https://schema.3sixty.global/documents/types.jsonld",

	/**
	 * The canonical RDF namespace URI for TWIN Common.
	 */
	NamespaceCommon: "https://schema.3sixty.global/common/",

	/**
	 * The value to use in JSON-LD context for TWIN Common.
	 */
	ContextCommon: "https://schema.3sixty.global/common/",

	/**
	 * The JSON-LD Context URL for TWIN Common.
	 */
	JsonLdContextCommon: "https://schema.3sixty.global/common/types.jsonld"
} as const;

/**
 * The contexts of document management objects.
 */
export type DocumentContexts = (typeof DocumentContexts)[keyof typeof DocumentContexts];

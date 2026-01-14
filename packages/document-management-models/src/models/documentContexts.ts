// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The contexts of document management objects.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DocumentContexts = {
	/**
	 * The namespace for the document types.
	 */
	Namespace: "https://schema.twindev.org/documents/",

	/**
	 * The namespace for the common types.
	 */
	NamespaceCommon: "https://schema.twindev.org/common/"
} as const;

/**
 * The contexts of document management objects.
 */
export type DocumentContexts = (typeof DocumentContexts)[keyof typeof DocumentContexts];

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of document management objects.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DocumentTypes = {
	/**
	 * Represents a document.
	 */
	Document: "Document",

	/**
	 * Represents a document hydrated.
	 */
	DocumentHydrated: "DocumentHydrated",

	/**
	 * Represents a document attestation.
	 */
	DocumentAttestation: "DocumentAttestation",

	/**
	 * Represents a document list.
	 */
	DocumentList: "DocumentList"
} as const;

/**
 * The types of document management objects.
 */
export type DocumentTypes = (typeof DocumentTypes)[keyof typeof DocumentTypes];

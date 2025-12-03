// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { SchemaOrgContexts } from "@twin.org/standards-schema-org";
import type { DocumentCodeList } from "@twin.org/standards-unece";
import type { DocumentContexts } from "./documentContexts.js";
import type { DocumentTypes } from "./documentTypes.js";

/**
 * Interface describing a document attestation.
 */
export interface IDocumentAttestation {
	/**
	 * JSON-LD Context.
	 */
	"@context": [
		typeof DocumentContexts.ContextRoot,
		typeof DocumentContexts.ContextRootCommon,
		typeof SchemaOrgContexts.ContextRoot
	];

	/**
	 * JSON-LD Type.
	 */
	type: typeof DocumentTypes.DocumentAttestation;

	/**
	 * The id of the document.
	 */
	documentId: string;

	/**
	 * The code for the document type.
	 */
	documentCode: DocumentCodeList;

	/**
	 * The revision of the document as a 0 based index.
	 */
	documentRevision: number;

	/**
	 * The date/time of when the document was created.
	 */
	dateCreated: string;

	/**
	 * The hash of the document being attested.
	 */
	blobHash: string;
}

// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { SchemaOrgContexts } from "@twin.org/standards-schema-org";
import type { UneceDocumentCodeList } from "@twin.org/standards-unece";
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
		typeof DocumentContexts.Context,
		typeof DocumentContexts.ContextCommon,
		typeof SchemaOrgContexts.Context
	];

	/**
	 * JSON-LD Type.
	 */
	type: typeof DocumentTypes.DocumentAttestation;

	/**
	 * The id of the document.
	 * json-ld type:schema:identifier
	 */
	documentId: string;

	/**
	 * The code for the document type.
	 * json-ld type:schema:identifier
	 */
	documentCode: UneceDocumentCodeList;

	/**
	 * The revision of the document as a 0 based index.
	 * json-ld type:schema:Integer
	 */
	documentRevision: number;

	/**
	 * The date/time of when the document was created.
	 * json-ld namespace:schema
	 */
	dateCreated: string;

	/**
	 * The hash of the document being attested.
	 * json-ld namespace:twin-common
	 */
	blobHash: string;
}

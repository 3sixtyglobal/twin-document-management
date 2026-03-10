// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IAttestationInformation } from "@twin.org/attestation-models";
import type { IBlobStorageEntry } from "@twin.org/blob-storage-models";
import type { IJsonLdContextDefinitionElement, IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { SchemaOrgContexts } from "@twin.org/standards-schema-org";
import type { UneceDocumentCodeList } from "@twin.org/standards-unece";
import type { DocumentContexts } from "./documentContexts.js";
import type { DocumentTypes } from "./documentTypes.js";

/**
 * Interface describing a document.
 */
export interface IDocument {
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
	type: typeof DocumentTypes.Document;

	/**
	 * The full id of the document.
	 */
	id: string;

	/**
	 * The id of the document.
	 * @json-ld type:schema:identifier
	 */
	documentId: string;

	/**
	 * The format of the document id.
	 * @json-ld type:schema:Text
	 */
	documentIdFormat?: string;

	/**
	 * The code for the document type.
	 * @json-ld type:schema:identifier
	 */
	documentCode: UneceDocumentCodeList;

	/**
	 * The revision of the document as a 0 based index.
	 * @json-ld type:schema:Integer
	 */
	documentRevision: number;

	/**
	 * Additional annotation information for the document.
	 * @json-ld namespace:twin-common
	 */
	annotationObject?: IJsonLdNodeObject;

	/**
	 * The blob storage id for the document.
	 * @json-ld type:schema:identifier
	 */
	blobStorageId: string;

	/**
	 * The integrity of the blob data.
	 * @json-ld namespace:twin-common
	 */
	integrity: string;

	/**
	 * The additional JSON-LD for blob storage if it was requested.
	 * @json-ld id
	 */
	blobStorageEntry?: IBlobStorageEntry;

	/**
	 * The data extracted from the document using data extraction services.
	 * @json-ld type:json
	 */
	extractedData?: unknown;

	/**
	 * The attestation for the document if one was created.
	 * @json-ld type:schema:identifier
	 */
	attestationId?: string;

	/**
	 * The additional JSON-LD for attestation storage if it was requested.
	 * @json-ld id
	 */
	attestationInformation?: IAttestationInformation;

	/**
	 * The date/time of when the document was created.
	 * @json-ld namespace:schema
	 */
	dateCreated: string;

	/**
	 * The date/time of when the document was modified.
	 * @json-ld namespace:schema
	 */
	dateModified?: string;

	/**
	 * The date/time of when the document was deleted, as we never actually remove items.
	 * @json-ld namespace:schema
	 */
	dateDeleted?: string;

	/**
	 * The organization which added the document to the graph.
	 * @json-ld namespace:twin-common
	 */
	organizationIdentity?: string;

	/**
	 * The user who added the document to the graph.
	 * @json-ld namespace:twin-common
	 */
	userIdentity?: string;
}

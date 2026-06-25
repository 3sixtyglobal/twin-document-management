// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IAttestationInformation } from "@twin.org/attestation-models";
import type { IBlobStorageEntry } from "@twin.org/blob-storage-models";
import type { IDocument } from "./IDocument.js";

/**
 * Interface describing a hydrated document which includes additional information that can be optionally requested when retrieving a document.
 */
export interface IDocumentHydrated extends IDocument {
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
	 * The additional JSON-LD for attestation storage if it was requested.
	 * @json-ld id
	 */
	attestationInformation?: IAttestationInformation;
}

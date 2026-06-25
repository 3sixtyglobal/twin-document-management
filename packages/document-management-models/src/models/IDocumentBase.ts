// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { UneceDocumentCodeList } from "@twin.org/standards-unece";

/**
 * Interface describing a document base.
 */
export interface IDocumentBase {
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
	 * Additional annotation information for the document.
	 * @json-ld namespace:twin-common
	 */
	annotationObject?: IJsonLdNodeObject;
}

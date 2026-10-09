// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { AttestationDataTypes } from "@3sixty/attestation-models";
import { BlobStorageDataTypes } from "@3sixty/blob-storage-models";
import { DataTypeHelper } from "@3sixty/data-core";
import { JsonLdDataTypes } from "@3sixty/data-json-ld";
import { UneceDataTypes } from "@3sixty/standards-unece";
import * as CompiledValidators from "../compiled/validators.js";
import { DocumentContexts } from "../models/documentContexts.js";
import { DocumentTypes } from "../models/documentTypes.js";
import DocumentSchema from "../schemas/Document.json" with { type: "json" };
import DocumentAttestationSchema from "../schemas/DocumentAttestation.json" with { type: "json" };
import DocumentBaseSchema from "../schemas/DocumentBase.json" with { type: "json" };
import DocumentHydratedSchema from "../schemas/DocumentHydrated.json" with { type: "json" };
import DocumentListSchema from "../schemas/DocumentList.json" with { type: "json" };

/**
 * Handle all the data types for document management.
 */
export class DocumentManagementDataTypes {
	/**
	 * Register all the data types.
	 */
	public static registerTypes(): void {
		// Register the types referenced by the schemas, which are only registered once.
		JsonLdDataTypes.registerTypes();
		AttestationDataTypes.registerTypes();
		BlobStorageDataTypes.registerTypes();
		UneceDataTypes.registerTypes();

		const types = [
			{
				type: DocumentTypes.Document,
				schema: DocumentSchema,
				compiledValidator: CompiledValidators.CompiledDocument
			},
			{
				type: DocumentTypes.DocumentAttestation,
				schema: DocumentAttestationSchema,
				compiledValidator: CompiledValidators.CompiledDocumentAttestation
			},
			{
				type: "DocumentBase",
				schema: DocumentBaseSchema,
				compiledValidator: CompiledValidators.CompiledDocumentBase
			},
			{
				type: DocumentTypes.DocumentHydrated,
				schema: DocumentHydratedSchema,
				compiledValidator: CompiledValidators.CompiledDocumentHydrated
			},
			{
				type: DocumentTypes.DocumentList,
				schema: DocumentListSchema,
				compiledValidator: CompiledValidators.CompiledDocumentList
			}
		];

		DataTypeHelper.registerTypes(DocumentContexts.Namespace, DocumentContexts.JsonLdContext, types);
	}
}

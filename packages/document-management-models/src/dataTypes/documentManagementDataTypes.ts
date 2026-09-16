// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { DataTypeHelper } from "@twin.org/data-core";
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
		const types = [
			{
				type: DocumentTypes.Document,
				schema: DocumentSchema
			},
			{
				type: DocumentTypes.DocumentAttestation,
				schema: DocumentAttestationSchema
			},
			{
				type: "DocumentBase",
				schema: DocumentBaseSchema
			},
			{
				type: DocumentTypes.DocumentHydrated,
				schema: DocumentHydratedSchema
			},
			{
				type: DocumentTypes.DocumentList,
				schema: DocumentListSchema
			}
		];

		DataTypeHelper.registerTypes(
			DocumentContexts.Namespace,
			DocumentContexts.JsonLdContext,
			types.map(t => ({ type: t.type, schema: t.schema }))
		);
	}
}

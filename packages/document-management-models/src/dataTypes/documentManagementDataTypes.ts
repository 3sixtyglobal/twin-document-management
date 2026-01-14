// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { DataTypeHandlerFactory, type IJsonSchema } from "@twin.org/data-core";
import { DocumentContexts } from "../models/documentContexts.js";
import { DocumentTypes } from "../models/documentTypes.js";
import DocumentSchema from "../schemas/Document.json" with { type: "json" };

/**
 * Handle all the data types for document management.
 */
export class DocumentManagementDataTypes {
	/**
	 * Register all the data types.
	 */
	public static registerTypes(): void {
		DataTypeHandlerFactory.register(
			`${DocumentContexts.Namespace}${DocumentTypes.Document}`,
			() => ({
				namespace: DocumentContexts.Namespace,
				type: DocumentTypes.Document,
				defaultValue: {},
				jsonSchema: async () => DocumentSchema as IJsonSchema
			})
		);

		DataTypeHandlerFactory.register(
			`${DocumentContexts.Namespace}${DocumentTypes.DocumentAttestation}`,
			() => ({
				namespace: DocumentContexts.Namespace,
				type: DocumentTypes.DocumentAttestation,
				defaultValue: {},
				jsonSchema: async () => DocumentSchema as IJsonSchema
			})
		);
	}
}

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
			`${DocumentContexts.ContextRoot}${DocumentTypes.Document}`,
			() => ({
				context: DocumentContexts.ContextRoot,
				type: DocumentTypes.Document,
				defaultValue: {},
				jsonSchema: async () => DocumentSchema as IJsonSchema
			})
		);

		DataTypeHandlerFactory.register(
			`${DocumentContexts.ContextRoot}${DocumentTypes.DocumentAttestation}`,
			() => ({
				context: DocumentContexts.ContextRoot,
				type: DocumentTypes.DocumentAttestation,
				defaultValue: {},
				jsonSchema: async () => DocumentSchema as IJsonSchema
			})
		);
	}
}

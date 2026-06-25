// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IDocumentManagementServiceConfig } from "./IDocumentManagementServiceConfig.js";

/**
 * Options for the document management Service constructor.
 */
export interface IDocumentManagementServiceConstructorOptions {
	/**
	 * The type of the auditable item graph component.
	 * @default auditable-item-graph
	 */
	auditableItemGraphComponentType?: string;

	/**
	 * The type of the blob storage component.
	 * @default blob-storage
	 */
	blobStorageComponentType?: string;

	/**
	 * The type of the attestation component.
	 * @default attestation
	 */
	attestationComponentType?: string;

	/**
	 * The type of the data processing component.
	 * @default data-processing
	 */
	dataProcessingComponentType?: string;

	/**
	 * The type of the telemetry component used for event metrics.
	 */
	telemetryComponentType?: string;

	/**
	 * The configuration for the service.
	 */
	config?: IDocumentManagementServiceConfig;
}

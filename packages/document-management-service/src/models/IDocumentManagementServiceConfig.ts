// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the document management service.
 */
export interface IDocumentManagementServiceConfig {
	/**
	 * The timeout in milliseconds for acquiring a mutex lock.
	 */
	mutexTimeoutMs?: number;
}

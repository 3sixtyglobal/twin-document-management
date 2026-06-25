// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Metric IDs for the document management service.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DocumentManagementMetricIds = {
	/**
	 * Number of documents created.
	 */
	DocumentsCreated: "dm_documents_created",
	/**
	 * Number of documents updated.
	 */
	DocumentsUpdated: "dm_documents_updated",
	/**
	 * Number of document revisions created.
	 */
	RevisionsCreated: "dm_revisions_created",
	/**
	 * Number of document revisions removed.
	 */
	RevisionsRemoved: "dm_revisions_removed",
	/**
	 * Number of document attestations created.
	 */
	AttestationsCreated: "dm_attestations_created"
} as const;

/**
 * Metric IDs for the document management service.
 */
export type DocumentManagementMetricIds =
	(typeof DocumentManagementMetricIds)[keyof typeof DocumentManagementMetricIds];

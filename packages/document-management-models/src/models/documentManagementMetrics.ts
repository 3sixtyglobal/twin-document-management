// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { type ITelemetryMetric, MetricType } from "@3sixty/telemetry-models";
import { DocumentManagementMetricIds } from "./documentManagementMetricIds.js";

/**
 * Metrics registered by the document management service.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DocumentManagementMetrics: ITelemetryMetric[] = [
	{
		id: DocumentManagementMetricIds.DocumentsCreated,
		label: "Documents created",
		type: MetricType.Counter
	},
	{
		id: DocumentManagementMetricIds.DocumentsUpdated,
		label: "Documents updated",
		type: MetricType.Counter
	},
	{
		id: DocumentManagementMetricIds.RevisionsCreated,
		label: "Document revisions created",
		type: MetricType.Counter
	},
	{
		id: DocumentManagementMetricIds.RevisionsRemoved,
		label: "Document revisions removed",
		type: MetricType.Counter
	},
	{
		id: DocumentManagementMetricIds.AttestationsCreated,
		label: "Document attestations created",
		type: MetricType.Counter
	}
];

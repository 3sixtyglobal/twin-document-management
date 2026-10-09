// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@3sixty/api-models";
import {
	generateRestRoutesDocumentManagement,
	tagsDocumentManagement
} from "./documentManagementRoutes.js";

/**
 * REST entry points for the document management service.
 */
export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "document-management",
		defaultBaseRoute: "document-management",
		tags: tagsDocumentManagement,
		generateRoutes: generateRestRoutesDocumentManagement
	}
];

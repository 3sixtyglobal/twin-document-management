// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@twin.org/api-models";
import {
	generateRestRoutesDocumentManagement,
	tagsDocumentManagement
} from "./documentManagementRoutes.js";

export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "document-management",
		defaultBaseRoute: "document-management",
		tags: tagsDocumentManagement,
		generateRoutes: generateRestRoutesDocumentManagement
	}
];

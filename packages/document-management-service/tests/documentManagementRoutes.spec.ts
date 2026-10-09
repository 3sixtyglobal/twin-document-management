// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpBodyLimit, type IRestRoute } from "@3sixty/api-models";
import { generateRestRoutesDocumentManagement } from "../src/documentManagementRoutes.js";

/**
 * The operation ids of the routes which accept a document payload.
 */
const LARGE_BODY_OPERATION_IDS = ["DocumentManagementSet", "DocumentManagementUpdatePartial"];

/**
 * Generate the routes under test.
 * @returns The generated routes.
 */
function generateRoutes(): IRestRoute[] {
	return generateRestRoutesDocumentManagement("/document-management", "document-management");
}

describe("documentManagementRoutes", () => {
	test("The DocumentManagementSet and DocumentManagementUpdatePartial routes have a bodyLimit of large", () => {
		const routes = generateRoutes().filter(route =>
			LARGE_BODY_OPERATION_IDS.includes(route.operationId)
		);

		expect(routes.map(route => route.operationId)).toEqual(LARGE_BODY_OPERATION_IDS);

		for (const route of routes) {
			expect(route.bodyLimit).toEqual(HttpBodyLimit.Large);
		}
	});

	test("All the other generated routes have an undefined bodyLimit", () => {
		const routes = generateRoutes().filter(
			route => !LARGE_BODY_OPERATION_IDS.includes(route.operationId)
		);

		expect(routes.map(route => route.operationId)).toEqual([
			"DocumentManagementGet",
			"DocumentManagementGetRevision",
			"DocumentManagementRemove",
			"DocumentManagementQuery"
		]);

		for (const route of routes) {
			expect(route.bodyLimit).toBeUndefined();
		}
	});
});

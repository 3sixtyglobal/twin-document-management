// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { DocumentManagementRestClient } from "../src/documentManagementRestClient";

describe("DocumentManagementRestClient", () => {
	test("Can create an instance", async () => {
		const client = new DocumentManagementRestClient({ endpoint: "http://localhost:8080" });
		expect(client).toBeDefined();
	});
});

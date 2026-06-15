// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, RandomHelper } from "@twin.org/core";
import { Bip39 } from "@twin.org/crypto";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import {
	EntityStorageIdentityConnector,
	type IdentityDocument,
	initSchema as initSchemaIdentity
} from "@twin.org/identity-connector-entity-storage";
import { IdentityConnectorFactory } from "@twin.org/identity-models";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageVaultConnector,
	initSchema as initSchemaVault,
	type VaultKey,
	type VaultSecret
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory, VaultKeyType } from "@twin.org/vault-models";
import {
	EntityStorageWalletConnector,
	initSchema as initSchemaWallet,
	type WalletAddress
} from "@twin.org/wallet-connector-entity-storage";
import { WalletConnectorFactory } from "@twin.org/wallet-models";

initSchemaVault();
initSchemaIdentity();
initSchemaWallet();

EntityStorageConnectorFactory.register(
	"vault-key",
	() =>
		new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>(),
			config: { storageKey: "vault-key" }
		})
);
const secretEntityStorage = new MemoryEntityStorageConnector<VaultSecret>({
	entitySchema: nameof<VaultSecret>(),
	config: { storageKey: "vault-secret" }
});
EntityStorageConnectorFactory.register("vault-secret", () => secretEntityStorage);

const identityDocumentEntityStorage = new MemoryEntityStorageConnector<IdentityDocument>({
	entitySchema: nameof<IdentityDocument>(),
	config: { storageKey: "identity-document" }
});
EntityStorageConnectorFactory.register("identity-document", () => identityDocumentEntityStorage);

const TEST_VAULT_CONNECTOR = new EntityStorageVaultConnector();
VaultConnectorFactory.register("vault", () => TEST_VAULT_CONNECTOR);

export const TEST_IDENTITY_CONNECTOR = new EntityStorageIdentityConnector();
IdentityConnectorFactory.register("identity", () => TEST_IDENTITY_CONNECTOR);

const walletAddressEntityStorage = new MemoryEntityStorageConnector<WalletAddress>({
	entitySchema: nameof<WalletAddress>(),
	config: { storageKey: "wallet-address" }
});
EntityStorageConnectorFactory.register("wallet-address", () => walletAddressEntityStorage);

export const TEST_WALLET_CONNECTOR = new EntityStorageWalletConnector();
WalletConnectorFactory.register("wallet", () => TEST_WALLET_CONNECTOR);

export let TEST_NODE_IDENTITY: string;
export let TEST_TENANT_IDENTITY: string;
export let TEST_TENANT_IDENTITY_SHORT: string;
export let TEST_ORGANIZATION_IDENTITY: string;
export let TEST_USER_IDENTITY: string;
export let TEST_VAULT_KEY: string;

/**
 * Setup the test environment.
 */
export async function setupTestEnv(): Promise<void> {
	let randCounter = 1;
	RandomHelper.generate = vi
		.fn()
		.mockImplementation(length => new Uint8Array(length).fill(randCounter++));
	Bip39.randomMnemonic = vi
		.fn()
		.mockImplementation(
			() =>
				"life first castle choose joke eyebrow middle speak lucky improve awesome common energy oval use scare water cluster update steak endorse sweet festival error"
		);

	const testIdentityConnector = IdentityConnectorFactory.get("identity");
	const testVaultConnector = VaultConnectorFactory.get("vault");

	const didNode = await testIdentityConnector.createDocument("test-node-identity");
	const didOrganisation = await testIdentityConnector.createDocument("test-organisation-identity");
	const didUser = await testIdentityConnector.createDocument("test-user-identity");

	await testIdentityConnector.addVerificationMethod(
		"test-organisation-identity",
		didOrganisation.id,
		"assertionMethod",
		"immutable-proof-assertion"
	);
	await testIdentityConnector.addVerificationMethod(
		"test-organisation-identity",
		didOrganisation.id,
		"assertionMethod",
		"attestation-assertion"
	);

	TEST_NODE_IDENTITY = didNode.id;
	TEST_ORGANIZATION_IDENTITY = didOrganisation.id;
	TEST_TENANT_IDENTITY = "a".repeat(32);
	TEST_TENANT_IDENTITY_SHORT = Converter.bytesToBase64(Converter.hexToBytes(TEST_TENANT_IDENTITY));
	TEST_USER_IDENTITY = didUser.id;
	TEST_VAULT_KEY = `${TEST_NODE_IDENTITY}/immutable-proof-hash`;

	await testVaultConnector.createKey(TEST_VAULT_KEY, VaultKeyType.Ed25519);
}

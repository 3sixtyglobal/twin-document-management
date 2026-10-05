# TWIN Document Management

This repository provides a modular set of components for storing, revising, querying, and retrieving business documents through auditable graph records and related blob content. The packages are designed to work together so services, clients, and shared schemas follow the same contract boundaries and data shapes.

It supports teams building document workflows that need traceability, predictable interfaces, and reusable integration points across runtime services and API consumers.

## Packages

- [document-management-models](packages/document-management-models/README.md) - Shared data models, schemas, and context definitions for document lifecycle records.
- [document-management-service](packages/document-management-service/README.md) - Service-side document lifecycle operations and REST route generation for server integrations.
- [document-management-rest-client](packages/document-management-rest-client/README.md) - REST client operations for creating, updating, retrieving, and querying managed documents.

## Contributing

To contribute to this package see the guidelines for building and publishing in [CONTRIBUTING](./CONTRIBUTING.md)

## Origin

This repository is derived from the original [iotaledger/twin-document-management](https://github.com/iotaledger/twin-document-management) repository.

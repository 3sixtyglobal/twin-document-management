# Document Management Packages

## document-management-models

This package provides the shared document schemas, context definitions, and model contracts used across the repository. It helps keep payload structures consistent between producers and consumers, reducing drift in validation and integration behaviour.

- [README](../packages/document-management-models/README.md)
- [Examples](../packages/document-management-models/docs/examples.md)
- [Changelog](../packages/document-management-models/docs/changelog.md)

## document-management-service

This package implements service-side document lifecycle logic and route generation for API integration. It supports create, update, revision retrieval, removal, and query flows while preserving consistent contract behaviour.

- [README](../packages/document-management-service/README.md)
- [Examples](../packages/document-management-service/docs/examples.md)
- [Changelog](../packages/document-management-service/docs/changelog.md)

## document-management-rest-client

This package exposes client-side operations for calling document lifecycle endpoints over HTTP. It offers a consistent way to create, update, retrieve revisions, remove revisions, and query managed records.

- [README](../packages/document-management-rest-client/README.md)
- [Examples](../packages/document-management-rest-client/docs/examples.md)
- [Changelog](../packages/document-management-rest-client/docs/changelog.md)

# Interface: IDocumentManagementCreateRequest

Request to create a document as an auditable item graph vertex.

## Properties

### body {#body}

> **body**: `object`

The body parameters.

#### document

> **document**: [`IDocumentBase`](IDocumentBase.md)

The document base properties.

#### blob

> **blob**: `string`

The data to create the document with, either as base64-encoded content or an existing blob storage entry id.

#### auditableItemGraphEdges?

> `optional` **auditableItemGraphEdges?**: [`IDocumentManagementEdgeEntry`](IDocumentManagementEdgeEntry.md)[]

The auditable item graph vertices to connect the document to.

#### options?

> `optional` **options?**: `object`

Additional options for the create operation.

##### options.includeAttestation?

> `optional` **includeAttestation?**: `boolean`

Flag to create an attestation for the document, defaults to false.

##### options.includeAlias?

> `optional` **includeAlias?**: `boolean`

Flag to add the document id as an alias to the aig vertex, defaults to true.

##### options.aliasAnnotationObject?

> `optional` **aliasAnnotationObject?**: `IJsonLdNodeObject`

Annotation object for the alias.

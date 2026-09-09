# Interface: IDocumentManagementUpdatePartialRequest

Request to partially update a document as an auditable item graph vertex.

## Properties

### pathParams {#pathparams}

> **pathParams**: `object`

The path parameters.

#### auditableItemGraphDocumentId

> **auditableItemGraphDocumentId**: `string`

The full id of the document to update.

***

### body {#body}

> **body**: `object`

The body parameters.

#### document?

> `optional` **document?**: `Partial`\<`Pick`\<[`IDocumentBase`](IDocumentBase.md), `"documentCode"` \| `"annotationObject"` \| `"documentIdFormat"`\>\>

The document base properties to update. annotationObject, documentIdFormat and documentCode are applied in-place to the current revision.

#### blob?

> `optional` **blob?**: `string`

The data to update the document with, either as base64-encoded content or an existing blob storage entry id.

#### auditableItemGraphEdges?

> `optional` **auditableItemGraphEdges?**: `object`

Explicit edge delta to apply. Use `add` to create new connections and `remove` to
disconnect existing ones by their target vertex id.

##### auditableItemGraphEdges.add?

> `optional` **add?**: [`IDocumentManagementEdgeEntry`](IDocumentManagementEdgeEntry.md)[]

Connections to add; each entry creates a back-edge on the connected vertex.

##### auditableItemGraphEdges.remove?

> `optional` **remove?**: `string`[]

Target vertex IDs to disconnect; their back-edges are removed.

#### options?

> `optional` **options?**: `object`

Additional options for the update operation.

##### options.includeAttestation?

> `optional` **includeAttestation?**: `boolean`

Set to true to start attesting the document (even if originally created without attestation), or false to remove the existing attestation. Omit to leave attestation state unchanged.

##### options.includeAlias?

> `optional` **includeAlias?**: `boolean`

Set to true to add the document id as an alias on the aig vertex, or false to remove it. Omit to leave alias state unchanged.

##### options.aliasAnnotationObject?

> `optional` **aliasAnnotationObject?**: `IJsonLdNodeObject`

Annotation object for the alias when adding.

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

#### blob?

> `optional` **blob?**: `string`

The data to update the document with, in base64.

#### annotationObject?

> `optional` **annotationObject?**: `IJsonLdNodeObject`

Additional information to associate with the document.

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

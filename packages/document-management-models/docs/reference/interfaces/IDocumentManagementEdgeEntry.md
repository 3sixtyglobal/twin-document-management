# Interface: IDocumentManagementEdgeEntry

A single edge entry used when connecting a document to an AIG vertex.

## Properties

### targetId {#targetid}

> **targetId**: `string`

The target AIG vertex id to connect to.

***

### includeAlias? {#includealias}

> `optional` **includeAlias?**: `boolean`

Whether to add the document id as an alias on the connected vertex, defaults to false.

***

### aliasAnnotationObject? {#aliasannotationobject}

> `optional` **aliasAnnotationObject?**: `IJsonLdNodeObject`

Annotation object for the alias, if includeAlias is true.

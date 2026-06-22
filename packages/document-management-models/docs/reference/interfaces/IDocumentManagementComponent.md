# Interface: IDocumentManagementComponent

Interface describing a document management contract.

## Extends

- `IComponent`

## Methods

### create() {#create}

> **create**(`document`, `blob`, `auditableItemGraphEdges?`, `options?`): `Promise`\<`string`\>

Create a document as an auditable item graph vertex and add its content to blob storage.
If the document id already exists and the blob data is different a new revision will be created.
For any other changes the current revision will be updated.

#### Parameters

##### document

[`IDocumentBase`](IDocumentBase.md)

The document base properties.

##### blob

`string` \| `Uint8Array`\<`ArrayBufferLike`\>

The data to create the document with as bytes, or an existing blob storage entry id.

##### auditableItemGraphEdges?

[`IDocumentManagementEdgeEntry`](IDocumentManagementEdgeEntry.md)[]

The auditable item graph vertices to connect the document to.

##### options?

Additional options for the set operation.

###### includeAttestation?

`boolean`

Flag to create an attestation for the document, defaults to false.

###### includeAlias?

`boolean`

Flag to add the document id as an alias to the aig vertex, defaults to true.

###### aliasAnnotationObject?

`IJsonLdNodeObject`

Annotation object for the alias.

#### Returns

`Promise`\<`string`\>

The auditable item graph vertex created for the document including its revision.

***

### updatePartial() {#updatepartial}

> **updatePartial**(`auditableItemGraphDocumentId`, `document?`, `blob?`, `auditableItemGraphEdges?`, `options?`): `Promise`\<`void`\>

Update a document as an auditable item graph vertex and add its content to blob storage.
If the blob data is different a new revision will be created.
For any other changes the current revision will be updated.

#### Parameters

##### auditableItemGraphDocumentId

`string`

The auditable item graph vertex id which contains the document.

##### document?

`Partial`\<`Pick`\<[`IDocumentBase`](IDocumentBase.md), `"annotationObject"` \| `"documentIdFormat"` \| `"documentCode"`\>\>

The document base properties to update. annotationObject, documentIdFormat and documentCode are applied in-place to the current revision.

##### blob?

`string` \| `Uint8Array`\<`ArrayBufferLike`\>

The data to update the document with as bytes, or an existing blob storage entry id.

##### auditableItemGraphEdges?

Explicit edge delta to apply. If undefined, existing connections
are retained unchanged. Use `add` to create new connections and `remove` to disconnect existing
ones by their target vertex id. To update alias metadata on an already-connected vertex, include
it in `add` with the updated `aliasAnnotationObject` — AIG's alias patch is an upsert, so the
alias is updated in place without creating a duplicate back-edge.

###### add?

[`IDocumentManagementEdgeEntry`](IDocumentManagementEdgeEntry.md)[]

Connections to add; each creates a back-edge on the connected vertex.

###### remove?

`string`[]

Target vertex IDs to disconnect; their back-edges are removed.

##### options?

Additional options for the update operation.

###### includeAttestation?

`boolean`

Set to true to start attesting the document (even if originally created without attestation), or false to remove the existing attestation. Omit (undefined) to leave attestation state unchanged.

###### includeAlias?

`boolean`

Set to true to add the document id as an alias on the aig vertex, or false to remove it. Omit to leave alias state unchanged.

###### aliasAnnotationObject?

`IJsonLdNodeObject`

Annotation object for the alias when adding.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the document has been updated.

***

### get() {#get}

> **get**(`auditableItemGraphDocumentId`, `options?`, `cursor?`, `limit?`): `Promise`\<\{ `entries`: [`IDocumentList`](IDocumentList.md); `cursor?`: `string`; \}\>

Get a document using it's auditable item graph vertex id and optional revision.

#### Parameters

##### auditableItemGraphDocumentId

`string`

The auditable item graph vertex id which contains the document.

##### options?

Additional options for the get operation.

###### includeBlobStorageMetadata?

`boolean`

Flag to include the blob storage metadata for the document, defaults to false.

###### includeBlobStorageData?

`boolean`

Flag to include the blob storage data for the document, defaults to false.

###### includeAttestation?

`boolean`

Flag to include the attestation information for the document, defaults to false.

###### includeRemoved?

`boolean`

Flag to include deleted documents, defaults to false.

###### includeDeletedEdges?

`boolean`

Flag to include soft-deleted edges in the response, defaults to false.

###### extractRuleGroupId?

`string`

If provided will extract data from the document using the specified rule group id.

###### extractMimeType?

`string`

By default extraction will auto detect the mime type of the document, this can be used to override the detection.

##### cursor?

`string`

The cursor to get the next chunk of revisions.

##### limit?

`number`

Limit the number of items to return, defaults to 1 so only most recent is returned.

#### Returns

`Promise`\<\{ `entries`: [`IDocumentList`](IDocumentList.md); `cursor?`: `string`; \}\>

The documents and revisions if requested, ordered by revision descending, cursor is set if there are more document revisions.

***

### getRevision() {#getrevision}

> **getRevision**(`auditableItemGraphDocumentId`, `revision`, `options?`): `Promise`\<[`IDocumentHydrated`](IDocumentHydrated.md)\>

Get a document revision using it's auditable item graph vertex id.

#### Parameters

##### auditableItemGraphDocumentId

`string`

The auditable item graph vertex id which contains the document.

##### revision

`number`

The revision id of the document to get.

##### options?

Additional options for the get operation.

###### includeBlobStorageMetadata?

`boolean`

Flag to include the blob storage metadata for the document, defaults to false.

###### includeBlobStorageData?

`boolean`

Flag to include the blob storage data for the document, defaults to false.

###### includeAttestation?

`boolean`

Flag to include the attestation information for the document, defaults to false.

###### extractRuleGroupId?

`string`

If provided will extract data from the document using the specified rule group id.

###### extractMimeType?

`string`

By default extraction will auto detect the mime type of the document, this can be used to override the detection.

#### Returns

`Promise`\<[`IDocumentHydrated`](IDocumentHydrated.md)\>

The document for the specified revision.

***

### removeRevision() {#removerevision}

> **removeRevision**(`auditableItemGraphDocumentId`, `revision`): `Promise`\<`void`\>

Remove an auditable item graph vertex using it's id.
The document dateDeleted will be set, but can still be queried with the includeRemoved flag.

#### Parameters

##### auditableItemGraphDocumentId

`string`

The auditable item graph vertex id which contains the document.

##### revision

`number`

The revision of the document to remove.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the revision has been removed.

***

### query() {#query}

> **query**(`documentId`, `cursor?`, `limit?`): `Promise`\<\{ `entries`: `IAuditableItemGraphVertexList`; `cursor?`: `string`; \}\>

Find all the document with a specific id.

#### Parameters

##### documentId

`string`

The document id to find in the graph.

##### cursor?

`string`

The cursor to get the next chunk of documents.

##### limit?

`number`

The limit to get the next chunk of documents.

#### Returns

`Promise`\<\{ `entries`: `IAuditableItemGraphVertexList`; `cursor?`: `string`; \}\>

The graph vertices that contain documents referencing the specified document id.

# Interface: IDocument

Interface describing a document.

## Extends

- [`IDocumentBase`](IDocumentBase.md)

## Extended by

- [`IDocumentHydrated`](IDocumentHydrated.md)

## Properties

### @context {#context}

> **@context**: \[`"https://schema.org"`, `"https://schema.twindev.org/documents/"`, `"https://schema.twindev.org/common/"`, `...IJsonLdContextDefinitionElement[]`\]

JSON-LD Context.

***

### type {#type}

> **type**: `"Document"`

JSON-LD Type.

***

### id {#id}

> **id**: `string`

The full id of the document.

***

### documentRevision {#documentrevision}

> **documentRevision**: `number`

The revision of the document as a 0 based index.

***

### blobStorageId {#blobstorageid}

> **blobStorageId**: `string`

The blob storage id for the document.

***

### integrity {#integrity}

> **integrity**: `string`

The integrity of the blob data.

***

### attestationId? {#attestationid}

> `optional` **attestationId?**: `string`

The attestation for the document if one was created.

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

The date/time of when the document was created.

***

### dateModified? {#datemodified}

> `optional` **dateModified?**: `string`

The date/time of when the document was modified.

***

### dateDeleted? {#datedeleted}

> `optional` **dateDeleted?**: `string`

The date/time of when the document was deleted, as we never actually remove items.

***

### organizationIdentity? {#organizationidentity}

> `optional` **organizationIdentity?**: `string`

The organization which added the document to the graph.

***

### userIdentity? {#useridentity}

> `optional` **userIdentity?**: `string`

The user who added the document to the graph.

***

### documentId {#documentid}

> **documentId**: `string`

The id of the document.

#### Inherited from

[`IDocumentBase`](IDocumentBase.md).[`documentId`](IDocumentBase.md#documentid)

***

### documentIdFormat? {#documentidformat}

> `optional` **documentIdFormat?**: `string`

The format of the document id.

#### Inherited from

[`IDocumentBase`](IDocumentBase.md).[`documentIdFormat`](IDocumentBase.md#documentidformat)

***

### documentCode {#documentcode}

> **documentCode**: `UneceDocumentCodeList`

The code for the document type.

#### Inherited from

[`IDocumentBase`](IDocumentBase.md).[`documentCode`](IDocumentBase.md#documentcode)

***

### annotationObject? {#annotationobject}

> `optional` **annotationObject?**: `IJsonLdNodeObject`

Additional annotation information for the document.

#### Inherited from

[`IDocumentBase`](IDocumentBase.md).[`annotationObject`](IDocumentBase.md#annotationobject)

# Interface: IDocumentHydrated

Interface describing a hydrated document which includes additional information that can be optionally requested when retrieving a document.

## Extends

- [`IDocument`](IDocument.md)

## Properties

### @context {#context}

> **@context**: \[`"https://schema.org"`, `"https://schema.3sixty.global/documents/"`, `"https://schema.3sixty.global/common/"`, `...IJsonLdContextDefinitionElement[]`\]

JSON-LD Context.

#### Inherited from

[`IDocument`](IDocument.md).[`@context`](IDocument.md#context)

***

### type {#type}

> **type**: `"Document"`

JSON-LD Type.

#### Inherited from

[`IDocument`](IDocument.md).[`type`](IDocument.md#type)

***

### id {#id}

> **id**: `string`

The full id of the document.

#### Inherited from

[`IDocument`](IDocument.md).[`id`](IDocument.md#id)

***

### documentRevision {#documentrevision}

> **documentRevision**: `number`

The revision of the document as a 0 based index.

#### Inherited from

[`IDocument`](IDocument.md).[`documentRevision`](IDocument.md#documentrevision)

***

### blobStorageId {#blobstorageid}

> **blobStorageId**: `string`

The blob storage id for the document.

#### Inherited from

[`IDocument`](IDocument.md).[`blobStorageId`](IDocument.md#blobstorageid)

***

### integrity {#integrity}

> **integrity**: `string`

The integrity of the blob data.

#### Inherited from

[`IDocument`](IDocument.md).[`integrity`](IDocument.md#integrity)

***

### attestationId? {#attestationid}

> `optional` **attestationId?**: `string`

The attestation for the document if one was created.

#### Inherited from

[`IDocument`](IDocument.md).[`attestationId`](IDocument.md#attestationid)

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

The date/time of when the document was created.

#### Inherited from

[`IDocument`](IDocument.md).[`dateCreated`](IDocument.md#datecreated)

***

### dateModified? {#datemodified}

> `optional` **dateModified?**: `string`

The date/time of when the document was modified.

#### Inherited from

[`IDocument`](IDocument.md).[`dateModified`](IDocument.md#datemodified)

***

### dateDeleted? {#datedeleted}

> `optional` **dateDeleted?**: `string`

The date/time of when the document was deleted, as we never actually remove items.

#### Inherited from

[`IDocument`](IDocument.md).[`dateDeleted`](IDocument.md#datedeleted)

***

### organizationIdentity? {#organizationidentity}

> `optional` **organizationIdentity?**: `string`

The organization which added the document to the graph.

#### Inherited from

[`IDocument`](IDocument.md).[`organizationIdentity`](IDocument.md#organizationidentity)

***

### userIdentity? {#useridentity}

> `optional` **userIdentity?**: `string`

The user who added the document to the graph.

#### Inherited from

[`IDocument`](IDocument.md).[`userIdentity`](IDocument.md#useridentity)

***

### documentId {#documentid}

> **documentId**: `string`

The id of the document.

#### Inherited from

[`IDocument`](IDocument.md).[`documentId`](IDocument.md#documentid)

***

### documentIdFormat? {#documentidformat}

> `optional` **documentIdFormat?**: `string`

The format of the document id.

#### Inherited from

[`IDocument`](IDocument.md).[`documentIdFormat`](IDocument.md#documentidformat)

***

### documentCode {#documentcode}

> **documentCode**: `UneceDocumentCodeList`

The code for the document type.

#### Inherited from

[`IDocument`](IDocument.md).[`documentCode`](IDocument.md#documentcode)

***

### annotationObject? {#annotationobject}

> `optional` **annotationObject?**: `IJsonLdNodeObject`

Additional annotation information for the document.

#### Inherited from

[`IDocument`](IDocument.md).[`annotationObject`](IDocument.md#annotationobject)

***

### blobStorageEntry? {#blobstorageentry}

> `optional` **blobStorageEntry?**: `IBlobStorageEntry`

The additional JSON-LD for blob storage if it was requested.

***

### extractedData? {#extracteddata}

> `optional` **extractedData?**: `unknown`

The data extracted from the document using data extraction services.

***

### attestationInformation? {#attestationinformation}

> `optional` **attestationInformation?**: `IAttestationInformation`

The additional JSON-LD for attestation storage if it was requested.

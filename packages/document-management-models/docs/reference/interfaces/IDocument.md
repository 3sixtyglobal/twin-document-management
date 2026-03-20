# Interface: IDocument

Interface describing a document.

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

### documentId {#documentid}

> **documentId**: `string`

The id of the document.

***

### documentIdFormat? {#documentidformat}

> `optional` **documentIdFormat?**: `string`

The format of the document id.

***

### documentCode {#documentcode}

> **documentCode**: `UneceDocumentCodeList`

The code for the document type.

***

### documentRevision {#documentrevision}

> **documentRevision**: `number`

The revision of the document as a 0 based index.

***

### annotationObject? {#annotationobject}

> `optional` **annotationObject?**: `IJsonLdNodeObject`

Additional annotation information for the document.

***

### blobStorageId {#blobstorageid}

> **blobStorageId**: `string`

The blob storage id for the document.

***

### integrity {#integrity}

> **integrity**: `string`

The integrity of the blob data.

***

### blobStorageEntry? {#blobstorageentry}

> `optional` **blobStorageEntry?**: `IBlobStorageEntry`

The additional JSON-LD for blob storage if it was requested.

***

### extractedData? {#extracteddata}

> `optional` **extractedData?**: `unknown`

The data extracted from the document using data extraction services.

***

### attestationId? {#attestationid}

> `optional` **attestationId?**: `string`

The attestation for the document if one was created.

***

### attestationInformation? {#attestationinformation}

> `optional` **attestationInformation?**: `IAttestationInformation`

The additional JSON-LD for attestation storage if it was requested.

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

# Interface: IDocument

Interface describing a document.

## Properties

### @context

> **@context**: \[`"https://schema.twindev.org/documents/"`, `"https://schema.twindev.org/common/"`, `"https://schema.org"`, `...IJsonLdContextDefinitionElement[]`\]

JSON-LD Context.

***

### type

> **type**: `"Document"`

JSON-LD Type.

***

### id

> **id**: `string`

The full id of the document.

***

### documentId

> **documentId**: `string`

The id of the document.
json-ld type:schema:identifier

***

### documentIdFormat?

> `optional` **documentIdFormat**: `string`

The format of the document id.
json-ld type:schema:Text

***

### documentCode

> **documentCode**: `UneceDocumentCodeList`

The code for the document type.
json-ld type:schema:identifier

***

### documentRevision

> **documentRevision**: `number`

The revision of the document as a 0 based index.
json-ld type:schema:Integer

***

### annotationObject?

> `optional` **annotationObject**: `IJsonLdNodeObject`

Additional annotation information for the document.
json-ld namespace:twin-common

***

### blobStorageId

> **blobStorageId**: `string`

The blob storage id for the document.
json-ld type:schema:identifier

***

### blobHash

> **blobHash**: `string`

The hash of the blob data.
json-ld namespace:twin-common

***

### blobStorageEntry?

> `optional` **blobStorageEntry**: `IBlobStorageEntry`

The additional JSON-LD for blob storage if it was requested.
json-ld id

***

### extractedData?

> `optional` **extractedData**: `unknown`

The data extracted from the document using data extraction services.
json-ld type:json

***

### attestationId?

> `optional` **attestationId**: `string`

The attestation for the document if one was created.
json-ld type:schema:identifier

***

### attestationInformation?

> `optional` **attestationInformation**: `IAttestationInformation`

The additional JSON-LD for attestation storage if it was requested.
json-ld id

***

### dateCreated

> **dateCreated**: `string`

The date/time of when the document was created.
json-ld namespace:schema

***

### dateModified?

> `optional` **dateModified**: `string`

The date/time of when the document was modified.
json-ld namespace:schema

***

### dateDeleted?

> `optional` **dateDeleted**: `string`

The date/time of when the document was deleted, as we never actually remove items.
json-ld namespace:schema

***

### organizationIdentity?

> `optional` **organizationIdentity**: `string`

The organization which added the document to the graph.
json-ld namespace:twin-common

***

### userIdentity?

> `optional` **userIdentity**: `string`

The user who added the document to the graph.
json-ld namespace:twin-common

# Interface: IDocumentAttestation

Interface describing a document attestation.

## Properties

### @context

> **@context**: \[`"https://schema.org"`, `"https://schema.twindev.org/documents/"`, `"https://schema.twindev.org/common/"`\]

JSON-LD Context.

***

### type

> **type**: `"DocumentAttestation"`

JSON-LD Type.

***

### documentId

> **documentId**: `string`

The id of the document.
json-ld type:schema:identifier

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

### dateCreated

> **dateCreated**: `string`

The date/time of when the document was created.
json-ld namespace:schema

***

### integrity

> **integrity**: `string`

The integrity of the document being attested.
json-ld namespace:twin-common

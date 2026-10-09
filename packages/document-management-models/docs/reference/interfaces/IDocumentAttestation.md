# Interface: IDocumentAttestation

Interface describing a document attestation.

## Properties

### @context {#context}

> **@context**: \[`"https://schema.org"`, `"https://schema.3sixty.global/documents/"`, `"https://schema.3sixty.global/common/"`\]

JSON-LD Context.

***

### type {#type}

> **type**: `"DocumentAttestation"`

JSON-LD Type.

***

### documentId {#documentid}

> **documentId**: `string`

The id of the document.

***

### documentCode {#documentcode}

> **documentCode**: `UneceDocumentCodeList`

The code for the document type.

***

### documentRevision {#documentrevision}

> **documentRevision**: `number`

The revision of the document as a 0 based index.

***

### dateCreated {#datecreated}

> **dateCreated**: `string`

The date/time of when the document was created.

***

### integrity {#integrity}

> **integrity**: `string`

The integrity of the document being attested.

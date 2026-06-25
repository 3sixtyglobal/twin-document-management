# Interface: IDocumentBase

Interface describing a document base.

## Extended by

- [`IDocument`](IDocument.md)

## Properties

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

### annotationObject? {#annotationobject}

> `optional` **annotationObject?**: `IJsonLdNodeObject`

Additional annotation information for the document.

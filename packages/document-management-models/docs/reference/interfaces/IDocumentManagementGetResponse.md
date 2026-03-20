# Interface: IDocumentManagementGetResponse

Response to get a document and optionally revisions from an auditable item graph vertex.

## Properties

### headers? {#headers}

> `optional` **headers?**: `object`

The headers which can be used to determine the response data type.

#### content-type

> **content-type**: `"application/json"` \| `"application/ld+json"`

#### link?

> `optional` **link?**: `string` \| `string`[]

***

### body {#body}

> **body**: [`IDocumentList`](IDocumentList.md)

The body parameters.

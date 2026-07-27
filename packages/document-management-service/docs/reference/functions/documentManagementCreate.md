# Function: documentManagementCreate()

> **documentManagementCreate**(`httpRequestContext`, `componentName`, `request`, `baseRouteName`): `Promise`\<`ICreatedResponse`\>

Create a document as an auditable item graph vertex.

## Parameters

### httpRequestContext

`IHttpRequestContext`

The request context for the API.

### componentName

`string`

The name of the component to use in the routes.

### request

`IDocumentManagementCreateRequest`

The request.

### baseRouteName

`string`

The base route name for constructing URLs.

## Returns

`Promise`\<`ICreatedResponse`\>

The response object with additional http response properties.

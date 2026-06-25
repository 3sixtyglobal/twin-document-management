# Document Management Models Examples

These snippets show typical setup steps for registering data types and creating document-shaped data that can be validated and exchanged consistently.

## DocumentManagementDataTypes

```typescript
import { DataTypeHandlerFactory } from '@twin.org/data-core';
import {
  DocumentContexts,
  DocumentManagementDataTypes,
  DocumentTypes
} from '@twin.org/document-management-models';

DocumentManagementDataTypes.registerTypes();

const handler = DataTypeHandlerFactory.get(
  `${DocumentContexts.Namespace}${DocumentTypes.Document}`
);

console.log(handler.namespace); // https://schema.twindev.org/document-management/
console.log(handler.type); // Document
```

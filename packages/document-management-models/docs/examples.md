# Document Management Models Examples

These snippets show typical setup steps for registering data types and creating document-shaped data that can be validated and exchanged consistently.

## DocumentManagementDataTypes

```typescript
import { DataTypeHandlerFactory } from '@3sixty/data-core';
import {
  DocumentContexts,
  DocumentManagementDataTypes,
  DocumentTypes
} from '@3sixty/document-management-models';

DocumentManagementDataTypes.registerTypes();

const handler = DataTypeHandlerFactory.get(
  `${DocumentContexts.Namespace}${DocumentTypes.Document}`
);

console.log(handler.namespace); // https://schema.3sixty.global/document-management/
console.log(handler.type); // Document
```

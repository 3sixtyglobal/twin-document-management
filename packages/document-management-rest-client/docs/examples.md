# Document Management REST Client Examples

These examples walk through common client calls for creating, updating, reading, and finding documents from a remote service.

## DocumentManagementRestClient

```typescript
import { DocumentManagementRestClient } from '@twin.org/document-management-rest-client';
import { Converter } from '@twin.org/core';
import { UneceDocumentCodeList } from '@twin.org/standards-unece';

const client = new DocumentManagementRestClient({
  endpoint: 'http://localhost:3000'
});

const blobBytes = Converter.utf8ToBytes('Updated bill of lading payload');
const edgeTargetId = 'aig:shipment-vertex';
```

```typescript
const componentName = client.className();
console.log(componentName); // DocumentManagementRestClient
```

```typescript
const createdVertexId = await client.create(
  'BOL-2026-0001',
  'bol',
  UneceDocumentCodeList.BillOfLading,
  blobBytes,
  {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: 'bol-2026-0001.pdf'
  },
  [
    {
      targetId: edgeTargetId,
      addAlias: true,
      aliasAnnotationObject: {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: 'Shipment link'
      }
    }
  ],
  {
    createAttestation: true,
    addAlias: true,
    aliasAnnotationObject: {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: 'Primary alias'
    }
  }
);

console.log(createdVertexId); // aig:document-vertex-1
```

```typescript
await client.update(
  'aig:document-vertex-1',
  Converter.utf8ToBytes('Second revision payload'),
  {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'bol-2026-0001-rev1.pdf'
  },
  [
    {
      targetId: edgeTargetId,
      addAlias: true,
      aliasAnnotationObject: {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: 'Shipment alias'
      }
    }
  ]
);
```

```typescript
const latest = await client.get(
  'aig:document-vertex-1',
  {
    includeBlobStorageMetadata: true,
    includeAttestation: true
  },
  '0',
  2
);

console.log(latest.entries.itemListElement.length); // 2
console.log(latest.cursor); // 2
```

```typescript
const revisionOne = await client.getRevision('aig:document-vertex-1', 1, {
  includeBlobStorageData: true,
  includeAttestation: true
});

console.log(revisionOne.documentRevision); // 1
console.log(revisionOne.documentId); // BOL-2026-0001
```

```typescript
await client.removeRevision('aig:document-vertex-1', 1);
```

```typescript
const matches = await client.query('BOL-2026-0001', '0', 10);

console.log(matches.entries.vertices.length); // 1
console.log(matches.cursor); // undefined
```

# Document Management Service Examples

Use these snippets to wire the service into existing components and handle a full document lifecycle from creation through querying.

## DocumentManagementService

```typescript
import { ComponentFactory, Converter } from '@3sixty/core';
import { DocumentManagementService } from '@3sixty/document-management-service';
import { UneceDocumentCodeList } from '@3sixty/standards-unece';

// Register concrete components before constructing the service.
ComponentFactory.register('auditable-item-graph', () => auditableItemGraphComponent);
ComponentFactory.register('blob-storage', () => blobStorageComponent);
ComponentFactory.register('attestation', () => attestationComponent);
ComponentFactory.register('data-processing', () => dataProcessingComponent);

const service = new DocumentManagementService();
const newBlob = Converter.utf8ToBytes('Initial customs document payload');
```

```typescript
const className = service.className();
console.log(className); // DocumentManagementService
```

```typescript
const vertexId = await service.create(
  'CUS-2026-0100',
  'customs',
  UneceDocumentCodeList.CustomsDeclaration,
  newBlob,
  {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: 'customs-2026-0100.xml'
  },
  [
    {
      targetId: 'aig:shipment-123',
      addAlias: true,
      aliasAnnotationObject: {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: 'Shipment reference'
      }
    }
  ],
  {
    createAttestation: true,
    addAlias: true,
    aliasAnnotationObject: {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: 'Primary document alias'
    }
  }
);

console.log(vertexId); // aig:document-vertex-2
```

```typescript
await service.update(
  'aig:document-vertex-2',
  Converter.utf8ToBytes('Customs document payload revision 1'),
  {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'customs-2026-0100-rev1.xml'
  },
  [
    {
      targetId: 'aig:shipment-123',
      addAlias: true,
      aliasAnnotationObject: {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: 'Updated shipment alias'
      }
    }
  ]
);
```

```typescript
const latestDocuments = await service.get(
  'aig:document-vertex-2',
  {
    includeBlobStorageMetadata: true,
    includeAttestation: true,
    includeRemoved: false
  },
  '0',
  2
);

console.log(latestDocuments.entries.itemListElement.length); // 2
console.log(latestDocuments.cursor); // 2
```

```typescript
const revision = await service.getRevision('aig:document-vertex-2', 1, {
  includeBlobStorageData: true,
  includeAttestation: true
});

console.log(revision.documentRevision); // 1
console.log(revision.documentCode); // Cusdec
```

```typescript
await service.removeRevision('aig:document-vertex-2', 1);
```

```typescript
const queryResult = await service.query('CUS-2026-0100', '0', 10);

console.log(queryResult.entries.vertices.length); // 1
console.log(queryResult.cursor); // undefined
```

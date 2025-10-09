// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	ICreatedResponse,
	IHttpRequestContext,
	INoContentResponse,
	INotFoundResponse,
	IRestRoute,
	ITag
} from "@twin.org/api-models";
import {
	AuditableItemGraphContexts,
	AuditableItemGraphTypes
} from "@twin.org/auditable-item-graph-models";
import { Coerce, ComponentFactory, Converter, Guards, Is } from "@twin.org/core";
import {
	DocumentContexts,
	DocumentTypes,
	type IDocumentManagementGetRevisionRequest,
	type IDocumentManagementGetRevisionResponse,
	type IDocumentManagementComponent,
	type IDocumentManagementCreateRequest,
	type IDocumentManagementGetRequest,
	type IDocumentManagementGetResponse,
	type IDocumentManagementQueryRequest,
	type IDocumentManagementQueryResponse,
	type IDocumentManagementRemoveRequest,
	type IDocumentManagementUpdateRequest
} from "@twin.org/document-management-models";
import { nameof } from "@twin.org/nameof";
import { SchemaOrgContexts, SchemaOrgTypes } from "@twin.org/standards-schema-org";
import { UneceDocumentCodes } from "@twin.org/standards-unece";
import { HeaderTypes, HttpStatusCode, MimeTypes } from "@twin.org/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "documentManagementStorageRoutes";

/**
 * The tag to associate with the routes.
 */
export const tagsDocumentManagement: ITag[] = [
	{
		name: "Document Management",
		description: "Endpoints which are modelled to access a document management contract."
	}
];

/**
 * The REST routes for document management.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param componentName The name of the component to use in the routes stored in the ComponentFactory.
 * @returns The generated routes.
 */
export function generateRestRoutesDocumentManagement(
	baseRouteName: string,
	componentName: string
): IRestRoute[] {
	const documentManagementCreateRoute: IRestRoute<
		IDocumentManagementCreateRequest,
		ICreatedResponse
	> = {
		operationId: "DocumentManagementSet",
		summary:
			"Store a document in an auditable item graph vertex and add its content to blob storage.",
		tag: tagsDocumentManagement[0].name,
		method: "POST",
		path: `${baseRouteName}/`,
		handler: async (httpRequestContext, request) =>
			documentManagementCreate(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IDocumentManagementCreateRequest>(),
			examples: [
				{
					id: "DocumentManagementCreateRequestExample",
					request: {
						body: {
							documentId: "2721000",
							documentIdFormat: "bol",
							documentCode: UneceDocumentCodes.BillOfLading,
							blob: "SGVsbG8gV29ybGQ=",
							annotationObject: {
								"@context": "https://schema.org",
								"@type": "DigitalDocument",
								name: "myfile.pdf"
							},
							createAttestation: true
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<ICreatedResponse>(),
				examples: [
					{
						id: "DocumentManagementCreateResponseExample",
						response: {
							statusCode: HttpStatusCode.created,
							headers: {
								[HeaderTypes.Location]: "aig:123456"
							}
						}
					}
				]
			}
		]
	};

	const documentManagementUpdateRoute: IRestRoute<
		IDocumentManagementUpdateRequest,
		INoContentResponse
	> = {
		operationId: "DocumentManagementUpdate",
		summary:
			"Update a document in an auditable item graph vertex and add its content to blob storage.",
		tag: tagsDocumentManagement[0].name,
		method: "PUT",
		path: `${baseRouteName}/:auditableItemGraphDocumentId`,
		handler: async (httpRequestContext, request) =>
			documentManagementUpdate(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IDocumentManagementUpdateRequest>(),
			examples: [
				{
					id: "DocumentManagementUpdateRequestExample",
					request: {
						pathParams: {
							auditableItemGraphDocumentId: "aig:123456"
						},
						body: {
							blob: "SGVsbG8gV29ybGQ=",
							annotationObject: {
								"@context": "https://schema.org",
								"@type": "DigitalDocument",
								name: "myfile.pdf"
							}
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>(),
				examples: [
					{
						id: "DocumentManagementCreateResponseExample",
						response: {
							statusCode: HttpStatusCode.noContent
						}
					}
				]
			}
		]
	};

	const documentManagementGetRoute: IRestRoute<
		IDocumentManagementGetRequest,
		IDocumentManagementGetResponse
	> = {
		operationId: "DocumentManagementGet",
		summary: "Get the data for a document from document management",
		tag: tagsDocumentManagement[0].name,
		method: "GET",
		path: `${baseRouteName}/:auditableItemGraphDocumentId`,
		handler: async (httpRequestContext, request) =>
			documentManagementGet(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IDocumentManagementGetRequest>(),
			examples: [
				{
					id: "DocumentManagementGetRequestExample",
					request: {
						pathParams: {
							auditableItemGraphDocumentId: "aig:123456"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IDocumentManagementGetResponse>(),
				examples: [
					{
						id: "DocumentManagementGetResponseExample",
						response: {
							body: {
								"@context": [
									SchemaOrgContexts.ContextRoot,
									DocumentContexts.ContextRoot,
									DocumentContexts.ContextRootCommon
								],
								type: SchemaOrgTypes.ItemList,
								[SchemaOrgTypes.ItemListElement]: [
									{
										"@context": [
											DocumentContexts.ContextRoot,
											DocumentContexts.ContextRootCommon,
											SchemaOrgContexts.ContextRoot
										],
										type: DocumentTypes.Document,
										id: "2721000:0",
										documentId: "2721000",
										documentIdFormat: "bol",
										documentCode: UneceDocumentCodes.BillOfLading,
										documentRevision: 0,
										blobStorageId:
											"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70",
										blobHash: "sha256:123456",
										dateCreated: "2024-01-01T00:00:00Z",
										annotationObject: {
											"@context": "https://schema.org",
											"@type": "DigitalDocument",
											name: "myfile.pdf"
										},
										nodeIdentity:
											"did:entity-storage:0x6363636363636363636363636363636363636363636363636363636363636363",
										userIdentity:
											"did:entity-storage:0x6363636363636363636363636363636363636363636363636363636363636363"
									}
								]
							}
						}
					}
				]
			},
			{
				type: nameof<IDocumentManagementGetResponse>(),
				mimeType: MimeTypes.JsonLd,
				examples: [
					{
						id: "DocumentManagementGetResponseExample",
						response: {
							body: {
								"@context": [
									SchemaOrgContexts.ContextRoot,
									DocumentContexts.ContextRoot,
									DocumentContexts.ContextRootCommon
								],
								type: SchemaOrgTypes.ItemList,
								[SchemaOrgTypes.ItemListElement]: [
									{
										"@context": [
											DocumentContexts.ContextRoot,
											DocumentContexts.ContextRootCommon,
											SchemaOrgContexts.ContextRoot
										],
										type: DocumentTypes.Document,
										id: "2721000:0",
										documentId: "2721000",
										documentIdFormat: "bol",
										documentCode: UneceDocumentCodes.BillOfLading,
										documentRevision: 0,
										blobStorageId:
											"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70",
										blobHash: "sha256:123456",
										dateCreated: "2024-01-01T00:00:00Z",
										annotationObject: {
											"@context": "https://schema.org",
											"@type": "DigitalDocument",
											name: "myfile.pdf"
										},
										nodeIdentity:
											"did:entity-storage:0x6363636363636363636363636363636363636363636363636363636363636363",
										userIdentity:
											"did:entity-storage:0x6363636363636363636363636363636363636363636363636363636363636363"
									}
								]
							}
						}
					}
				]
			},
			{
				type: nameof<INotFoundResponse>()
			}
		]
	};

	const documentManagementGetRevisionRoute: IRestRoute<
		IDocumentManagementGetRevisionRequest,
		IDocumentManagementGetRevisionResponse
	> = {
		operationId: "DocumentManagementGetRevision",
		summary: "Get the data for a document revision from document management",
		tag: tagsDocumentManagement[0].name,
		method: "GET",
		path: `${baseRouteName}/:auditableItemGraphDocumentId/:revision`,
		handler: async (httpRequestContext, request) =>
			documentManagementGetRevision(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IDocumentManagementGetRequest>(),
			examples: [
				{
					id: "DocumentManagementGetRevisionRequestExample",
					request: {
						pathParams: {
							auditableItemGraphDocumentId: "aig:123456",
							revision: "1"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IDocumentManagementGetRevisionResponse>(),
				examples: [
					{
						id: "DocumentManagementGetRevisionResponseExample",
						response: {
							body: {
								"@context": [
									DocumentContexts.ContextRoot,
									DocumentContexts.ContextRootCommon,
									SchemaOrgContexts.ContextRoot
								],
								type: DocumentTypes.Document,
								id: "2721000:0",
								documentId: "2721000",
								documentIdFormat: "bol",
								documentCode: UneceDocumentCodes.BillOfLading,
								documentRevision: 1,
								blobStorageId:
									"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70",
								blobHash: "sha256:123456",
								dateCreated: "2024-01-01T00:00:00Z",
								annotationObject: {
									"@context": "https://schema.org",
									"@type": "DigitalDocument",
									name: "myfile.pdf"
								},
								nodeIdentity:
									"did:entity-storage:0x6363636363636363636363636363636363636363636363636363636363636363",
								userIdentity:
									"did:entity-storage:0x6363636363636363636363636363636363636363636363636363636363636363"
							}
						}
					}
				]
			},
			{
				type: nameof<IDocumentManagementGetRevisionResponse>(),
				mimeType: MimeTypes.JsonLd,
				examples: [
					{
						id: "DocumentManagementGetRevisionResponseExample",
						response: {
							body: {
								"@context": [
									DocumentContexts.ContextRoot,
									DocumentContexts.ContextRootCommon,
									SchemaOrgContexts.ContextRoot
								],
								type: DocumentTypes.Document,
								id: "2721000:0",
								documentId: "2721000",
								documentIdFormat: "bol",
								documentCode: UneceDocumentCodes.BillOfLading,
								documentRevision: 1,
								blobStorageId:
									"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70",
								blobHash: "sha256:123456",
								dateCreated: "2024-01-01T00:00:00Z",
								annotationObject: {
									"@context": "https://schema.org",
									"@type": "DigitalDocument",
									name: "myfile.pdf"
								},
								nodeIdentity:
									"did:entity-storage:0x6363636363636363636363636363636363636363636363636363636363636363",
								userIdentity:
									"did:entity-storage:0x6363636363636363636363636363636363636363636363636363636363636363"
							}
						}
					}
				]
			},
			{
				type: nameof<INotFoundResponse>()
			}
		]
	};

	const documentManagementRemoveRevisionRoute: IRestRoute<
		IDocumentManagementRemoveRequest,
		INoContentResponse
	> = {
		operationId: "DocumentManagementRemove",
		summary: "Remove an document from an auditable item graph vertex",
		tag: tagsDocumentManagement[0].name,
		method: "DELETE",
		path: `${baseRouteName}/:auditableItemGraphDocumentId/:revision`,
		handler: async (httpRequestContext, request) =>
			documentManagementRemove(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IDocumentManagementRemoveRequest>(),
			examples: [
				{
					id: "DocumentManagementRemoveRequestExample",
					request: {
						pathParams: {
							auditableItemGraphDocumentId: "aig:1234",
							revision: "1"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			},
			{
				type: nameof<INotFoundResponse>()
			}
		]
	};

	const documentManagementQueryRoute: IRestRoute<
		IDocumentManagementQueryRequest,
		IDocumentManagementQueryResponse
	> = {
		operationId: "DocumentManagementQuery",
		summary: "Query the items from an auditable item graph vertex",
		tag: tagsDocumentManagement[0].name,
		method: "GET",
		path: `${baseRouteName}/`,
		handler: async (httpRequestContext, request) =>
			documentManagementQuery(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IDocumentManagementQueryRequest>(),
			examples: [
				{
					id: "DocumentManagementQueryRequestExample",
					request: {
						query: {
							documentId: "2721000"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IDocumentManagementQueryResponse>(),
				examples: [
					{
						id: "DocumentManagementQueryResponseExample",
						response: {
							body: {
								"@context": [SchemaOrgContexts.ContextRoot, AuditableItemGraphContexts.ContextRoot],
								type: [SchemaOrgTypes.ItemList, AuditableItemGraphTypes.VertexList],
								[SchemaOrgTypes.ItemListElement]: [
									{
										"@context": [
											AuditableItemGraphContexts.ContextRoot,
											AuditableItemGraphContexts.ContextRootCommon
										],
										id: "aig:c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7",
										type: AuditableItemGraphTypes.Vertex,
										dateCreated: "2024-08-22T04:13:20.000Z",
										aliases: [
											{
												"@context": [AuditableItemGraphContexts.ContextRoot],
												id: "test-id-0",
												type: AuditableItemGraphTypes.Alias,
												dateCreated: "2024-08-22T04:13:20.000Z"
											}
										],
										resources: [
											{
												"@context": AuditableItemGraphContexts.ContextRoot,
												type: AuditableItemGraphTypes.Resource,
												dateCreated: "2024-08-22T04:13:20.000Z",
												resourceObject: {
													"@context": [
														"https://schema.twindev.org/documents/",
														"https://schema.twindev.org/common/",
														"https://schema.org"
													],
													type: "Document",
													id: "test-id-0:0",
													documentId: "test-id-0",
													documentCode: "unece:DocumentCodeList#705",
													documentRevision: 0,
													annotationObject: {
														"@context": "https://schema.org",
														type: "DigitalDocument",
														name: "bill-of-lading"
													},
													blobHash: "sha256:E3Duqrp6bHojSx+CzDttAToAiP1eFkCDAPBbKLABVGM=",
													blobStorageId:
														"blob:memory:1370eeaaba7a6c7a234b1f82cc3b6d013a0088fd5e16408300f05b28b0015463",
													dateCreated: "2024-08-22T04:13:20.000Z",
													nodeIdentity:
														"did:entity-storage:0x0101010101010101010101010101010101010101010101010101010101010101",
													userIdentity:
														"did:entity-storage:0x0404040404040404040404040404040404040404040404040404040404040404"
												}
											}
										]
									}
								]
							}
						}
					}
				]
			}
		]
	};

	return [
		documentManagementCreateRoute,
		documentManagementUpdateRoute,
		documentManagementGetRoute,
		documentManagementGetRevisionRoute,
		documentManagementRemoveRevisionRoute,
		documentManagementQueryRoute
	];
}

/**
 * Create a document as an auditable item graph vertex.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function documentManagementCreate(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IDocumentManagementCreateRequest
): Promise<ICreatedResponse> {
	Guards.object<IDocumentManagementCreateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDocumentManagementCreateRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);
	Guards.stringBase64(ROUTES_SOURCE, nameof(request.body.blob), request.body.blob);

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);
	const id = await component.create(
		request.body.documentId,
		request.body.documentIdFormat,
		request.body.documentCode,
		Converter.base64ToBytes(request.body.blob),
		request.body.annotationObject,
		request.body.auditableItemGraphEdges,
		{
			createAttestation: request.body.createAttestation,
			addAlias: request.body.addAlias,
			aliasAnnotationObject: request.body.aliasAnnotationObject
		},
		httpRequestContext.userIdentity,
		httpRequestContext.nodeIdentity
	);

	return {
		statusCode: HttpStatusCode.created,
		headers: {
			location: id
		}
	};
}

/**
 * Get the document from the auditable item graph vertex.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function documentManagementGet(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IDocumentManagementGetRequest
): Promise<IDocumentManagementGetResponse> {
	Guards.object<IDocumentManagementGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDocumentManagementGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(
		ROUTES_SOURCE,
		nameof(request.pathParams.auditableItemGraphDocumentId),
		request.pathParams.auditableItemGraphDocumentId
	);

	const mimeType = request.headers?.[HeaderTypes.Accept] === MimeTypes.JsonLd ? "jsonld" : "json";

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	const result = await component.get(
		request.pathParams.auditableItemGraphDocumentId,
		{
			includeBlobStorageMetadata: Coerce.boolean(request.query?.includeBlobStorageMetadata),
			includeBlobStorageData: Coerce.boolean(request.query?.includeBlobStorageData),
			includeAttestation: Coerce.boolean(request.query?.includeAttestation),
			includeRemoved: Coerce.boolean(request.query?.includeRemoved),
			extractRuleGroupId: request.query?.extractRuleGroupId,
			extractMimeType: request.query?.extractMimeType
		},
		request.query?.cursor,
		Coerce.integer(request.query?.limit),
		httpRequestContext.userIdentity,
		httpRequestContext.nodeIdentity
	);

	return {
		headers: {
			[HeaderTypes.ContentType]: mimeType === "json" ? MimeTypes.Json : MimeTypes.JsonLd
		},
		body: result
	};
}

/**
 * Get the document revision from the auditable item graph vertex.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function documentManagementGetRevision(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IDocumentManagementGetRevisionRequest
): Promise<IDocumentManagementGetRevisionResponse> {
	Guards.object<IDocumentManagementGetRevisionRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDocumentManagementGetRevisionRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(
		ROUTES_SOURCE,
		nameof(request.pathParams.auditableItemGraphDocumentId),
		request.pathParams.auditableItemGraphDocumentId
	);

	const revision = Coerce.integer(request.pathParams.revision);
	Guards.integer(ROUTES_SOURCE, nameof(revision), revision);

	const mimeType = request.headers?.[HeaderTypes.Accept] === MimeTypes.JsonLd ? "jsonld" : "json";

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	const result = await component.getRevision(
		request.pathParams.auditableItemGraphDocumentId,
		revision,
		{
			includeBlobStorageMetadata: Coerce.boolean(request.query?.includeBlobStorageMetadata),
			includeBlobStorageData: Coerce.boolean(request.query?.includeBlobStorageData),
			includeAttestation: Coerce.boolean(request.query?.includeAttestation),
			extractRuleGroupId: request.query?.extractRuleGroupId,
			extractMimeType: request.query?.extractMimeType
		},
		httpRequestContext.userIdentity,
		httpRequestContext.nodeIdentity
	);

	return {
		headers: {
			[HeaderTypes.ContentType]: mimeType === "json" ? MimeTypes.Json : MimeTypes.JsonLd
		},
		body: result
	};
}

/**
 * Update the document from the auditable item graph vertex.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function documentManagementUpdate(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IDocumentManagementUpdateRequest
): Promise<INoContentResponse> {
	Guards.object<IDocumentManagementUpdateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDocumentManagementUpdateRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(
		ROUTES_SOURCE,
		nameof(request.pathParams.auditableItemGraphDocumentId),
		request.pathParams.auditableItemGraphDocumentId
	);

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	await component.update(
		request.pathParams.auditableItemGraphDocumentId,
		Is.stringValue(request.body.blob) ? Converter.base64ToBytes(request.body.blob) : undefined,
		request.body.annotationObject,
		request.body.auditableItemGraphEdges,
		httpRequestContext.userIdentity,
		httpRequestContext.nodeIdentity
	);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Remove the document from the auditable item graph vertex.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function documentManagementRemove(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IDocumentManagementRemoveRequest
): Promise<INoContentResponse> {
	Guards.object<IDocumentManagementRemoveRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDocumentManagementRemoveRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(
		ROUTES_SOURCE,
		nameof(request.pathParams.auditableItemGraphDocumentId),
		request.pathParams.auditableItemGraphDocumentId
	);
	const revision = Coerce.number(request.pathParams.revision);
	Guards.integer(ROUTES_SOURCE, nameof(request.pathParams.revision), revision);

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	await component.removeRevision(
		request.pathParams.auditableItemGraphDocumentId,
		revision,
		httpRequestContext.userIdentity,
		httpRequestContext.nodeIdentity
	);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Query the documents from an auditable item graph vertex.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function documentManagementQuery(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IDocumentManagementQueryRequest
): Promise<IDocumentManagementQueryResponse> {
	Guards.object<IDocumentManagementQueryRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDocumentManagementQueryRequest["query"]>(
		ROUTES_SOURCE,
		nameof(request.query),
		request.query
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.query.documentId), request.query.documentId);

	const mimeType = request.headers?.[HeaderTypes.Accept] === MimeTypes.JsonLd ? "jsonld" : "json";

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	const result = await component.query(
		request.query.documentId,
		request.query?.cursor,
		Coerce.integer(request.query?.limit),
		httpRequestContext.userIdentity,
		httpRequestContext.nodeIdentity
	);

	return {
		headers: {
			[HeaderTypes.ContentType]: mimeType === "json" ? MimeTypes.Json : MimeTypes.JsonLd
		},
		body: result
	};
}

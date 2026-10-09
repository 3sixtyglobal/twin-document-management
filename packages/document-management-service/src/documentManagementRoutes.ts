// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	HttpBodyLimit,
	HttpContextIdKeys,
	HttpHeaderHelper,
	HttpUrlHelper,
	type ICreatedResponse,
	type IHttpRequestContext,
	type INoContentResponse,
	type INotFoundResponse,
	type IRestRoute,
	type ITag
} from "@3sixty/api-models";
import {
	AuditableItemGraphContexts,
	AuditableItemGraphTypes
} from "@3sixty/auditable-item-graph-models";
import { ContextIdStore } from "@3sixty/context";
import { Coerce, ComponentFactory, Converter, Guards, Is } from "@3sixty/core";
import {
	DocumentContexts,
	DocumentTypes,
	type IDocumentManagementComponent,
	type IDocumentManagementCreateRequest,
	type IDocumentManagementGetRequest,
	type IDocumentManagementGetResponse,
	type IDocumentManagementGetRevisionRequest,
	type IDocumentManagementGetRevisionResponse,
	type IDocumentManagementQueryRequest,
	type IDocumentManagementQueryResponse,
	type IDocumentManagementRemoveRequest,
	type IDocumentManagementUpdatePartialRequest
} from "@3sixty/document-management-models";
import { nameof } from "@3sixty/nameof";
import { SchemaOrgContexts, SchemaOrgTypes } from "@3sixty/standards-schema-org";
import { UneceDocumentCodeList } from "@3sixty/standards-unece";
import { HeaderTypes, HttpStatusCode, type IHttpHeaders, MimeTypes } from "@3sixty/web";

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
		bodyLimit: HttpBodyLimit.Large,
		handler: async (httpRequestContext, request) =>
			documentManagementCreate(httpRequestContext, componentName, request, baseRouteName),
		requestType: {
			type: nameof<IDocumentManagementCreateRequest>(),
			examples: [
				{
					id: "DocumentManagementCreateRequestExample",
					request: {
						body: {
							document: {
								documentId: "2721000",
								documentIdFormat: "bol",
								documentCode: UneceDocumentCodeList.BillOfLading,
								annotationObject: {
									"@context": "https://schema.org",
									"@type": "DigitalDocument",
									name: "myfile.pdf"
								}
							},
							blob: "SGVsbG8gV29ybGQ=",
							options: { includeAttestation: true }
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
								[HeaderTypes.Location]: "aig%3A123456"
							}
						}
					}
				]
			}
		]
	};

	const documentManagementUpdatePartialRoute: IRestRoute<
		IDocumentManagementUpdatePartialRequest,
		INoContentResponse
	> = {
		operationId: "DocumentManagementUpdatePartial",
		summary:
			"Partially update a document in an auditable item graph vertex and add its content to blob storage.",
		tag: tagsDocumentManagement[0].name,
		method: "PATCH",
		path: `${baseRouteName}/:auditableItemGraphDocumentId`,
		bodyLimit: HttpBodyLimit.Large,
		handler: async (httpRequestContext, request) =>
			documentManagementUpdatePartial(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IDocumentManagementUpdatePartialRequest>(),
			examples: [
				{
					id: "DocumentManagementUpdatePartialRequestExample",
					request: {
						pathParams: {
							auditableItemGraphDocumentId: "aig:123456"
						},
						body: {
							document: {
								annotationObject: {
									"@context": "https://schema.org",
									"@type": "DigitalDocument",
									name: "myfile.pdf"
								}
							},
							blob: "SGVsbG8gV29ybGQ="
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
						id: "DocumentManagementUpdatePartialResponseExample",
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
									SchemaOrgContexts.Context,
									DocumentContexts.Context,
									DocumentContexts.ContextCommon
								],
								type: SchemaOrgTypes.ItemList,
								[SchemaOrgTypes.ItemListElement]: [
									{
										"@context": [
											SchemaOrgContexts.Context,
											DocumentContexts.Context,
											DocumentContexts.ContextCommon
										],
										type: DocumentTypes.Document,
										id: "2721000:0",
										documentId: "2721000",
										documentIdFormat: "bol",
										documentCode: UneceDocumentCodeList.BillOfLading,
										documentRevision: 0,
										blobStorageId:
											"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70",
										integrity: "sha256-123456",
										dateCreated: "2024-01-01T00:00:00Z",
										annotationObject: {
											"@context": "https://schema.org",
											"@type": "DigitalDocument",
											name: "myfile.pdf"
										},
										organizationIdentity:
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
									SchemaOrgContexts.Context,
									DocumentContexts.Context,
									DocumentContexts.ContextCommon
								],
								type: SchemaOrgTypes.ItemList,
								[SchemaOrgTypes.ItemListElement]: [
									{
										"@context": [
											SchemaOrgContexts.Context,
											DocumentContexts.Context,
											DocumentContexts.ContextCommon
										],
										type: DocumentTypes.Document,
										id: "2721000:0",
										documentId: "2721000",
										documentIdFormat: "bol",
										documentCode: UneceDocumentCodeList.BillOfLading,
										documentRevision: 0,
										blobStorageId:
											"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70",
										integrity: "sha256-123456",
										dateCreated: "2024-01-01T00:00:00Z",
										annotationObject: {
											"@context": "https://schema.org",
											"@type": "DigitalDocument",
											name: "myfile.pdf"
										},
										organizationIdentity:
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
									SchemaOrgContexts.Context,
									DocumentContexts.Context,
									DocumentContexts.ContextCommon
								],
								type: DocumentTypes.Document,
								id: "2721000:0",
								documentId: "2721000",
								documentIdFormat: "bol",
								documentCode: UneceDocumentCodeList.BillOfLading,
								documentRevision: 1,
								blobStorageId:
									"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70",
								integrity: "sha256-123456",
								dateCreated: "2024-01-01T00:00:00Z",
								annotationObject: {
									"@context": "https://schema.org",
									"@type": "DigitalDocument",
									name: "myfile.pdf"
								},
								organizationIdentity:
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
									SchemaOrgContexts.Context,
									DocumentContexts.Context,
									DocumentContexts.ContextCommon
								],
								type: DocumentTypes.Document,
								id: "2721000:0",
								documentId: "2721000",
								documentIdFormat: "bol",
								documentCode: UneceDocumentCodeList.BillOfLading,
								documentRevision: 1,
								blobStorageId:
									"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70",
								integrity: "sha256-123456",
								dateCreated: "2024-01-01T00:00:00Z",
								annotationObject: {
									"@context": "https://schema.org",
									"@type": "DigitalDocument",
									name: "myfile.pdf"
								},
								organizationIdentity:
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
								"@context": [SchemaOrgContexts.Context, AuditableItemGraphContexts.Context],
								type: [SchemaOrgTypes.ItemList, AuditableItemGraphTypes.VertexList],
								[SchemaOrgTypes.ItemListElement]: [
									{
										"@context": [
											AuditableItemGraphContexts.Context,
											AuditableItemGraphContexts.ContextCommon
										],
										id: "aig:c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7",
										type: AuditableItemGraphTypes.Vertex,
										dateCreated: "2024-08-22T04:13:20.000Z",
										aliases: [
											{
												"@context": [AuditableItemGraphContexts.Context],
												id: "test-id-0",
												type: AuditableItemGraphTypes.Alias,
												dateCreated: "2024-08-22T04:13:20.000Z"
											}
										],
										resources: [
											{
												"@context": AuditableItemGraphContexts.Context,
												type: AuditableItemGraphTypes.Resource,
												dateCreated: "2024-08-22T04:13:20.000Z",
												resourceObject: {
													"@context": [
														"https://schema.3sixty.global/documents/",
														"https://schema.3sixty.global/common/",
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
													integrity: "sha256-E3Duqrp6bHojSx+CzDttAToAiP1eFkCDAPBbKLABVGM=",
													blobStorageId:
														"blob:memory:1370eeaaba7a6c7a234b1f82cc3b6d013a0088fd5e16408300f05b28b0015463",
													dateCreated: "2024-08-22T04:13:20.000Z",
													organizationIdentity:
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
		documentManagementUpdatePartialRoute,
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
 * @param baseRouteName The base route name for constructing URLs.
 * @returns The response object with additional http response properties.
 */
export async function documentManagementCreate(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IDocumentManagementCreateRequest,
	baseRouteName: string
): Promise<ICreatedResponse> {
	Guards.object<IDocumentManagementCreateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDocumentManagementCreateRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);
	Guards.object<IDocumentManagementCreateRequest["body"]["document"]>(
		ROUTES_SOURCE,
		nameof(request.body.document),
		request.body.document
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.blob), request.body.blob);

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);
	const id = await component.create(
		request.body.document,
		Is.stringBase64(request.body.blob)
			? Converter.base64ToBytes(request.body.blob)
			: request.body.blob,
		request.body.auditableItemGraphEdges,
		{
			includeAttestation: request.body.options?.includeAttestation,
			includeAlias: request.body.options?.includeAlias,
			aliasAnnotationObject: request.body.options?.aliasAnnotationObject
		}
	);

	const contextIds = await ContextIdStore.getContextIds();
	const publicOrigin = contextIds?.[HttpContextIdKeys.PublicOrigin];

	const headers: IHttpHeaders = {};
	HttpHeaderHelper.buildId(
		headers,
		id,
		HttpUrlHelper.combineOriginPath(publicOrigin, `${baseRouteName}/:id`)
	);

	return {
		statusCode: HttpStatusCode.created,
		headers
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

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	const result = await component.get(
		request.pathParams.auditableItemGraphDocumentId,
		{
			includeBlobStorageMetadata: Coerce.boolean(request.query?.includeBlobStorageMetadata),
			includeBlobStorageData: Coerce.boolean(request.query?.includeBlobStorageData),
			includeAttestation: Coerce.boolean(request.query?.includeAttestation),
			includeRemoved: Coerce.boolean(request.query?.includeRemoved),
			includeDeletedEdges: Coerce.boolean(request.query?.includeDeletedEdges),
			extractRuleGroupId: request.query?.extractRuleGroupId,
			extractMimeType: request.query?.extractMimeType
		},
		request.query?.cursor,
		Coerce.integer(request.query?.limit)
	);

	const headers: IHttpHeaders = {};
	HttpHeaderHelper.buildJsonContentType(headers, request.headers);

	const contextIds = await ContextIdStore.getContextIds();
	HttpHeaderHelper.buildCursor(
		headers,
		httpRequestContext.serverRequest.url,
		contextIds?.[HttpContextIdKeys.PublicOrigin],
		result.cursor
	);

	return {
		headers,
		body: result.entries
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
		}
	);

	const headers: IHttpHeaders = {};
	HttpHeaderHelper.buildJsonContentType(headers, request.headers);

	return {
		headers,
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
export async function documentManagementUpdatePartial(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IDocumentManagementUpdatePartialRequest
): Promise<INoContentResponse> {
	Guards.object<IDocumentManagementUpdatePartialRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IDocumentManagementUpdatePartialRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(
		ROUTES_SOURCE,
		nameof(request.pathParams.auditableItemGraphDocumentId),
		request.pathParams.auditableItemGraphDocumentId
	);
	Guards.object<IDocumentManagementUpdatePartialRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	await component.updatePartial(
		request.pathParams.auditableItemGraphDocumentId,
		request.body.document,
		Is.stringBase64(request.body.blob)
			? Converter.base64ToBytes(request.body.blob)
			: request.body.blob,
		request.body.auditableItemGraphEdges,
		{
			includeAttestation: request.body.options?.includeAttestation,
			includeAlias: request.body.options?.includeAlias,
			aliasAnnotationObject: request.body.options?.aliasAnnotationObject
		}
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
	const revision = Coerce.integer(request.pathParams.revision);
	Guards.integer(ROUTES_SOURCE, nameof(revision), revision);

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	await component.removeRevision(request.pathParams.auditableItemGraphDocumentId, revision);

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

	const component = ComponentFactory.get<IDocumentManagementComponent>(componentName);

	const result = await component.query(
		request.query.documentId,
		request.query?.cursor,
		Coerce.integer(request.query?.limit)
	);

	const headers: IHttpHeaders = {};
	HttpHeaderHelper.buildJsonContentType(headers, request.headers);

	const contextIds = await ContextIdStore.getContextIds();
	HttpHeaderHelper.buildCursor(
		headers,
		httpRequestContext.serverRequest.url,
		contextIds?.[HttpContextIdKeys.PublicOrigin],
		result.cursor
	);

	return {
		headers,
		body: result.entries
	};
}

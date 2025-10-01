/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MCPRegistryClient, MCP_REGISTRY_BASE_URL } from './mcp-registry-client';
import type { components, paths } from '@kortex-hub/mcp-registry-types';

const FETCH_MOCK: typeof fetch = vi.fn();

const SERVER_LIST_EMPTY: components['schemas']['ServerList'] = {
    servers: [],
}

const SERVER_DETAILS: components['schemas']['Server'] = {
    name: 'foo',
    description: 'bar',
    version: '1.0.0'
}

const RESPONSE_MOCK: Response = {
    json: vi.fn(),
    ok: true,
} as unknown as Response;

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(FETCH_MOCK).mockResolvedValue(RESPONSE_MOCK);
});

interface GetServersTestCase {
    baseURL?: string,
    parameters: paths['/v0/servers']['get']['parameters'],
    expectedURL: string,
}

describe('getServers', () => {
    beforeEach(() => {
        vi.mocked(RESPONSE_MOCK.json).mockResolvedValue(SERVER_LIST_EMPTY);
    });

    test.each<GetServersTestCase>([
        {
            parameters: { query: {} },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers`
        },
        {
            baseURL:  `${MCP_REGISTRY_BASE_URL}/subpath/`,
            parameters: { query: {} },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/subpath/v0/servers`
        },
        {
            baseURL:  `${MCP_REGISTRY_BASE_URL}/subpath`,
            parameters: { query: {} },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/subpath/v0/servers`
        },
        {
            parameters: { query: { limit: 5 } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers?limit=5`
        },
        {
            parameters: { query: { cursor: '10' } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers?cursor=10`
        },
        {
            parameters: { query: { limit: 20, cursor: '40', } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers?limit=20&cursor=40`
        },
        {
            parameters: { query: { cursor: undefined } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers`
        },
    ])('should call fetch with correct URL for parameters $parameters', async ({ baseURL, parameters, expectedURL }) => {
        const client = new MCPRegistryClient({ fetch: FETCH_MOCK, baseURL: baseURL });
        await client.getServers(parameters);
        expect(FETCH_MOCK).toHaveBeenCalledWith(expectedURL);
    });
});

interface GetServerTestCase {
    parameters: paths['/v0/servers/{serverName}']['get']['parameters'],
    expectedURL: string,
}

describe('getServer', () => {
    beforeEach(() => {
        vi.mocked(RESPONSE_MOCK.json).mockResolvedValue(SERVER_DETAILS);
    });

    test.each<GetServerTestCase>([
        {
            parameters: { path: { serverName: encodeURI('foo') } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers/foo`
        },
        {
            parameters: { path: { serverName: encodeURI('bar') } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers/bar`
        },
    ])('should call fetch with correct URL for parameters $parameters', async ({ parameters, expectedURL }) => {
        const client = new MCPRegistryClient({ fetch: FETCH_MOCK });
        await client.getServer(parameters);
        expect(FETCH_MOCK).toHaveBeenCalledWith(expectedURL);
    });
});

interface GetServerVersionsTestCase {
    parameters: paths['/v0/servers/{serverName}/versions']['get']['parameters'],
    expectedURL: string,
}

describe('getServers', () => {
    beforeEach(() => {
        vi.mocked(RESPONSE_MOCK.json).mockResolvedValue(SERVER_DETAILS);
    });

    test.each<GetServerVersionsTestCase>([
        {
            parameters: { path: { serverName: encodeURI('foo') } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers/foo/versions`
        },
        {
            parameters: { path: { serverName: encodeURI('bar') } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers/bar/versions`
        },
    ])('should call fetch with correct URL for parameters $parameters', async ({ parameters, expectedURL }) => {
        const client = new MCPRegistryClient({ fetch: FETCH_MOCK });
        await client.getServerVersions(parameters);
        expect(FETCH_MOCK).toHaveBeenCalledWith(expectedURL);
    });
});

interface GetServerVersionTestCase {
    parameters: paths['/v0/servers/{serverName}/versions/{version}']['get']['parameters'],
    expectedURL: string,
}

describe('getServerVersion', () => {
    beforeEach(() => {
        vi.mocked(RESPONSE_MOCK.json).mockResolvedValue(SERVER_DETAILS);
    });

    test.each<GetServerVersionTestCase>([
        {
            parameters: { path: { serverName: encodeURI('foo'), version: encodeURI('1.0.5') } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers/foo/versions/1.0.5`
        },
        {
            parameters: { path: { serverName: encodeURI('bar'), version: encodeURI('2.8.3') } },
            expectedURL: `${MCP_REGISTRY_BASE_URL}/v0/servers/bar/versions/2.8.3`
        },
    ])('should call fetch with correct URL for parameters $parameters', async ({ parameters, expectedURL }) => {
        const client = new MCPRegistryClient({ fetch: FETCH_MOCK });
        await client.getServerVersion(parameters);
        expect(FETCH_MOCK).toHaveBeenCalledWith(expectedURL);
    });
});

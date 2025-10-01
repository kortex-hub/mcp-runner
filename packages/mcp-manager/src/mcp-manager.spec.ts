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

import { expect, test, vi, describe, beforeEach } from "vitest";
import { MCPManager } from "/@/mcp-manager";
import type { Storage } from "/@/models/storage";
import { MCPRemote, MCPPackage } from "@kortex-hub/mcp-runner";
import {Transport} from "@modelcontextprotocol/sdk/shared/transport.js";
import type {MCPRegistryClient} from "@kortex-hub/mcp-registry-client";
import {MCPRegistriesClients} from "/@/models/mcp-registries-clients";
import type { components } from '@kortex-hub/mcp-registry-types';

// mock runner
vi.mock('@kortex-hub/mcp-runner');

const STORAGE_MOCK: Storage = {
    get: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
    values: vi.fn(),
}

const SERVER_DETAILS: components['schemas']['ServerDetail'] = {
    name: 'foo',
    description: 'bar',
    version: '1.0.0',
    remotes: [{
        headers: [{
            name: 'FOO',
            value: 'bar',
            format: 'string',
            isSecret: false,
            isRequired: false,
        }],
        url: 'https://foo.bar',
        type: 'streamable-http',
    }],
    packages: [{
        runtimeArguments: [{
            type: 'named',
            name: '--foo-runtime',
            value: 'bar-runtime',
            format: 'string',
            isSecret: false,
            isRequired: false,
        },
            {
                value: 'bar-runtime-positional',
                format: 'string',
                isSecret: false,
                isRequired: false,
            }],
        packageArguments: [{
            name: 'foo-package',
            value: 'bar-package',
            format: 'string',
            isSecret: false,
            isRequired: false,
        }],
        version: '1.0.0',
        identifier: 'foo',
        registryType: 'foo',
        environmentVariables: [{
            name: 'foo-env',
            value: 'bar-env',
            format: 'string',
            isSecret: false,
            isRequired: false,
        }],
    }],
}

const SERVER_RESPONSE: components['schemas']['ServerResponse'] =  {
    server: SERVER_DETAILS,
    _meta: {}
}

const MCP_TRANSPORT: Transport = {
    close: vi.fn(),
    start: vi.fn(),
    send: vi.fn()
}

const MCP_REGISTRIES_CLIENTS_MOCK: MCPRegistriesClients = {
    getClient: vi.fn(),
}

const MCP_REGISTRY_CLIENT_MOCK: MCPRegistryClient = {
    getServers: vi.fn(),
    getServer: vi.fn(),
    getServerVersions: vi.fn(),
    getServerVersion: vi.fn(),
} as unknown as MCPRegistryClient;

const REGISTRY_URL_MOCK = 'https://foo.bar';

beforeEach(() => {
    vi.clearAllMocks();

    // mock Transport
    vi.mocked(MCP_TRANSPORT.close).mockResolvedValue(undefined);

    // mock MCPRemote
    vi.mocked(MCPRemote.prototype.connect).mockResolvedValue(MCP_TRANSPORT);

    // mock MCP Spawner
    vi.mocked(MCPPackage.prototype.enabled).mockResolvedValue(true);
    vi.mocked(MCPPackage.prototype.spawn).mockResolvedValue(MCP_TRANSPORT);

    // mock storage
    vi.mocked(STORAGE_MOCK.get).mockResolvedValue({
        type: 'remote',
        name: SERVER_DETAILS.name,
        registryURL: REGISTRY_URL_MOCK,
        remoteId: 0,
        version: SERVER_DETAILS.version,
        id: 'foo-bar',
        headers: {},
    });

    // mock MCP Registry client
    vi.mocked(MCP_REGISTRIES_CLIENTS_MOCK.getClient).mockReturnValue(MCP_REGISTRY_CLIENT_MOCK);
    vi.mocked(MCP_REGISTRY_CLIENT_MOCK.getServerVersion).mockResolvedValue(SERVER_RESPONSE);
});

test('MCPManager should not have any instance after constructor', () => {
    const manager = new MCPManager(STORAGE_MOCK, MCP_REGISTRIES_CLIENTS_MOCK);
    expect(manager.all()).toHaveLength(0);
});

describe('MCPManager#onUpdate', () => {
    let manager: MCPManager;
    beforeEach(() => {
        manager = new MCPManager(STORAGE_MOCK, MCP_REGISTRIES_CLIENTS_MOCK);
    });

    test('listener should be called on registerRemote', async () => {
        const onUpdate = vi.fn();
        manager.onUpdate(onUpdate);

        const { configId } = await manager.registerRemote(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {});

        expect(onUpdate).toHaveBeenCalledWith({
            type: 'register',
            configId: configId,
        });
    });

    test('disposed listener should not be called', async () => {
        const onUpdate = vi.fn();
        const disposable = manager.onUpdate(onUpdate);

        // dispose listener
        disposable[Symbol.dispose]();

        await manager.registerRemote(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {});

        expect(onUpdate).not.toHaveBeenCalled();
    });

    test('listener should be called on registerPackage', async () => {
        const onUpdate = vi.fn();
        manager.onUpdate(onUpdate);

        await manager.registerPackage(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {}, {}, {});

        expect(onUpdate).toHaveBeenCalledOnce();
    });

    test('listener should be called on start', async () => {
        const onUpdate = vi.fn();
        manager.onUpdate(onUpdate);

        const instance = await manager.start('foo-bar');

        expect(onUpdate).toHaveBeenCalledOnce();
    });

    test('listener should be called on stop', async () => {
        const onUpdate = vi.fn();
        manager.onUpdate(onUpdate);

        const instance = await manager.start('foo-bar');
        expect(onUpdate).toHaveBeenCalledOnce();

        await manager.stop(instance.configId);
        expect(onUpdate).toHaveBeenCalledTimes(2);
    });
});

describe('MCPManager#registerRemote', () => {
    let manager: MCPManager;
    beforeEach(() => {
        manager = new MCPManager(STORAGE_MOCK, MCP_REGISTRIES_CLIENTS_MOCK);
    });

    test('expect error if remoteId is out of bound', async () => {
        await expect(() => {
            return manager.registerRemote(REGISTRY_URL_MOCK, SERVER_DETAILS, 55, {});
        }).rejects.toThrowError('invalid index for remote');
    });

    test('expect MCPRemote to be instantiated with correct arguments', async () => {
        await manager.registerRemote(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {});

        expect(MCPRemote).toHaveBeenCalledOnce();
        expect(MCPRemote).toHaveBeenCalledWith({
            ...SERVER_DETAILS.remotes?.[0],
            headers: {
                'FOO': 'bar',
            },
        }, undefined);
    });

    test('expect MCPRemote#connect to have been called', async () => {
        await manager.registerRemote(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {});
        expect(MCPRemote.prototype.connect).toHaveBeenCalledOnce();
    });

    test('expect custom headers to overwrite server details', async () => {
        await manager.registerRemote(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {
            'FOO': 'baz'
        });
        expect(MCPRemote).toHaveBeenCalledWith(expect.objectContaining({
            headers: expect.objectContaining(
                {
                    'FOO': 'baz',
                }
            )
        }), undefined);
    });

    test('expect instance to be added to the manager', async () => {
        const instance = await manager.registerRemote(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {});

        const all = manager.all();
        expect(all).toHaveLength(1);
        expect(all[0]).toStrictEqual(instance);
    });
});

describe('MCPManager#stop', () => {
    let manager: MCPManager;
    beforeEach(async () => {
        manager = new MCPManager(STORAGE_MOCK, MCP_REGISTRIES_CLIENTS_MOCK);
    });

    test('expect stop remote instance to properly cleanup', async () => {
        const instance = await manager.registerRemote(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {});
        expect(manager.all()).toHaveLength(1);
        expect(MCP_TRANSPORT.close).not.toHaveBeenCalled();

        await manager.stop(instance.configId);
        expect(manager.all()).toHaveLength(0);

        // cleanup
        expect(MCP_TRANSPORT.close).toHaveBeenCalledOnce();
    });

    test('expect stop package instance to properly cleanup', async () => {
        const instance = await manager.registerPackage(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {}, {}, {});
        expect(manager.all()).toHaveLength(1);
        expect(MCPPackage.prototype[Symbol.asyncDispose]).not.toHaveBeenCalled();
        expect(MCP_TRANSPORT.close).not.toHaveBeenCalled();

        await manager.stop(instance.configId);
        expect(manager.all()).toHaveLength(0);

        // cleanup
        expect(MCPPackage.prototype[Symbol.asyncDispose]).toHaveBeenCalledOnce();
        expect(MCP_TRANSPORT.close).toHaveBeenCalledOnce();
    });
});

describe('MCPManager#registerPackage', () => {
    let manager: MCPManager;
    beforeEach(() => {
        manager = new MCPManager(STORAGE_MOCK, MCP_REGISTRIES_CLIENTS_MOCK);
    });

    test('expect error if packageId is out of bound', async () => {
        await expect(() => {
            return manager.registerPackage(REGISTRY_URL_MOCK, SERVER_DETAILS, 55, {}, {}, {});
        }).rejects.toThrowError('invalid index for package');
    });

    test('expect getMCPSpawner to have been called with appropriate arguments', async () => {
        await manager.registerPackage(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {}, {}, {});

        expect(MCPPackage).toHaveBeenCalledOnce();
        expect(MCPPackage).toHaveBeenCalledWith({
            ...SERVER_DETAILS.packages?.[0],
            runtimeArguments: [
                '--foo-runtime=bar-runtime',
                'bar-runtime-positional',
            ],
            packageArguments: [
                'bar-package'
            ],
            environmentVariables: {
                'foo-env': 'bar-env',
            },
        });
    });

    test('expect error when MCPSpawner is not enabled', async () => {
        vi.mocked(MCPPackage.prototype.enabled).mockResolvedValue(false);

        await expect(() => {
            return manager.registerPackage(REGISTRY_URL_MOCK, SERVER_DETAILS, 0, {}, {}, {});
        }).rejects.toThrowError('cannot start MCP server for registry foo')
    });
});

describe('start', () => {
    let manager: MCPManager;
    beforeEach(() => {
        manager = new MCPManager(STORAGE_MOCK, MCP_REGISTRIES_CLIENTS_MOCK);
    });

    test('start should get from storage the config', async () => {
        const instance = await manager.start('foo-bar');
        expect(instance).toEqual(expect.objectContaining({
            configId: 'foo-bar',
        }));

        expect(STORAGE_MOCK.get).toHaveBeenCalledOnce();
        expect(STORAGE_MOCK.get).toHaveBeenCalledWith('foo-bar');
    });

    test('start should use MCPRegistryClient to get full server details', async () => {
        await manager.start('foo-bar');

        expect(MCP_REGISTRY_CLIENT_MOCK.getServerVersion).toHaveBeenCalledOnce();
        expect(MCP_REGISTRY_CLIENT_MOCK.getServerVersion).toHaveBeenCalledWith({
            path: {
                version: SERVER_DETAILS.version,
                serverName: SERVER_DETAILS.name,
            }
        });
    });

    test('should should return appropriate MCP instance', async () => {
        await manager.start('foo-bar');

        expect(MCPPackage).not.toHaveBeenCalled();
        expect(MCPRemote).toHaveBeenCalledOnce();
    });

    test('start twice should fails', async () => {
        await manager.start('foo-bar');

        await expect(() => {
            return manager.start('foo-bar');
        }).rejects.toThrowError('an MCP instance for configId foo-bar already exists');
    });
});

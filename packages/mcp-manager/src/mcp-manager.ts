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
import {Storage} from "/@/models/storage";
import {MCPInstance} from "/@/models/mcp-instance";
import type { components } from '@kortex-hub/mcp-registry-types';
import { randomUUID } from 'node:crypto';
import { MCPRemote, MCPPackage } from '@kortex-hub/mcp-runner';
import type  { MCPRemoteOptions } from "@kortex-hub/mcp-runner";
import { MCPRegistryClient } from "@kortex-hub/mcp-registry-client";
import {RemoteConfig} from "/@/models/remote-config";
import {PackageConfig} from "/@/models/package-config";
import { EventEmitter } from 'node:events';
import {formatKeyValueInputs} from "/packages/mcp-manager/src/utils/format-key-value-inputs";
import {formatArguments} from "/@/utils/arguments";

export type VersionedServerDetail = components['schemas']['ServerDetail'] & {
    _meta: {
        "io.modelcontextprotocol.registry/official": {
            serverId: string;
            versionId: string;
            publishedAt: string;
            updatedAt: string;
            isLatest: boolean;
        }
    }
}

export type MCPManagerOptions = MCPRemoteOptions & {
    client?: MCPRegistryClient
};

const UPDATE_EVENT = 'mcp-manager-update';

export class MCPManager implements AsyncDisposable {
    #client: MCPRegistryClient;
    #instances: Map<string, MCPInstance> = new Map();
    #event: EventEmitter = new EventEmitter();

    constructor(protected readonly storage: Storage, protected readonly options?: MCPManagerOptions) {
        this.#client = options?.client ?? new MCPRegistryClient();
    }

    public onUpdate(listener: () => void): Disposable {
        this.#event.on(UPDATE_EVENT, listener);
        return {
            [Symbol.dispose]: () => {
                this.#event.off(UPDATE_EVENT, listener);
            }
        }
    }

    protected notify(): void {
        this.#event.emit(UPDATE_EVENT);
    }

    public async start(configId: string): Promise<MCPInstance> {
        if(this.#instances.has(configId)) {
            throw new Error(`an MCP instance for configId ${configId} already exists`);
        }

        const config = await this.storage.get(configId);

        const server: components['schemas']['ServerDetail'] = await this.#client.getServer({
            query: {
                version: config.version,
            },
            path: {
                server_id: config.serverId,
            }
        });

        if(!this.isVersionedServerDetail(server)) throw new Error('missing "io.modelcontextprotocol.registry/official" metadata on server details');

        switch (config.type) {
            case "remote":
                return this.startRemote(server, config);
            case "package":
                return this.startPackage(server, config);
        }
    }

    protected isVersionedServerDetail(server: components['schemas']['ServerDetail']): server is VersionedServerDetail {
        return !!server._meta?.["io.modelcontextprotocol.registry/official"];
    }

    public async registerRemote(
        server: components['schemas']['ServerDetail'],
        remoteId: number,
        headers: Record<string, string>,
    ): Promise<MCPInstance> {
        if(!this.isVersionedServerDetail(server)) throw new Error('missing "io.modelcontextprotocol.registry/official" metadata on server details');

        // Create a Remote Config
        const uuid = randomUUID();
        const config: RemoteConfig = {
            id: uuid,
            serverId: server._meta["io.modelcontextprotocol.registry/official"].serverId,
            version: server.version,
            type: 'remote',
            remoteId: remoteId,
            headers: headers,
        };

        const instance = await this.startRemote(server, config);

        // save config
        await this.storage.add(config);
        return instance;
    }

    public async registerPackage(
        server: components['schemas']['ServerDetail'],
        packageId: number,
        runtimeArguments: Record<number, string>,
        packageArguments: Record<number, string>,
        environmentVariables: Record<string, string>,
    ): Promise<MCPInstance> {
        if(!this.isVersionedServerDetail(server)) throw new Error('missing "io.modelcontextprotocol.registry/official" metadata on server details');

        // Create a Remote Config
        const uuid = randomUUID();
        const config: PackageConfig = {
            id: uuid,
            serverId: server._meta["io.modelcontextprotocol.registry/official"].serverId,
            version: server.version,
            type: 'package',
            packageId: packageId,
            runtimeArguments: runtimeArguments,
            packageArguments: packageArguments,
            environmentVariables: environmentVariables,
        };

        const instance = await this.startPackage(server, config);

        // save config
        await this.storage.add(config);
        return instance;
    }

    public async stop(configId: string): Promise<void> {
        try {
            return this.#instances.get(configId)?.[Symbol.asyncDispose]();
        } finally {
            this.notify();
        }
    }

    protected async startRemote(
        server: VersionedServerDetail,
        config: RemoteConfig,
    ): Promise<MCPInstance> {
        if(!server.remotes?.[config.remoteId]) throw new Error('invalid index for remote');

        const connector = new MCPRemote({
            ...server.remotes?.[config.remoteId],
            // resolve headers with config values and server values
            headers: formatKeyValueInputs(server.remotes?.[config.remoteId].headers, config.headers),
        }, this.options);
        const transport = await connector.connect();

        const instance: MCPInstance = {
            configId: config.id,
            transport: transport,
            [Symbol.asyncDispose]: async (): Promise<void> => {
                transport.close().catch(console.error);
                this.#instances.delete(config.id);
            }
        }

        // update instance store
        this.#instances.set(config.id, instance);
        this.notify();

        return instance;
    }

    public async startPackage(
        server: components['schemas']['ServerDetail'],
        config: PackageConfig,
    ): Promise<MCPInstance> {
        if(!server._meta?.["io.modelcontextprotocol.registry/official"]) throw new Error('missing "io.modelcontextprotocol.registry/official" metadata on server details');
        if(!server.packages?.[config.packageId]) throw new Error('invalid index for package');

        const spawner = new MCPPackage({
            ...server.packages?.[config.packageId],
            runtimeArguments: formatArguments(server.packages?.[config.packageId]?.runtimeArguments, config.runtimeArguments),
            // if the user provided package arguments, we want to override it
            packageArguments: formatArguments(server.packages?.[config.packageId]?.packageArguments, config.packageArguments),
            // if the user provided environment variables, we want to override it
            environmentVariables: formatKeyValueInputs(server.packages?.[config.packageId]?.environmentVariables, config.environmentVariables),
        });

        // ensure the spawner is enabled
        if(!(await spawner.enabled())) {
            throw new Error(`cannot start MCP server for registry ${server.packages?.[config.packageId].registryType}`);
        }

        // spawn the process
        const transport = await spawner.spawn();
        const instance: MCPInstance = {
            configId: config.id,
            transport: transport,
            [Symbol.asyncDispose]: async (): Promise<void> => {
                await Promise.allSettled([
                    spawner[Symbol.asyncDispose](),
                    transport.close()
                ]);
                this.#instances.delete( config.id);
            }
        }
        // update instance store
        this.#instances.set(config.id, instance);
        this.notify();

        return instance;
    }

    public all(): Array<MCPInstance> {
        return Array.from(this.#instances.values());
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await Promise.all(Array.from(this.#instances.values()).map((instance) => instance[Symbol.asyncDispose]));
        this.#instances.clear();
    }
}
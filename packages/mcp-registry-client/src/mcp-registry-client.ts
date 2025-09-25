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
import type { components, paths} from '@kortex-hub/mcp-registry-types';

export interface MCPRegistryClientOptions {
    baseURL?: string;
    fetch?: typeof fetch
}

export const MCP_REGISTRY_BASE_URL = 'https://registry.modelcontextprotocol.io';

export class MCPRegistryClient {
    #baseURL: string;
    #fetch: typeof fetch;

    constructor(options?: MCPRegistryClientOptions) {
        this.#baseURL = options?.baseURL ?? MCP_REGISTRY_BASE_URL;
        this.#fetch = options?.fetch ?? fetch;
    }

    protected getURL(
        pathname: keyof paths,
        options: {
            queries?: Record<string, unknown> | undefined,
            paths?: Record<string, unknown> | undefined,
        }
    ): string {
        const url = new URL(this.#baseURL);

        let template: string = pathname;
        if(options.paths) {
            Object.entries(options.paths).forEach(([key, value]) => {
                template = template.replace(`{${key}}`, String(value));
            });
        }
        url.pathname = template;

        if(options.queries) {
            url.search = new URLSearchParams(
                Object.fromEntries(Object.entries(options.queries).map(([key, value]) => ([key, String(value)]))),
            ).toString();
        }

        return url.toString();
    }

    public async getServers(parameters?: paths['/v0/servers']['get']['parameters']): Promise<components['schemas']['ServerList']> {
        const response = await this.#fetch(
            this.getURL('/v0/servers', {
                queries: parameters?.query,
            }),
        );
        if(!response.ok) throw new Error(`Failed to fetch servers: ${response.statusText}`);
        const body = await response.json()
        return body as components['schemas']['ServerList'];
    }

    public async getServer(parameters: paths['/v0/servers/{server_id}']['get']['parameters']): Promise<components['schemas']['ServerDetail']> {
        const response = await this.#fetch(
            this.getURL('/v0/servers/{server_id}', {
                queries: parameters.query,
                paths: parameters.path,
            }),
        );
        if(!response.ok) throw new Error(`Failed to fetch server details: ${response.statusText}`);
        const body = await response.json()
        return body as components['schemas']['ServerDetail'];
    }

    public async getServerVersions(parameters: paths['/v0/servers/{server_id}']['get']['parameters']): Promise<components['schemas']['ServerList']> {
        const response = await this.#fetch(
            this.getURL('/v0/servers/{server_id}', {
                queries: parameters.query,
                paths: parameters.path,
            }),
        );
        if(!response.ok) throw new Error(`Failed to fetch server versions: ${response.statusText}`);
        const body = await response.json()
        return body as components['schemas']['ServerList'];
    }
}
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
import type {components} from "@kortex-hub/mcp-registry-types";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

export interface MCPRemoteOptions {
    fetch?: typeof fetch;
}

export type ResolvedServerRemote = Omit<components['schemas']['Remote'], 'headers'> & {
    headers?: Record<string, string>,
};

export class MCPRemote implements AsyncDisposable {
    #transport: Transport | undefined;

    constructor(
        protected readonly remote: ResolvedServerRemote,
        protected readonly options?: MCPRemoteOptions,
    ) {}

    public async connect(): Promise<Transport> {
        const requestInit: RequestInit = {
            headers: this.remote.headers,
        }

        switch (this.remote.type) {
            case "streamable-http":
                this.#transport = new StreamableHTTPClientTransport(new URL(this.remote.url), {
                    requestInit: requestInit,
                    fetch: this.options?.fetch,
                });
                break;
            case "sse":
                this.#transport  = new SSEClientTransport(new URL(this.remote.url), {
                    requestInit: requestInit,
                    fetch: this.options?.fetch,
                });
                break;
        }

        return this.#transport;
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await this.#transport?.close();
    }
}
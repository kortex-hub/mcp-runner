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
import { formatInputWithVariables } from "/@/utils/input-with-variables";

export interface MCPRemoteOptions {
    fetch?: typeof fetch;
}

export class MCPRemote {
    constructor(
        protected readonly remote: components['schemas']['Remote'],
        protected readonly options?: MCPRemoteOptions,
    ) {}

    public async connect(): Promise<Transport> {
        const requestInit: RequestInit = {
            headers: Object.fromEntries((this.remote.headers ?? []).map((header) => ([header.name, formatInputWithVariables(header)]))),
        }

        switch (this.remote.type) {
            case "streamable-http":
                return new StreamableHTTPClientTransport(new URL(this.remote.url), {
                    requestInit: requestInit,
                    fetch: this.options?.fetch,
                });
            case "sse":
                return new SSEClientTransport(new URL(this.remote.url), {
                    requestInit: requestInit,
                    fetch: this.options?.fetch,
                });
        }
    }
}
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
import { MCPPackage } from "./package/mcp-package";
import { MCPRemote } from "./remote/mcp-remote";
import type { MCPRemoteOptions, ResolvedServerRemote } from "./remote/mcp-remote";
import type { MCPSpawner, ResolvedServerPackage } from './spawner/mcp-spawner';
import { MCPManager } from './manager/mcp-manager';
import type { MCPManagerEvent, MCPManagerOptions, MCPRegisterEvent, MCPStartEvent, MCPStopEvent } from './manager/mcp-manager';
import type { MCPInstance } from "./models/mcp-instance";
import type { MCPConfigurations, Storage } from "./models/storage";
import { MCPRegistryClient } from "./registry/mcp-registry-client";
import type { MCPRegistryClientOptions } from "./registry/mcp-registry-client";

export {
    /**
     * MCP Manager-related exports
     */
    type MCPManagerEvent,
    type MCPRegisterEvent,
    type MCPStopEvent,
    type MCPStartEvent,
    type MCPManagerOptions,
    type MCPInstance,
    MCPManager,
    /**
     * Storage-related exports
     */
    type MCPConfigurations,
    type Storage,
    /**
     * MCP Spawner-related exports
     */
    type MCPSpawner,
    /**
     * MCP Package-related exports
     */
    MCPPackage,
    type ResolvedServerPackage,
    /**
     * MCP Remote-related exports
     */
    MCPRemote,
    type ResolvedServerRemote,
    type MCPRemoteOptions,
    /**
     * MCP Registry client-related exports
     */
    MCPRegistryClient,
    type MCPRegistryClientOptions,
};

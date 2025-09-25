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
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { components } from '@kortex-hub/mcp-registry-types';
import { describe, expect, test } from 'vitest';

import { MCPSpawner } from './mcp-spawner';

type MockPack = components['schemas']['Package'] & { registryType: 'mock' };

const PACKAGE_MOCK = {
  registryType: 'mock',
} as MockPack;

class McpSpawnerMock extends MCPSpawner<'mock'> {
  constructor(pack?: Partial<MockPack>) {
    super({
      ...PACKAGE_MOCK,
      ...pack,
    });
  }

  [Symbol.asyncDispose](): PromiseLike<void> {
    throw new Error('not implemented');
  }

  spawn(): Promise<Transport> {
    throw new Error('not implemented');
  }
  enabled(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public override getEnvironments(): Record<string, string> {
    return super.getEnvironments();
  }
}

interface GetEnvironmentsTestCase {
  name: string;
  envs?: components['schemas']['KeyValueInput'][];
  expected: Record<string, string>;
}

describe('MCPSpawner#getEnvironments', () => {
  test.each<GetEnvironmentsTestCase>([
    {
      name: 'empty env array',
      envs: [],
      expected: {},
    },
    {
      name: 'simple single env with provided value',
      envs: [
        {
          name: 'FOO',
          isRequired: true,
          isSecret: true,
          format: 'string',
          value: 'BAR',
        },
      ],
      expected: {
        FOO: 'BAR',
      },
    },
  ])('$name', ({ envs, expected }) => {
    const spawner = new McpSpawnerMock({
      environmentVariables: envs,
    });
    const result = spawner.getEnvironments();
    expect(result).toStrictEqual(expected);
  });
});

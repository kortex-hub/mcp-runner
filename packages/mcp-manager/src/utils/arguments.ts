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

import { components } from "@kortex-hub/mcp-registry-types";
import {formatInputWithVariables} from "/@/utils/input-with-variables";

export function formatArgument(
    argument: components['schemas']['PositionalArgument'] | components['schemas']['NamedArgument'],
): string | undefined {
    const resolved = formatInputWithVariables(argument);
    if(!resolved) return undefined;

    // dealing with named argument
    if ('type' in argument && argument['type'] === 'named') {
        return `${argument.name}=${resolved}`;
    } else {
        return resolved;
    }
}

type patate = (components["schemas"]["InputWithVariables"] & { value: string}) |(components["schemas"]["InputWithVariables"] & { valueHint: string })
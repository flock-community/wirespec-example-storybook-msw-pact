#!/usr/bin/env node
// Rebuild gen/model/index.ts, gen/endpoint/index.ts and gen/Client.ts to
// re-export every file in their respective directories. Wirespec emits these
// barrel files per-source, so the second `wirespec` invocation in this project
// overwrites whatever the first one wrote — losing exports. We just enumerate
// the actual files post-hoc.

import {readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const GEN = new URL('../src/gen/', import.meta.url).pathname;

const tsFiles = (dir) =>
    readdirSync(join(GEN, dir))
        .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
        .map((f) => f.replace(/\.ts$/, ''))
        .sort();

const writeBarrel = (dir) => {
    const exports = tsFiles(dir).map((name) => `export {${name}} from './${name}'`);
    writeFileSync(join(GEN, dir, 'index.ts'), exports.join('\n') + '\n');
};

writeBarrel('model');
writeBarrel('endpoint');

// Composite Client.ts: spread every per-endpoint client factory found in
// gen/client/. Each file exports `${name[0].lower}${name.slice(1)}Client`.
const clientFiles = tsFiles('client');
const clientImports = clientFiles
    .map((name) => {
        const fn = name[0].toLowerCase() + name.slice(1);
        return `import {${fn}} from './client/${name}'`;
    })
    .join('\n');
const clientSpreads = clientFiles
    .map((name) => `  ...${name[0].toLowerCase() + name.slice(1)}(serialization, transportation),`)
    .join('\n');
writeFileSync(
    join(GEN, 'Client.ts'),
    `import {Wirespec} from './Wirespec'
${clientImports}
export const client = (serialization: Wirespec.Serialization, transportation: Wirespec.Transportation) => ({
${clientSpreads}
})
`,
);

console.log(`Rebuilt barrels: model (${tsFiles('model').length}), endpoint (${tsFiles('endpoint').length}), Client.ts (${clientFiles.length} clients)`);

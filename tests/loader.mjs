import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = path.resolve(import.meta.dirname, '..');
const srcRoot = path.join(projectRoot, 'src');

const candidatesFor = (basePath) => [
  basePath,
  `${basePath}.ts`,
  `${basePath}.tsx`,
  path.join(basePath, 'index.ts'),
  path.join(basePath, 'index.tsx'),
];

registerHooks({
  resolve(specifier, context, nextResolve) {
    let basePath;

    if (specifier.startsWith('@/')) {
      basePath = path.join(srcRoot, specifier.slice(2));
    } else if (specifier.startsWith('.') && context.parentURL) {
      basePath = path.resolve(path.dirname(new URL(context.parentURL).pathname), specifier);
    } else {
      return nextResolve(specifier, context);
    }

    const found = candidatesFor(basePath).find((candidate) => existsSync(candidate));
    if (found) {
      return { url: pathToFileURL(found).href, shortCircuit: true };
    }

    return nextResolve(specifier, context);
  },
});

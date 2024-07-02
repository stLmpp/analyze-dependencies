import { Command } from '../command.js';
import { z } from 'zod';
import { spawn } from 'node:child_process';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import {
  AnalyzedDependency,
  Dependency,
  Main,
  MainResponse,
} from '../types/main-response.js';
import * as url from 'node:url';

function analyzeDependency(dependency: Dependency): AnalyzedDependency {
  const dependencies = Object.entries(dependency.dependencies ?? {});
  let totalDependencies = dependencies.length;
  const analyzedDependencies: AnalyzedDependency[] = [];
  for (const [key, value] of dependencies) {
    value.name = key;
    const analyzedDependency = analyzeDependency(value);
    analyzedDependencies.push(analyzedDependency);
    totalDependencies += analyzedDependency.totalDependencies;
  }
  return {
    name: dependency.name,
    version: dependency.version,
    directDependencies: dependencies.length,
    totalDependencies,
    dependencies: analyzedDependencies,
  };
}

function lsDeps(depth: number): Promise<Main[]> {
  return new Promise((resolve) => {
    const program = spawn('pnpm', ['ls', '--depth', String(depth), '--json']);
    const buffers: Buffer[] = [];
    program.stdout.on('data', (data) => {
      buffers.push(data);
    });
    program.on('exit', () => {
      resolve(JSON.parse(Buffer.concat(buffers).toString()));
    });
  });
}

async function getName(): Promise<string> {
  try {
    const file = await fsp.readFile(
      path.join(process.cwd(), 'package.json'),
      'utf8',
    );
    return JSON.parse(file)?.name ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export const mainCommand = new Command('__MAIN')
  .withSchema(
    z.object({
      depth: z
        .string()
        .trim()
        .regex(/^\d{1,16}$/)
        .transform(Number)
        .pipe(z.number().safe().min(0))
        .default('0'),
    }),
  )
  .withAction(async (args) => {
    const [jsons, name] = await Promise.all([lsDeps(args.depth), getName()]);
    const json = jsons.at(0)!;
    const response: MainResponse = {
      name: json.name,
      version: json.version,
      dependencies: {
        directDependencies: 0,
        totalDependencies: 0,
        dependencies: [],
      },
      devDependencies: {
        totalDependencies: 0,
        directDependencies: 0,
        dependencies: [],
      },
      unsavedDependencies: {
        dependencies: [],
        directDependencies: 0,
        totalDependencies: 0,
      },
    };
    const dependencies = Object.entries(json.dependencies ?? {});
    for (const [key, dependency] of dependencies) {
      dependency.name = key;
      const analyzedDependency = analyzeDependency(dependency);
      response.dependencies.directDependencies++;
      response.dependencies.totalDependencies +=
        analyzedDependency.totalDependencies + 1;
      response.dependencies.dependencies.push(analyzedDependency);
    }
    const devDependencies = Object.entries(json.devDependencies ?? {});
    for (const [key, dependency] of devDependencies) {
      dependency.name = key;
      const analyzedDependency = analyzeDependency(dependency);
      response.devDependencies.directDependencies++;
      response.devDependencies.totalDependencies +=
        analyzedDependency.totalDependencies + 1;
      response.devDependencies.dependencies.push(analyzedDependency);
    }
    const unsavedDependencies = Object.entries(json.unsavedDependencies ?? {});
    for (const [key, dependency] of unsavedDependencies) {
      dependency.name = key;
      const analyzedDependency = analyzeDependency(dependency);
      response.unsavedDependencies.directDependencies++;
      response.unsavedDependencies.totalDependencies +=
        analyzedDependency.totalDependencies + 1;
      response.unsavedDependencies.dependencies.push(analyzedDependency);
    }

    const app = new Hono();

    const libPath = path.dirname(url.fileURLToPath(import.meta.url));
    const [indexJs, indexHtml] = await Promise.all([
      fsp.readFile(path.join(libPath, 'front-end', 'index.js'), 'utf8'),
      fsp
        .readFile(path.join(libPath, 'front-end', 'index.html'), 'utf8')
        .then((file) => file.replace('$TITLE$', name)),
    ]);

    app
      .get('/data.json', (c) => c.json(response))
      .get('/index.js', (c) =>
        c.text(indexJs, 200, { 'Content-Type': 'text/javascript' }),
      )
      .get('/package/:packageName', (c) => c.json(response))
      .get('/', (c) => c.html(indexHtml));

    const port = 8080;
    console.log(`Server is running on http://localhost:${port}`);

    serve({
      fetch: app.fetch,
      port,
    });
  });

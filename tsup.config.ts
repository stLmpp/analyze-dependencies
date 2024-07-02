import { tsupConfig } from '@st-api/config';
import * as tsup from 'tsup';
import fsp from 'node:fs/promises';
import fs from 'node:fs';

export default tsup.defineConfig((options) => {
  const watch = options.watch ? 'src' : undefined;
  return {
    ...tsupConfig,
    entry: {
      bin: './src/bin.ts',
    },
    dts: false,
    skipNodeModulesBundle: true,
    watch,
    plugins: [
      {
        name: 'front-end',
        async buildEnd() {
          if (!fs.existsSync('dist/front-end')) {
            fs.mkdirSync('dist/front-end');
          }
          await Promise.all([
            tsup.build({
              config: false,
              dts: false,
              sourcemap: 'inline',
              format: 'esm',
              outDir: 'dist/front-end',
              minify: true,
              bundle: true,
              entry: {
                index: 'src/front-end/index.ts',
              },
              tsconfig: 'tsconfig.front.json',
              platform: 'browser',
            }),
            fsp.copyFile(
              'src/front-end/index.html',
              'dist/front-end/index.html',
            ),
          ]);
        },
      },
    ],
  };
});

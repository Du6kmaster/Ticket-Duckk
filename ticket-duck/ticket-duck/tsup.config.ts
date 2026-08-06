import { defineConfig } from 'tsup';

/**
 * bundle:false é proposital aqui: o command loader e o event loader
 * (src/utils/commandLoader.ts e eventLoader.ts) escaneiam as pastas
 * dist/commands e dist/events em tempo de execução. Empacotar tudo em
 * um único arquivo removeria esses arquivos individuais do disco e
 * quebraria o carregamento dinâmico. Como o código-fonte usa apenas
 * imports relativos (sem aliases), não há nenhuma desvantagem em manter
 * bundle:false — cada arquivo é apenas transpilado, preservando a
 * estrutura de pastas 1:1 entre src/ e dist/.
 */
export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  bundle: false,
  outDir: 'dist',
  esbuildOptions(options) {
    options.platform = 'node';
  },
});

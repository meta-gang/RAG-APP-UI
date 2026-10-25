const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function loadTS(relativePath, globals = {}) {
  const file = path.resolve(__dirname, '..', relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  const local = { exports: {} };
  const localRequire = (id) => {
    if (id.startsWith('.')) {
      const full = path.resolve(path.dirname(file), id);
      for (const extension of ['.ts', '.tsx'])
        if (fs.existsSync(full + extension)) return loadTS(full + extension, globals);
    }
    return require(id);
  };
  Function(
    'module',
    'exports',
    'require',
    ...Object.keys(globals),
    compiled,
  )(local, local.exports, localRequire, ...Object.values(globals));
  return local.exports;
}
module.exports = { loadTS };

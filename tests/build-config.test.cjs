const assert = require('node:assert/strict');
const test = require('node:test');

test('webpack exposes only the public WebSocket setting', () => {
  const common = require('../config/webpack.common');
  const definePlugin = common.plugins.find(
    (plugin) => plugin.constructor && plugin.constructor.name === 'DefinePlugin',
  );

  assert.ok(definePlugin, 'DefinePlugin must configure the public WebSocket URL');
  const definitions = definePlugin.definitions;
  assert.equal(Object.hasOwn(definitions, 'process.env'), false);
  assert.equal(Object.hasOwn(definitions, 'process.env.REACT_APP_WS_URL'), true);
  assert.deepEqual(Object.keys(definitions), ['process.env.REACT_APP_WS_URL']);
});

test('production service worker output is deterministic', () => {
  const production = require('../config/webpack.prod');
  const generateSW = production.plugins.find(
    (plugin) => plugin.constructor && plugin.constructor.name === 'GenerateSW',
  );

  assert.ok(generateSW, 'GenerateSW must be configured');
  assert.equal(generateSW.config.sourcemap, false);
});

test('session bootstrap and navigations always bypass service worker cache', () => {
  const worker = require('../config/webpack.prod').plugins.find((p) => p.constructor?.name === 'GenerateSW').config;
  assert.ok(worker.exclude.some((pattern) => pattern.test('ragang-session.js')));
  assert.ok(!worker.include.some((pattern) => pattern.test('index.html')));
  const route = worker.runtimeCaching.find((r) => r.handler === 'NetworkOnly');
  assert.equal(route.urlPattern({ request: { mode: 'navigate' }, url: new URL('http://127.0.0.1:8080/') }), true);
  assert.equal(
    route.urlPattern({ request: { mode: 'cors' }, url: new URL('http://127.0.0.1:8080/ragang-session.js') }),
    true,
  );
  assert.equal(route.urlPattern({ request: { mode: 'cors' }, url: new URL('http://127.0.0.1:8080/main.js') }), false);
});

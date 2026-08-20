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

// Mock de process para entornos que no son Node.js (React Native Android)
module.exports = {
  cwd: () => '/',
  env: {},
  version: 'v20.0.0',
  platform: 'android',
  nextTick: (fn) => setTimeout(fn, 0),
  hrtime: () => [0, 0],
  memory: () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0 }),
  versions: { node: 'v20.0.0', v8: '10.0.0' },
  argv: [],
  execPath: '/',
  exit: () => {},
  stdout: { write: () => {} },
  stderr: { write: () => {} },
  stdin: { isTTY: false },
};

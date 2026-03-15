// Bootstrap ts-node with the scripts tsconfig (CommonJS) before running tests.
process.env.TS_NODE_PROJECT = 'tsconfig.scripts.json';
require('ts-node/register');

#!/usr/bin/env node
import log from '@purinton/log';
import { registerHandlers, registerSignals } from '@purinton/common';
import { createApp, startApp } from './src/app.mjs';

registerHandlers({ log });
registerSignals({ log });

async function main() {
  log.info('knit service starting...');
  const app = await createApp({ log });
  startApp({ appInstance: app, log });
}

main().catch(err => {
  log.error('Failed to start knit service:', err);
  process.exit(1);
});
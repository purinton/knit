#!/usr/bin/env node
import 'dotenv/config';
import { log, registerHandlers, registerSignals } from '@purinton/common';
import { runWizard } from './src/wizard.mjs';

registerHandlers({ log });
registerSignals({ log });

log.info('Knit Wizard starting...');

runWizard();
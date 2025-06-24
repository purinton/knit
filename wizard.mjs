#!/usr/bin/env node
import 'dotenv/config';
import { log, registerHandlers, registerSignals } from '@purinton/common';

registerHandlers({ log });
registerSignals({ log });

log.info('Knit Wizard starting...');

import { runWizard } from './src/wizard.mjs';

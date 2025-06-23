import express from 'express';
import bodyParser from 'body-parser';
import { createWebhookProcessor } from './webhookProcessor.mjs';
import path from 'path';
import log from '@purinton/log';


function configureMiddleware(app, assetsPath) {
    app.use('/assets', express.static(assetsPath));
    app.use(bodyParser.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString('utf8');
        }
    }));
}

function configureRoutes(app, processor, log) {
    app.post('/', (req, res) => {
        log.info('[App] Incoming POST / request');
        processor.process(req, res);
    });
}

export async function createApp({
    webhookProcessorFactory = createWebhookProcessor,
    publisher = undefined,
    assetsPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../assets'),
    log: injectedLog = log
} = {}) {
    const app = express();
    configureMiddleware(app, assetsPath);
    const processor = webhookProcessorFactory({ publisher, log: injectedLog });
    configureRoutes(app, processor, injectedLog);
    return app;
}

export function startApp({
    appInstance,
    PORT = process.env.PORT || 3456,
    log: injectedLog = log
}) {
    if (!appInstance) throw new Error('App not created. Call createApp() first.');
    appInstance.listen(PORT, () => {
        injectedLog.info(`Server is listening on port ${PORT}`);
    });
}

import express from 'express';
import bodyParser from 'body-parser';
import WebhookProcessor from './webhookProcessor.mjs';


function configureMiddleware(app, assetsPath) {
    app.use('/assets', express.static(assetsPath));
    app.use(bodyParser.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString('utf8');
        }
    }));
}

function configureRoutes(app, processor) {
    app.post('/', (req, res) => {
        console.log('[App] Incoming POST / request');
        processor.process(req, res);
    });
}

export async function createApp({
    webhookProcessorFn = WebhookProcessor,
    assetsPath = path(import.meta, '..', 'assets')
} = {}) {
    const app = express();
    configureMiddleware(app, assetsPath);
    configureRoutes(app, webhookProcessorfn);
    appInstance = app;
    return app;
}

export function startApp({
    appInstance,
    PORT = process.env.PORT || 3456
}) {
    if (!appInstance) throw new Error('App not created. Call createApp() first.');
    appInstance.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
}

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import WebhookProcessor from './WebhookProcessor.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsPath = path.join(__dirname, 'assets');

let appInstance = null;
let PORT = process.env.PORT || 3456;
let webhookProcessor = null;

function configureMiddleware(app) {
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

export async function createApp() {
  const app = express();
  webhookProcessor = new WebhookProcessor();
  configureMiddleware(app);
  configureRoutes(app, webhookProcessor);
  appInstance = app;
  return app;
}

export function startApp() {
  if (!appInstance) throw new Error('App not created. Call createApp() first.');
  appInstance.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

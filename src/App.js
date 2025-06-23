import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import WebhookProcessor from './WebhookProcessor.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsPath = path.join(__dirname, 'assets');

class App {
    constructor() {
        this.app = express();
        this.PORT = process.env.PORT || 3456;
        this.webhookProcessor = new WebhookProcessor();
        this.configureMiddleware();
        this.configureRoutes();
    }

    configureMiddleware() {
        this.app.use('/assets', express.static(assetsPath));
        this.app.use(bodyParser.json({
            verify: (req, res, buf) => {
                req.rawBody = buf.toString('utf8');
            }
        }));
    }

    configureRoutes() {
        this.app.post('/', (req, res) => {
            console.log('[App] Incoming POST / request');
            this.webhookProcessor.process(req, res);
        });
    }

    start() {
        this.app.listen(this.PORT, () => {
            console.log(`Server is listening on port ${this.PORT}`);
        });
    }
}

export default App;

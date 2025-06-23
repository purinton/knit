import * as SignatureValidator from './signatureValidator.mjs';
import * as Publisher from './publisher.mjs';

let queue = 'inbox';
let secret = process.env.GITHUB_WEBHOOK_SECRET || '';
let publisherInstance = null;

export function createWebhookProcessor(publisher, customQueue = 'inbox') {
  queue = customQueue;
  secret = process.env.GITHUB_WEBHOOK_SECRET || '';
  publisherInstance = publisher || Publisher;
  return {
    async process(req, res) {
      try {
        const rawData = req.rawBody;
        const data = req.body;
        validateSignature(rawData, req.headers['x-hub-signature-256']);
        console.log('[WebhookProcessor] Signature validated');
        publisherInstance.publish({ raw: rawData, parsed: data });
        console.log('[WebhookProcessor] Published data to Publisher');
        res.sendStatus(200);
      } catch (err) {
        console.error('[WebhookProcessor] Error:', err.message || err);
        res.status(400).send('Webhook processing failed.');
      }
    }
  };
}

function validateSignature(body, signature) {
  if (!secret || !signature) {
    throw new Error('Forbidden: Missing secret or signature.');
  }
  if (!SignatureValidator.validate(body, secret, signature)) {
    throw new Error('Forbidden: Invalid signature.');
  }
}

import SignatureValidator from './SignatureValidator.js';
import Publisher from './Publisher.js';

class WebhookProcessor {
  constructor(publisher, queue = 'inbox') {
    this.queue = queue;
    this.secret = process.env.GITHUB_WEBHOOK_SECRET || '';
    this.publisher = publisher || new Publisher();
  }

  async process(req, res) {
    try {
      const rawData = req.rawBody;
      const data = req.body;
      this.validateSignature(rawData, req.headers['x-hub-signature-256']);
      console.log('[WebhookProcessor] Signature validated');
      // Log the raw GitHub payload
      //console.log('[WebhookProcessor] Raw GitHub payload:', rawData);
      this.publisher.publish({ raw: rawData, parsed: data });
      console.log('[WebhookProcessor] Published data to Publisher');
      res.sendStatus(200);
    } catch (err) {
      console.error('[WebhookProcessor] Error:', err.message || err);
      res.status(400).send('Webhook processing failed.');
    }
  }

  validateSignature(body, signature) {
    if (!this.secret || !signature) {
      throw new Error('Forbidden: Missing secret or signature.');
    }
    if (!SignatureValidator.validate(body, this.secret, signature)) {
      throw new Error('Forbidden: Invalid signature.');
    }
  }
}

export default WebhookProcessor;

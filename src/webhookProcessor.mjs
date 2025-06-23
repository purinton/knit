import * as SignatureValidator from './signatureValidator.mjs';
import * as Publisher from './publisher.mjs';

/**
 * Creates a webhook processor for handling GitHub webhook events.
 * @param {Object} params
 * @param {Object} [params.publisher=Publisher] - The publisher module to use.
 * @param {Object} [params.log] - Logger instance to use.
 * @returns {Object} Webhook processor with a process method.
 */
export function createWebhookProcessor({ publisher = Publisher, log } = {}) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
  return {
    /**
     * Processes an incoming webhook request.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async process(req, res) {
      try {
        const rawData = req.rawBody;
        const data = req.body;
        validateSignature({ body: rawData, signature: req.headers['x-hub-signature-256'], secret, log });
        if (log) log.info('[WebhookProcessor] Signature validated');
        publisher.publish({ raw: rawData, parsed: data, log });
        if (log) log.info('[WebhookProcessor] Published data to Publisher');
        res.sendStatus(200);
      } catch (err) {
        if (log) log.error('[WebhookProcessor] Error:', err.message || err);
        res.status(400).send('Webhook processing failed.');
      }
    }
  };
}

/**
 * Validates the GitHub webhook signature.
 * @param {Object} params
 * @param {string} params.body - The raw request body.
 * @param {string} params.signature - The signature from the header.
 * @param {string} params.secret - The webhook secret.
 * @param {Object} [params.log] - Logger instance to use.
 * @throws {Error} If the signature is missing or invalid.
 */
function validateSignature({ body, signature, secret, log }) {
  if (!secret || !signature) {
    if (log) log.error('Forbidden: Missing secret or signature.');
    throw new Error('Forbidden: Missing secret or signature.');
  }
  if (!SignatureValidator.validate({ data: body, secret, signature })) {
    if (log) log.error('Forbidden: Invalid signature.');
    throw new Error('Forbidden: Invalid signature.');
  }
}

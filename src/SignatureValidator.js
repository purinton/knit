import crypto from 'crypto';

class SignatureValidator {
  static validate(data, secret, signature) {
    if (!secret || !signature) return false;
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(data).digest('hex');
    return expectedSignature === signature;
  }
}

export default SignatureValidator;

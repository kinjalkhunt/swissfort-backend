import crypto from 'crypto';

// Generate Password Reset Token
const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  return {
    token: resetToken,
    hash: crypto.createHash('sha256').update(resetToken).digest('hex'),
    expiry: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  };
};

export default generateResetToken;

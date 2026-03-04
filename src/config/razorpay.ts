import Razorpay from 'razorpay';

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('Missing Razorpay configuration. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export const razorpayPublicConfig = {
  keyId: RAZORPAY_KEY_ID,
};

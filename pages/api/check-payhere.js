export default function handler(req, res) {
  res.json({
    exists: !!process.env.PAYHERE_MERCHANT_SECRET,
    firstChars:
      process.env.PAYHERE_MERCHANT_SECRET?.slice(0, 5),
  });
}
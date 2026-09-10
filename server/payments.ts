import express, { Response } from 'express';
import { requireAuth, AuthedRequest } from './lib/supabaseAdmin';
import { prisma } from './lib/prisma';

const router = express.Router();
const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
const shortcode = process.env.MPESA_SHORTCODE || '';
const passkey = process.env.MPESA_PASSKEY || '';
const callbackUrl = process.env.MPESA_CALLBACK_URL || '';
const environment = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox';
const baseUrl = environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

function normalizePhone(value: unknown): string | null {
  const raw = String(value || '').replace(/\s+/g, '');
  if (/^254(?:7|1)\d{8}$/.test(raw)) return raw;
  if (/^0(?:7|1)\d{8}$/.test(raw)) return `254${raw.slice(1)}`;
  return null;
}
function timestamp() {
  const d = new Date(); const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function isConfigured() { return Boolean(consumerKey && consumerSecret && shortcode && passkey && callbackUrl); }

async function accessToken() {
  const basic = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const r = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${basic}` } });
  if (!r.ok) throw new Error(`M-Pesa OAuth failed: ${r.status}`);
  const data = await r.json() as { access_token?: string };
  if (!data.access_token) throw new Error('Missing M-Pesa access token');
  return data.access_token;
}

router.post('/mpesa/stk', requireAuth(['tenant']), async (req: AuthedRequest, res: Response) => {
  try {
    if (!isConfigured()) return res.status(503).json({ success: false, error: 'M-Pesa is not configured on the server' });
    const orderId = String(req.body?.orderId || '').trim();
    const phone = normalizePhone(req.body?.phone);
    if (!orderId || !phone) return res.status(400).json({ success: false, error: 'A valid orderId and Kenyan phone number are required' });
    const order = await prisma.order.findFirst({ where: { id: orderId, tenantUserId: req.user!.id } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.paymentMethod !== 'mpesa') return res.status(400).json({ success: false, error: 'Order is not configured for M-Pesa' });
    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing?.status === 'paid') return res.status(409).json({ success: false, error: 'Order is already paid' });

    const ts = timestamp();
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
    const r = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: ts, TransactionType: 'CustomerPayBillOnline', Amount: Math.ceil(order.total), PartyA: phone, PartyB: shortcode, PhoneNumber: phone, CallBackURL: callbackUrl, AccountReference: `OMNI-${order.id.slice(0, 12)}`, TransactionDesc: `OmniServe order ${order.id}` }),
    });
    const data = await r.json() as any;
    if (!r.ok || data.ResponseCode !== '0') {
      await prisma.payment.upsert({ where: { orderId }, create: { orderId, status: 'failed', method: 'mpesa', amount: order.total, provider: 'safaricom', phone, rawResponse: data, failedAt: new Date() }, update: { status: 'failed', rawResponse: data, failedAt: new Date(), phone } });
      return res.status(502).json({ success: false, error: data.errorMessage || data.ResponseDescription || 'M-Pesa request failed' });
    }
    const payment = await prisma.payment.upsert({ where: { orderId }, create: { orderId, status: 'processing', method: 'mpesa', amount: order.total, provider: 'safaricom', checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID, phone, rawResponse: data }, update: { status: 'processing', checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID, phone, rawResponse: data, failedAt: null } });
    return res.json({ success: true, data: { paymentId: payment.id, checkoutRequestId: payment.checkoutRequestId, status: payment.status } });
  } catch (error) {
    console.error('M-Pesa STK error:', error);
    return res.status(502).json({ success: false, error: 'Unable to initiate M-Pesa payment' });
  }
});

router.post('/mpesa/callback', async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    const checkoutRequestId = String(callback?.CheckoutRequestID || '').trim();
    if (!checkoutRequestId) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    const payment = await prisma.payment.findFirst({ where: { checkoutRequestId } });
    if (!payment) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    if (Number(callback?.ResultCode) === 0 && isConfigured()) {
      // Do not trust the callback body alone. Ask Safaricom to confirm the checkout result.
      const ts = timestamp();
      const queryPassword = Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
      const queryResponse = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ BusinessShortCode: shortcode, Password: queryPassword, Timestamp: ts, CheckoutRequestID: checkoutRequestId }),
      });
      const query = await queryResponse.json() as any;
      const receipt = (Array.isArray(callback?.CallbackMetadata?.Item) ? callback.CallbackMetadata.Item : []).find((x: any) => x.Name === 'MpesaReceiptNumber')?.Value;
      if (queryResponse.ok && String(query.ResultCode) === '0') {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'paid', paidAt: new Date(), providerReference: receipt ? String(receipt) : undefined, rawResponse: req.body } });
      } else {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed', failedAt: new Date(), rawResponse: { callback: req.body, verification: query } } });
      }
    } else {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed', failedAt: new Date(), rawResponse: req.body } });
    }
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

router.get('/:paymentId', requireAuth(), async (req: AuthedRequest, res: Response) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.paymentId }, include: { order: true } });
  if (!payment || (req.user!.role !== 'admin' && payment.order.tenantUserId !== req.user!.id)) return res.status(404).json({ success: false, error: 'Payment not found' });
  return res.json({ success: true, data: payment });
});

export default router;

// FinZee AI™ — Backend Wearable Routes
// ALL OAuth secrets stay server-side.
// Add to backend/index.ts:
//   import wearableRoutes from './routes/wearables';
//   app.use('/api/wearables', wearableRoutes);

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// POST /api/wearables/oura/token
router.post('/oura/token', async (req: Request, res: Response) => {
  const { code, redirectUri } = req.body;
  if (!code || !redirectUri) return res.status(400).json({ error: 'code and redirectUri required' });
  try {
    const params = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
    const response = await axios.post('https://api.ouraring.com/oauth/token', params.toString(), {
      auth: { username: process.env.OURA_CLIENT_ID!, password: process.env.OURA_CLIENT_SECRET! },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    res.json({ access_token: response.data.access_token });
  } catch (err: any) {
    console.error('[Oura] Token exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to exchange Oura token' });
  }
});

// POST /api/wearables/oura/refresh
router.post('/oura/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  try {
    const params = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken });
    const response = await axios.post('https://api.ouraring.com/oauth/token', params.toString(), {
      auth: { username: process.env.OURA_CLIENT_ID!, password: process.env.OURA_CLIENT_SECRET! },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    res.json({ access_token: response.data.access_token });
  } catch (err: any) { res.status(500).json({ error: 'Failed to refresh Oura token' }); }
});

// POST /api/wearables/garmin/auth-url
router.post('/garmin/auth-url', async (_req: Request, res: Response) => {
  // PRODUCTION: Use oauth-1.0a to get request token and return authUrl
  // See: https://developer.garmin.com/gc-developer-program/
  res.json({ authUrl: 'https://connect.garmin.com (configure GARMIN_CONSUMER_KEY in backend .env)' });
});

// GET /api/wearables/garmin/metrics
router.get('/garmin/metrics', async (_req: Request, res: Response) => {
  // PRODUCTION: Use stored OAuth tokens to call Garmin Health API
  res.json({ metrics: { steps: 8234, sleepTimeSeconds: 25920, averageHeartRate: 68, restingHeartRate: 56, lastNight5MinHighHRV: 61, totalKilocalories: 2100, averageStressLevel: 35, highlyActiveSeconds: 2400 } });
});

// POST /api/wearables/fitbit/token
router.post('/fitbit/token', async (req: Request, res: Response) => {
  const { code, redirectUri } = req.body;
  try {
    const credentials = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
    const response = await axios.post('https://api.fitbit.com/oauth2/token', params.toString(), {
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    res.json({ access_token: response.data.access_token });
  } catch (err: any) {
    console.error('[Fitbit] Token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to exchange Fitbit token' });
  }
});

// GET /api/wearables/fitbit/metrics
router.get('/fitbit/metrics', async (_req: Request, res: Response) => {
  // PRODUCTION: Fetch with stored access token from DB
  res.json({ activities: { steps: [{ value: 7100 }], calories: [{ value: 1950 }], minutesFairlyActive: [{ value: 28 }], heart: [{ value: { restingHeartRate: 59 } }] }, sleep: [{ minutesAsleep: 370 }] });
});

export default router;

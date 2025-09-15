import express from'express';
import session from 'express-session';
import axios from 'axios';
import crypto from 'crypto';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import 'dotenv/config'

import VerifyToken from './VerifiyToken.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}), session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true
}));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

app.get('/auth/google', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.state = state;

  const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authURL.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authURL.searchParams.set('redirect_uri', REDIRECT_URI);
  authURL.searchParams.set('scope', 'openid email profile');
  authURL.searchParams.set('response_type', 'code');
  authURL.searchParams.set('state', state);

  res.redirect(authURL.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!req.session.state || req.session.state !== state) {
      return res.status(400).send('Invalid state parameter');
    }

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });

    const { access_token, id_token } = tokenResponse.data;
    const verification = await VerifyToken(id_token);
    if(!verification.success){ return res.status(401).send('Invalid token');}

    const userInfo = verification.user;
    console.log(userInfo);
    //後でJWTで認証情報を渡すようにする
    res.redirect('http://localhost:5173');

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});
app.get('/prof',(res,req)=>{
  res.json(userInfo);
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
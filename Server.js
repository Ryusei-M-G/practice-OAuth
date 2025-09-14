// Node.js + Express での Google OAuth 実装

import express from'express';
import session from 'express-session';
import axios from 'axios';
import crypto from 'crypto';
import cors from 'cors'
import 'dotenv/config'

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}),session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true
}));

// 環境変数
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';


// Google認証開始
app.get('/auth/google', (req, res) => {
  // CSRF対策用のstate生成
  const state = crypto.randomBytes(32).toString('hex');
  // stateをセッションに保存
  req.session.state = state;
  
  const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authURL.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authURL.searchParams.set('redirect_uri', REDIRECT_URI);
  authURL.searchParams.set('scope', 'openid email profile');
  authURL.searchParams.set('response_type', 'code');
  authURL.searchParams.set('state', state);
  
  res.redirect(authURL.toString());
});

// Google認証コールバック
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // state検証
    if (!req.session.state || req.session.state !== state) {
      return res.status(400).send('Invalid state parameter');
    }
    
    // アクセストークン取得
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });
    
    const { access_token, id_token } = tokenResponse.data;
    
    // ユーザー情報取得
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    const userInfo = userResponse.data;
    
    // セッションにユーザー情報保存
    req.session.user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };
    req.session.accessToken = access_token;
    
    // フロントエンドにリダイレクト
    res.redirect('http://localhost:5173');
    
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// ログイン確認ミドルウェア
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/google');
  }
  req.user = req.session.user;
  next();
};

// 保護されたルート
app.get('/dashboard', requireAuth, (req, res) => {
  res.json({
    message: 'Welcome to dashboard!',
    user: req.user
  });
});

// ログアウト
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ホームページ
app.get('/', (req, res) => {
  res.send(`
    <h1>Google OAuth Demo</h1>
    <a href="/auth/google">Login with Google</a>
  `);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
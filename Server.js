// Node.js + Express での Google OAuth 実装

import express from'express';
import axios from 'axios';
import crypto from 'crypto';
const app = express();

// 環境変数
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

// セッション管理用（実際はRedisなど使用）
const sessions = new Map();

// Google認証開始
app.get('/auth/google', (req, res) => {
  // CSRF対策用のstate生成
  const state = crypto.randomBytes(32).toString('hex');
  
  // stateをセッションに保存
  sessions.set(req.sessionID, { state });
  
  const authURL = new URL('https://accounts.google.com/oauth2/v2/auth');
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
    
    // state検証（CSRF対策）
    const session = sessions.get(req.sessionID);
    if (!session || session.state !== state) {
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
    sessions.set(req.sessionID, {
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      accessToken: access_token
    });
    
    // ダッシュボードにリダイレクト
    res.redirect('/dashboard');
    
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// ログイン確認ミドルウェア
const requireAuth = (req, res, next) => {
  const session = sessions.get(req.sessionID);
  if (!session || !session.user) {
    return res.redirect('/auth/google');
  }
  req.user = session.user;
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
  sessions.delete(req.sessionID);
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
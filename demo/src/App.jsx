import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ページ読み込み時にログイン状態確認
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/dashboard', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/logout', {
        credentials: 'include'
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <div style={{textAlign:'center'}}>読み込み中...</div>;
  }

  // ログイン済みの場合はプロフィール表示
  if (user) {
    return (
      <div style={{textAlign:'center', padding: '20px'}}>
        <h1>プロフィール</h1>
        <img src={user.picture} alt="プロフィール" style={{borderRadius: '50%', width: '100px', height: '100px'}} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <button onClick={handleLogout}>ログアウト</button>
      </div>
    );
  }

  // 未ログインの場合はログインボタン表示
  return (
    <div style={{textAlign:'center'}}>
      <button onClick={handleLogin}>Googleでログイン</button>
    </div>
  );
}

export default App;

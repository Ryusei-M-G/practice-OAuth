function App() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <button onClick={handleLogin}>
      Googleでログイン
    </button>
  );
}

export default App;
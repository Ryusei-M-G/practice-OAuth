import axios from "axios";
import { useState} from "react";

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:3000/prof");
      console.log(res);
      setUser(res);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <button onClick={fetchProfile}>プロフィール取得</button>
      <h1>プロフィール</h1>
      <img
        src={user?.picture}
        alt="プロフィール"
        style={{ borderRadius: "50%", width: "100px", height: "100px" }}
      />
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
      <div style={{ textAlign: "center" }}>
        <button onClick={handleLogin}>Googleでログイン</button>
      </div>
    </div>
  );
}

export default App;

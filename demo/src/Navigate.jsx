import { useNavigate } from "react-router";

const Navigater = () => {
  const navi = useNavigate();
  return (
    <div style={{backgroundColor:'gray',padding:'6',textAlign:'center'}}>
      <button onClick={() => navi("/")}>Home</button>
      <button onClick={() => navi("/login")}>Login</button>
      <button onClick={() => navi("profile")}>Profile</button>
      <button onClick={() => navi("/logout")}>Logout</button>
      
    </div>
  );
};

export default Navigater;

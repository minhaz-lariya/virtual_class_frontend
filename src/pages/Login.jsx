import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Virtual Class Login</h2>
      <button onClick={() => navigate("/dashboard")}>
        Enter
      </button>
    </div>
  );
}
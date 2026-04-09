import { useState } from "react";
import CryptoTool from "./components/CryptoTool";
import EthTransfer from "./components/EthTransfer";
import ReadOnChain from "./components/ReadOnChain";
import ContractLogger from "./components/ContractLogger";
import GraphQuery from "./components/GraphQuery";
import "./App.css";

const TABS = [
  { id: "crypto",   label: "① 加密/解密" },
  { id: "transfer", label: "② ETH 转账上链" },
  { id: "read",     label: "③ 读取链上数据" },
  { id: "contract", label: "④ 合约日志上链" },
  { id: "graph",    label: "⑤ The Graph 查询" },
];

export default function App() {
  const [tab, setTab] = useState("crypto");

  return (
    <div className="app">
      <header>
        <h1>区块链数据上链平台</h1>
        <p className="subtitle">数据加密 → 上链 → 链上读回 → 解密展示</p>
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
        {tab === "crypto"   && <CryptoTool />}
        {tab === "transfer" && <EthTransfer />}
        {tab === "read"     && <ReadOnChain />}
        {tab === "contract" && <ContractLogger />}
        {tab === "graph"    && <GraphQuery />}
      </main>
    </div>
  );
}

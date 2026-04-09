import { useState } from "react";
import { JsonRpcProvider } from "ethers";
import { decrypt } from "../crypto";

const ALCHEMY_RPC = import.meta.env.VITE_ALCHEMY_RPC_URL || "";
const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || "";

export default function ReadOnChain() {
  const [txHash, setTxHash] = useState("");
  const [method, setMethod] = useState("ethers");
  const [rawData, setRawData] = useState("");
  const [decrypted, setDecrypted] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleRead() {
    setError("");
    setRawData("");
    setDecrypted("");
    if (!txHash.trim()) return setError("请输入交易 Hash");

    try {
      let data = "";

      if (method === "ethers") {
        if (!ALCHEMY_RPC) return setError("请在 .env 中配置 VITE_ALCHEMY_RPC_URL");
        setStatus("通过 Ethers.js + Alchemy 读取...");
        const provider = new JsonRpcProvider(ALCHEMY_RPC);
        const tx = await provider.getTransaction(txHash);
        if (!tx) throw new Error("未找到该交易");
        data = tx.data;
      } else {
        if (!ETHERSCAN_KEY) return setError("请在 .env 中配置 VITE_ETHERSCAN_API_KEY");
        setStatus("通过 Etherscan API 读取...");
        const url = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!json.result) throw new Error("Etherscan 未返回数据");
        data = json.result.input;
      }

      setRawData(data);

      if (data && data !== "0x") {
        setDecrypted(decrypt(data));
      } else {
        setDecrypted("（该交易无附加数据）");
      }
      setStatus("读取成功");
    } catch (e) {
      setError(e.message);
      setStatus("");
    }
  }

  return (
    <section className="card">
      <h2>读取链上数据</h2>
      <p className="desc">输入交易 Hash，读取 input data 并解密</p>

      <label>读取方式</label>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            value="ethers"
            checked={method === "ethers"}
            onChange={() => setMethod("ethers")}
          />
          Ethers.js + Alchemy RPC
        </label>
        <label>
          <input
            type="radio"
            value="etherscan"
            checked={method === "etherscan"}
            onChange={() => setMethod("etherscan")}
          />
          Etherscan API
        </label>
      </div>

      <label>交易 Hash</label>
      <input
        value={txHash}
        onChange={(e) => setTxHash(e.target.value)}
        placeholder="0x..."
      />

      <button onClick={handleRead}>读取并解密</button>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {rawData && (
        <div className="result">
          <div>
            <span className="label">原始 input data：</span>
            <code className="break">{rawData}</code>
          </div>
          <div>
            <span className="label">解密明文：</span>
            <code>{decrypted}</code>
          </div>
        </div>
      )}
    </section>
  );
}

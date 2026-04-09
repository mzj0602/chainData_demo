import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { encrypt } from "../crypto";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// DataLogger ABI（只需要用到的部分）
const ABI = [
  "function storeData(string calldata data) external",
  "event DataStored(address indexed sender, string data, uint256 timestamp)",
];

export default function ContractLogger() {
  const [account, setAccount] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function connectWallet() {
    if (!window.ethereum) return setError("请先安装 MetaMask");
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    setError("");
  }

  async function handleStore() {
    setError("");
    setTxHash("");
    if (!account) return setError("请先连接钱包");
    if (!plaintext.trim()) return setError("请输入上链内容");
    if (!CONTRACT_ADDRESS) return setError("请在 .env 中配置 VITE_CONTRACT_ADDRESS");

    try {
      setStatus("加密数据中...");
      const hexData = encrypt(plaintext);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      setStatus("等待 MetaMask 确认...");
      const tx = await contract.storeData(hexData);

      setStatus("交易已发送，等待上链...");
      await tx.wait();
      setTxHash(tx.hash);
      setStatus("数据已记录到合约 Event Log！");
    } catch (e) {
      setError(e.message);
      setStatus("");
    }
  }

  return (
    <section className="card">
      <h2>合约 Event Log 上链</h2>
      <p className="desc">
        调用 DataLogger 合约，将加密数据以 Event 形式永久记录
        {CONTRACT_ADDRESS
          ? `（合约：${CONTRACT_ADDRESS.slice(0, 10)}...）`
          : "（需先部署合约并配置 VITE_CONTRACT_ADDRESS）"}
      </p>

      {!account ? (
        <button onClick={connectWallet}>连接 MetaMask</button>
      ) : (
        <p className="account">已连接：{account}</p>
      )}

      <label>上链内容（明文）</label>
      <textarea
        rows={3}
        value={plaintext}
        onChange={(e) => setPlaintext(e.target.value)}
        placeholder="输入要记录到合约 Event 的内容..."
      />

      <button onClick={handleStore} disabled={!account}>
        加密并写入合约
      </button>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
      {txHash && (
        <div className="result">
          <span className="label">交易 Hash：</span>
          <code>{txHash}</code>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            在 Etherscan 查看
          </a>
        </div>
      )}
    </section>
  );
}

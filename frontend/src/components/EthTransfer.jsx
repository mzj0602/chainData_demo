import { useState } from "react";
import { BrowserProvider } from "ethers";
import { encrypt } from "../crypto";

export default function EthTransfer() {
  const [account, setAccount] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [toAddress, setToAddress] = useState("");
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

  async function handleSend() {
    setError("");
    setTxHash("");
    if (!account) return setError("请先连接钱包");
    if (!plaintext.trim()) return setError("请输入上链内容");
    if (!toAddress.trim()) return setError("请输入目标地址");

    try {
      setStatus("加密数据中...");
      const hexData = encrypt(plaintext);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setStatus("等待 MetaMask 确认...");
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: 0n,
        data: hexData,
      });

      setStatus("交易已发送，等待上链...");
      await tx.wait();
      setTxHash(tx.hash);
      setStatus("上链成功！");
    } catch (e) {
      setError(e.message);
      setStatus("");
    }
  }

  return (
    <section className="card">
      <h2>ETH 转账方式上链</h2>
      <p className="desc">
        将加密数据写入交易的 <code>data</code> 字段，无需部署合约
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
        placeholder="输入要上链的内容，系统会自动加密..."
      />

      <label>目标地址（可以填自己的地址）</label>
      <input
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
        placeholder="0x..."
      />

      <button onClick={handleSend} disabled={!account}>
        加密并上链
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

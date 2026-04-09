import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { encrypt, decrypt } from "../crypto";
import { useWallet } from "../hooks/useWallet";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const GRAPH_URL        = import.meta.env.VITE_GRAPH_URL || "";

const ABI = [
  "function storeData(string calldata data) external",
  "event DataStored(address indexed sender, string data, uint256 timestamp)",
];

const QUERY = `
  query {
    dataStoreds(first: 100, orderBy: timestamp, orderDirection: desc) {
      id
      sender
      data
      timestamp
      transactionHash
    }
  }
`;

export default function PathB() {
  const { account, connect, error: walletError, getEthersProvider } = useWallet();

  // 上链状态
  const [plaintext, setPlaintext]       = useState("");
  const [hexPreview, setHexPreview]     = useState("");
  const [uploadHash, setUploadHash]     = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError]   = useState("");

  // 查询状态
  const [records, setRecords]           = useState([]);
  const [queryStatus, setQueryStatus]   = useState("");
  const [queryError, setQueryError]     = useState("");

  function handlePlaintextChange(val) {
    setPlaintext(val);
    setHexPreview(val ? encrypt(val) : "");
  }

  async function handleStore() {
    setUploadError("");
    setUploadHash("");
    if (!account) return setUploadError("请先连接钱包");
    if (!plaintext.trim()) return setUploadError("请输入上链内容");
    if (!CONTRACT_ADDRESS) return setUploadError("请配置 VITE_CONTRACT_ADDRESS");

    try {
      const hexData = encrypt(plaintext);
      setHexPreview(hexData);

      const provider = getEthersProvider();
      const signer   = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      setUploadStatus("等待 MetaMask 确认...");
      const tx = await contract.storeData(hexData);

      setUploadStatus("交易已发送，等待上链...");
      await tx.wait();
      setUploadHash(tx.hash);
      setUploadStatus("已写入合约 Event Log！");
    } catch (e) {
      setUploadError(e.message);
      setUploadStatus("");
    }
  }

  async function handleQuery() {
    setQueryError("");
    setRecords([]);
    if (!GRAPH_URL) return setQueryError("请配置 VITE_GRAPH_URL");

    try {
      setQueryStatus("查询 The Graph 中...");
      const res  = await fetch(GRAPH_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query: QUERY }),
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      const items = json.data.dataStoreds || [];
      const decoded = items.map((item) => {
        let plain = "";
        try { plain = decrypt(item.data); }
        catch { plain = "（解密失败）"; }
        return { ...item, plaintext: plain };
      });

      setRecords(decoded);
      setQueryStatus(`查询到 ${decoded.length} 条记录`);
    } catch (e) {
      setQueryError(e.message);
      setQueryStatus("");
    }
  }

  return (
    <div className="path">
      <div className="path-header">
        <h2>路径 B — 合约 Event Log 上链</h2>
        <p className="desc">
          调用 DataLogger 合约，数据以结构化 Event 形式上链，通过 The Graph 批量查询
          {CONTRACT_ADDRESS && <span className="contract-addr">合约：{CONTRACT_ADDRESS.slice(0, 10)}...</span>}
        </p>
      </div>

      <div className="two-col">
        {/* 左：上链（需要钱包） */}
        <div className="card">
          <div className="step-title"><span className="step-num">Step 1</span> 数据上链</div>

          <div className="wallet-bar">
            {!account
              ? <button onClick={connect}>连接 MetaMask</button>
              : <span className="account">已连接：{account}</span>
            }
            {walletError && <span className="error">{walletError}</span>}
          </div>

          <label>明文内容</label>
          <textarea
            rows={3}
            value={plaintext}
            onChange={(e) => handlePlaintextChange(e.target.value)}
            placeholder="输入要上链的内容..."
          />

          {hexPreview && (
            <div className="inline-step">
              <span className="step-label">XOR 加密后 →</span>
              <code className="break">{hexPreview}</code>
            </div>
          )}

          <button onClick={handleStore} disabled={!account}>加密并写入合约</button>

          {uploadStatus && <p className="status">{uploadStatus}</p>}
          {uploadError  && <p className="error">{uploadError}</p>}
          {uploadHash   && (
            <div className="result">
              <span className="label">交易 Hash：</span>
              <code className="break">{uploadHash}</code>
              <a href={`https://sepolia.etherscan.io/tx/${uploadHash}`} target="_blank" rel="noreferrer">
                Etherscan 查看
              </a>
            </div>
          )}
        </div>

        {/* 右：查询（无需钱包） */}
        <div className="card">
          <div className="step-title"><span className="step-num">Step 2</span> The Graph 查询</div>
          <p className="desc">通过 GraphQL 拉取所有链上 Event，自动解密展示（无需连接钱包）</p>

          <button onClick={handleQuery}>查询所有链上记录</button>

          {queryStatus && <p className="status">{queryStatus}</p>}
          {queryError  && <p className="error">{queryError}</p>}

          {records.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>解密内容</th>
                  <th>发送者</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.plaintext}</td>
                    <td><code title={r.sender}>{r.sender.slice(0, 10)}...</code></td>
                    <td>{new Date(Number(r.timestamp) * 1000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

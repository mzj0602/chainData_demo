import { useState } from "react";
import { BrowserProvider, JsonRpcProvider } from "ethers";
import { encrypt, decrypt } from "../crypto";
import { useWallet } from "../hooks/useWallet";

const ALCHEMY_RPC = import.meta.env.VITE_ALCHEMY_RPC_URL || "";
const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || "";

export default function PathA() {
  const { account, connect, error: walletError, getEthersProvider } = useWallet();

  // 上链状态
  const [plaintext, setPlaintext]       = useState("");
  const [toAddress, setToAddress]       = useState("");
  const [hexPreview, setHexPreview]     = useState("");
  const [uploadHash, setUploadHash]     = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError]   = useState("");

  // 读取状态
  const [txHash, setTxHash]           = useState("");
  const [readMethod, setReadMethod]   = useState("ethers");
  const [rawData, setRawData]         = useState("");
  const [decrypted, setDecrypted]     = useState("");
  const [readStatus, setReadStatus]   = useState("");
  const [readError, setReadError]     = useState("");

  function handlePlaintextChange(val) {
    setPlaintext(val);
    setHexPreview(val ? encrypt(val) : "");
  }

  async function handleUpload() {
    setUploadError("");
    setUploadHash("");
    if (!account) return setUploadError("请先连接钱包");
    if (!plaintext.trim()) return setUploadError("请输入上链内容");
    if (!toAddress.trim()) return setUploadError("请输入目标地址");

    try {
      const hexData = encrypt(plaintext);
      setHexPreview(hexData);

      const provider = getEthersProvider();
      const signer = await provider.getSigner();

      setUploadStatus("等待 MetaMask 确认...");
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: 0n,
        data: hexData,
      });

      setUploadStatus("交易已发送，等待上链...");
      await tx.wait();
      setUploadHash(tx.hash);
      setUploadStatus("上链成功！");
    } catch (e) {
      setUploadError(e.message);
      setUploadStatus("");
    }
  }

  async function handleRead() {
    setReadError("");
    setRawData("");
    setDecrypted("");
    if (!txHash.trim()) return setReadError("请输入交易 Hash");

    try {
      let data = "";

      if (readMethod === "ethers") {
        if (!ALCHEMY_RPC) return setReadError("请配置 VITE_ALCHEMY_RPC_URL");
        setReadStatus("通过 Ethers.js + Alchemy 读取...");
        const provider = new JsonRpcProvider(ALCHEMY_RPC);
        const tx = await provider.getTransaction(txHash);
        if (!tx) throw new Error("未找到该交易");
        data = tx.data;
      } else {
        if (!ETHERSCAN_KEY) return setReadError("请配置 VITE_ETHERSCAN_API_KEY");
        setReadStatus("通过 Etherscan API 读取...");
        const url = `https://api.etherscan.io/v2/api?chainid=11155111&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!json.result) throw new Error("Etherscan 未返回数据");
        data = json.result.input;
      }

      setRawData(data);
      setDecrypted(data && data !== "0x" ? decrypt(data) : "（该交易无附加数据）");
      setReadStatus("读取成功");
    } catch (e) {
      setReadError(e.message);
      setReadStatus("");
    }
  }

  return (
    <div className="path">
      <div className="path-header">
        <h2>路径 A — ETH 转账上链</h2>
        <p className="desc">将加密数据写入交易的 <code>data</code> 字段，无需部署合约</p>
      </div>

      <div className="wallet-bar">
        {!account
          ? <button onClick={connect}>连接 MetaMask</button>
          : <span className="account">已连接：{account}</span>
        }
        {walletError && <span className="error">{walletError}</span>}
      </div>

      <div className="two-col">
        {/* 左：上链 */}
        <div className="card">
          <div className="step-title"><span className="step-num">Step 1</span> 数据上链</div>

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

          <label>目标地址</label>
          <input
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x...（可填自己的地址）"
          />

          <button onClick={handleUpload} disabled={!account}>加密并上链</button>

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

        {/* 右：读取 */}
        <div className="card">
          <div className="step-title"><span className="step-num">Step 2</span> 链上读取</div>

          <label>读取方式</label>
          <div className="radio-group">
            <label>
              <input type="radio" value="ethers" checked={readMethod === "ethers"} onChange={() => setReadMethod("ethers")} />
              Ethers.js + Alchemy
            </label>
            <label>
              <input type="radio" value="etherscan" checked={readMethod === "etherscan"} onChange={() => setReadMethod("etherscan")} />
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

          {readStatus && <p className="status">{readStatus}</p>}
          {readError  && <p className="error">{readError}</p>}
          {rawData && (
            <div className="result">
              <div>
                <span className="label">链上 input data（hex 密文）：</span>
                <code className="break">{rawData}</code>
              </div>
              <div className="inline-step">
                <span className="step-label">XOR 解密后 →</span>
                <code>{decrypted}</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

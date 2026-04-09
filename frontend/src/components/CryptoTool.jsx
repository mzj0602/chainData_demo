import { useState } from "react";
import { encrypt, decrypt } from "../crypto";

export default function CryptoTool() {
  const [plaintext, setPlaintext] = useState("");
  const [hexOutput, setHexOutput] = useState("");
  const [hexInput, setHexInput] = useState("");
  const [decrypted, setDecrypted] = useState("");
  const [key, setKey] = useState("BlockChain2024");
  const [error, setError] = useState("");

  function handleEncrypt() {
    setError("");
    if (!plaintext.trim()) return;
    try {
      setHexOutput(encrypt(plaintext, key));
    } catch (e) {
      setError(e.message);
    }
  }

  function handleDecrypt() {
    setError("");
    if (!hexInput.trim()) return;
    try {
      setDecrypted(decrypt(hexInput, key));
    } catch (e) {
      setError("解密失败：" + e.message);
    }
  }

  return (
    <section className="card">
      <h2>加密 / 解密工具</h2>
      <p className="desc">算法：XOR 异或加密（循环密钥）→ hex 编码</p>

      <label>密钥</label>
      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="自定义密钥"
      />

      <div className="two-col">
        <div>
          <label>明文 → hex 加密</label>
          <textarea
            rows={4}
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="输入需要上链的原始内容..."
          />
          <button onClick={handleEncrypt}>加密</button>
          {hexOutput && (
            <div className="result">
              <span className="label">密文 (hex)：</span>
              <code>{hexOutput}</code>
              <button
                className="copy"
                onClick={() => navigator.clipboard.writeText(hexOutput)}
              >
                复制
              </button>
            </div>
          )}
        </div>

        <div>
          <label>hex → 明文解密</label>
          <textarea
            rows={4}
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="粘贴 hex 密文（0x...）..."
          />
          <button onClick={handleDecrypt}>解密</button>
          {decrypted && (
            <div className="result">
              <span className="label">明文：</span>
              <code>{decrypted}</code>
            </div>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}

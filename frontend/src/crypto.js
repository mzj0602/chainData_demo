/**
 * 自定义 XOR 加密模块
 * 加密流程：明文 → XOR(key循环) → hex字符串
 * 解密流程：hex字符串 → bytes → XOR(key循环) → 明文
 */

const DEFAULT_KEY = "BlockChain2024";

/**
 * 将明文加密为 hex 字符串
 * @param {string} plaintext - 明文
 * @param {string} key - 密钥（默认 "BlockChain2024"）
 * @returns {string} hex 字符串，如 "0x4f3a..."
 */
export function encrypt(plaintext, key = DEFAULT_KEY) {
  const textBytes = new TextEncoder().encode(plaintext);
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(textBytes.length);

  for (let i = 0; i < textBytes.length; i++) {
    result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  const hex = Array.from(result)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return "0x" + hex;
}

/**
 * 将 hex 字符串解密为明文
 * @param {string} hexStr - hex 字符串，带或不带 "0x" 前缀
 * @param {string} key - 密钥
 * @returns {string} 明文
 */
export function decrypt(hexStr, key = DEFAULT_KEY) {
  const clean = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
  if (clean.length % 2 !== 0) throw new Error("无效的 hex 字符串");

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }

  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return new TextDecoder().decode(result);
}

/**
 * 纯 hex 编码（不加密，仅转码）
 */
export function toHex(str) {
  return (
    "0x" +
    Array.from(new TextEncoder().encode(str))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * hex 解码（不解密，仅转码）
 */
export function fromHex(hexStr) {
  const clean = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

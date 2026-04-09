import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

function getMetaMaskProvider() {
  if (!window.ethereum) return null;
  // 多钱包并存时，providers 数组里找 MetaMask
  if (window.ethereum.providers) {
    const mm = window.ethereum.providers.find(
      (p) => p.isMetaMask && !p.isPhantom && !p.isBrave
    );
    if (mm) return mm;
  }
  // 只有一个钱包时直接判断
  if (window.ethereum.isMetaMask && !window.ethereum.isPhantom) {
    return window.ethereum;
  }
  return null;
}

export function useWallet() {
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const provider = getMetaMaskProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || "");
    };
    provider.on("accountsChanged", handleAccountsChanged);
    return () => provider.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  async function connect() {
    setError("");
    const provider = getMetaMaskProvider();
    if (!provider) return setError("未检测到 MetaMask，请安装或启用");

    try {
      const permissions = await provider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accountPerm = permissions.find((p) => p.parentCapability === "eth_accounts");
      const picked = accountPerm?.caveats?.[0]?.value?.[0];
      if (picked) {
        setAccount(picked);
      } else {
        const accounts = await provider.request({ method: "eth_accounts" });
        setAccount(accounts[0] || "");
      }
    } catch (e) {
      setError(e.message);
    }
  }

  // 返回 ethers BrowserProvider（发交易时用）
  function getEthersProvider() {
    const p = getMetaMaskProvider();
    return p ? new BrowserProvider(p) : null;
  }

  return { account, connect, error, getEthersProvider };
}

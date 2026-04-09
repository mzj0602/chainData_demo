import { useState } from "react";
import { decrypt } from "../crypto";

const GRAPH_URL = import.meta.env.VITE_GRAPH_URL || "";

const QUERY = `
  query GetAllData($skip: Int!) {
    dataStoreds(first: 100, skip: $skip, orderBy: timestamp, orderDirection: desc) {
      id
      sender
      data
      timestamp
    }
  }
`;

export default function GraphQuery() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleFetch() {
    setError("");
    setRecords([]);
    if (!GRAPH_URL) return setError("请在 .env 中配置 VITE_GRAPH_URL");

    try {
      setStatus("查询 The Graph 中...");
      const res = await fetch(GRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: QUERY, variables: { skip: 0 } }),
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      const items = json.data.dataStoreds || [];
      const decoded = items.map((item) => {
        let plain = "";
        try {
          plain = decrypt(item.data);
        } catch {
          plain = "（解密失败）";
        }
        return { ...item, plaintext: plain };
      });

      setRecords(decoded);
      setStatus(`查询到 ${decoded.length} 条记录`);
    } catch (e) {
      setError(e.message);
      setStatus("");
    }
  }

  return (
    <section className="card">
      <h2>The Graph 数据查询</h2>
      <p className="desc">
        通过 GraphQL 查询 DataLogger 合约的所有 Event Log，并自动解密
        {!GRAPH_URL && "（需先部署 Subgraph 并配置 VITE_GRAPH_URL）"}
      </p>

      <button onClick={handleFetch}>查询所有链上记录</button>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {records.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>发送者</th>
              <th>解密内容</th>
              <th>hex 数据</th>
              <th>时间戳</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>
                  <code title={r.sender}>{r.sender.slice(0, 10)}...</code>
                </td>
                <td>{r.plaintext}</td>
                <td>
                  <code title={r.data}>{r.data.slice(0, 20)}...</code>
                </td>
                <td>{new Date(Number(r.timestamp) * 1000).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

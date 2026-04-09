# 区块链数据上链平台 — 项目文档

## 一、项目概述

本项目是一个完整的「数据上链 + 链上读取」演示平台，覆盖以太坊 Sepolia 测试网的两种上链路径，并提供前端界面串联全流程。

**核心流程：**
```
明文数据 → XOR 加密 → hex 编码 → 上链 → 链上读取 → XOR 解密 → 还原明文
```

---

## 二、项目结构

```
chain_demo/
├── hardhat/          # 智能合约（Solidity + Hardhat）
├── frontend/         # 前端界面（React + Vite）
└── subgraph/         # 链上数据索引（The Graph）
```

---

## 三、模块详解

### 模块 1：加密解密（`frontend/src/crypto.js`）

**算法：XOR 异或加密**

原理是把明文每个字节与密钥对应字节做异或运算，密钥循环使用：

```
明文字节[i]  XOR  密钥字节[i % 密钥长度]  =  密文字节[i]
```

异或的特性决定了加解密是同一个操作，用同一把密钥再做一次 XOR 就能还原：

```
密文字节[i]  XOR  密钥字节[i % 密钥长度]  =  明文字节[i]
```

加密后将字节数组转成十六进制字符串（如 `0x48656c6c6f`），因为以太坊链上数据字段只能存 hex 格式。

**默认密钥：** `BlockChain2024`（前端界面可自定义）

---

### 模块 2：智能合约（`hardhat/contracts/DataLogger.sol`）

```solidity
contract DataLogger {
    event DataStored(
        address indexed sender,  // 发送者地址
        string  data,            // 加密后的 hex 字符串
        uint256 timestamp        // 上链时的区块时间戳
    );

    function storeData(string calldata data) external {
        require(bytes(data).length > 0, "DataLogger: empty data");
        emit DataStored(msg.sender, data, block.timestamp);
    }
}
```

**设计思路：**
- 合约不存储任何状态变量（无 mapping、无数组），只 emit Event
- Event Log 永久存在于区块链上，Gas 消耗极低
- 数据本身在链上是公开可读的 hex，需要知道密钥才能解密
- 已部署到 Sepolia：`0x30A80495D360C1426C976b5A26ca8c92C9917589`
- 已在 Etherscan 开源验证：任何人可查看合约源码

---

### 模块 3：路径 A — ETH 转账上链（`EthTransfer.jsx`）

**原理：** 以太坊每笔交易都有一个 `data` 字段（也叫 input data），普通 ETH 转账时这个字段通常为空，但可以写入任意 hex 数据。

**流程：**
```
用户输入明文
    ↓ XOR 加密
hex 密文
    ↓ ethers.js 构造交易
{ to: 目标地址, value: 0, data: hex密文 }
    ↓ MetaMask 签名
交易广播到 Sepolia
    ↓ 上链确认
返回 tx hash
```

**特点：**
- 无需部署合约，成本最低
- 数据存在交易的 input data 字段
- 可以通过 tx hash 永久读取

---

### 模块 4：路径 A 的数据读取（`ReadOnChain.jsx`）

提供两种读取方式，用户可选：

**方式 1 — Ethers.js + Alchemy RPC：**
```javascript
const provider = new JsonRpcProvider(ALCHEMY_RPC_URL);
const tx = await provider.getTransaction(txHash);
const hexData = tx.data;  // 拿到 input data
const plaintext = decrypt(hexData);  // XOR 解密
```
直接连接节点读链，去中心化，稍慢。

**方式 2 — Etherscan API：**
```
GET https://api-sepolia.etherscan.io/api
    ?module=proxy&action=eth_getTransactionByHash
    &txhash={txHash}&apikey={KEY}
```
通过 Etherscan 的索引服务查询，响应更快，但依赖第三方。

---

### 模块 5：路径 B — 合约 Event Log 上链（`ContractLogger.jsx`）

**流程：**
```
用户输入明文
    ↓ XOR 加密
hex 密文
    ↓ ethers.js 调用合约
contract.storeData(hexData)
    ↓ MetaMask 签名
合约执行 emit DataStored(...)
    ↓ Event 写入区块链
返回 tx hash
```

**与路径 A 的区别：**
- 数据存在 Event Log 里，而非 input data
- Event Log 有结构化索引（sender、data、timestamp），方便查询
- 可以用 The Graph 批量查询所有历史记录

---

### 模块 6：The Graph 数据查询（`GraphQuery.jsx`）

**The Graph 是什么：**
The Graph 是区块链数据的「搜索引擎」。它监听指定合约的 Event，自动建立索引，前端用 GraphQL 查询，像查数据库一样简单。

**Subgraph 工作原理：**
```
Sepolia 链上 DataStored Event
    ↓ The Graph 节点监听
mapping.ts 处理函数触发
    ↓ 数据存入 Subgraph 数据库
前端 GraphQL 查询
    ↓ 返回结构化数据
XOR 解密 → 展示明文
```

**GraphQL 查询语句：**
```graphql
query {
  dataStoreds(first: 100, orderBy: timestamp, orderDirection: desc) {
    id
    sender
    data       # 链上 hex 密文
    timestamp
  }
}
```

**Subgraph 信息：**
- Query URL：`https://api.studio.thegraph.com/query/1747690/data-logger/v0.0.1`
- 起始区块：`10615061`（合约部署区块，避免从第 0 块扫描）

---

## 四、技术栈

| 层面 | 技术 | 作用 |
|------|------|------|
| 智能合约 | Solidity 0.8.24 | 定义链上数据结构和逻辑 |
| 合约开发框架 | Hardhat | 编译、测试、部署、verify |
| 测试网络 | Ethereum Sepolia | 无需真实 ETH 的测试环境 |
| 前端框架 | React + Vite | 用户界面 |
| 链交互库 | ethers.js v6 | 连接钱包、发交易、读链数据 |
| 钱包 | MetaMask | 私钥管理、交易签名 |
| RPC 节点 | Alchemy | 连接以太坊节点的 HTTP 接口 |
| 链上数据索引 | The Graph | GraphQL 方式查询 Event Log |
| 合约验证 | Sepolia Etherscan | 合约源码公开可查 |
| 加密算法 | XOR 异或 | 轻量级对称加密 |

---

## 五、已部署信息

| 组件 | 地址 / URL |
|------|-----------|
| DataLogger 合约 | `0x30A80495D360C1426C976b5A26ca8c92C9917589` |
| Etherscan 验证 | https://sepolia.etherscan.io/address/0x30A80495D360C1426C976b5A26ca8c92C9917589#code |
| The Graph Subgraph | https://thegraph.com/studio/subgraph/data-logger |
| GraphQL Endpoint | https://api.studio.thegraph.com/query/1747690/data-logger/v0.0.1 |

---

## 六、本地运行

### 启动前端
```bash
cd frontend
npm run dev
# 访问 http://localhost:5173
```

### 重新部署合约
```bash
cd hardhat
node_modules/.bin/hardhat run scripts/deploy.js --network sepolia
```

### 本地测试合约
```bash
cd hardhat
node_modules/.bin/hardhat test
```

### 更新 Subgraph
```bash
cd subgraph
node_modules/.bin/graph deploy --studio data-logger --version-label v0.0.2
```

---

## 七、环境变量说明

### `hardhat/.env`
| 变量 | 说明 |
|------|------|
| `SEPOLIA_RPC_URL` | Alchemy 提供的 Sepolia RPC 节点地址 |
| `PRIVATE_KEY` | 部署账户的钱包私钥（不带 0x） |
| `ETHERSCAN_API_KEY` | Etherscan API Key，用于合约开源验证 |

### `frontend/.env`
| 变量 | 说明 |
|------|------|
| `VITE_ALCHEMY_RPC_URL` | Alchemy RPC，前端读链数据用 |
| `VITE_ETHERSCAN_API_KEY` | Etherscan API Key，前端查交易用 |
| `VITE_CONTRACT_ADDRESS` | DataLogger 合约地址 |
| `VITE_GRAPH_URL` | The Graph GraphQL 查询端点 |

---

## 八、数据流完整示意

```
┌─────────────────────────────────────────────────────┐
│                     用户界面（React）                  │
│                                                     │
│  输入明文 → [XOR加密] → hex密文                        │
│                          │                          │
│              ┌───────────┴───────────┐              │
│              ▼                       ▼              │
│        路径A：ETH转账             路径B：合约调用       │
│        tx.data = hex            storeData(hex)      │
│              │                       │              │
│              └───────────┬───────────┘              │
│                          ▼                          │
│                   Sepolia 区块链                     │
│                          │                          │
│              ┌───────────┴───────────┐              │
│              ▼                       ▼              │
│       Ethers.js/Etherscan        The Graph          │
│       读取 tx.data              GraphQL 查询         │
│              │                       │              │
│              └───────────┬───────────┘              │
│                          ▼                          │
│                   [XOR解密] → 展示明文                │
└─────────────────────────────────────────────────────┘
```

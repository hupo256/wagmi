# wagmi + viem 实战项目

基于 Vite + React + TypeScript，集成 wagmi v2 与 viem，提供从“连接钱包、签名、发送交易”到“与合约交互”的完整示例，默认使用 Sepolia 测试网。

## 功能概览

- 连接钱包（Injected、WalletConnect）
- 签名消息、发送原生 ETH 交易
- 合约交互页面：
  - ERC20（余额查询、转账）
  - 简单存储合约（store/retrieve）
  - 计数器合约（increment/decrement）
- 网络检查（确保连接到 Sepolia）

## 预览路由

- `/home`：首页（基础功能入口、快速链接）
- `/list`：示例列表（wagmi 基础读写示例）
- `/details`：示例详情
- `/contracts`：合约测试器（多合约类型：ERC20、存储、计数器）
- `/simple-contract`：简化合约测试器（专注基础读/写）

导航组件：`src/components/Navigation.tsx`（已集成到 `App.tsx`）。

## 快速开始

1. 安装依赖（推荐 pnpm）

```bash
pnpm install
```

2. 配置环境变量（可选，用于 WalletConnect）

- 在项目根目录创建 `.env` 或 `.env.local`，加入：

```bash
VITE_WALLETCONNECT_PROJECT_ID=你的_walletconnect_project_id
```

- 项目读取位置：`src/wagmi.config.ts`
- 未配置也可使用 Injected（MetaMask 等）直接连接

3. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:5173`。

## 网络与链配置

- 默认链：Sepolia（链 ID 11155111）或本地 Hardhat（链 ID 31337）
- 配置文件：`src/wagmi.ts`、`src/localChain.ts`
- 传输：`http()`（使用默认 RPC，建议替换为你自己的 RPC）

### 本地链（Hardhat）说明

如需本地开发和调试，推荐使用 Hardhat：

1. 安装 hardhat（如未安装）

```bash
pnpm add -D hardhat
```

2. 启动本地链

```bash
npx hardhat node
```

3. 部署合约（参考 CONTRACT_DEPLOYMENT_GUIDE.md）
4. 将本地链地址填入 `src/pages/List.tsx`、`src/abis/simpleStorageAbi.ts` 等相关文件
5. MetaMask 添加本地网络：

- 网络名称: Hardhat
- RPC URL: http://127.0.0.1:8545
- 链 ID: 31337

如需切换到本地链，请确保 `CONTRACT_ADDRESS`、`chainId` 等参数已正确设置。

## 合约交互

## 合约交互与事件监听

- 简单存储合约交互：`src/pages/List.tsx`
  - 读取当前值、写入新值
  - 监听 `ValueChanged` 事件，自动刷新页面
  - 事件监听逻辑：
    ```tsx
    useWatchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: simpleStorageAbi,
      eventName: "ValueChanged",
      chainId: chainId as 31337 | undefined,
      onLogs(logs) {
        console.log("✅ Event:", logs);
        refetch();
      },
      onError(error) {
        console.error("Event watching error:", error);
      },
    });
    ```

### 事件监听与调试建议

- 若事件未触发：
  1. 检查合约地址与 ABI 是否正确
  2. 确认链 ID 与钱包网络一致（Sepolia 或 Hardhat）
  3. 打开浏览器控制台，观察事件日志与错误输出
  4. 检查合约实现是否 emit 了事件
  5. 确认交易已成功上链

- 推荐在本地链调试，便于快速定位问题。

## 相关文件快速索引

```text
├─ src
│  ├─ App.tsx                 # 路由与导航
│  ├─ main.tsx                # 入口，挂载 Provider 与 App
│  ├─ wagmi.ts                # wagmi 配置（链、连接器、RPC）
│  ├─ localChain.ts           # 本地链配置（Hardhat）
│  ├─ abis/
│  │  └─ simpleStorageAbi.ts  # 简单存储合约 ABI
│  ├─ pages/
│  │  ├─ List.tsx             # 简单存储合约读写与事件监听
│  │  ├─ Home.tsx             # 首页
│  │  └─ Details.tsx          # 详情页
│  └─ components/
│     ├─ ConnectMan.tsx       # 钱包连接
│     ├─ NetworkChecker.tsx   # 网络检查
│     └─ TokenBalance.tsx     # ERC20 余额查询
```

## 网络检查（必读）

组件：`src/components/NetworkChecker.tsx`

- 已在合约相关页面集成
- 若未连接到 Sepolia，会显示红色提示与切换方法
- 正确连接时显示绿色提示

快速添加 Sepolia 网络（任选其一）：

- 访问 Chainlist 添加：`https://chainlist.org/`（搜索 “Sepolia” → Add to MetaMask）
- 手动添加：
  - 网络名称: Sepolia test network
  - RPC URL: `https://rpc.sepolia.org`
  - 链 ID: `11155111`
  - 货币符号: `ETH`
  - 浏览器: `https://sepolia.etherscan.io`

详细钱包设置指南：`METAMASK_SETUP_GUIDE.md`

## 测试 ETH（水龙头）

- `https://sepoliafaucet.com/`
- `https://faucet.quicknode.com/ethereum/sepolia`
- `https://www.alchemy.com/faucets/ethereum-sepolia`

## 项目结构

```text
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tailwind.config.js
├─ postcss.config.js
├─ src
│  ├─ index.css               # Tailwind 指令与全局样式
│  ├─ main.tsx                # 入口，挂载 Provider 与 App
│  ├─ App.tsx                 # 路由与导航
│  ├─ wagmi.ts                # wagmi 配置（chains、connectors、transports）
│  ├─ components
│  │  ├─ ConnectMan.tsx
│  │  ├─ SignatureMan.tsx
│  │  ├─ Transaction.tsx
│  │  ├─ ContractTester.tsx   # 合约测试器（多合约）
│  │  ├─ SimpleContractTester.tsx
│  │  └─ NetworkChecker.tsx   # 网络检查（Sepolia）
│  └─ pages
│     ├─ Home.tsx
│     ├─ Details.tsx
│     └─ List/index.tsx
└─ README.md
```

## TailwindCSS

已集成 Tailwind，相关文件：`tailwind.config.js`、`postcss.config.js`、`src/index.css`。

## 常用命令

```bash
pnpm format          # 格式化
pnpm format:check    # 校验格式
pnpm dev             # 启动开发服务器
pnpm build           # 生产构建
pnpm preview         # 本地预览构建产物
```

## 常见问题

- 未安装注入钱包（如 MetaMask）时，Injected 连接器将不可用
- 发送交易或写合约需要足够的测试 ETH
- 如果交易失败：
  - 检查是否连接到 Sepolia
  - 检查合约地址与 ABI 是否正确
  - 稍后重试（网络可能拥堵）

## 许可证

MIT

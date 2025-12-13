import ConnectMan from "./ConnectMan";
import Signature from "./SignatureMan";
import Transaction from "./Transaction";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6">Wagmi 合约交互测试平台</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">🚀 新功能：合约测试</h2>
        <p className="text-blue-700 mb-4">
          现在您可以在 Sepolia 测试网上与智能合约进行交互！我们提供了多种合约类型供您测试：
        </p>
        <ul className="text-blue-700 space-y-2">
          <li>
            • <strong>ERC20 代币合约</strong> - 查询余额、转账代币
          </li>
          <li>
            • <strong>简单存储合约</strong> - 存储和读取数据
          </li>
          <li>
            • <strong>计数器合约</strong> - 增加/减少数值
          </li>
        </ul>
        <div className="mt-4">
          <a href="/contracts" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-3">
            开始测试合约
          </a>
          <a
            href="/simple-contract"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            简单合约测试
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">📋 基础功能</h3>
          <p className="text-gray-600 mb-4">连接钱包、签名消息、发送交易</p>
          <ConnectMan />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">✍️ 签名功能</h3>
          <p className="text-gray-600 mb-4">测试消息签名和验证</p>
          <Signature />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">💸 交易功能</h3>
        <p className="text-gray-600 mb-4">发送 ETH 交易和查看交易状态</p>
        <Transaction />
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ 重要提示</h3>
        <ul className="text-yellow-700 space-y-1">
          <li>• 本项目使用 Sepolia 测试网，请确保您的钱包连接到正确的网络</li>
          <li>• 测试代币可以通过水龙头免费获取</li>
          <li>
            • 查看 <code className="bg-yellow-100 px-2 py-1 rounded">CONTRACT_DEPLOYMENT_GUIDE.md</code>{" "}
            了解如何部署自己的合约
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="https://chainlist.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
          >
            🔗 添加 Sepolia 网络
          </a>
          <a
            href="https://sepoliafaucet.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
          >
            💰 获取测试 ETH
          </a>
        </div>
      </div>
    </div>
  );
}

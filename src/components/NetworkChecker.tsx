import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

export default function NetworkChecker() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Sepolia 测试网的链 ID 是 11155111
  const isSepolia = chainId === sepolia.id;
  const isCorrectNetwork = isSepolia;

  if (!isConnected) return null;

  if (!isCorrectNetwork) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">网络错误</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>请切换到 Sepolia 测试网以使用此应用。</p>
              <p className="mt-1">
                当前网络链 ID: <code className="bg-red-100 px-1 rounded">{chainId}</code>， 需要:{" "}
                <code className="bg-red-100 px-1 rounded">{sepolia.id}</code>
              </p>
            </div>
            <div className="mt-3">
              <div className="text-sm text-red-700">
                <p className="font-medium">如何切换到 Sepolia 测试网：</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>点击 MetaMask 顶部的网络下拉菜单</li>
                  <li>选择 "Sepolia test network"</li>
                  <li>如果没有看到，请手动添加网络</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">网络连接正常</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>您已成功连接到 Sepolia 测试网，可以开始测试合约交互。</p>
            <p className="mt-1">
              网络: <code className="bg-green-100 px-1 rounded">Sepolia test network</code> (链 ID: {chainId})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

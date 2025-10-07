import { useAccount, useBalance, useConnect, useDisconnect, useChainId } from "wagmi";
import { formatUnits } from "viem";

export default function ConnectMan() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending: isConnectPending, status: connectStatus, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    chainId,
    query: { enabled: !!address },
  });

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Wallet Connection</h2>
      {isConnected ? (
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <p>已连接: {address}</p>
          <p>链 ID: {chainId}</p>
          <p>
            余额: {balance ? formatUnits(balance.value, balance.decimals) : "-"} {balance?.symbol}
          </p>
          <button
            className="mt-2 inline-flex items-center rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            onClick={() => disconnect()}
          >
            断开连接
          </button>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2">
            {connectors.map((c) => (
              <button
                key={(c as any).uid ?? c.id}
                disabled={isConnectPending}
                onClick={() => connect({ connector: c as any })}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                连接 {c.name}
              </button>
            ))}
          </div>
          <div className="text-sm text-red-500 mt-2">{connectError?.message}</div>
          <div className="text-sm mt-1">状态: {connectStatus}</div>
        </div>
      )}
    </section>
  );
}

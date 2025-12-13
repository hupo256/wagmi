import { useAccount, useBalance, useConnect, useDisconnect, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { useContractor } from "@store/index";
import { useEffect } from "react";

export default function ConnectMan() {
  const { address, isConnected } = useAccount();
  const { isRefresh, setIsRefresh, balance, setBalance } = useContractor();
  const chainId = useChainId();
  const { connectors, connect, isPending, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceObj, refetch } = useBalance({
    address,
    chainId,
    query: { enabled: !!address },
  });

  // 更新余额
  useEffect(() => {
    if (!balanceObj) return;
    setBalance(balanceObj);
  }, [balanceObj]);

  // 更新余额
  useEffect(() => {
    if (!isRefresh) return;
    refetch().then(() => setIsRefresh(false));
  }, [isRefresh]);

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
                key={c.uid}
                disabled={isPending}
                onClick={() => connect({ connector: c as any })}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                连接 {c.name}
              </button>
            ))}
          </div>
          <div className="text-sm text-red-500 mt-2">{error?.message}</div>
          <div className="text-sm mt-1">状态: {status}</div>
        </div>
      )}
    </section>
  );
}

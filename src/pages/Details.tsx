import { useSearchParams } from "react-router-dom";
import { useReadContract, useWriteContract } from "wagmi";
import lock from "../contracts/Lock.json";

export const lockContract = {
  address: lock.address as `0x${string}`,
  abi: lock.abi,
} as const;

const btnTex =
  "inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50";

export function useReadOwner() {
  return useReadContract({
    address: lockContract.address,
    abi: lockContract.abi,
    functionName: "owner", // 按你的合约实际方法调整
    args: [],
    chainId: 31337,
  });
}

export function useWithdraw() {
  const write = useWriteContract();
  return (args?: unknown[]) =>
    write.writeContract({
      address: lockContract.address,
      abi: lockContract.abi,
      functionName: "withdraw",
      args,
      chainId: 31337,
    });
}

export default function Details() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const { data: owner } = useReadOwner();
  const withdraw = useWithdraw();

  const onWithdraw = () => {
    console.log("withdraw");
    const res = withdraw([]);
    console.log(res);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Details</h1>
      <button onClick={onWithdraw} className={btnTex}>
        onWithdraw
      </button>
      <p>owner: {typeof owner === "string" ? owner : String(owner ?? "")}</p>
      <p className="text-gray-700 dark:text-gray-300">这里是详情页占位{id ? `（id=${id}）` : ""}。</p>
    </div>
  );
}

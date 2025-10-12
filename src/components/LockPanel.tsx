// src/components/LockPanel.tsx
import { useReadContract, useWriteContract } from "wagmi";
import lock from "../contracts/Lock.json";

const lockContract = {
  address: lock.address as `0x${string}`,
  abi: lock.abi,
} as const;

export function LockPanel() {
  const { data: owner } = useReadContract({
    address: lockContract.address,
    abi: lockContract.abi,
    functionName: "owner",
    chainId: 31337,
  });

  const write = useWriteContract();

  const onWithdraw = () =>
    write.writeContract({
      address: lockContract.address,
      abi: lockContract.abi,
      functionName: "withdraw",
      chainId: 31337,
    });

  return (
    <div>
      <div>Owner: {owner as string}</div>
      <button onClick={onWithdraw}>Withdraw</button>
    </div>
  );
}

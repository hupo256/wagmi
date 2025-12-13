import USDCPanel from "./USDCPanel";
import AaveDepositPanel from "./AaveDepositPanel";
import AaveFullPanel from "./AaveFullPanel";
import AaveWithAA from "./AaveWithAA";
import GetUSDCButton from "./GetUSDCButton";
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Details() {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto p-8 font-sans">
      <div className="flex items-center justify-between  mb-4">
        <h1 className="text-2xl font-bold">Aave Operation Part 1</h1>
        <ConnectButton />
      </div>

      {/* USDC (Sepolia) */}
      <USDCPanel />

      {/* approve & deposit  */}
      <AaveDepositPanel />

      {/* deposit & withdraw */}
      <AaveFullPanel />

      {/* Deposit */}
      <AaveWithAA />

      {/* Get USDC Btn */}
      <GetUSDCButton />
    </div>
  );
}

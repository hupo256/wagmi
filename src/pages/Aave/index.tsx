import USDCPanel from "./USDCPanel";
import AaveDepositPanel from "./AaveDepositPanel";
import AaveFullPanel from "./AaveFullPanel";
import AaveWithAA from "./AaveWithAA";
import GetUSDCButton from "./GetUSDCButton";

export default function Details() {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Aave Operation</h1>
      <AaveWithAA />
      <GetUSDCButton />

      <USDCPanel />
      <AaveDepositPanel />
      <AaveFullPanel />
    </div>
  );
}

import { useSearchParams } from "react-router-dom";
import USDCPanel from "@/components/USDCPanel";
import AaveDepositPanel from "@/components/AaveDepositPanel";
import AaveFullPanel from "@/components/AaveFullPanel";
import AaveWithAA from "@/components/AaveWithAA";

export default function Details() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Details: {id}</h1>

      <USDCPanel />
      <AaveDepositPanel />
      <AaveFullPanel />
      {/* <AaveWithAA /> */}
    </div>
  );
}

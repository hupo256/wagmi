import { useSearchParams } from "react-router-dom";
import USDCPanel from "@/components/USDCPanel";

export default function Details() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Details: {id}</h1>

      <USDCPanel />
    </div>
  );
}

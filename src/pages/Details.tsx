import { useSearchParams } from "react-router-dom";

export default function Details() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Details</h1>
      <p className="text-gray-700 dark:text-gray-300">这里是详情页占位{id ? `（id=${id}）` : ""}。</p>
    </div>
  );
}

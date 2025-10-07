import ConnectMan from "../components/ConnectMan";
import Signature from "../components/SignatureMan";
import Transaction from "../components/Transaction";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      <ConnectMan />
      <Signature />
      <Transaction />
    </div>
  );
}

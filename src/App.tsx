import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import List from "./pages/List";
import SmartAccount from "./pages/SmartAccount";
import Aave from "./pages/Aave";
import Details from "./pages/Details";
import ContractTester from "./components/ContractTester";
import SimpleContractTester from "./components/SimpleContractTester";
import Navigation from "./components/Navigation";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/aave" element={<Aave />} />
        <Route path="/smartAccount" element={<SmartAccount />} />
        <Route path="/list" element={<List />} />
        <Route path="/details" element={<Details />} />
        <Route path="/contracts" element={<ContractTester />} />
        <Route path="/simple-contract" element={<SimpleContractTester />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
}

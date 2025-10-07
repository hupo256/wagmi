import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import List from "./pages/List/index";
import Details from "./pages/Details";

export default function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/list" element={<List />} />
      <Route path="/details" element={<Details />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

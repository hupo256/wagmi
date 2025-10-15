export const simpleStorageAbi = [
  {
    inputs: [],
    name: "retrieve",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "num", type: "uint256" }],
    name: "store",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "setter", type: "address" },
      { indexed: false, internalType: "uint256", name: "newValue", type: "uint256" },
    ],
    name: "ValueChanged",
    type: "event",
  },
] as const;

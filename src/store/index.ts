import { createTrackedSelector } from "react-tracked";
import { z } from "zod";
import { create } from "zustand";

// balance 类型
const BalanceSchema = z.object({
  decimals: z.number(),
  formatted: z.string(),
  symbol: z.string(),
  value: z.bigint(),
});

export type BalanceType = z.infer<typeof BalanceSchema>;

type State = {
  balance: BalanceType | null;
  isRefresh: boolean;

  setBalance: (balance: BalanceType) => void;
  setIsRefresh: (isRefresh: boolean) => void;
};

const initialState = {
  balance: null,
  isRefresh: false,
};

const store = create<State>((set) => ({
  ...initialState,
  setBalance: (balance) => set({ balance }),
  setIsRefresh: (isRefresh) => set({ isRefresh }),
}));

export const useContractor = createTrackedSelector(store);

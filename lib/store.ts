import { create } from "zustand";
import type { Post } from "@/lib/data";

// UI store for cross-route persistent overlays (content drawer + chat launcher).
// Kept deliberately small — this is the frontend's only client state. The live
// data layer (React Query over Supabase) lands in a later backend phase.
interface UIState {
  openedPost: Post | null;
  openPost: (p: Post) => void;
  closePost: () => void;

  chatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (v: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  openedPost: null,
  openPost: (p) => set({ openedPost: p }),
  closePost: () => set({ openedPost: null }),

  chatOpen: false,
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (v) => set({ chatOpen: v }),
}));

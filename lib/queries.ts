"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { track } from "@/lib/analytics";
import { useUI } from "@/lib/store";
import type { ChannelId } from "@/lib/data";
import type { PostContent } from "@/lib/types/content";

// React Query hooks over the typed data layer. In mock mode the queryFn resolves
// synchronously-fast, so surfaces share one code path across mock and live.

export const keys = {
  campaign: ["campaign"] as const,
  scripts: ["scripts"] as const,
  analytics: ["analytics"] as const,
  brand: ["brand"] as const,
  socialAccounts: ["socialAccounts"] as const,
};

export function useCampaign() {
  return useQuery({ queryKey: keys.campaign, queryFn: () => api.getCampaign() });
}

export function useScripts() {
  return useQuery({ queryKey: keys.scripts, queryFn: () => api.getScripts() });
}

export function useAnalytics() {
  return useQuery({ queryKey: keys.analytics, queryFn: () => api.getAnalytics() });
}

export function useBrand() {
  return useQuery({ queryKey: keys.brand, queryFn: () => api.getBrand() });
}

// Approve a single post, then mock-publish it (status→published + external_post_id) if its channel
// is publishable. Returns { published } so the caller can pick the right toast (Phase 6 gate).
export function useApprovePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, channel }: { id: string; channel: ChannelId }) => {
      await api.approvePost(id);
      return api.publishPost(id, channel);
    },
    onSuccess: (res, { channel }) => {
      track("post_approved", { channel, published: res.published });
      qc.invalidateQueries({ queryKey: keys.campaign });
    },
  });
}

// Approve-all in the current channel filter, then bulk-publish the now-approved publishable posts.
export function useApproveAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (channel: ChannelId | "all") => {
      await api.approveAll(channel);
      return api.publishApproved(channel);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.campaign }),
  });
}

export function useMarkFilmed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scriptId, postId }: { scriptId: string; postId: string }) =>
      api.markFilmed(scriptId, postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.campaign });
      qc.invalidateQueries({ queryKey: keys.scripts });
    },
  });
}

// Drawer "Mark filmed": only the post id is on hand, so resolve the founder_scripts row by post_id.
export function useMarkFilmedByPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.markFilmedByPost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.campaign });
      qc.invalidateQueries({ queryKey: keys.scripts });
    },
  });
}

// ===== Phase 6: social account connect/disconnect =====
export function useSocialAccounts() {
  return useQuery({ queryKey: keys.socialAccounts, queryFn: () => api.getSocialAccounts() });
}

export function useConnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: ChannelId) => api.connectAccount(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.socialAccounts }),
  });
}

export function useDisconnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: ChannelId) => api.disconnectAccount(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.socialAccounts }),
  });
}

// Chat-edit preview — returns a validated proposed content; no DB write, no invalidation.
export function useChatEdit() {
  return useMutation({
    mutationFn: ({ postId, message }: { postId: string; message: string }) => api.chatEdit(postId, message),
  });
}

// Apply the previewed patch: persist, refresh the calendar, and re-open the drawer with the new
// content so the open post re-renders immediately (the store is the drawer's source of truth).
export function useApplyPatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: PostContent }) => api.applyPatch(postId, content),
    onSuccess: (_data, { content }) => {
      qc.invalidateQueries({ queryKey: keys.campaign });
      const cur = useUI.getState().openedPost;
      if (cur) useUI.getState().openPost({ ...cur, content });
    },
  });
}

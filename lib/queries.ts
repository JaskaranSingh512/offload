"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ChannelId } from "@/lib/data";

// React Query hooks over the typed data layer. In mock mode the queryFn resolves
// synchronously-fast, so surfaces share one code path across mock and live.

export const keys = {
  campaign: ["campaign"] as const,
  scripts: ["scripts"] as const,
  analytics: ["analytics"] as const,
  brand: ["brand"] as const,
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

export function useApprovePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approvePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.campaign }),
  });
}

export function useApproveAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channel: ChannelId | "all") => api.approveAll(channel),
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

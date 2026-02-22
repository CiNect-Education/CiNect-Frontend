import { useApiQuery } from "@/hooks/use-api-query";

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  imageUrl?: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  movies?: Array<{ id: string; title: string; posterUrl: string }>;
  promotions?: Array<{ id: string; title: string; code: string }>;
  metadata?: { title: string; description: string; ogImage?: string };
}

export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  priority: number;
  title?: string;
}

export function useActiveCampaigns() {
  return useApiQuery<Campaign[]>(["campaigns", "active"], "/campaigns/active");
}

export function useCampaign(slug: string) {
  return useApiQuery<Campaign>(["campaigns", slug], `/campaigns/${slug}`, undefined, {
    enabled: !!slug,
  });
}

export function useBanners(position: string) {
  return useApiQuery<Banner[]>(
    ["banners", position],
    "/banners",
    { position },
    { enabled: !!position }
  );
}

export function useTrendingPromotions() {
  return useApiQuery<
    Array<{
      id: string;
      title: string;
      code: string;
      discountValue: number;
      discountType: string;
      imageUrl?: string;
    }>
  >(["promotions", "trending"], "/promotions/trending");
}

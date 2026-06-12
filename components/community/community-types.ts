export type CommunityReviewItem = {
  id: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  rating?: number;
  title?: string;
  content?: string;
  tags?: string[];
  imageUrls?: string[];
  hasSpoiler?: boolean;
  isVerified?: boolean;
  helpfulCount?: number;
  createdAt?: string;
  movie?: { id?: string; title?: string; slug?: string; posterUrl?: string };
  cinema?: { id?: string; name?: string; slug?: string };
};

export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type CommunityPostItem = {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  type?: string;
  hashtags?: string[];
  pollOptions?: PollOption[];
  hasSpoiler?: boolean;
  likeCount?: number;
  createdAt: string;
  movie?: { id: string; title: string; slug: string };
};

export type CommunityPhotoItem = {
  id: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
  user?: { id: string; fullName: string; avatar?: string };
  movie?: { id: string; title: string; slug: string };
};

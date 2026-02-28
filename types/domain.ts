// ─── Enums / Unions ────────────────────────────────────────────────
export type UserRole = "ADMIN" | "STAFF" | "USER";
export type MovieStatus = "NOW_SHOWING" | "COMING_SOON" | "ENDED";
export type AgeRating = "P" | "C13" | "C16" | "C18";
export type RoomFormat = "2D" | "3D" | "IMAX" | "4DX" | "DOLBY";
export type SeatType = "STANDARD" | "VIP" | "COUPLE" | "DISABLED";
export type SeatStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED";
export type PaymentMethod = "CARD" | "MOMO" | "ZALOPAY" | "VNPAY" | "BANK_TRANSFER" | "CASH";
export type DiscountType = "PERCENTAGE" | "FIXED";
export type PromotionStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
export type DayType = "WEEKDAY" | "WEEKEND" | "HOLIDAY";
export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
export type NotificationType = "BOOKING" | "PROMOTION" | "SYSTEM" | "MEMBERSHIP";
export type GiftCardStatus = "AVAILABLE" | "SOLD_OUT" | "REDEEMED" | "EXPIRED";
export type CouponStatus = "ACTIVE" | "USED" | "EXPIRED";
export type NewsCategory = "REVIEWS" | "TRAILERS" | "PROMOTIONS" | "GUIDES" | "GENERAL";
export type BackendType = "SPRING" | "NODE";

// ─── Domain Entities ───────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  membershipTier?: string;
  membershipPoints?: number;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface CastMember {
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  slug: string;
  description: string;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  galleryUrls?: string[];
  duration: number;
  releaseDate: string;
  endDate?: string;
  genres: Genre[];
  director: string;
  cast: CastMember[];
  language: string;
  subtitles?: string;
  rating?: number;
  ratingCount?: number;
  ageRating: AgeRating;
  formats: RoomFormat[];
  status: MovieStatus;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight list projection (no description/cast/gallery). */
export interface MovieListItem {
  id: string;
  title: string;
  slug: string;
  posterUrl: string;
  duration: number;
  releaseDate: string;
  genres: Genre[];
  ageRating: AgeRating;
  formats: RoomFormat[];
  rating?: number;
  status: MovieStatus;
}

export interface Cinema {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

export interface CinemaListItem {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  imageUrl?: string;
  amenities: string[];
  roomCount: number;
}

export interface Room {
  id: string;
  name: string;
  cinemaId: string;
  cinemaName?: string;
  format: RoomFormat;
  totalSeats: number;
  rows: number;
  columns: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  roomId: string;
  row: string;
  number: number;
  type: SeatType;
  status: SeatStatus;
  price?: number;
}

export interface Showtime {
  id: string;
  movieId: string;
  roomId: string;
  cinemaId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  format: RoomFormat;
  language?: string;
  subtitles?: string;
  movieTitle?: string;
  moviePosterUrl?: string;
  cinemaName?: string;
  roomName?: string;
  availableSeats?: number;
  totalSeats?: number;
  memberExclusive?: boolean;
}

export interface BookingItem {
  seatId: string;
  row: string;
  number: number;
  type: SeatType;
  price: number;
}

export interface SnackItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  seats: BookingItem[];
  snacks: SnackItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: BookingStatus;
  payment?: Payment;
  promotionCode?: string;
  pointsUsed?: number;
  giftCardCode?: string;
  movieTitle: string;
  moviePosterUrl?: string;
  cinemaName: string;
  roomName: string;
  showtime: string;
  format: RoomFormat;
  qrCode?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingRule {
  id: string;
  seatType: SeatType;
  dayType: DayType;
  timeSlot: TimeSlot;
  roomFormat: RoomFormat;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code?: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount?: number;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  conditions?: string;
  status: PromotionStatus;
  /** Optional list of payment methods this promo applies to */
  eligiblePaymentMethods?: PaymentMethod[];
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt: string;
  status: CouponStatus;
  userId?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  movieId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  imageUrl?: string;
  author: string;
  tags?: string[];
  relatedArticleIds?: string[];
  publishedAt: string;
  createdAt: string;
}

export interface MembershipTier {
  id: string;
  name: string;
  level: number;
  pointsRequired: number;
  benefits: string[];
  discountPercent: number;
  color: string;
  icon?: string;
}

export interface MembershipProfile {
  userId: string;
  tier: MembershipTier;
  currentPoints: number;
  totalPoints: number;
  nextTier?: MembershipTier;
  pointsToNextTier?: number;
  memberSince: string;
  expiresAt?: string;
}

export interface GiftCard {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  value: number;
  price: number;
  code?: string;
  recipientEmail?: string;
  message?: string;
  status: GiftCardStatus;
  expiresAt?: string;
  purchasedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ─── Helper / Utility ──────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
}

export type SeatHoldStatus = "AVAILABLE" | "HELD" | "BOOKED" | "DISABLED";

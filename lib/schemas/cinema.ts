import { z } from "zod";

/** Accept null from API but normalize to undefined */
const n = <T extends z.ZodTypeAny>(schema: T) =>
  schema.optional().nullable().transform((v) => v ?? undefined);

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  cinemaId: z.string(),
  cinemaName: n(z.string()),
  format: z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"]),
  totalSeats: z.number(),
  rows: z.number(),
  columns: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cinemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  address: z.string(),
  city: z.string(),
  district: n(z.string()),
  phone: n(z.string()),
  email: n(z.string()),
  imageUrl: n(z.string()),
  amenities: z.array(z.string()),
  latitude: n(z.number()),
  longitude: n(z.number()),
  rooms: z.array(roomSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cinemaListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  address: z.string(),
  city: z.string(),
  imageUrl: n(z.string()),
  amenities: z.array(z.string()),
  roomCount: z.number(),
});

export const seatSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  row: z.string(),
  number: z.number(),
  type: z.enum(["STANDARD", "VIP", "COUPLE", "DISABLED"]),
  status: z.enum(["AVAILABLE", "BOOKED", "BLOCKED"]),
  price: n(z.number()),
});

export const showtimeSchema = z.object({
  id: z.string(),
  movieId: z.string(),
  roomId: z.string(),
  cinemaId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  basePrice: z.number(),
  format: z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"]),
  language: n(z.string()),
  subtitles: n(z.string()),
  movieTitle: n(z.string()),
  moviePosterUrl: n(z.string()),
  cinemaName: n(z.string()),
  roomName: n(z.string()),
  availableSeats: n(z.number()),
  totalSeats: n(z.number()),
  memberExclusive: n(z.boolean()),
});

import { getApiBaseUrl } from "@/lib/api-discovery";
import { io, type Socket } from "socket.io-client";

export type SeatEvent = {
  type: "SEAT_HELD" | "SEAT_RELEASED" | "SEAT_BOOKED" | "HOLD_EXPIRED";
  seatIds: string[];
  showtimeId: string;
};

export type EventHandler = (event: SeatEvent) => void;

export class RealtimeConnection {
  private socket: Socket | null = null;
  private handlers: Set<EventHandler> = new Set();
  private showtimeId: string;

  constructor(showtimeId: string) {
    this.showtimeId = showtimeId;
  }

  connect() {
    const baseUrl = getApiBaseUrl();
    const serverUrl = baseUrl.replace(/\/api\/v1$/, "");

    this.socket = io(`${serverUrl}/ws`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    const forward = (type: SeatEvent["type"]) => (payload: { showtimeId: string; seatIds: string[] }) => {
      if (!payload?.showtimeId || !Array.isArray(payload.seatIds)) return;
      this.handlers.forEach((handler) =>
        handler({
          type,
          showtimeId: payload.showtimeId,
          seatIds: payload.seatIds,
        })
      );
    };

    this.socket.on("connect", () => {
      this.socket?.emit("joinShowtime", { showtimeId: this.showtimeId });
    });

    this.socket.on("SEAT_HELD", forward("SEAT_HELD"));
    this.socket.on("SEAT_RELEASED", forward("SEAT_RELEASED"));
    this.socket.on("SEAT_BOOKED", forward("SEAT_BOOKED"));
    this.socket.on("HOLD_EXPIRED", forward("HOLD_EXPIRED"));
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    try {
      this.socket?.emit("leaveShowtime", { showtimeId: this.showtimeId });
    } catch {
      // ignore
    }
    this.socket?.disconnect();
    this.socket = null;
    this.handlers.clear();
  }

  get isConnected() {
    return this.socket?.connected === true;
  }
}

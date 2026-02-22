export type SeatEvent = {
  type: "SEAT_HELD" | "SEAT_RELEASED" | "SEAT_BOOKED" | "HOLD_EXPIRED";
  seatIds: string[];
  showtimeId: string;
};

export type EventHandler = (event: SeatEvent) => void;

export class RealtimeConnection {
  private ws: WebSocket | null = null;
  private handlers: Set<EventHandler> = new Set();
  private showtimeId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(showtimeId: string) {
    this.showtimeId = showtimeId;
  }

  connect() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
    const wsUrl = baseUrl.replace(/^http/, "ws").replace(/\/api\/v1$/, "");

    try {
      this.ws = new WebSocket(`${wsUrl}/ws/showtimes/${this.showtimeId}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SeatEvent;
          this.handlers.forEach((handler) => handler(data));
        } catch {
          // Ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      // WebSocket not available, fallback handled by hook
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

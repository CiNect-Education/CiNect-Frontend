/**
 * A/B Testing placeholder utility.
 * In production, replace with a real A/B testing service (e.g., LaunchDarkly, Optimizely).
 */

export function getVariant(experimentId: string, userId?: string): "A" | "B" {
  // Simple deterministic assignment based on userId hash
  if (!userId) {
    return Math.random() > 0.5 ? "A" : "B";
  }
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 2 === 0 ? "A" : "B";
}

export function trackEvent(experimentId: string, variant: string, event: string) {
  // Placeholder: in production, send to analytics service
  if (process.env.NEXT_PUBLIC_ENV !== "prod") {
    console.log(`[A/B] ${experimentId}:${variant} -> ${event}`);
  }
}

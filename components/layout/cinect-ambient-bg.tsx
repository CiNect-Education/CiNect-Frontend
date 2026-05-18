/** Fixed ambient background layers (blur orbs + plum gradient). */
export function CinectAmbientBg() {
  return (
    <div className="cinect-ambient-bg pointer-events-none fixed inset-0" aria-hidden>
      <span className="cinect-ambient-orb cinect-ambient-orb--primary" />
      <span className="cinect-ambient-orb cinect-ambient-orb--plum-left" />
      <span className="cinect-ambient-orb cinect-ambient-orb--blue-right" />
    </div>
  );
}

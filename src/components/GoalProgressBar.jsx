import { useEffect, useRef, useState } from "react";

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto 2rem auto",
    padding: "1.5rem 2rem",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    boxSizing: "border-box",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  goalName: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "1rem",
    color: "#111827",
    margin: 0,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.78rem",
    padding: "4px 12px",
    borderRadius: "999px",
    boxShadow: "0 2px 8px rgba(16,185,129,0.35)",
    letterSpacing: "0.03em",
  },
  amountsRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
  },
  amountLabel: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: "0.8rem",
    color: "#6b7280",
    fontWeight: 500,
  },
  amountValue: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "0.85rem",
    color: "#374151",
  },
  track: {
    width: "100%",
    height: "14px",
    background: "#f3f4f6",
    borderRadius: "999px",
    overflow: "hidden",
    position: "relative",
  },
  fill: (pct, animated) => ({
    height: "100%",
    width: animated ? `${pct}%` : "0%",
    background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)",
    borderRadius: "999px",
    transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
  }),
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    background: "rgba(255,255,255,0.25)",
    borderRadius: "999px 999px 0 0",
  },
  pctText: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#2563eb",
    marginTop: "0.4rem",
    textAlign: "right",
  },
};

export default function GoalProgressBar({ goalName, currentAmount, targetAmount }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  const raw = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const pct = Math.min(100, Math.max(0, raw));
  const reached = pct >= 100;

  const fmt = (n) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={styles.wrapper} ref={ref}>
      <div style={styles.topRow}>
        <p style={styles.goalName}>{goalName}</p>
        {reached && (
          <span style={styles.badge}>
            ✦ Goal Reached
          </span>
        )}
      </div>
      <div style={styles.amountsRow}>
        <span style={styles.amountLabel}>
          Saved: <span style={styles.amountValue}>{fmt(currentAmount)}</span>
        </span>
        <span style={styles.amountLabel}>
          Target: <span style={styles.amountValue}>{fmt(targetAmount)}</span>
        </span>
      </div>
      <div style={styles.track}>
        <div style={styles.fill(pct, animated)}>
          <div style={styles.shine} />
        </div>
      </div>
      <p style={styles.pctText}>{Math.round(pct)}%</p>
    </div>
  );
}

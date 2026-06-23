type AvatarWindEffectProps = {
  intensity?: "soft" | "normal" | "active";
  showLeaves?: boolean;
  showLightTrails?: boolean;
  className?: string;
};

const leaves = [
  { left: "7%", top: "72%", delay: "0s", duration: "9s" },
  { left: "18%", top: "48%", delay: "-2.2s", duration: "10.5s" },
  { left: "32%", top: "82%", delay: "-4.8s", duration: "11s" },
  { left: "52%", top: "65%", delay: "-1.4s", duration: "9.8s" },
  { left: "68%", top: "76%", delay: "-6s", duration: "12s" },
  { left: "80%", top: "42%", delay: "-3.5s", duration: "10s" },
  { left: "88%", top: "68%", delay: "-7s", duration: "11.5s" },
];

const sparkles = ["12%:22%", "26%:38%", "38%:16%", "51%:31%", "63%:20%", "74%:36%", "86%:17%", "91%:54%"];

export default function AvatarWindEffect({ intensity = "soft", showLeaves = true, showLightTrails = true, className = "" }: AvatarWindEffectProps) {
  const leafCount = intensity === "soft" ? 4 : intensity === "normal" ? 6 : 7;
  return <div aria-hidden className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${className}`}>
    <span className="avatar-viewer-glow absolute inset-[8%] rounded-full" />
    {showLeaves && leaves.slice(0, leafCount).map((leaf, index) => <span key={index} className="avatar-leaf" style={{ left: leaf.left, top: leaf.top, animationDelay: leaf.delay, animationDuration: leaf.duration }} />)}
    {showLightTrails && <>{["22%", "48%", "69%"].map((top, index) => <span key={top} className="avatar-wind-line" style={{ top, animationDelay: `${index * -1.8}s` }} />)}</>}
    {sparkles.slice(0, intensity === "active" ? 8 : intensity === "normal" ? 6 : 4).map((item, index) => { const [left, top] = item.split(":"); return <span key={item} className="avatar-sparkle" style={{ left, top, animationDelay: `${index * -.55}s` }} />; })}
  </div>;
}

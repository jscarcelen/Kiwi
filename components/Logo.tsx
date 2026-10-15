// WOM logo: twin speech bubbles (a shared recommendation) + wordmark drawn as paths (no font dependency).
const BLUE = "#2251FF";
const OVERLAP = "#5AA9FF";
const NAVY = "#051C2C";

function pt(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function tailPath(cx: number, cy: number, r: number, side: "left" | "right") {
  const [a1, a2] = side === "left" ? [105, 150] : [75, 30];
  const p1 = pt(cx, cy, r * 0.92, a1), p2 = pt(cx, cy, r * 0.92, a2), t = pt(cx, cy, r * 1.55, (a1 + a2) / 2);
  return `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${t[0].toFixed(1)} ${t[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)} Z`;
}

function Bubbles({ tone }: { tone: "light" | "dark" }) {
  const left = tone === "light" ? NAVY : "#FFFFFF";
  return (
    <g>
      <clipPath id="wom-left-clip"><circle cx="64" cy="62" r="40" /></clipPath>
      <circle cx="64" cy="62" r="40" fill={left} />
      <path d={tailPath(64, 62, 40, "left")} fill={left} stroke={left} strokeWidth="6.4" strokeLinejoin="round" />
      <circle cx="104" cy="62" r="40" fill={BLUE} />
      <path d={tailPath(104, 62, 40, "right")} fill={BLUE} stroke={BLUE} strokeWidth="6.4" strokeLinejoin="round" />
      <circle cx="104" cy="62" r="40" fill={OVERLAP} clipPath="url(#wom-left-clip)" />
    </g>
  );
}

export function LogoMark({ size = 32, tone = "light", className }: { size?: number; tone?: "light" | "dark"; className?: string }) {
  return (
    <svg role="img" aria-label="WOM" viewBox="16 12 136 108" height={size} width={(size * 136) / 108} className={className}>
      <Bubbles tone={tone} />
    </svg>
  );
}

export default function Logo({ height = 34, tone = "light", className }: { height?: number; tone?: "light" | "dark"; className?: string }) {
  const ink = tone === "light" ? NAVY : "#FFFFFF";
  const dx = 130;
  return (
    <svg role="img" aria-label="WOM" viewBox="10 4 440 122" height={height} width={(height * 440) / 122} className={className}>
      <Bubbles tone={tone} />
      <g fill="none" stroke={ink} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${24 + dx} 40 L${46 + dx} 92 L${66 + dx} 54 L${86 + dx} 92 L${108 + dx} 40`} />
        <circle cx={164 + dx} cy="66" r="26" />
        <path d={`M${226 + dx} 92 V60 a20 20 0 0 1 40 0 V92 M${266 + dx} 60 a20 20 0 0 1 40 0 V92`} />
      </g>
    </svg>
  );
}

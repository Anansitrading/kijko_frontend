import { formatPercent, formatRatio } from '../../../../utils/formatting';

interface CompressionProgressProps {
  savingsPercent: number;
  ratio: number;
  costSavings: number;
}

function GaugeMeter({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));

  const cx = 60;
  const cy = 55;
  const r = 34;
  const strokeW = 16;

  // 4 colored segments with gaps between them
  const gapDeg = 4;
  const segDeg = (180 - gapDeg * 3) / 4; // 42° each

  const segments = [
    { start: 180, end: 180 - segDeg, color: '#dc2626' },
    { start: 180 - segDeg - gapDeg, end: 180 - 2 * segDeg - gapDeg, color: '#f97316' },
    { start: 180 - 2 * (segDeg + gapDeg), end: 180 - 3 * segDeg - 2 * gapDeg, color: '#eab308' },
    { start: 180 - 3 * segDeg - 3 * gapDeg, end: 0, color: '#16a34a' },
  ];

  function makeArc(startDeg: number, endDeg: number) {
    const s = (startDeg * Math.PI) / 180;
    const e = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy - r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy - r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  }

  // Needle: angle from 180° (left, 0%) to 0° (right, 100%)
  const needleAngle = Math.PI - (clamped / 100) * Math.PI;
  const needleLen = 22;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 120 68" className="w-full max-w-[120px]">
      {segments.map((seg, i) => (
        <path
          key={i}
          d={makeArc(seg.start, seg.end)}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeW}
          strokeLinecap="butt"
        />
      ))}
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={nx} y2={ny}
        stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3" fill="#9ca3af" />
      <circle cx={cx} cy={cy} r="1.5" fill="#6b7280" />
      {/* Percentage */}
      <text x={cx} y={cy + 3} textAnchor="middle" dominantBaseline="hanging" className="fill-white text-[9px] font-bold">
        {formatPercent(percent)}
      </text>
    </svg>
  );
}

export function CompressionProgress({
  savingsPercent,
  ratio,
}: CompressionProgressProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="border border-cyan-500/20 bg-slate-800/60 rounded-lg px-3 py-2.5 flex flex-col items-center justify-center">
        <GaugeMeter percent={savingsPercent} />
        <div className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">
          Compressed
        </div>
      </div>
      <div className="border border-white/5 bg-slate-800/40 rounded-lg px-3 py-2.5 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-white tracking-tight">
          {formatRatio(ratio)}
        </div>
        <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
          Compression Ratio
        </div>
      </div>
    </div>
  );
}

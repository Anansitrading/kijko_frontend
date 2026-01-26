import { formatPercent, formatRatio } from '../../../../utils/formatting';

interface CompressionProgressProps {
  savingsPercent: number;
  ratio: number;
  costSavings: number;
}

function GaugeMeter({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));

  const cx = 60;
  const cy = 52;
  const r = 38;
  const arcLength = Math.PI * r; // semicircle length
  const filled = (clamped / 100) * arcLength;

  // Semicircle path from left to right through top
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // Needle: angle from 180° (left, 0%) to 0° (right, 100%)
  const needleAngle = Math.PI - (clamped / 100) * Math.PI;
  const needleLen = 28;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 120 68" className="w-full max-w-[120px]">
      {/* Background arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgb(30 41 59 / 0.5)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Filled arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgb(6 182 212)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${arcLength}`}
      />
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={nx} y2={ny}
        stroke="white" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="2.5" fill="white" />
      {/* 0 and 100 labels */}
      <text x={cx - r - 1} y={cy + 10} textAnchor="middle" className="fill-gray-600 text-[7px]">0</text>
      <text x={cx + r + 1} y={cy + 10} textAnchor="middle" className="fill-gray-600 text-[7px]">100</text>
      {/* Percentage */}
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="hanging" className="fill-white text-[9px] font-bold">
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

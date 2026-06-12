'use client';

import { Star } from 'lucide-react';

export default function KPointsBadge({ points = 0 }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-semibold">
      <Star size={14} className="fill-yellow-300 text-yellow-300" />
      <span>{points.toLocaleString()}</span>
      <span className="text-white/80 text-xs font-normal">K-pts</span>
    </div>
  );
}

'use client';

export default function CitationChip({ chunkId, index, onClick }) {
  // Show a simple numbered reference
  const num = (index || 0) + 1;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 mx-0.5 bg-[#0072CE]/10 text-[#0072CE] text-[10px] font-bold rounded hover:bg-[#0072CE]/20 underline decoration-[#0072CE] cursor-pointer transition-colors align-baseline"
      title={`View source: ${chunkId}`}
    >
      [{num}]
    </button>
  );
}

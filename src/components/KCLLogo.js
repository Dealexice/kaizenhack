export default function KCLLogo({ className = '', size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="8" fill="#A71930" />
      <text
        x="50"
        y="42"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="28"
        fontWeight="bold"
        fill="white"
        letterSpacing="1"
      >
        KING&apos;S
      </text>
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="14"
        fill="white"
        letterSpacing="2"
      >
        College
      </text>
      <text
        x="50"
        y="80"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="16"
        fontWeight="bold"
        fill="white"
        letterSpacing="3"
      >
        LONDON
      </text>
      <line x1="20" y1="87" x2="80" y2="87" stroke="white" strokeWidth="1.5" />
      <line x1="25" y1="91" x2="75" y2="91" stroke="white" strokeWidth="1" />
    </svg>
  );
}

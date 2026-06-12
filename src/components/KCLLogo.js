import Image from 'next/image';

export default function KCLLogo({ className = '', size = 40 }) {
  return (
    <Image
      src="/kcl.png"
      alt="King's College London Logo"
      width={size}
      height={size}
      className={className}
      style={{
        height: size,
        width: 'auto',
        objectFit: 'contain',
        display: 'inline-block'
      }}
    />
  );
}

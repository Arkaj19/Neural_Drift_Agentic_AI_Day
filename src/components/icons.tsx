import type { SVGProps } from "react";

export const Icons = {
  shield: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#007BFF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#00C6FF', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#0052D4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#4364F7', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Head shape */}
      <path 
        d="M65 20 C 55 20, 50 25, 50 35 C 50 45, 55 50, 65 50 C 75 50, 80 45, 80 35 C 80 25, 75 20, 65 20 Z M 65 50 C 60 50, 55 55, 55 65 L 55 80 L 85 80 L 85 65 C 85 55, 80 50, 70 50"
        transform="translate(-5, -15) scale(1.2)"
        fill="url(#logo-gradient)"
      />
      <path
        d="M78 33 c 0 10 -5 15 -15 15 c -10 0 -15 -5 -15 -15 c 0 -10 5 -15 15 -15 c 10 0 15 5 15 15"
        fill="none"
      />
      <path
        d="M50 25 C 40 25, 30 30, 30 40 V 60 L 50 75 V 80"
        fill="none"
      />
      
      {/* Network lines and dots */}
      <g stroke="url(#logo-gradient)" strokeWidth="2.5">
          <path d="M45 25 L 35 30 L 25 28" />
          <path d="M35 30 L 38 40" />
          <path d="M38 40 L 30 45" />
          <path d="M38 40 L 48 42" />
          <path d="M48 42 L 45 50" />
      </g>
      
      <circle cx="45" cy="25" r="3" fill="url(#logo-gradient)" />
      <circle cx="35" cy="30" r="3" fill="url(#logo-gradient)" />
      <circle cx="25" cy="28" r="3" fill="url(#logo-gradient)" />
      <circle cx="38" cy="40" r="3" fill="url(#logo-gradient)" />
      <circle cx="30" cy="45" r="3" fill="url(#logo-gradient)" />
      <circle cx="48" cy="42" r="3" fill="url(#logo-gradient)" />
      <circle cx="45" cy="50" r="3" fill="url(#logo-gradient)" />
    </svg>
  ),
};

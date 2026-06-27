import type { CSSProperties } from "react";

// Offload brand mark — the swirling loop glyph from `offload logo.html`.
export const OffloadMark = ({ size = 28, className, style }: { size?: number; className?: string; style?: CSSProperties }) => (
  <svg
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 743.4 493.94"
    width={size}
    height={size * (493.94 / 743.4)}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M743.4,271.72c-14.4,149.05-152.47,248.14-297.7,216.24-60.91-13.38-108.36-49.26-145.26-98.41-6.09-8.11-9.53-20.75-19.32-23.06-85.02-5.92-174.23,4.27-258.78-.96-8.46-.52-14.06-5.56-22.07-2.22-.96-16.87-.15-35.81,17.83-42.7l320.88-1.91c13.48,2.15,16.54,18.26,23.49,27.43,93.27,122.92,280.84,77.31,304.93-74.41h76Z" />
    <path d="M743.4,222.72h-76c-28.11-153.67-213.09-198.7-306.99-70.1-6.78,9.29-8.68,22.22-21.79,24.88l-187.46.54c-29.57-3.57-22.27-44.02,8.39-47.02,38.62-3.78,82.45,3.82,121.61-.85,7.25-2.3,23.01-30.2,29.5-38.4C345.53,47.77,400.59,13.78,455.83,3.93c142.22-25.35,272.4,74.75,287.57,218.79Z" />
    <path d="M333.82,224.86c-2.24,16.29-2.24,30.57,0,46.87H77.31c-9.51,0-14.97-17.83-13.61-26.5,1.09-6.95,14.25-20.37,19.94-20.37h250.18Z" />
  </svg>
);

// Full lockup — mark + "Offload" wordmark. `tone` controls color in light vs dark contexts.
export const OffloadLogo = ({
  markSize = 26,
  wordSize = 20,
  tone = "default",
}: {
  markSize?: number;
  wordSize?: number;
  tone?: "default" | "onDark";
}) => (
  <span className={`offload-logo ${tone === "onDark" ? "on-dark" : ""}`}>
    <OffloadMark size={markSize} className="offload-logo-mark" />
    <span className="offload-logo-word" style={{ fontSize: wordSize }}>
      Offload
    </span>
  </span>
);

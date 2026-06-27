// Minimal icon set — line icons, lucide-inspired but original
const Icon = ({ d, viewBox = '0 0 24 24', size = 16, stroke = 1.6, fill = 'none', className = 'icon', children, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size} viewBox={viewBox}
    fill={fill} stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
    style={style}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Home: (p) => <Icon {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></Icon>,
  Scripts: (p) => <Icon {...p}><rect x="4" y="3" width="14" height="18" rx="2"/><path d="M8 8h6M8 12h6M8 16h4"/></Icon>,
  Chart: (p) => <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Arrow: (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>,
  ArrowLeft: (p) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Icon>,
  ArrowUp: (p) => <Icon {...p}><path d="M12 19V5M6 11l6-6 6 6"/></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14M18 13l-6 6-6-6"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 13l4 4L19 7"/></Icon>,
  Sparkle: (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  Upload: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></Icon>,
  Image: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></Icon>,
  Edit: (p) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Send: (p) => <Icon {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  Target: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></Icon>,
  Users: (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></Icon>,
  Bolt: (p) => <Icon {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></Icon>,
  Megaphone: (p) => <Icon {...p}><path d="M3 11v2a2 2 0 0 0 2 2h2l8 5V4L7 9H5a2 2 0 0 0-2 2zM20 7l-3 3M20 17l-3-3M21 12h-3"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Heart: (p) => <Icon {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></Icon>,
  Repeat: (p) => <Icon {...p}><path d="m17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></Icon>,
  Film: (p) => <Icon {...p}><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></Icon>,
  Type: (p) => <Icon {...p}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></Icon>,
  Layers: (p) => <Icon {...p}><path d="m12 2 10 6-10 6L2 8l10-6z"/><path d="m2 17 10 6 10-6M2 12l10 6 10-6"/></Icon>,
  Mic: (p) => <Icon {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 19v3"/></Icon>,
  Copy: (p) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>,
  Play: (p) => <Icon {...p}><path d="M5 3v18l16-9L5 3z" fill="currentColor"/></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></Icon>,
  Wand: (p) => <Icon {...p}><path d="m15 4 6 6-12 12-6-6L15 4zM12 7l5 5M3 21l3-3"/></Icon>,
  Filter: (p) => <Icon {...p}><path d="M22 3H2l8 9.4V19l4 2v-8.6L22 3z"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="M15 18l-6-6 6-6"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="M9 18l6-6-6-6"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  TrendUp: (p) => <Icon {...p}><path d="M23 6 13.5 15.5 8.5 10.5 1 18"/><path d="M17 6h6v6"/></Icon>,
  Dollar: (p) => <Icon {...p}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></Icon>,
  Coffee: (p) => <Icon {...p}><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></Icon>,
  Beaker: (p) => <Icon {...p}><path d="M9 3h6v5l4 10a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3L9 8V3z"/><path d="M9 3h6"/></Icon>,
  Pin: (p) => <Icon {...p}><path d="M12 2 7 9v6l5 7 5-7V9l-5-7z"/><circle cx="12" cy="11" r="2"/></Icon>,
  Hash: (p) => <Icon {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></Icon>,
  // Brand glyphs (simple)
  Reddit: (p) => (
    <Icon viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="13" r="8.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13" r="1.2" fill="white" stroke="none" />
      <circle cx="15" cy="13" r="1.2" fill="white" stroke="none" />
      <path d="M8.5 16c1 1 2 1.4 3.5 1.4S14.5 17 15.5 16" stroke="white" strokeWidth="1.4" fill="none" />
      <circle cx="18.5" cy="6.5" r="2" fill="currentColor" stroke="none" />
      <path d="M12.5 8.2 13.5 5l4 0.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </Icon>
  ),
  TikTok: (p) => (
    <Icon viewBox="0 0 24 24" {...p}>
      <path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5h1V13a1 1 0 1 0 1 1V4z" fill="currentColor" stroke="none" />
      <path d="M14 4c.5 2.5 2 4 4.5 4.5V5C16.5 4.7 15.2 3.5 15 2h-1z" fill="currentColor" stroke="none" />
    </Icon>
  ),
  Instagram: (p) => (
    <Icon viewBox="0 0 24 24" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" fill="none" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" fill="none" strokeWidth="1.8"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  ),
  XLogo: (p) => (
    <Icon viewBox="0 0 24 24" {...p}>
      <path d="M3 3l8.5 11.2L3.8 21h2.4l6.6-6 4.5 6H22L13 9.2 21 3h-2.4L13 8.6 8.7 3H3z" fill="currentColor" stroke="none" />
    </Icon>
  ),
};

window.I = I;
window.Icon = Icon;

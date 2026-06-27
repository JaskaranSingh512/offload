// Shared UI bits used across screens
const Toggle = ({ on, onChange }) => (
  <button
    className={`toggle ${on ? 'on' : ''}`}
    onClick={(e) => { e.stopPropagation(); onChange(!on); }}
    aria-pressed={on}
  />
);

const Chip = ({ children, tone, dot }) => (
  <span className={`chip ${tone === 'teal' ? 'chip-teal' : ''}`}>
    {dot && <span className="chip-dot" style={dot === true ? {} : { background: dot }} />}
    {children}
  </span>
);

const ChannelIcon = ({ channel, size = 14 }) => {
  const meta = window.brewLab.channelMeta[channel];
  return (
    <div className="cal-post-ch-icon" style={{ background: meta.color, width: size, height: size }}>
      <meta.Icon size={size * 0.7} />
    </div>
  );
};

const PageHead = ({ eyebrow, title, sub, actions }) => (
  <div className="page-head">
    <div>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
      <h1 className="page-title" dangerouslySetInnerHTML={{ __html: title }} />
      {sub && <p className="page-sub">{sub}</p>}
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

// Tiny inline bar/line chart components
const BarChart = ({ data, height = 180, color = 'var(--teal)', maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height, gap: 6 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${(d.value / max) * 100}%`,
              background: d.color || color,
              borderRadius: '4px 4px 0 0',
              transition: 'height 600ms cubic-bezier(.2,.8,.2,1)',
              minHeight: 4,
            }} />
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

const LineChart = ({ data, height = 200, color = 'var(--teal)', secondaryData = null }) => {
  const max = Math.max(...data.map(d => d.value), ...(secondaryData ? secondaryData.map(d => d.value) : [0]));
  const min = 0;
  const w = 600;
  const h = height;
  const pad = { top: 16, right: 16, bottom: 28, left: 32 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const xStep = innerW / (data.length - 1);
  const path = data.map((d, i) => {
    const x = pad.left + i * xStep;
    const y = pad.top + innerH - ((d.value - min) / (max - min)) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const secPath = secondaryData ? secondaryData.map((d, i) => {
    const x = pad.left + i * xStep;
    const y = pad.top + innerH - ((d.value - min) / (max - min)) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ') : null;

  const area = `${path} L${pad.left + (data.length - 1) * xStep},${pad.top + innerH} L${pad.left},${pad.top + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* horizontal gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.top + innerH * (1 - t);
        return <line key={i} x1={pad.left} x2={w - pad.right} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}
      <path d={area} fill="url(#lc-fill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {secPath && <path d={secPath} fill="none" stroke="var(--espresso-50)" strokeWidth="1.5" strokeDasharray="4 4" />}
      {data.map((d, i) => {
        const x = pad.left + i * xStep;
        const y = pad.top + innerH - ((d.value - min) / (max - min)) * innerH;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
      {data.map((d, i) => i % 2 === 0 && (
        <text key={`l${i}`} x={pad.left + i * xStep} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--text-faint)" fontFamily="var(--font-mono)">{d.label}</text>
      ))}
      {[0, 0.5, 1].map((t, i) => (
        <text key={`yl${i}`} x={pad.left - 6} y={pad.top + innerH * (1 - t) + 3} textAnchor="end" fontSize="10" fill="var(--text-faint)" fontFamily="var(--font-mono)">
          {Math.round(max * t)}
        </text>
      ))}
    </svg>
  );
};

Object.assign(window, { Toggle, Chip, ChannelIcon, PageHead, BarChart, LineChart });

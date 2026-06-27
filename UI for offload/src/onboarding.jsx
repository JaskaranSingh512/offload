const { useState, useEffect, useRef } = React;

// ===== ONBOARDING FLOW =====
const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const steps = ['welcome', 'brand', 'audience', 'channels', 'loading'];
  const progress = ((step + 1) / steps.length) * 100;

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="onb-wrap">
      <div className="onb-topbar">
        <div className="sidebar-logo" style={{ padding: 0, border: 'none', margin: 0 }}>
          <span className="mark">t</span>
          <span className="wordmark">Tether</span>
        </div>
        <div className="onb-progress">
          <span>Step {step + 1} of {steps.length}</span>
          <div className="onb-progress-bar">
            <div className="onb-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="onb-body">
        {step === 0 && <Welcome onNext={next} />}
        {step === 1 && <BrandStep onNext={next} onBack={prev} />}
        {step === 2 && <AudienceStep onNext={next} onBack={prev} />}
        {step === 3 && <ChannelsStep onNext={next} onBack={prev} />}
        {step === 4 && <LoadingStep onComplete={onComplete} />}
      </div>
    </div>
  );
};

const Welcome = ({ onNext }) => (
  <div className="onb-card welcome-hero">
    <div className="onb-step-label">Welcome to Tether</div>
    <h1 className="word">Marketing,<br /><span className="em">on a tether.</span></h1>
    <p className="tagline">
      Tell us about your brand once. We'll research your market, build a 2-week multi-channel
      campaign, schedule it, and tell you what's working.
    </p>
    <div className="welcome-grid">
      <div className="wg-card">
        <div className="wg-icon"><I.Beaker size={18}/></div>
        <h3 className="wg-title">Researches your market</h3>
        <p className="wg-desc">Pulls competitor angles, audience signals, and proven hooks.</p>
      </div>
      <div className="wg-card">
        <div className="wg-icon"><I.Calendar size={18}/></div>
        <h3 className="wg-title">Builds a 2-week campaign</h3>
        <p className="wg-desc">Generated posts across Reddit, TikTok, Instagram, and X.</p>
      </div>
      <div className="wg-card">
        <div className="wg-icon"><I.TrendUp size={18}/></div>
        <h3 className="wg-title">Tells you what works</h3>
        <p className="wg-desc">Recommends what to double down on and where to put paid budget.</p>
      </div>
    </div>
    <button className="btn btn-primary btn-lg" onClick={onNext}>
      Get started <I.Arrow />
    </button>
    <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 20 }}>
      Takes about 3 minutes. No credit card required.
    </p>
  </div>
);

const BrandStep = ({ onNext, onBack }) => {
  const [name, setName] = useState('Brew Lab');
  const [tagline, setTagline] = useState('Small-batch cold brew, brewed slow.');
  const [voice, setVoice] = useState('warm-witty');
  const [colors] = useState([
    { name: 'Espresso',  hex: '#3B2417', role: 'primary' },
    { name: 'Cream',     hex: '#F5EFE6', role: 'background' },
    { name: 'Teal',      hex: '#1FA89B', role: 'accent' },
  ]);

  const voices = [
    { id: 'warm-witty',     label: 'Warm + witty',      sub: 'Friendly, a little irreverent' },
    { id: 'authoritative',  label: 'Authoritative',     sub: 'Expert, measured, confident' },
    { id: 'playful',        label: 'Playful',           sub: 'Energetic, casual, fun' },
    { id: 'editorial',      label: 'Editorial',         sub: 'Thoughtful, considered, slow' },
  ];

  return (
    <div className="onb-card">
      <div className="onb-step-label">01 · Brand</div>
      <h1 className="onb-title">Tell us about <span className="em">your brand.</span></h1>
      <p className="onb-sub">We pre-filled some details from your domain. Adjust anything that's not quite right.</p>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4" style={{ alignItems: 'stretch' }}>
          {/* Logo upload */}
          <div className="field" style={{ flex: '0 0 140px' }}>
            <span className="field-label">Logo</span>
            <button style={{
              width: 140, height: 140,
              border: '1.5px dashed var(--border-strong)',
              borderRadius: 12,
              background: 'var(--cream)',
              display: 'grid', placeItems: 'center',
              color: 'var(--espresso)',
              cursor: 'pointer',
              position: 'relative',
              padding: 0,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 38, fontStyle: 'italic',
                  marginBottom: 6,
                }}>bl</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <I.Upload size={11}/> Replace
                </div>
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-3" style={{ flex: 1 }}>
            <label className="field">
              <span className="field-label">Brand name</span>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">One-line description</span>
              <input className="input" value={tagline} onChange={e => setTagline(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Brand colors</span>
          <div className="swatch-row">
            {colors.map(c => (
              <div className="swatch" key={c.name}>
                <div className="chip-color" style={{ background: c.hex }} />
                <div className="swatch-meta">
                  <span className="name">{c.name}</span>
                  <span className="hex">{c.hex.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Brand voice</span>
          <div className="opt-grid">
            {voices.map(v => (
              <button key={v.id} className={`opt-card ${voice === v.id ? 'on' : ''}`} onClick={() => setVoice(v.id)}>
                <div className="opt-icon"><I.Mic size={16} /></div>
                <h4 className="opt-title">{v.label}</h4>
                <p className="opt-desc">{v.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="onb-actions">
        <button className="btn btn-ghost" onClick={onBack}><I.ArrowLeft size={14}/> Back</button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={onNext}>
          Continue <I.Arrow />
        </button>
      </div>
    </div>
  );
};

const AudienceStep = ({ onNext, onBack }) => {
  const [audience, setAudience] = useState('Remote workers and creatives, 25–40, who care about quality and aesthetics. Spend on coffee at home. Follow design + lifestyle accounts.');
  const [goal, setGoal] = useState('awareness');
  const goals = [
    { id: 'awareness',  label: 'Grow awareness',   sub: 'Get in front of people who don\'t know us yet.', icon: I.Megaphone },
    { id: 'orders',     label: 'Drive first orders', sub: 'Convert new audience into paying customers.', icon: I.Dollar },
    { id: 'community',  label: 'Build community',  sub: 'Grow an audience that follows along.', icon: I.Users },
    { id: 'launch',     label: 'Launch a product', sub: 'Build hype around a specific release.', icon: I.Bolt },
  ];

  return (
    <div className="onb-card">
      <div className="onb-step-label">02 · Audience & Goals</div>
      <h1 className="onb-title">Who are you reaching, <span className="em">and why?</span></h1>
      <p className="onb-sub">The clearer this is, the better Tether's first campaign will be.</p>

      <div className="flex flex-col gap-4">
        <label className="field">
          <span className="field-label">Who do you serve?</span>
          <textarea className="textarea" value={audience} onChange={e => setAudience(e.target.value)} rows={3} />
          <span className="field-hint">Describe your ideal customer in a sentence or two. Demographics, what they care about, what they spend on.</span>
        </label>

        <div className="field">
          <span className="field-label">What are you trying to accomplish?</span>
          <div className="opt-grid">
            {goals.map(g => (
              <button key={g.id} className={`opt-card ${goal === g.id ? 'on' : ''}`} onClick={() => setGoal(g.id)}>
                <div className="opt-icon"><g.icon size={16}/></div>
                <h4 className="opt-title">{g.label}</h4>
                <p className="opt-desc">{g.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="onb-actions">
        <button className="btn btn-ghost" onClick={onBack}><I.ArrowLeft size={14}/> Back</button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={onNext}>
          Continue <I.Arrow />
        </button>
      </div>
    </div>
  );
};

const ChannelsStep = ({ onNext, onBack }) => {
  const [enabled, setEnabled] = useState({ reddit: true, tiktok: true, instagram: true, x: false });
  const channels = [
    { id: 'reddit',    name: 'Reddit',    desc: 'Long-form posts, AMAs, niche subreddits.', color: '#FF4500', Icon: I.Reddit },
    { id: 'tiktok',    name: 'TikTok',    desc: 'Slideshow + talking-head, 15–60s.',         color: '#111111', Icon: I.TikTok },
    { id: 'instagram', name: 'Instagram', desc: 'Carousels and single-image posts.',          color: '#E1306C', Icon: I.Instagram },
    { id: 'x',         name: 'X',         desc: 'Short posts and threads.',                   color: '#000000', Icon: I.XLogo },
  ];

  return (
    <div className="onb-card">
      <div className="onb-step-label">03 · Channels</div>
      <h1 className="onb-title">Where should we <span className="em">publish?</span></h1>
      <p className="onb-sub">Toggle the channels you want Tether to plan content for. You can add more later — these defaults work for most brands.</p>

      <div className="flex flex-col gap-2">
        {channels.map(c => (
          <div key={c.id} className={`channel-card ${enabled[c.id] ? 'on' : ''}`}>
            <div className="ch-icon" style={{ background: c.color }}><c.Icon size={20} /></div>
            <div className="ch-meta">
              <h4 className="ch-name">{c.name}</h4>
              <p className="ch-desc">{c.desc}</p>
            </div>
            <Toggle on={enabled[c.id]} onChange={(v) => setEnabled({ ...enabled, [c.id]: v })} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--cream)', borderRadius: 10, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <I.Bell size={14} style={{ marginTop: 1, flexShrink: 0, color: 'var(--espresso)' }}/>
        <span>This is a prototype — channel connections are simulated. In production you'd OAuth each platform here.</span>
      </div>

      <div className="onb-actions">
        <button className="btn btn-ghost" onClick={onBack}><I.ArrowLeft size={14}/> Back</button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={onNext}>
          Generate my first campaign <I.Sparkle size={14}/>
        </button>
      </div>
    </div>
  );
};

const LoadingStep = ({ onComplete }) => {
  const tasks = [
    'Analyzing brewlab.co and your social presence…',
    'Identifying 4 main competitors and what they\'re publishing…',
    'Mapping audience overlap on Reddit, TikTok, Instagram…',
    'Generating 12 content angles for your brand voice…',
    'Drafting 35 posts across 4 channels…',
    'Scheduling your 2-week launch campaign…',
  ];
  const [taskIdx, setTaskIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const totalMs = 2800;
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / totalMs, 1);
      setProgress(p * 100);
      const idx = Math.min(Math.floor(p * tasks.length), tasks.length - 1);
      setTaskIdx(idx);
      if (p >= 1) {
        clearInterval(t);
        setTimeout(onComplete, 480);
      }
    }, 60);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="loader-wrap" style={{ minHeight: 'auto', flex: 1, width: '100%' }}>
      <div className="loader-card">
        <div className="loader-mark">t</div>
        <h2 className="loader-title">Building your first campaign</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          This usually takes about 3 seconds. In production it'd be more like 30.
        </p>

        <div className="loader-progress">
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="loader-status">
          <I.Sparkle size={13} style={{ color: 'var(--teal)' }} />
          <span>{tasks[taskIdx]}</span>
        </div>

        <div className="loader-checks">
          {tasks.map((t, i) => (
            <div key={i} className={`loader-check ${i < taskIdx ? 'done' : i === taskIdx ? 'active' : ''}`}>
              <span className="check-dot">{i < taskIdx && <I.Check />}</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

window.Onboarding = Onboarding;

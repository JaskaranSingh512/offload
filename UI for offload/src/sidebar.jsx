const Sidebar = ({ route, setRoute }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: I.Home },
    { id: 'calendar',  label: 'Calendar',  icon: I.Calendar, badge: 35 },
    { id: 'scripts',   label: 'Scripts',   icon: I.Scripts, badge: 4 },
    { id: 'analytics', label: 'Analytics', icon: I.Chart },
  ];
  const tools = [
    { id: 'builder',   label: 'New campaign', icon: I.Plus },
  ];

  return (
    <aside className="sidebar">
      <button onClick={() => setRoute('dashboard')} className="sidebar-logo" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', width: '100%' }}>
        <span className="mark">t</span>
        <span className="wordmark">Tether</span>
      </button>

      <div className="sidebar-section-label">Workspace</div>
      {items.map(it => (
        <button key={it.id} className={`nav-item ${route === it.id ? 'active' : ''}`} onClick={() => setRoute(it.id)}>
          <it.icon className="icon" />
          <span>{it.label}</span>
          {it.badge && <span className="nav-badge">{it.badge}</span>}
        </button>
      ))}

      <div className="sidebar-section-label">Create</div>
      {tools.map(it => (
        <button key={it.id} className={`nav-item ${route === it.id ? 'active' : ''}`} onClick={() => setRoute(it.id)}>
          <it.icon className="icon" />
          <span>{it.label}</span>
        </button>
      ))}

      <div className="sidebar-footer">
        <div className="avatar">BL</div>
        <div className="brand-pill">
          <span className="bdot" />
          <span>Brew Lab</span>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--text-muted)' }} title="Settings">
          <I.Settings />
        </button>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;

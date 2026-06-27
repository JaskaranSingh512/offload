const ContentCalendar = ({ openPost }) => {
  const { posts, dateLabels, channelMeta, TODAY_DAY } = window.brewLab;
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? posts : posts.filter(p => p.channel === filter);

  const postsByDay = filtered.reduce((acc, p) => {
    (acc[p.day] = acc[p.day] || []).push(p);
    return acc;
  }, {});

  const renderWeek = (weekOffset) => (
    <div className="cal-grid">
      {Array.from({ length: 7 }, (_, dayIdx) => {
        const dayNum = weekOffset * 7 + dayIdx;
        const date = dateLabels[dayNum];
        const dayPosts = postsByDay[dayNum] || [];
        const isToday = dayNum === TODAY_DAY;
        return (
          <div key={dayNum} className={`cal-day ${isToday ? 'today' : ''}`}>
            <div className="cal-day-head">
              <span className="cal-day-num">{date.num}</span>
              <span className="cal-day-dow">
                {isToday ? <span style={{ color: 'var(--teal-deep)' }}>TODAY</span> : date.dow}
              </span>
            </div>
            {dayPosts.sort((a, b) => a.time.localeCompare(b.time)).map(p => {
              const meta = channelMeta[p.channel];
              return (
                <div
                  key={p.id}
                  className="cal-post"
                  style={{ borderLeftColor: meta.color }}
                  onClick={() => openPost(p)}
                >
                  <div className="cal-post-head">
                    <ChannelIcon channel={p.channel} size={14} />
                    <span className="cal-post-time">{p.time}</span>
                  </div>
                  <div className="cal-post-title">{p.title}</div>
                  <div className="cal-post-type">{p.type}</div>
                </div>
              );
            })}
            {dayPosts.length === 0 && (
              <div style={{
                marginTop: 'auto',
                marginBottom: 'auto',
                textAlign: 'center',
                color: 'var(--text-faint)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
              }}>
                No posts
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="main-inner">
      <PageHead
        eyebrow="Content Calendar"
        title='The Honest Cold Brew <span class="em">— Spring Launch</span>'
        sub="May 5 – May 18 · 35 posts across 4 channels · all drafted and scheduled"
        actions={
          <>
            <button className="btn btn-secondary"><I.Filter size={13}/> Filters</button>
            <button className="btn btn-secondary"><I.Plus size={13}/> Add post</button>
            <button className="btn btn-primary"><I.Send size={13}/> Approve all</button>
          </>
        }
      />

      <div className="cal-head">
        <div className="cal-legend">
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>
            All channels
          </button>
          {Object.entries(channelMeta).map(([id, m]) => (
            <button
              key={id}
              className={`btn btn-sm ${filter === id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(id)}
              style={filter === id ? { background: m.color, borderColor: m.color, color: 'white' } : {}}
            >
              <span className="lg-dot" style={{ background: m.color }}/> {m.name}
            </button>
          ))}
        </div>
        <div className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {posts.length} posts
        </div>
      </div>

      {/* Week 1 */}
      <div className="cal-week-label">
        <span>Week 1 · May 5 – May 11</span>
        <span style={{ color: 'var(--teal-deep)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <I.Check size={12}/> 8 posts published · 10 upcoming
        </span>
      </div>
      {renderWeek(0)}

      {/* Week 2 */}
      <div className="cal-week-label">
        <span>Week 2 · May 12 – May 18</span>
        <span style={{ color: 'var(--text-muted)' }}>17 posts scheduled</span>
      </div>
      {renderWeek(1)}

      {/* Helper */}
      <div className="card" style={{ marginTop: 24, padding: 20, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--cream)' }}>
        <I.Bolt size={20} style={{ color: 'var(--teal-deep)', flexShrink: 0 }}/>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--espresso)', flex: 1 }}>
          <strong>Tip:</strong> Click any post to preview the full content, edit copy, swap visuals, or reschedule.
          Anything you change will be reflected on the live calendar instantly.
        </p>
      </div>
    </div>
  );
};

window.ContentCalendar = ContentCalendar;

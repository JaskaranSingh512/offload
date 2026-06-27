// Main app — manages routing across onboarding + 5 main screens + content detail drawer
const App = () => {
  const [onboarded, setOnboarded] = useState(false);
  const [route, setRoute] = useState('dashboard');
  const [openedPost, setOpenedPost] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  // Route change with subtle fade
  const goTo = (r) => {
    if (r === route) return;
    setTransitioning(true);
    setOpenedPost(null);
    setTimeout(() => {
      setRoute(r);
      setTransitioning(false);
      // scroll main back to top
      const main = document.querySelector('.main');
      if (main) main.scrollTop = 0;
    }, 120);
  };

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  return (
    <div className="app" data-screen-label={`Tether · ${route}`}>
      <Sidebar route={route} setRoute={goTo} />
      <main className="main">
        <div style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(4px)' : 'none',
          transition: 'opacity 220ms ease, transform 220ms ease',
        }}>
          {route === 'dashboard' && <Dashboard setRoute={goTo} openPost={setOpenedPost} />}
          {route === 'calendar'  && <ContentCalendar openPost={setOpenedPost} />}
          {route === 'builder'   && <CampaignBuilder setRoute={goTo} />}
          {route === 'scripts'   && <Scripts setRoute={goTo} />}
          {route === 'analytics' && <Analytics setRoute={goTo} />}
        </div>
      </main>

      {openedPost && (
        <ContentDetail post={openedPost} onClose={() => setOpenedPost(null)} />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

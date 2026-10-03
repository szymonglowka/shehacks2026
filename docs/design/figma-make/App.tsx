import { useState, type ReactNode } from "react";

type IconName =
  | "home"
  | "calendar"
  | "chart"
  | "heart"
  | "book"
  | "user"
  | "bell"
  | "arrow"
  | "moon"
  | "spark"
  | "check"
  | "phone"
  | "close";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5M9 21v-7h6v7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4m8-4v4M3 10h18" /></>,
    chart: <><path d="M4 20V10m6 10V4m6 16v-7m5 7H2" /></>,
    heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
    moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />,
    spark: <><path d="m12 3-1.2 4.1a5.2 5.2 0 0 1-3.6 3.6L3 12l4.2 1.3a5.2 5.2 0 0 1 3.6 3.6L12 21l1.2-4.1a5.2 5.2 0 0 1 3.6-3.6L21 12l-4.2-1.3a5.2 5.2 0 0 1-3.6-3.6L12 3Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <div className="brand">
      <svg className="brand-mark" viewBox="0 0 36 36" aria-hidden="true">
        <path d="M18 17.8C6 15.2 7 4.9 11.3 4.1c4.5-.9 6.4 5.7 6.7 13.7Z" />
        <path d="M18 17.8C30 15.2 29 4.9 24.7 4.1c-4.5-.9-6.4 5.7-6.7 13.7Z" />
        <path d="M18 18.2C6 20.8 7 31.1 11.3 31.9c4.5.9 6.4-5.7 6.7-13.7Z" />
        <path d="M18 18.2c12 2.6 11 12.9 6.7 13.7-4.5.9-6.4-5.7-6.7-13.7Z" />
      </svg>
      <span>otula</span>
    </div>
  );
}

const navigation: { label: string; icon: IconName }[] = [
  { label: "Dzisiaj", icon: "home" },
  { label: "Kalendarz", icon: "calendar" },
  { label: "Statystyki", icon: "chart" },
  { label: "Wsparcie", icon: "heart" },
  { label: "Wiedza", icon: "book" },
];

function Nav({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  return (
    <>
      <aside className="sidebar">
        <Brand />
        <nav className="side-nav" aria-label="Główna nawigacja">
          {navigation.map((item) => (
            <button className={active === item.label ? "nav-item active" : "nav-item"} onClick={() => setActive(item.label)} key={item.label}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Icon name="user" /><span>Profil</span></button>
          <div className="support-note">
            <span>Potrzebujesz pomocy?</span>
            <button><Icon name="phone" size={16} /> Telefony wsparcia</button>
          </div>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="Główna nawigacja">
        {navigation.slice(0, 4).map((item) => (
          <button className={active === item.label ? "mobile-nav-item active" : "mobile-nav-item"} onClick={() => setActive(item.label)} key={item.label}>
            <Icon name={item.icon} size={21} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

function CheckInModal({ close }: { close: () => void }) {
  const [mood, setMood] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="checkin-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={close} aria-label="Zamknij"><Icon name="close" /></button>
        {saved ? (
          <div className="success-state">
            <div className="success-icon"><Icon name="check" size={30} /></div>
            <h2>Dziękuję, że to zauważyłaś</h2>
            <p>Twój check-in został zapisany. Jutro znów zajmie tylko chwilę.</p>
            <button className="primary-button" onClick={close}>Wróć do dzisiaj</button>
          </div>
        ) : (
          <>
            <div className="eyebrow">Codzienny check-in · 1 z 4</div>
            <h2 id="checkin-title">Jak się teraz czujesz?</h2>
            <p className="modal-copy">Nie ma dobrych ani złych odpowiedzi. Wybierz to, co jest najbliżej.</p>
            <div className="mood-scale">
              {[
                ["1", "Bardzo trudno"],
                ["2", "Trudno"],
                ["3", "Różnie"],
                ["4", "Dobrze"],
                ["5", "Bardzo dobrze"],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setMood(Number(value))} className={mood === Number(value) ? "mood-option selected" : "mood-option"}>
                  <span>{value}</span><small>{label}</small>
                </button>
              ))}
            </div>
            <button className="primary-button full" disabled={!mood} onClick={() => setSaved(true)}>Dalej <Icon name="arrow" size={18} /></button>
            <div className="progress-dots"><span className="current" /><span /><span /><span /></div>
          </>
        )}
      </section>
    </div>
  );
}

function HardDayModal({ close }: { close: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section className="modal hard-day-modal" role="dialog" aria-modal="true" aria-labelledby="hard-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={close} aria-label="Zamknij"><Icon name="close" /></button>
        <div className="breath-orb"><span /></div>
        <div className="eyebrow">Jestem przy Tobie</div>
        <h2 id="hard-title">Zacznijmy od jednego spokojnego oddechu</h2>
        <p className="modal-copy">Wdech przez 4 sekundy, zatrzymaj na chwilę i zrób długi wydech. Nic więcej nie musisz teraz robić.</p>
        <button className="primary-button full">Rozpocznij 1 minutę</button>
        <button className="text-button" onClick={close}>Wybierz inną formę wsparcia</button>
      </section>
    </div>
  );
}

function Dashboard({ openCheckIn, openHardDay }: { openCheckIn: () => void; openHardDay: () => void }) {
  return (
    <main className="main">
      <header className="topbar">
        <div className="mobile-brand"><Brand /></div>
        <div className="topbar-date">Wtorek, 14 maja</div>
        <div className="topbar-actions">
          <button className="hard-day-button" onClick={openHardDay}><Icon name="heart" size={17} /> Gorszy dzień</button>
          <button className="icon-button notification" aria-label="Powiadomienia"><Icon name="bell" /><span /></button>
          <div className="avatar">MK</div>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="content-column">
          <section className="welcome">
            <div>
              <div className="eyebrow">Dzień dobry, Marta</div>
              <h1>Jak się dziś masz?</h1>
              <p>Mały krok wystarczy. Zatrzymaj się na chwilę dla siebie.</p>
            </div>
            <div className="stage-pill">
              <span className="stage-number">6</span>
              <span><strong>tydzień połogu</strong><small>dzień 39</small></span>
            </div>
          </section>

          <section className="checkin-card">
            <div className="checkin-art" aria-hidden="true">
              <div className="petal petal-one" />
              <div className="petal petal-two" />
              <div className="petal petal-three" />
              <div className="center-dot" />
            </div>
            <div className="checkin-content">
              <div className="duration"><span /><span /> około 30 sekund</div>
              <h2>Twój codzienny check-in</h2>
              <p>Sprawdź nastrój, energię, sen i objawy. Dzięki temu lepiej dopasujemy wsparcie do Ciebie.</p>
              <button className="primary-button" onClick={openCheckIn}>Zacznij check-in <Icon name="arrow" size={18} /></button>
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div><div className="eyebrow">Dla Ciebie</div><h2>Na dzisiejszy dzień</h2></div>
              <button className="link-button">Zobacz wszystkie <Icon name="arrow" size={16} /></button>
            </div>
            <div className="recommendation-grid">
              <article className="recommendation featured">
                <div className="recommendation-icon"><Icon name="moon" size={22} /></div>
                <div className="match">Najlepsze dopasowanie</div>
                <h3>10 minut odpoczynku bez telefonu</h3>
                <p>Ta strategia pomagała Ci w 4 z 5 trudniejszych dni.</p>
                <div className="card-bottom"><span>10 min</span><button aria-label="Rozpocznij"><Icon name="arrow" /></button></div>
              </article>
              <article className="recommendation">
                <div className="recommendation-icon warm"><Icon name="spark" size={22} /></div>
                <div className="match muted">Delikatny ruch</div>
                <h3>Krótki spacer w Twoim tempie</h3>
                <p>Świeże powietrze może pomóc rozluźnić ciało i myśli.</p>
                <div className="card-bottom"><span>5–15 min</span><button aria-label="Rozpocznij"><Icon name="arrow" /></button></div>
              </article>
            </div>
          </section>

          <section className="insight-card">
            <div className="insight-icon"><Icon name="chart" /></div>
            <div><div className="eyebrow">Twoje odkrycie</div><h3>Sen wyraźnie wspiera Twój nastrój</h3><p>Po nocach z co najmniej 6 godzinami snu oceniasz nastrój średnio o 24% lepiej.</p></div>
            <button className="icon-button" aria-label="Zobacz statystyki"><Icon name="arrow" /></button>
          </section>
        </div>

        <aside className="right-column">
          <section className="today-card">
            <div className="section-heading compact"><h2>Dzisiaj</h2><span className="completion">1 z 3</span></div>
            <div className="goal-list">
              <div className="goal done"><span><Icon name="check" size={15} /></span><div><strong>Szklanka wody</strong><small>Zrobione o 8:20</small></div></div>
              <div className="goal"><span /><div><strong>Codzienny check-in</strong><small>Około 30 sekund</small></div></div>
              <div className="goal"><span /><div><strong>Chwila dla siebie</strong><small>Minimum 10 minut</small></div></div>
            </div>
            <div className="completion-bar"><span /></div>
          </section>

          <section className="epds-card">
            <div className="epds-top"><div className="epds-icon"><Icon name="heart" size={19} /></div><span>Za 3 dni</span></div>
            <h3>Krótka ankieta samopoczucia</h3>
            <p>Regularny przesiew EPDS pomaga zauważyć, kiedy potrzebujesz więcej wsparcia.</p>
            <button className="link-button">Dowiedz się więcej <Icon name="arrow" size={16} /></button>
          </section>

          <section className="article-card">
            <img src="https://images.unsplash.com/photo-1732051842183-6c459aab5e9a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=800&h=500" alt="Bliskość rodzica i niemowlęcia" />
            <div className="article-body"><span>5 min czytania</span><h3>Odpoczynek w połogu to nie luksus</h3><button className="link-button">Przeczytaj artykuł <Icon name="arrow" size={16} /></button></div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Placeholder({ active }: { active: string }) {
  return (
    <main className="main">
      <header className="topbar"><div className="mobile-brand"><Brand /></div><div className="topbar-date">Otula</div></header>
      <div className="placeholder">
        <div className="placeholder-icon"><Icon name={navigation.find((item) => item.label === active)?.icon ?? "heart"} size={30} /></div>
        <div className="eyebrow">Twoja przestrzeń</div>
        <h1>{active}</h1>
        <p>Ta sekcja jest gotowa na kolejne elementy Twojej drogi.</p>
      </div>
    </main>
  );
}

export default function App() {
  const [active, setActive] = useState("Dzisiaj");
  const [modal, setModal] = useState<"checkin" | "hard" | null>(null);

  return (
    <div className="app-shell">
      <Nav active={active} setActive={setActive} />
      {active === "Dzisiaj" ? <Dashboard openCheckIn={() => setModal("checkin")} openHardDay={() => setModal("hard")} /> : <Placeholder active={active} />}
      {modal === "checkin" && <CheckInModal close={() => setModal(null)} />}
      {modal === "hard" && <HardDayModal close={() => setModal(null)} />}
    </div>
  );
}

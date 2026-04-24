import { useEffect } from "react";
import { PageStatusGate } from "@/components/page-status-gate";

/* =========================================================
   LONG MARCH — EDITABLE TIMELINE DATA
   Everything on this page is generated from the object below.
   Change copy here. Flag "key: true" to star an event in gold.
   ========================================================= */
export const LONG_MARCH_DATA = {
  meta: {
    dossierCode: "DOSSIER // DB-LM-001",
    eyesOnly: "EYES ONLY — ADMIN",
    fileTag: "FILE: LONG-MARCH / v1.0",
    title: "The Long March",
    subtitle: "A timeline of the utopian subversion of the West",
    byline: "Filed by DinoBane Intel · dinobane.com",
  },
  thesis: [
    "History, we were told, is an inevitable drift leftwards — an eternal climb toward utopia. Every failure is a rung. Every atrocity, a price. Every collapse, a lesson the faithful refuse to learn.",
    "This dossier tracks the ideological engine from its Prussian roots to the boardrooms of BlackRock. The tactic changes — unions, students, sexuality, race, climate, capital itself — the structure does not. A problem is manufactured. A crisis is amplified. The cure is always the same: more power, further up the chain, further from you.",
    "The perfection of the communist ideal was never designed around the well-being of others. It is, and always was, a blueprint for godlike authority.",
  ],
  timeline: [
    {
      year: "1848", title: "The Communist Manifesto", place: "London", key: true,
      body: "Marx and Engels publish the founding pamphlet of modern communism on the eve of the 1848 revolutions. The blueprint: abolish private property, family, nation, religion — everything a free person could stand on without asking permission.",
      links: [
        { label: "Marxists.org — full text", url: "https://www.marxists.org/archive/marx/works/1848/communist-manifesto/" },
        { label: "Wikipedia — publication history", url: "https://en.wikipedia.org/wiki/The_Communist_Manifesto" },
      ],
    },
    {
      year: "1917", title: "Bolshevik Revolution", place: "Petrograd", key: true,
      body: "The first laboratory. A single faction out-competes, out-lies and out-murders every rival until the Party is the State. The blood-soaked template every later revolution will copy and every Western progressive will quietly excuse.",
      links: [{ label: "Britannica — October Revolution", url: "https://www.britannica.com/event/October-Revolution" }],
    },
    {
      year: "1923", title: "The Frankfurt School is founded", place: "Frankfurt am Main", key: false,
      body: "The Institute for Social Research opens as the first Marxist research centre attached to a major German university. Its mission is not factory agitation but cultural analysis — preparing the intellectual weaponry that would later be aimed at the American middle class.",
      links: [
        { label: "Britannica — Frankfurt School", url: "https://www.britannica.com/topic/Frankfurt-School" },
        { label: "Jacobin — a century of the Frankfurt School", url: "https://jacobin.com/2023/10/frankfurt-school-domination-modern-social-research-capitalism-critical-theory" },
      ],
    },
    {
      year: "1929-1935", title: "Gramsci writes the Prison Notebooks", place: "Turi Prison, Italy", key: true,
      body: "Gramsci, imprisoned by Mussolini, diagnoses why the revolution failed: the workers didn't want it. Solution — abandon the factory, capture the culture. Schools, churches, media, law, entertainment. Win the \"war of position\" inside the institutions and the revolution arrives without a shot fired.",
      links: [
        { label: "Britannica — Prison Notebooks", url: "https://www.britannica.com/topic/Prison-Notebooks" },
        { label: "Britannica — cultural hegemony", url: "https://www.britannica.com/topic/hegemony" },
      ],
    },
    {
      year: "1964", title: "Marcuse publishes One-Dimensional Man", place: "USA", key: false,
      body: "The Frankfurt School's most readable prophet tells the Western student that consumer comfort is the new chain, and that liberation requires tearing out the floor. The bible of the emerging New Left. The \"repressive tolerance\" permission slip that would justify every later purge.",
      links: [
        { label: "Britannica — Herbert Marcuse", url: "https://www.britannica.com/biography/Herbert-Marcuse" },
        { label: "Wikipedia — One-Dimensional Man", url: "https://en.wikipedia.org/wiki/One-Dimensional_Man" },
      ],
    },
    {
      year: "1967", title: "\"The long march through the institutions\"", place: "West Germany", key: true,
      body: "Student activist Rudi Dutschke coins the phrase that names the strategy. Don't storm the state — become it. Universities, civil service, broadcasters, courts. A generation of radicals puts on a suit and collects a pension while rewriting the rules from inside.",
      links: [{ label: "Wikipedia — long march through the institutions", url: "https://en.wikipedia.org/wiki/Long_march_through_the_institutions" }],
    },
    {
      year: "1969", title: "Stonewall — the sexual vanguard opens", place: "Greenwich Village, New York", key: false,
      body: "A legitimate civil-rights flashpoint. Over the following decades it will be annexed by the wider project: a movable, ever-escalating frontier used to mark out enemies, shame dissent, and rebrand any stable institution — family, church, biology itself — as bigotry.",
      links: [
        { label: "Britannica — Stonewall riots", url: "https://www.britannica.com/event/Stonewall-riots" },
        { label: "Library of Congress — 1969 primary sources", url: "https://guides.loc.gov/lgbtq-studies/stonewall-era" },
      ],
    },
    {
      year: "1989", title: "Crenshaw coins \"intersectionality\"", place: "University of Chicago", key: true,
      body: "Originally a narrow legal argument; weaponised within a decade into a ranking system of oppressions. Its practical function: a forever-expanding grievance matrix that guarantees the revolution can never run out of victims — or villains.",
      links: [
        { label: "Crenshaw — original 1989 paper (PDF)", url: "https://chicagounbound.uchicago.edu/cgi/viewcontent.cgi?article=1052&context=uclf" },
        { label: "Harvard — publication record", url: "https://inclusionandbelongingtaskforce.harvard.edu/publications/demarginalizing-intersection-race-and-sex-black-feminist-critique" },
      ],
    },
    {
      year: "1989", title: "The Berlin Wall falls", place: "Berlin", key: false,
      body: "State communism loses the economic argument in public. By every Hegelian metric this was sublation — the system was disproved. The doctrine does not care. The project simply moves home: out of Moscow, into the faculty lounge, the HR department, the ratings board.",
      links: [
        { label: "BBC — how 1989 reshaped the world", url: "https://www.bbc.com/news/world-europe-50013048" },
        { label: "Wikipedia — Fall of the Berlin Wall", url: "https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall" },
      ],
    },
    {
      year: "1990", title: "Judith Butler — Gender Trouble", place: "USA", key: false,
      body: "Sex itself is declared a performance. The biological anchor of half of humanity's self-understanding is redefined as oppression. Thirty years later the consequences arrive in children's hospitals, women's prisons and girls' changing rooms.",
      links: [{ label: "The Nation — re-reading Gender Trouble", url: "https://www.thenation.com/article/society/judith-butler-gender-trans-1990s/" }],
    },
    {
      year: "2011", title: "Occupy Wall Street", place: "Zuccotti Park, NYC", key: false,
      body: "Called into being by Canadian ad-men at Adbusters. Meant to channel post-2008 rage at the banks into a permanent left-populist movement. Its energy, personnel and vocabulary (\"the 1%\", \"systems\") would be inherited wholesale by the next decade's campus and corporate activism.",
      links: [
        { label: "The New Yorker — Pre-Occupied", url: "https://www.newyorker.com/magazine/2011/11/28/pre-occupied" },
        { label: "NPR — Adbuster origins", url: "https://www.npr.org/2011/10/20/141526467/exploring-occupy-wall-streets-adbuster-origins" },
      ],
    },
    {
      year: "2018", title: "BlackRock declares \"purpose\"", place: "New York", key: true,
      body: "Larry Fink's annual letter tells every CEO on Earth that their company must \"make a positive contribution to society.\" Translation: the largest asset manager in history will now grade you on political alignment. Private capital is drafted into the long march.",
      links: [{ label: "IMD — analysis of the 2018 letter", url: "https://www.imd.org/research-knowledge/sustainability/articles/the-blackrock-letter-a-turning-point-for-real-change/" }],
    },
    {
      year: "2020", title: "Corporate capture goes total", place: "Global", key: true,
      body: "After the summer of riots, every major Western brand publishes identical statements within a week. BlackRock follows up by announcing sustainability as the organising principle of all its portfolios. The old left wrote pamphlets — the new left writes HR policy backed by trillions in index funds.",
      links: [{ label: "BlackRock — 2020 CEO letter", url: "https://www.blackrock.com/corporate/investor-relations/2020-larry-fink-ceo-letter" }],
    },
    {
      year: "2020s", title: "Mass migration as demographic reset", place: "UK · EU · North America", key: false,
      body: "Borders are not failing — they're performing. The native population is re-framed as historical villain, replaced with a client class, and any objection is priced out of polite speech. The \"problem\" of labour shortage justifies the \"solution\" of permanent dependency on the managerial state.",
      links: [],
    },
    {
      year: "Now", title: "The false choice", place: "Everywhere", key: true,
      body: "You are offered two doors. Behind one, a stagnant managerial imperium that already owns your bank, your job and your children's curriculum. Behind the other, accelerated dissolution sold as liberation. Both doors are held by the same hand. The blueprint was never a better world — it was a single authority nobody is permitted to question.",
      links: [],
    },
  ],
  tactics: [
    { name: "Feminism (late-stage)", use: "Detaches women from family, faith and biology; reframes motherhood as oppression and the state as liberator. A solved first-wave project kept on life support as a recruitment funnel." },
    { name: "Intersectionality", use: "A ranking matrix of grievances. Keeps the revolution supplied with victims, villains and infighting in perpetuity; makes coherent opposition almost definitionally bigoted." },
    { name: "LGBTQ+ as vanguard", use: "Legitimate rights become a ratchet. Each victory is immediately redefined as an inadequate starting line. The moving frontier brands any defender of the previous norm as an extremist." },
    { name: "Mass migration", use: "Economic argument up front (GDP, labour, kebabs). Political function underneath: dilute cohesion, import client voters, flood housing and services, then sell the overload as a reason for more state." },
    { name: "Entertainment capture", use: "Demoralise via the thing people loved. Rewrite their childhood heroes as bigots, their fiction as harmful, their humour as violence. A population that can't share a story can't share a cause." },
    { name: "ESG & private capital", use: "When the ballot box resists, the boardroom doesn't. Index-fund giants grade companies on political compliance; pensions quietly fund the agenda the electorate rejected." },
    { name: "Academia & NGOs", use: "Credential the ideology, then require the credential. The same people write the policy, train the regulators, run the charities and grade the dissenters." },
    { name: "Legacy & social media", use: "Set the menu of acceptable thought. Escalate fringe positions into settled science. Demonetise, de-amplify, de-person the rest." },
  ],
  engine: [
    { step: "Action", title: "Manufacture the crisis", body: "Identify (or inflate) a genuine discontent: inequality, injustice, an outrage on camera. Amplify it into an existential moral emergency. The anger must be louder than the analysis." },
    { step: "Problem", title: "Name the villain", body: "The cause is always the existing order — the family, the church, the flag, the boss, the native, the white, the male, the West. Nothing you love is innocent. Any defence of it is proof of guilt." },
    { step: "Solution", title: "Surrender power upward", body: "More regulation. More funding. More oversight. More centralisation. More experts. The cure is always the same shape: your life gets smaller, theirs gets bigger. And when the cure fails, it wasn't real — and a bigger dose is prescribed." },
  ],
  closing: [
    "The progressive theory of history is a perpetual-motion machine for power. It cannot be falsified — every failure is redefined as \"not yet real\" — and it cannot be satisfied, because satisfaction would end the march.",
    "The way out is not another utopia. It is the refusal to trade a functioning, imperfect society for a perfect one that has never existed and has only ever produced graves.",
  ],
};

const D = LONG_MARCH_DATA;

export default function LongMarchPage() {
  // Inject Google Fonts link only when this page mounts (keeps the rest of
  // the site unaffected and avoids @import-order CSS warnings).
  useEffect(() => {
    const id = "lm-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Scroll-reveal for timeline cards
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lm-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "-60px 0px", threshold: 0.12 },
    );
    document.querySelectorAll(".lm-event").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Split title so last word is red
  const parts = D.meta.title.trim().split(/\s+/);
  const titleMain = parts.length > 1 ? parts.slice(0, -1).join(" ") : D.meta.title;
  const titleAccent = parts.length > 1 ? parts[parts.length - 1] : "";

  return (
    <PageStatusGate slug="long-march" name="The Long March">
      <style>{CSS}</style>
      <div className="lm-wrap">
        <div className="lm-dossier">
          <span className="lm-tag">{D.meta.dossierCode}</span>
          <span className="lm-stamp">{D.meta.eyesOnly}</span>
          <span>{D.meta.fileTag}</span>
        </div>

        <header className="lm-hero">
          <div className="lm-eyebrow">A DinoBane Intel Timeline</div>
          <h1>
            {titleMain}
            {titleAccent && <> <span className="lm-amp">{titleAccent}</span></>}
          </h1>
          <p className="lm-sub">{D.meta.subtitle}</p>
          <div className="lm-byline">{D.meta.byline}</div>
          <div className="lm-rule" />
        </header>

        <section className="lm-thesis">
          {D.thesis.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <SectionHead kicker="Section I · Chronology" title="The Drift Leftward" />
        <section className="lm-timeline">
          {D.timeline.map((e, i) => (
            <article className={`lm-event${e.key ? " lm-key" : ""}`} key={i}>
              <span className="lm-node" aria-hidden />
              <div className="lm-card">
                {e.key && <span className="lm-key-tag">Key Event</span>}
                <span className="lm-year">{e.year}</span>
                {e.place && <div className="lm-place">{e.place}</div>}
                <h3>{e.title}</h3>
                <p>{e.body}</p>
                {e.links.length > 0 && (
                  <div className="lm-links">
                    {e.links.map((l, j) => (
                      <a key={j} href={l.url} target="_blank" rel="noopener noreferrer">
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <SectionHead kicker="Section II · Tactics Matrix" title="Angels' Faces" />
        <section className="lm-tactics">
          {D.tactics.map((t, i) => (
            <div className="lm-tactic" key={i}>
              <div className="lm-num">TACTIC · {String(i + 1).padStart(2, "0")}</div>
              <h4>{t.name}</h4>
              <p>{t.use}</p>
            </div>
          ))}
        </section>

        <SectionHead kicker="Section III · The Machiavellian Engine" title="Action · Problem · Solution" />
        <section className="lm-engine">
          {D.engine.map((s, i) => (
            <div className="lm-step" key={i}>
              <div className="lm-step-num">{s.step}</div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </div>
          ))}
        </section>

        <SectionHead kicker="Section IV · In Closing" title="The Blueprint" />
        <section className="lm-closing">
          {D.closing.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <footer className="lm-footer">
          <span>DinoBane Intel · <span className="lm-mark">//</span> Long March Dossier</span>
          <span>v1.0</span>
          <span><span className="lm-mark">//</span> dinobane.com</span>
        </footer>
      </div>
    </PageStatusGate>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="lm-section-head">
      <div className="lm-kicker">{kicker}</div>
      <h2>{title}</h2>
      <div className="lm-under" />
    </div>
  );
}

/* =========================================================
   SCOPED STYLES — prefixed "lm-" so they don't touch the
   rest of the app's Tailwind styling.
   ========================================================= */
const CSS = `
.lm-wrap{
  --lm-bg:#0a0a0a; --lm-ink:#e9e3d7; --lm-dim:#a49a8a; --lm-mute:#6f6558;
  --lm-red:#cc2a2a; --lm-red-deep:#8a1616; --lm-red-glow:rgba(204,42,42,.35);
  --lm-gold:#d4a24a; --lm-gold-soft:#b8893b;
  --lm-line:#2a2420;
  --lm-serif:"Cormorant Garamond", Georgia, serif;
  --lm-mono:"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  max-width:1100px; margin:0 auto; padding:0 28px;
  color:var(--lm-ink); font-weight:300; font-size:17px; line-height:1.65;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(204,42,42,.10), transparent 70%),
    radial-gradient(900px 500px at 50% 110%, rgba(212,162,74,.05), transparent 70%),
    var(--lm-bg);
  position:relative;
}
.lm-wrap *{box-sizing:border-box}

.lm-dossier{
  border-bottom:1px solid var(--lm-line);
  padding:18px 0 14px;
  font-family:var(--lm-mono); font-size:12px; letter-spacing:.22em;
  text-transform:uppercase; color:var(--lm-dim);
  display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.lm-tag{color:var(--lm-red); letter-spacing:.28em}
.lm-stamp{
  color:var(--lm-gold); border:1px solid var(--lm-gold-soft);
  padding:4px 10px; transform:rotate(-1.2deg);
  background:rgba(212,162,74,.04);
}

.lm-hero{padding:72px 0 48px; text-align:center}
.lm-eyebrow{
  font-family:var(--lm-mono); text-transform:uppercase; letter-spacing:.4em;
  font-size:11px; color:var(--lm-red); margin-bottom:18px;
}
.lm-hero h1{
  font-family:var(--lm-serif); font-weight:700; font-style:italic;
  font-size:clamp(54px, 9vw, 108px); line-height:.95; margin:0 0 12px;
  color:var(--lm-ink); text-shadow:0 0 40px rgba(204,42,42,.15);
}
.lm-amp{color:var(--lm-red); font-style:normal}
.lm-sub{
  font-family:var(--lm-serif); font-style:italic;
  font-size:clamp(18px, 2.2vw, 24px); color:var(--lm-dim);
  max-width:680px; margin:0 auto 22px;
}
.lm-byline{
  font-family:var(--lm-mono); font-size:11px; letter-spacing:.3em;
  text-transform:uppercase; color:var(--lm-mute);
}
.lm-rule{width:80px; height:2px; background:var(--lm-red); margin:30px auto 0; box-shadow:0 0 24px var(--lm-red-glow)}

.lm-thesis{
  max-width:780px; margin:24px auto 60px;
  padding:36px 40px; border:1px solid var(--lm-line);
  background:linear-gradient(180deg, rgba(255,255,255,.015), transparent 60%);
  position:relative;
}
.lm-thesis::before, .lm-thesis::after{
  content:""; position:absolute; width:22px; height:22px;
  border:1px solid var(--lm-red); opacity:.8;
}
.lm-thesis::before{top:-1px; left:-1px; border-right:none; border-bottom:none}
.lm-thesis::after{bottom:-1px; right:-1px; border-left:none; border-top:none}
.lm-thesis p{font-family:var(--lm-serif); font-size:20px; line-height:1.55; color:var(--lm-ink); margin:0 0 16px}
.lm-thesis p:last-child{margin-bottom:0; color:var(--lm-dim); font-style:italic}

.lm-section-head{text-align:center; margin:80px 0 36px}
.lm-kicker{font-family:var(--lm-mono); font-size:11px; letter-spacing:.4em; text-transform:uppercase; color:var(--lm-red); margin-bottom:10px}
.lm-section-head h2{font-family:var(--lm-serif); font-style:italic; font-weight:600; font-size:clamp(36px, 5vw, 58px); color:var(--lm-ink); margin:0; line-height:1}
.lm-under{width:50px; height:1px; background:var(--lm-mute); margin:18px auto 0}

.lm-timeline{position:relative; padding:20px 0 40px}
.lm-timeline::before{
  content:""; position:absolute; left:50%; top:0; bottom:0;
  width:1px; background:linear-gradient(180deg, transparent, var(--lm-line) 8%, var(--lm-line) 92%, transparent);
  transform:translateX(-.5px);
}
.lm-timeline::after{
  content:""; position:absolute; left:50%; top:0; width:3px; height:40px;
  transform:translateX(-1.5px);
  background:linear-gradient(180deg, transparent, var(--lm-red), transparent);
  opacity:.55; animation:lm-scan 9s linear infinite;
  box-shadow:0 0 14px var(--lm-red-glow); pointer-events:none;
}
@keyframes lm-scan{0%{top:-8%} 100%{top:108%}}

.lm-event{
  position:relative; width:50%; padding:18px 44px;
  opacity:0; transform:translateY(18px);
  transition:opacity .7s ease, transform .7s ease;
}
.lm-event.lm-in{opacity:1; transform:none}
.lm-event:nth-child(odd){left:0; text-align:right}
.lm-event:nth-child(even){left:50%}
.lm-node{position:absolute; top:34px; width:14px; height:14px; background:var(--lm-bg); border:1.5px solid var(--lm-mute); border-radius:50%}
.lm-event:nth-child(odd) .lm-node{right:-7px}
.lm-event:nth-child(even) .lm-node{left:-7px}
.lm-event.lm-key .lm-node{
  border-color:var(--lm-gold); background:var(--lm-gold);
  box-shadow:0 0 0 4px rgba(212,162,74,.12), 0 0 18px rgba(212,162,74,.55);
}
.lm-event.lm-key .lm-card{
  border-color:rgba(212,162,74,.35);
  box-shadow:0 0 0 1px rgba(212,162,74,.05) inset, 0 0 40px rgba(204,42,42,.06);
}
.lm-event.lm-key .lm-year{color:var(--lm-gold)}
.lm-event.lm-key .lm-key-tag{
  display:inline-block; font-family:var(--lm-mono); font-size:10px;
  letter-spacing:.3em; text-transform:uppercase; color:var(--lm-gold);
  border:1px solid var(--lm-gold-soft); padding:2px 8px; margin-bottom:10px;
}
.lm-card{
  background:linear-gradient(180deg, rgba(255,255,255,.018), rgba(0,0,0,.25));
  border:1px solid var(--lm-line); padding:22px 24px; position:relative;
  transition:transform .3s ease, border-color .3s ease, box-shadow .3s ease;
}
.lm-card:hover{transform:translateY(-2px); border-color:var(--lm-red-deep); box-shadow:0 10px 40px rgba(204,42,42,.12)}
.lm-year{font-family:var(--lm-serif); font-style:italic; font-weight:700; font-size:28px; color:var(--lm-red); line-height:1; display:block; margin-bottom:4px}
.lm-place{font-family:var(--lm-mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase; color:var(--lm-mute); margin-bottom:10px}
.lm-card h3{font-family:var(--lm-serif); font-weight:600; font-size:26px; line-height:1.15; margin:0 0 12px; color:var(--lm-ink)}
.lm-card p{margin:0 0 14px; color:var(--lm-ink); font-size:16px}
.lm-links{display:flex; gap:8px; flex-wrap:wrap; margin-top:8px}
.lm-event:nth-child(odd) .lm-links{justify-content:flex-end}
.lm-links a{
  font-family:var(--lm-mono); font-size:10.5px; letter-spacing:.18em;
  text-transform:uppercase; color:var(--lm-dim); border:1px solid var(--lm-line);
  padding:6px 10px; text-decoration:none; transition:all .25s ease;
  display:inline-flex; align-items:center; gap:6px;
}
.lm-links a::before{content:"▸"; color:var(--lm-red); font-size:9px}
.lm-links a:hover{color:var(--lm-ink); border-color:var(--lm-red); background:rgba(204,42,42,.08)}

.lm-tactics{
  display:grid; grid-template-columns:repeat(auto-fit, minmax(270px, 1fr));
  gap:1px; background:var(--lm-line); border:1px solid var(--lm-line); margin:10px 0 40px;
}
.lm-tactic{background:var(--lm-bg); padding:26px 24px; transition:background .3s ease}
.lm-tactic:hover{background:#0f0c0c}
.lm-num{font-family:var(--lm-mono); font-size:10px; letter-spacing:.28em; color:var(--lm-red); margin-bottom:10px}
.lm-tactic h4{font-family:var(--lm-serif); font-weight:600; font-size:22px; margin:0 0 10px; color:var(--lm-ink); line-height:1.2}
.lm-tactic p{margin:0; color:var(--lm-dim); font-size:15px; line-height:1.6}

.lm-engine{display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin:10px 0 40px; position:relative}
.lm-engine::before{
  content:""; position:absolute; top:50%; left:8%; right:8%; height:1px;
  background:linear-gradient(90deg, transparent, var(--lm-red-deep), transparent); z-index:0;
}
.lm-step{
  background:linear-gradient(180deg, rgba(204,42,42,.04), transparent 60%);
  border:1px solid var(--lm-line); padding:28px 24px; position:relative; z-index:1; text-align:center;
}
.lm-step-num{
  font-family:var(--lm-mono); font-size:10px; letter-spacing:.35em; text-transform:uppercase;
  color:var(--lm-red); border:1px solid var(--lm-red-deep); padding:4px 12px;
  display:inline-block; margin-bottom:16px; background:var(--lm-bg);
}
.lm-step h4{font-family:var(--lm-serif); font-style:italic; font-weight:600; font-size:28px; margin:0 0 12px; color:var(--lm-ink)}
.lm-step p{margin:0; color:var(--lm-dim); font-size:15px; line-height:1.6}

.lm-closing{max-width:780px; margin:30px auto 20px; text-align:center; padding:30px 20px}
.lm-closing p{font-family:var(--lm-serif); font-style:italic; font-size:22px; line-height:1.55; color:var(--lm-ink); margin:0 0 16px}
.lm-closing p:last-child{color:var(--lm-red)}

.lm-footer{
  margin-top:60px; border-top:1px solid var(--lm-line); padding:28px 0 50px;
  font-family:var(--lm-mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase;
  color:var(--lm-mute); display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.lm-mark{color:var(--lm-red)}

@media (max-width: 780px){
  .lm-wrap{font-size:16px}
  .lm-timeline::before{left:18px}
  .lm-timeline::after{left:18px}
  .lm-event{width:100%; left:0 !important; padding:14px 0 14px 42px; text-align:left !important}
  .lm-event .lm-node{left:11px !important; right:auto !important}
  .lm-event:nth-child(odd) .lm-links{justify-content:flex-start}
  .lm-engine{grid-template-columns:1fr; gap:14px}
  .lm-engine::before{display:none}
  .lm-thesis{padding:28px 22px}
  .lm-thesis p{font-size:17px}
}
`;

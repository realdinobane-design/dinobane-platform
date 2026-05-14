import { useQuery } from "@tanstack/react-query";
import { PageStatusGate } from "@/components/page-status-gate";
import { TimelineRenderer, type TimelineData } from "@/components/timeline-renderer";
import { getPageContent } from "@/lib/page-status";
import { MembersOnlyBanner } from "@/components/members-only-banner";
import { TimelineReactions } from "@/components/timeline-reactions";

/* =========================================================
   LONG MARCH — EDITABLE TIMELINE DATA (v2)
   ---------------------------------------------------------
   Every event below is a real, fact-checked moment. Twelve
   entries, grouped into four Acts. Each event carries:
     - body     (≈2 sentences for the card surface)
     - detail   (long-form dossier prose, behind a toggle)
     - pullQuote (optional verbatim primary source)
     - act      (which chapter it belongs to)

   When you change anything here, bump `contentVersion`. The
   server boot migration uses it to decide whether the saved
   DB override is stale and the page should serve defaults.
   ========================================================= */

export const LONG_MARCH_CONTENT_VERSION = 2;

export const LONG_MARCH_DATA: TimelineData = {
  contentVersion: LONG_MARCH_CONTENT_VERSION,
  meta: {
    dossierCode: "DOSSIER // DB-LM-001",
    eyesOnly: "EYES ONLY — ADMIN",
    fileTag: "FILE: LONG-MARCH / v2.0",
    title: "The Long March",
    subtitle: "A timeline of the utopian subversion of the West",
    byline: "Filed by DinoBane Intel · dinobane.com",
  },
  thesis: [
    "History, we were told, is an inevitable drift leftwards — an eternal climb toward utopia. Every failure is a rung. Every atrocity, a price. Every collapse, a lesson the faithful refuse to learn.",
    "This dossier tracks the ideological engine from a Prussian study to the boardroom of BlackRock. The tactic changes — unions, students, sexuality, race, climate, capital itself — the structure does not. A problem is manufactured. A crisis is amplified. The cure is always the same: more power, further up the chain, further from you.",
    "The perfection of the communist ideal was never designed around the well-being of others. It is, and always was, a blueprint for godlike authority.",
  ],
  acts: [
    {
      id: "theory",
      label: "Act I",
      kicker: "Act I · Theory",
      title: "The Blueprint Is Drawn",
      years: "1848 — 1923",
      lede: "Three documents, drafted across seventy-five years, give the project its language, its precedent and its first respectable address. The march does not yet exist. The map does.",
    },
    {
      id: "strategy",
      label: "Act II",
      kicker: "Act II · Strategy",
      title: "The March Names Itself",
      years: "1929 — 1967",
      lede: "Prison, exile and the lecture hall produce the actual operating manual. Stop trying to storm the gate. Apply for a job inside it. Get the credential. Become the rule.",
    },
    {
      id: "cultural-capture",
      label: "Act III",
      kicker: "Act III · Cultural Capture",
      title: "The Institutions Change Hands",
      years: "1969 — 1990",
      lede: "Sexuality, race and the body itself are reclassified as theatres of struggle. State communism loses the economic argument in public — and the project moves house, out of Moscow, into the seminar room.",
    },
    {
      id: "total-capture",
      label: "Act IV",
      kicker: "Act IV · Total Capture",
      title: "The Boardroom Pays the Bill",
      years: "2011 — 2018",
      lede: "Once the not-for-profit wing was won, capital was drafted. The largest pool of money on Earth begins grading companies on political alignment. The cage is a beautiful one — it pays a salary.",
    },
  ],
  timeline: [
    /* ─── ACT I · THEORY ─────────────────────────────────── */
    {
      act: "theory", year: "1848", title: "The Communist Manifesto", place: "London", key: true,
      body: "Marx and Engels publish the founding pamphlet of modern communism on the eve of the 1848 revolutions. The blueprint: abolish private property, family, nation, religion — everything a free person could stand on without asking permission.",
      detail: "Kant had already supplied the ghost in the machine — the idea that history was quietly executing a hidden plan of nature toward an inwardly perfect state. Marx supplied the schedule. The manifesto re-frames every attachment a human being has ever found worth dying for — kin, country, creed — as so much residue to be dissolved.\n\nThe tone is the tell. It is not a proposal; it is an announcement. The future has already been decided; the only open question is how much resistance will have to be crushed along the way. Every later instalment of the march treats this pamphlet the same way a medieval cleric treated scripture — not argued with, only interpreted.",
      pullQuote: {
        text: "A spectre is haunting Europe — the spectre of communism.",
        attribution: "Karl Marx & Friedrich Engels, opening of the Manifesto, 1848",
      },
      links: [
        { label: "Marxists.org — full text", url: "https://www.marxists.org/archive/marx/works/1848/communist-manifesto/" },
        { label: "Wikipedia — publication history", url: "https://en.wikipedia.org/wiki/The_Communist_Manifesto" },
      ],
    },
    {
      act: "theory", year: "1917", title: "Bolshevik Revolution", place: "Petrograd", key: true,
      body: "The first laboratory. A single faction out-competes, out-lies and out-murders every rival until the Party is the State. The blood-soaked template every later revolution will copy and every Western progressive will quietly excuse.",
      detail: "The pattern sets here and never really changes. Frantic fermentation. A single faction outspends, out-argues and ultimately out-murders its rivals. A feudal monarchy with extra steps and committees, renamed 'the Party' so the peasants can't tell it is the court.\n\nBy every Hegelian metric this was supposed to be sublation — a system tested and found wanting should give way to its successor. But the doctrine has a cheat code. Any failure is redefined as 'not yet real socialism', the graves are dusted off the history books, and the same prescription is written out again on a fresh pad.",
      links: [
        { label: "Britannica — Russian Revolution", url: "https://www.britannica.com/event/Russian-Revolution" },
        { label: "Britannica — October Revolution", url: "https://www.britannica.com/event/October-Revolution" },
      ],
    },
    {
      act: "theory", year: "1923", title: "The Frankfurt School is founded", place: "Frankfurt am Main", key: false,
      body: "The Institute for Social Research opens as the first Marxist research centre attached to a major German university. Its mission is not factory agitation but cultural analysis — preparing the intellectual weaponry that would later be aimed at the American middle class.",
      detail: "The diagnosis, quietly, is that Marx was wrong about the workers. Given the option of a detached house, a decent wage and a football match on a Saturday, the proletariat politely declined to storm anything. The Institute's unspoken job is to find out why — and what has to be dismantled so the revolution can be rebooted.\n\nIt is the beginning of a long re-aiming. The target is no longer the factory floor; it is taste, sexuality, family, the very idea that a settled life might be a good one. Adorno, Horkheimer, Marcuse and their heirs will spend the rest of the century preparing the intellectual weaponry for a war most of the people being fought over will never know is underway.",
      links: [
        { label: "Britannica — Institute for Social Research", url: "https://www.britannica.com/topic/Institute-for-Social-Research" },
        { label: "Jacobin — a century of the Frankfurt School", url: "https://jacobin.com/2023/10/frankfurt-school-domination-modern-social-research-capitalism-critical-theory" },
      ],
    },
    /* ─── ACT II · STRATEGY ──────────────────────────────── */
    {
      act: "strategy", year: "1929–1935", title: "Gramsci writes the Prison Notebooks", place: "Turi Prison, Italy", key: true,
      body: "Gramsci, imprisoned by Mussolini, diagnoses why the revolution failed: the workers didn't want it. Solution — abandon the factory, capture the culture. Schools, churches, media, law, entertainment. Win the \"war of position\" inside the institutions and the revolution arrives without a shot fired.",
      detail: "Gramsci's insight, written in the margins of a fascist prison ledger, is the most quietly consequential of the twentieth century. The populace was not a revolutionary base because it could not even imagine the revolution — it had been raised inside capitalism, treated reasonably well, and was therefore unwilling to gamble its Saturday afternoon on a vague promise of something better.\n\nHis answer is the long war of position. Don't storm the palace; apply for a job inside it. Credential the ideology, then require the credential. Train the teachers, then the teachers' teachers. The uprising arrives on a Tuesday, quietly, via a new staff handbook. Everything that follows in this dossier is one long execution of that memo.",
      pullQuote: {
        text: "The old world is dying, and the new world struggles to be born: now is the time of monsters.",
        attribution: "Antonio Gramsci, Prison Notebooks (paraphrased from Notebook 3, §34)",
      },
      links: [
        { label: "Wikipedia — Prison Notebooks", url: "https://en.wikipedia.org/wiki/Prison_Notebooks" },
        { label: "Britannica — cultural hegemony", url: "https://www.britannica.com/topic/hegemony" },
      ],
    },
    {
      act: "strategy", year: "1964", title: "Marcuse publishes One-Dimensional Man", place: "USA", key: false,
      body: "The Frankfurt School's most readable prophet tells the Western student that consumer comfort is the new chain, and that liberation requires tearing out the floor. The bible of the emerging New Left. The \"repressive tolerance\" permission slip that would justify every later purge.",
      detail: "Marcuse's trick is to redescribe plenty as prison. The washing machine, the family car, the weekend at the coast — all of it is repositioned as narcotic, a system of apparent comfort preventing the populace from noticing their own oppression. Gramsci's diagnosis, rewritten for the American campus with better paper stock.\n\nThe real bequest is 'repressive tolerance' — the permission slip which will justify every later purge. Tolerance for the right ideas; repression for the wrong ones. Once the student radicals stop being students and start being deans, they will remember exactly which column they were told they were in.",
      links: [
        { label: "Marcuse.org — full text & notes", url: "https://www.marcuse.org/herbert/publications/1960s/1965-one-dimensional-man.html" },
        { label: "Wikipedia — One-Dimensional Man", url: "https://en.wikipedia.org/wiki/One-Dimensional_Man" },
      ],
    },
    {
      act: "strategy", year: "1967", title: "\"The long march through the institutions\"", place: "West Germany", key: true,
      body: "Student activist Rudi Dutschke coins the phrase that names the strategy. Don't storm the state — become it. Universities, civil service, broadcasters, courts. A generation of radicals puts on a suit and collects a pension while rewriting the rules from inside.",
      detail: "Dutschke simply names what Gramsci had designed. The strategy is not to overthrow the state — it is to become the civil service that runs it. It is slow. It is boring. It involves committee work, union meetings, tenure applications, HR reviews. It is also, for those reasons, nearly invisible to the people it is being done to.\n\nA generation later the radicals have the pensions. They write the policy, the training materials, the editorial guidelines, the courts' working definitions. The revolution did not fail to arrive; it simply arrived in a lanyard rather than a balaclava, and nobody thought to call it one.",
      pullQuote: {
        text: "The long march through the institutions.",
        attribution: "Rudi Dutschke, West German student movement, 1967",
      },
      links: [
        { label: "Wiktionary — phrase origin", url: "https://en.wiktionary.org/wiki/long_march_through_the_institutions" },
        { label: "Wikipedia — long march through the institutions", url: "https://en.wikipedia.org/wiki/Long_march_through_the_institutions" },
      ],
    },
    /* ─── ACT III · CULTURAL CAPTURE ─────────────────────── */
    {
      act: "cultural-capture", year: "1969", title: "Stonewall — the sexual vanguard opens", place: "Greenwich Village, New York", key: false,
      body: "A legitimate civil-rights flashpoint. Over the following decades it will be annexed by the wider project: a movable, ever-escalating frontier used to mark out enemies, shame dissent, and rebrand any stable institution — family, church, biology itself — as bigotry.",
      detail: "The original grievance is real and the reform is decent — that is precisely what makes the frontier so useful afterwards. Each concession is immediately redefined as an inadequate starting line. Each victory is the pretext for the next demand. The goalposts are not moving by accident; motion is the point.\n\nBy the time the ratchet reaches drag queen story hour, puberty blockers for twelve-year-olds and the polite institutional question 'what is a woman?', the logic is unmistakable. Utopia must always, by definition, be somewhere in the future — so any present arrangement, however decent, must be torn down on the assumption that something better is waiting underneath.",
      links: [
        { label: "Britannica — Stonewall riots", url: "https://www.britannica.com/event/Stonewall-riots" },
        { label: "Library of Congress — 1969 primary sources", url: "https://guides.loc.gov/lgbtq-studies/stonewall-era" },
      ],
    },
    {
      act: "cultural-capture", year: "1989", title: "Crenshaw coins \"intersectionality\"", place: "UCLA School of Law", key: true,
      body: "Originally a narrow legal argument about Black women's standing in discrimination law. Within a decade it is weaponised into a ranking system of oppressions — a forever-expanding grievance matrix that guarantees the revolution can never run out of victims, or villains.",
      detail: "Crenshaw's 1989 paper, written while she was teaching at UCLA Law, is technical and modest. It points out that a Black woman fired from a job could lose a 'race' suit (because Black men were retained) and lose a 'sex' suit (because white women were retained) — and so vanish from the courts entirely. The original argument is sound.\n\nWithin a decade the framework has metastasised into a full ranking system of human worth by inherited category — and, crucially, a generator of infinite subdivisions. Every new axis produces fresh victims, fresh villains and fresh in-fighting, all of which the march feeds on. This is the doctrine's masterpiece of self-preservation. A coherent opposition becomes almost definitionally bigoted; any critic is re-diagnosed as a member of whichever column happens to need condemning that week. The revolution cannot run out of fuel because the fuel is manufactured inside the engine.",
      pullQuote: {
        text: "Because the intersectional experience is greater than the sum of racism and sexism, any analysis that does not take intersectionality into account cannot sufficiently address the particular manner in which Black women are subordinated.",
        attribution: "Kimberlé Crenshaw, \"Demarginalizing the Intersection of Race and Sex\", 1989",
      },
      links: [
        { label: "Crenshaw — original 1989 paper (PDF)", url: "https://chicagounbound.uchicago.edu/cgi/viewcontent.cgi?article=1052&context=uclf" },
        { label: "UCLA Law — Crenshaw on 30 years of intersectionality", url: "https://law.ucla.edu/news/intersectionality-30-qa-kimberle-crenshaw" },
      ],
    },
    {
      act: "cultural-capture", year: "1989", title: "The Berlin Wall falls", place: "Berlin", key: false,
      body: "State communism loses the economic argument in public. By every Hegelian metric this was sublation — the system was disproved. The doctrine does not care. The project simply moves home: out of Moscow, into the faculty lounge, the HR department, the ratings board.",
      detail: "The experiment is over. The results are in. The bloc empties, the queues dissolve, the files are opened. Hegel's own dialectic would, on its own terms, call this a clean refutation and move on. Modern utopianism has a fascinating answer instead: that wasn't real socialism. That was only a rehearsal. Ignore it.\n\nAnd so the project does not die; it simply relocates. Out of the Politburo, into the seminar. Out of the five-year plan, into the HR memo. The people who had excused the gulags spend the next decade writing the new workplace training materials, and by 2010 nobody thinks the change of address is worth remarking on.",
      links: [
        { label: "Wikipedia — Fall of the Berlin Wall", url: "https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall" },
        { label: "BBC — how 1989 reshaped the world", url: "https://www.bbc.com/news/world-europe-50013048" },
      ],
    },
    {
      act: "cultural-capture", year: "1990", title: "Judith Butler — Gender Trouble", place: "USA", key: false,
      body: "Sex itself is declared a performance. The biological anchor of half of humanity's self-understanding is redefined as oppression. Thirty years later the consequences arrive in children's hospitals, women's prisons and girls' changing rooms.",
      detail: "Butler completes the project that began when Marx declared the family a bourgeois institution. If the family must go, the sexes that compose it must go. If the sexes must go, biology itself must be reclassified as a social construction — a story told by power rather than a fact observed by science.\n\nThe price of the theory is paid, as ever, elsewhere. Thirty years later it is teenage girls on mastectomy tables, male prisoners in women's wings, and a generation of clinicians who have forgotten how to say 'no'. The seminar paid nothing. The children paid everything.",
      links: [
        { label: "Wikipedia — Gender Trouble", url: "https://en.wikipedia.org/wiki/Gender_Trouble" },
        { label: "The Nation — re-reading Gender Trouble", url: "https://www.thenation.com/article/society/judith-butler-gender-trans-1990s/" },
      ],
    },
    /* ─── ACT IV · TOTAL CAPTURE ─────────────────────────── */
    {
      act: "total-capture", year: "2011", title: "Occupy Wall Street", place: "Zuccotti Park, NYC", key: false,
      body: "Called into being by Canadian ad-men at Adbusters. Meant to channel post-2008 rage at the banks into a permanent left-populist movement. Its energy, personnel and vocabulary (\"the 1%\", \"systems\") would be inherited wholesale by the next decade's campus and corporate activism.",
      detail: "On the surface, Occupy failed. The tents came down, the working groups dissolved, and the specific demands were never clearly articulated in the first place. Underneath, it did exactly what it needed to do. It trained a cohort, road-tested a vocabulary, and handed both to every campus, newsroom and HR department that would matter over the following decade.\n\nThe slogans — 'the 1%', 'systemic', 'lived experience' — will be walking the corridors of banks the movement claimed to oppose within ten years. A protest that appeared to lose against capital instead taught capital its new liturgy.",
      links: [
        { label: "Wikipedia — Occupy Wall Street", url: "https://en.wikipedia.org/wiki/Occupy_Wall_Street" },
        { label: "The New Yorker — Pre-Occupied", url: "https://www.newyorker.com/magazine/2011/11/28/pre-occupied" },
      ],
    },
    {
      act: "total-capture", year: "2018", title: "BlackRock declares \"purpose\"", place: "New York", key: true,
      body: "Larry Fink's annual letter tells every CEO on Earth that their company must \"make a positive contribution to society.\" Translation: the largest asset manager in history will now grade you on political alignment. Private capital is drafted into the long march.",
      detail: "This is the moment the ladder is kicked down. For seventy years the march has worked chiefly through the not-for-profit wing of society — the university, the broadcaster, the charity. Now the largest pool of capital on Earth tells every boardroom that future access to money is contingent on political alignment.\n\nThe effect is instant and everywhere. Compliance stops being a matter of fines and starts being a matter of funding. ESG becomes the new rating agency; the rating agency writes the policy; the policy is indistinguishable from last year's NGO manifesto. When the ballot box resists, the boardroom never does — because the boardroom's shares are held by people who have already signed the pledge.",
      pullQuote: {
        text: "To prosper over time, every company must not only deliver financial performance, but also show how it makes a positive contribution to society.",
        attribution: "Larry Fink, BlackRock annual letter to CEOs, January 2018",
      },
      links: [
        { label: "Harvard Law — 'A Sense of Purpose'", url: "https://corpgov.law.harvard.edu/2018/01/17/a-sense-of-purpose/" },
        { label: "IMD — analysis of the 2018 letter", url: "https://www.imd.org/research-knowledge/sustainability/articles/the-blackrock-letter-a-turning-point-for-real-change/" },
      ],
    },
  ],
  tactics: [
    { axis: "identity",      name: "Feminism (late-stage)", use: "Detaches women from family, faith and biology; reframes motherhood as oppression and the state as liberator. A solved first-wave project kept on life support as a recruitment funnel." },
    { axis: "identity",      name: "Intersectionality", use: "A ranking matrix of grievances. Keeps the revolution supplied with victims, villains and infighting in perpetuity; makes coherent opposition almost definitionally bigoted." },
    { axis: "identity",      name: "LGBTQ+ as vanguard", use: "Legitimate rights become a ratchet. Each victory is immediately redefined as an inadequate starting line. The moving frontier brands any defender of the previous norm as an extremist." },
    { axis: "demographic",   name: "Mass migration", use: "Economic argument up front (GDP, labour, kebabs). Political function underneath: dilute cohesion, import client voters, flood housing and services, then sell the overload as a reason for more state." },
    { axis: "cultural",      name: "Entertainment capture", use: "Demoralise via the thing people loved. Rewrite their childhood heroes as bigots, their fiction as harmful, their humour as violence. A population that can't share a story can't share a cause." },
    { axis: "capital",       name: "ESG & private capital", use: "When the ballot box resists, the boardroom doesn't. Index-fund giants grade companies on political compliance; pensions quietly fund the agenda the electorate rejected." },
    { axis: "institutional", name: "Academia & NGOs", use: "Credential the ideology, then require the credential. The same people write the policy, train the regulators, run the charities and grade the dissenters." },
    { axis: "technological", name: "Legacy & social media", use: "Set the menu of acceptable thought. Escalate fringe positions into settled science. Demonetise, de-amplify, de-person the rest." },
  ],
  engine: [
    { step: "Action", title: "Manufacture the crisis", body: "Identify (or inflate) a genuine discontent: inequality, injustice, an outrage on camera. Amplify it into an existential moral emergency. The anger must be louder than the analysis." },
    { step: "Problem", title: "Name the villain", body: "The cause is always the existing order — the family, the church, the flag, the boss, the native, the white, the male, the West. Nothing you love is innocent. Any defence of it is proof of guilt." },
    { step: "Solution", title: "Surrender power upward", body: "More regulation. More funding. More oversight. More centralisation. More experts. The cure is always the same shape: your life gets smaller, theirs gets bigger. And when the cure fails, it wasn't real — and a bigger dose is prescribed." },
  ],
  closing: [
    "Look at the dates. 1848 to 2018. A hundred and seventy years and the prescription has never once changed: tear down what works, on the promise of something better that never arrives. The corpses pile up. The promise is reissued.",
    "You are offered two doors. Behind one, a stagnant managerial imperium that already owns your bank, your job and your children's curriculum. Behind the other, accelerated dissolution sold as liberation. Both doors are held by the same hand.",
    "The progressive theory of history is a perpetual-motion machine for power. It cannot be falsified — every failure is redefined as \"not yet real\" — and it cannot be satisfied, because satisfaction would end the march.",
    "The way out is not another utopia. It is the quiet, unfashionable refusal to trade a functioning, imperfect society for a perfect one that has never existed and has only ever produced graves.",
  ],
};

/** Kept for backwards compat with the admin editor import. */
export type LongMarchData = TimelineData;

/* =========================================================
   DEEP MERGE — admin override over hardcoded defaults
   ---------------------------------------------------------
   Every top-level field is per-field merged so that shipping
   new default copy (a new sentence in the thesis, a new
   tactic, a new pull-quote on an event) does NOT require a
   re-save from the admin UI. Admin edits always win when
   non-empty; missing/blank fields fall through to defaults.
   ========================================================= */
function nonEmptyArray<T>(a: T[] | undefined | null): a is T[] {
  return Array.isArray(a) && a.length > 0;
}

function nonEmptyString(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function mergeData(override: Partial<TimelineData> | null | undefined): TimelineData {
  if (!override || typeof override !== "object") return LONG_MARCH_DATA;

  // ── Timeline events: match by year+title so admin reorders survive ──
  const defaultEventByKey = new Map(
    LONG_MARCH_DATA.timeline.map((e) => [`${e.year}|${e.title}`, e]),
  );
  const mergedTimeline = nonEmptyArray(override.timeline)
    ? override.timeline.map((e, i) => {
        const def =
          defaultEventByKey.get(`${e.year}|${e.title}`) ??
          LONG_MARCH_DATA.timeline[i];
        if (!def) return e;
        return {
          ...def,
          ...e,
          // Per-field fallback so new fields ship without a re-save.
          act: e.act ?? def.act,
          detail: nonEmptyString(e.detail) ? e.detail : def.detail,
          pullQuote: e.pullQuote ?? def.pullQuote,
          imageUrl: e.imageUrl || def.imageUrl,
          links: nonEmptyArray(e.links) ? e.links : def.links,
        };
      })
    : LONG_MARCH_DATA.timeline;

  // ── Tactics: match by name so axis falls back from defaults ──
  const defaultTacticByName = new Map(
    LONG_MARCH_DATA.tactics.map((t) => [t.name, t]),
  );
  const mergedTactics = nonEmptyArray(override.tactics)
    ? override.tactics.map((t) => {
        const def = defaultTacticByName.get(t.name);
        if (!def) return t;
        return { ...def, ...t, axis: t.axis ?? def.axis };
      })
    : LONG_MARCH_DATA.tactics;

  // ── Engine: match by step so admin can rewrite a body but
  //    keep the default title when blank ──
  const defaultEngineByStep = new Map(
    LONG_MARCH_DATA.engine.map((s) => [s.step, s]),
  );
  const mergedEngine = nonEmptyArray(override.engine)
    ? override.engine.map((s, i) => {
        const def =
          defaultEngineByStep.get(s.step) ?? LONG_MARCH_DATA.engine[i];
        if (!def) return s;
        return {
          ...def,
          ...s,
          title: nonEmptyString(s.title) ? s.title : def.title,
          body: nonEmptyString(s.body) ? s.body : def.body,
        };
      })
    : LONG_MARCH_DATA.engine;

  // ── Thesis / closing: arrays of strings, drop empties and
  //    fall back to defaults if the admin saved an empty array ──
  const mergedThesis = nonEmptyArray(override.thesis)
    ? override.thesis.filter(nonEmptyString)
    : LONG_MARCH_DATA.thesis;
  const finalThesis = nonEmptyArray(mergedThesis) ? mergedThesis : LONG_MARCH_DATA.thesis;

  const mergedClosing = nonEmptyArray(override.closing)
    ? override.closing.filter(nonEmptyString)
    : LONG_MARCH_DATA.closing;
  const finalClosing = nonEmptyArray(mergedClosing) ? mergedClosing : LONG_MARCH_DATA.closing;

  return {
    contentVersion: override.contentVersion ?? LONG_MARCH_DATA.contentVersion,
    meta: { ...LONG_MARCH_DATA.meta, ...(override.meta || {}) },
    thesis: finalThesis,
    acts: nonEmptyArray(override.acts) ? override.acts : LONG_MARCH_DATA.acts,
    timeline: mergedTimeline,
    tactics: mergedTactics,
    engine: mergedEngine,
    closing: finalClosing,
    extraSections: override.extraSections ?? LONG_MARCH_DATA.extraSections,
  };
}

export default function LongMarchPage() {
  const { data: saved } = useQuery({
    queryKey: ["/api/page-content/long-march"],
    queryFn: () => getPageContent<Partial<TimelineData>>("long-march"),
    staleTime: 30_000,
    retry: 1,
  });

  // ?defaults=1 — admin-only escape hatch to preview the raw defaults
  // regardless of whatever the DB currently holds. Useful when iterating
  // on this file before deploying a re-seed.
  const useDefaults =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("defaults") === "1";

  const D = useDefaults ? LONG_MARCH_DATA : mergeData(saved);

  return (
    <>
      <MembersOnlyBanner variant="auto" />
      <PageStatusGate slug="long-march" name="The Long March">
        <TimelineRenderer data={D} />
        <TimelineReactions slug="long-march" />
      </PageStatusGate>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { PageStatusGate } from "@/components/page-status-gate";
import { TimelineRenderer, type TimelineData } from "@/components/timeline-renderer";
import { getPageContent } from "@/lib/page-status";
import { MembersOnlyBanner } from "@/components/members-only-banner";
import { TimelineReactions } from "@/components/timeline-reactions";

/* =========================================================
   LONG MARCH — EDITABLE TIMELINE DATA
   Everything on this page is generated from the object below.
   Change copy here. Flag "key: true" to star an event in gold.
   ========================================================= */
export const LONG_MARCH_DATA: TimelineData = {
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
      detail: "Kant had already supplied the ghost in the machine — the idea that history was quietly executing a hidden plan of nature toward an inwardly perfect state. Marx supplied the schedule. The manifesto re-frames every attachment a human being has ever found worth dying for — kin, country, creed — as so much residue to be dissolved.\n\nThe tone is the tell. It is not a proposal; it is an announcement. The future has already been decided; the only open question is how much resistance will have to be crushed along the way. Every later instalment of the march treats this pamphlet the same way a medieval cleric treated scripture — not argued with, only interpreted.",
      links: [
        { label: "Marxists.org — full text", url: "https://www.marxists.org/archive/marx/works/1848/communist-manifesto/" },
        { label: "Wikipedia — publication history", url: "https://en.wikipedia.org/wiki/The_Communist_Manifesto" },
      ],
    },
    {
      year: "1917", title: "Bolshevik Revolution", place: "Petrograd", key: true,
      body: "The first laboratory. A single faction out-competes, out-lies and out-murders every rival until the Party is the State. The blood-soaked template every later revolution will copy and every Western progressive will quietly excuse.",
      detail: "The pattern sets here and never really changes. Frantic fermentation. A single faction outspends, out-argues and ultimately out-murders its rivals. A feudal monarchy with extra steps and committees, renamed \u2018the Party\u2019 so the peasants can't tell it is the court.\n\nBy every Hegelian metric this was supposed to be sublation — a system tested and found wanting should give way to its successor. But the doctrine has a cheat code. Any failure is redefined as \u2018not yet real socialism\u2019, the graves are dusted off the history books, and the same prescription is written out again on a fresh pad.",
      links: [{ label: "Britannica — October Revolution", url: "https://www.britannica.com/event/October-Revolution" }],
    },
    {
      year: "1923", title: "The Frankfurt School is founded", place: "Frankfurt am Main", key: false,
      body: "The Institute for Social Research opens as the first Marxist research centre attached to a major German university. Its mission is not factory agitation but cultural analysis — preparing the intellectual weaponry that would later be aimed at the American middle class.",
      detail: "The diagnosis, quietly, is that Marx was wrong about the workers. Given the option of a detached house, a decent wage and a football match on a Saturday, the proletariat politely declined to storm anything. The Institute's unspoken job is to find out why — and what has to be dismantled so the revolution can be rebooted.\n\nIt is the beginning of a long re-aiming. The target is no longer the factory floor; it is taste, sexuality, family, the very idea that a settled life might be a good one. Adorno, Horkheimer, Marcuse and their heirs will spend the rest of the century preparing the intellectual weaponry for a war most of the people being fought over will never know is underway.",
      links: [
        { label: "Britannica — Frankfurt School", url: "https://www.britannica.com/topic/Frankfurt-School" },
        { label: "Jacobin — a century of the Frankfurt School", url: "https://jacobin.com/2023/10/frankfurt-school-domination-modern-social-research-capitalism-critical-theory" },
      ],
    },
    {
      year: "1929-1935", title: "Gramsci writes the Prison Notebooks", place: "Turi Prison, Italy", key: true,
      body: "Gramsci, imprisoned by Mussolini, diagnoses why the revolution failed: the workers didn't want it. Solution — abandon the factory, capture the culture. Schools, churches, media, law, entertainment. Win the \"war of position\" inside the institutions and the revolution arrives without a shot fired.",
      detail: "Gramsci's insight, written in the margins of a fascist prison ledger, is the most quietly consequential of the twentieth century. The populace was not a revolutionary base because it could not even imagine the revolution — it had been raised inside capitalism, treated reasonably well, and was therefore unwilling to gamble its Saturday afternoon on a vague promise of something better.\n\nHis answer is the long war of position. Don't storm the palace; apply for a job inside it. Credential the ideology, then require the credential. Train the teachers, then the teachers' teachers. The uprising arrives on a Tuesday, quietly, via a new staff handbook. Everything that follows in this dossier is one long execution of that memo.",
      links: [
        { label: "Britannica — Prison Notebooks", url: "https://www.britannica.com/topic/Prison-Notebooks" },
        { label: "Britannica — cultural hegemony", url: "https://www.britannica.com/topic/hegemony" },
      ],
    },
    {
      year: "1964", title: "Marcuse publishes One-Dimensional Man", place: "USA", key: false,
      body: "The Frankfurt School's most readable prophet tells the Western student that consumer comfort is the new chain, and that liberation requires tearing out the floor. The bible of the emerging New Left. The \"repressive tolerance\" permission slip that would justify every later purge.",
      detail: "Marcuse's trick is to redescribe plenty as prison. The washing machine, the family car, the weekend at the coast — all of it is repositioned as narcotic, a system of apparent comfort preventing the populace from noticing their own oppression. Gramsci's diagnosis, rewritten for the American campus with better paper stock.\n\nThe real bequest is \u2018repressive tolerance\u2019 — the permission slip which will justify every later purge. Tolerance for the right ideas; repression for the wrong ones. Once the student radicals stop being students and start being deans, they will remember exactly which column they were told they were in.",
      links: [
        { label: "Britannica — Herbert Marcuse", url: "https://www.britannica.com/biography/Herbert-Marcuse" },
        { label: "Wikipedia — One-Dimensional Man", url: "https://en.wikipedia.org/wiki/One-Dimensional_Man" },
      ],
    },
    {
      year: "1967", title: "\"The long march through the institutions\"", place: "West Germany", key: true,
      body: "Student activist Rudi Dutschke coins the phrase that names the strategy. Don't storm the state — become it. Universities, civil service, broadcasters, courts. A generation of radicals puts on a suit and collects a pension while rewriting the rules from inside.",
      detail: "Dutschke simply names what Gramsci had designed. The strategy is not to overthrow the state — it is to become the civil service that runs it. It is slow. It is boring. It involves committee work, union meetings, tenure applications, HR reviews. It is also, for those reasons, nearly invisible to the people it is being done to.\n\nA generation later the radicals have the pensions. They write the policy, the training materials, the editorial guidelines, the courts' working definitions. The revolution did not fail to arrive; it simply arrived in a lanyard rather than a balaclava, and nobody thought to call it one.",
      links: [{ label: "Wikipedia — long march through the institutions", url: "https://en.wikipedia.org/wiki/Long_march_through_the_institutions" }],
    },
    {
      year: "1969", title: "Stonewall — the sexual vanguard opens", place: "Greenwich Village, New York", key: false,
      body: "A legitimate civil-rights flashpoint. Over the following decades it will be annexed by the wider project: a movable, ever-escalating frontier used to mark out enemies, shame dissent, and rebrand any stable institution — family, church, biology itself — as bigotry.",
      detail: "The original grievance is real and the reform is decent — that is precisely what makes the frontier so useful afterwards. Each concession is immediately redefined as an inadequate starting line. Each victory is the pretext for the next demand. The goalposts are not moving by accident; motion is the point.\n\nBy the time the ratchet reaches drag queen story hour, puberty blockers for twelve-year-olds and the polite institutional question \u2018what is a woman?\u2019, the logic is unmistakable. Utopia must always, by definition, be somewhere in the future — so any present arrangement, however decent, must be torn down on the assumption that something better is waiting underneath.",
      links: [
        { label: "Britannica — Stonewall riots", url: "https://www.britannica.com/event/Stonewall-riots" },
        { label: "Library of Congress — 1969 primary sources", url: "https://guides.loc.gov/lgbtq-studies/stonewall-era" },
      ],
    },
    {
      year: "1989", title: "Crenshaw coins \"intersectionality\"", place: "University of Chicago", key: true,
      body: "Originally a narrow legal argument; weaponised within a decade into a ranking system of oppressions. Its practical function: a forever-expanding grievance matrix that guarantees the revolution can never run out of victims — or villains.",
      detail: "The paper itself is modest. Within a decade the framework has metastasised into a full ranking system of human worth by inherited category — and, crucially, a generator of infinite subdivisions. Every new axis produces fresh victims, fresh villains and fresh in-fighting, all of which the march feeds on.\n\nThis is the doctrine's masterpiece of self-preservation. A coherent opposition becomes almost definitionally bigoted; any critic is re-diagnosed as a member of whichever column happens to need condemning that week. The revolution cannot run out of fuel because the fuel is manufactured inside the engine.",
      links: [
        { label: "Crenshaw — original 1989 paper (PDF)", url: "https://chicagounbound.uchicago.edu/cgi/viewcontent.cgi?article=1052&context=uclf" },
        { label: "Harvard — publication record", url: "https://inclusionandbelongingtaskforce.harvard.edu/publications/demarginalizing-intersection-race-and-sex-black-feminist-critique" },
      ],
    },
    {
      year: "1989", title: "The Berlin Wall falls", place: "Berlin", key: false,
      body: "State communism loses the economic argument in public. By every Hegelian metric this was sublation — the system was disproved. The doctrine does not care. The project simply moves home: out of Moscow, into the faculty lounge, the HR department, the ratings board.",
      detail: "The experiment is over. The results are in. The bloc empties, the queues dissolve, the files are opened. Hegel's own dialectic would, on its own terms, call this a clean refutation and move on. Modern utopianism has a fascinating answer instead: that wasn't real socialism. That was only a rehearsal. Ignore it.\n\nAnd so the project does not die; it simply relocates. Out of the Politburo, into the seminar. Out of the five-year plan, into the HR memo. The people who had excused the gulags spend the next decade writing the new workplace training materials, and by 2010 nobody thinks the change of address is worth remarking on.",
      links: [
        { label: "BBC — how 1989 reshaped the world", url: "https://www.bbc.com/news/world-europe-50013048" },
        { label: "Wikipedia — Fall of the Berlin Wall", url: "https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall" },
      ],
    },
    {
      year: "1990", title: "Judith Butler — Gender Trouble", place: "USA", key: false,
      body: "Sex itself is declared a performance. The biological anchor of half of humanity's self-understanding is redefined as oppression. Thirty years later the consequences arrive in children's hospitals, women's prisons and girls' changing rooms.",
      detail: "Butler completes the project that began when Marx declared the family a bourgeois institution. If the family must go, the sexes that compose it must go. If the sexes must go, biology itself must be reclassified as a social construction — a story told by power rather than a fact observed by science.\n\nThe price of the theory is paid, as ever, elsewhere. Thirty years later it is teenage girls on mastectomy tables, male prisoners in women's wings, and a generation of clinicians who have forgotten how to say \u2018no\u2019. The seminar paid nothing. The children paid everything.",
      links: [{ label: "The Nation — re-reading Gender Trouble", url: "https://www.thenation.com/article/society/judith-butler-gender-trans-1990s/" }],
    },
    {
      year: "2011", title: "Occupy Wall Street", place: "Zuccotti Park, NYC", key: false,
      body: "Called into being by Canadian ad-men at Adbusters. Meant to channel post-2008 rage at the banks into a permanent left-populist movement. Its energy, personnel and vocabulary (\"the 1%\", \"systems\") would be inherited wholesale by the next decade's campus and corporate activism.",
      detail: "On the surface, Occupy failed. The tents came down, the working groups dissolved, and the specific demands were never clearly articulated in the first place. Underneath, it did exactly what it needed to do. It trained a cohort, road-tested a vocabulary, and handed both to every campus, newsroom and HR department that would matter over the following decade.\n\nThe slogans — \u2018the 1%\u2019, \u2018systemic\u2019, \u2018lived experience\u2019 — will be walking the corridors of banks the movement claimed to oppose within ten years. A protest that appeared to lose against capital instead taught capital its new liturgy.",
      links: [
        { label: "The New Yorker — Pre-Occupied", url: "https://www.newyorker.com/magazine/2011/11/28/pre-occupied" },
        { label: "NPR — Adbuster origins", url: "https://www.npr.org/2011/10/20/141526467/exploring-occupy-wall-streets-adbuster-origins" },
      ],
    },
    {
      year: "2018", title: "BlackRock declares \"purpose\"", place: "New York", key: true,
      body: "Larry Fink's annual letter tells every CEO on Earth that their company must \"make a positive contribution to society.\" Translation: the largest asset manager in history will now grade you on political alignment. Private capital is drafted into the long march.",
      detail: "This is the moment the ladder is kicked down. For seventy years the march has worked chiefly through the not-for-profit wing of society — the university, the broadcaster, the charity. Now the largest pool of capital on Earth tells every boardroom that future access to money is contingent on political alignment.\n\nThe effect is instant and everywhere. Compliance stops being a matter of fines and starts being a matter of funding. ESG becomes the new rating agency; the rating agency writes the policy; the policy is indistinguishable from last year's NGO manifesto. When the ballot box resists, the boardroom never does — because the boardroom's shares are held by people who have already signed the pledge.",
      links: [{ label: "IMD — analysis of the 2018 letter", url: "https://www.imd.org/research-knowledge/sustainability/articles/the-blackrock-letter-a-turning-point-for-real-change/" }],
    },
    {
      year: "2020", title: "Corporate capture goes total", place: "Global", key: true,
      body: "After the summer of riots, every major Western brand publishes identical statements within a week. BlackRock follows up by announcing sustainability as the organising principle of all its portfolios. The old left wrote pamphlets — the new left writes HR policy backed by trillions in index funds.",
      detail: "Within seven days of a single American street incident, every multinational brand on Earth publishes a statement with the same adjectives in the same order. The co-ordination is not a conspiracy; it is the endpoint of a century of institutional training. When the signal comes, the response is reflex.\n\nOld-left agitation was pamphlets on a mimeograph. New-left agitation is a mandatory training module from head office, backed by fiduciary duty and trillions in index funds. Dissent is no longer a debate your neighbour wins; it is a line in the staff handbook, and you are out of a job before breakfast. The cage is a beautiful one — it pays a salary.",
      links: [{ label: "BlackRock — 2020 CEO letter", url: "https://www.blackrock.com/corporate/investor-relations/2020-larry-fink-ceo-letter" }],
    },
    {
      year: "2020s", title: "Mass migration as demographic reset", place: "UK · EU · North America", key: false,
      body: "Borders are not failing — they're performing. The native population is re-framed as historical villain, replaced with a client class, and any objection is priced out of polite speech. The \"problem\" of labour shortage justifies the \"solution\" of permanent dependency on the managerial state.",
      detail: "The policy comes dressed as economic necessity — what would the NHS do without its imported consultants, the cities without their delivery riders, dinner without its takeaway? Underneath the GDP graph, the arithmetic runs the other way. The receiving countries get poorer year on year; the taxes climb to cover the bill; the housing market becomes a game only the already-wealthy can afford to play.\n\nThe function of the policy is not labour. It is demographic. A native population reframed as historical villain is a population that can be dispossessed without protest; a client class imported to replace it is a reliable voter and a permanent case for a larger state. The demon comes, as ever, wearing the face of an angel — this time holding a balance sheet.",
      links: [],
    },
    {
      year: "Now", title: "The false choice", place: "Everywhere", key: true,
      body: "You are offered two doors. Behind one, a stagnant managerial imperium that already owns your bank, your job and your children's curriculum. Behind the other, accelerated dissolution sold as liberation. Both doors are held by the same hand. The blueprint was never a better world — it was a single authority nobody is permitted to question.",
      detail: "The two doors are a confidence trick. Door one: the managerial imperium, stagnant, expensive, already holding the mortgage on your house and the syllabus for your children. Door two: the accelerationist promise — tear it all down and something better will emerge from the rubble, honest, just trust us, we have a flag.\n\nThe hand on both handles is the same. The progressive theory of history requires only that you keep moving; the direction is immaterial so long as the present arrangement is treated as intolerable. The way out is not another utopia. It is the quiet, unfashionable refusal to trade a functioning, imperfect society for a perfect one that has never existed and has only ever produced graves.",
      links: [],
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
    "The progressive theory of history is a perpetual-motion machine for power. It cannot be falsified — every failure is redefined as \"not yet real\" — and it cannot be satisfied, because satisfaction would end the march.",
    "The way out is not another utopia. It is the refusal to trade a functioning, imperfect society for a perfect one that has never existed and has only ever produced graves.",
  ],
};

/** Kept for backwards compat with the admin editor import. */
export type LongMarchData = TimelineData;

// Deep-merge admin-edited content over the hardcoded defaults so that
// partial overrides still yield a complete data structure. For the timeline
// array, per-event fields that are missing/blank in the override (e.g. newly
// added fields like `detail`) fall back to the matching default entry so that
// shipping new default prose doesn't require a re-save from the admin UI.
function mergeData(override: Partial<TimelineData> | null | undefined): TimelineData {
  if (!override || typeof override !== "object") return LONG_MARCH_DATA;

  // Build a lookup of defaults keyed by year+title for resilient matching even
  // if the admin has reordered events.
  const defaultByKey = new Map(
    LONG_MARCH_DATA.timeline.map((e) => [`${e.year}|${e.title}`, e]),
  );
  const mergedTimeline = override.timeline
    ? override.timeline.map((e, i) => {
        const def =
          defaultByKey.get(`${e.year}|${e.title}`) ?? LONG_MARCH_DATA.timeline[i];
        if (!def) return e;
        return {
          ...def,
          ...e,
          // Prefer admin-written detail when present; otherwise fall back to
          // the default so new narrative fields ship without a re-save.
          detail:
            e.detail && e.detail.trim() ? e.detail : def.detail,
          imageUrl: e.imageUrl || def.imageUrl,
          links: e.links && e.links.length > 0 ? e.links : def.links,
        };
      })
    : LONG_MARCH_DATA.timeline;

  // Same idea for tactics — let admin edits override but fall back to default
  // axis when an entry doesn't carry one.
  const defaultTacticByName = new Map(
    LONG_MARCH_DATA.tactics.map((t) => [t.name, t]),
  );
  const mergedTactics = override.tactics
    ? override.tactics.map((t) => {
        const def = defaultTacticByName.get(t.name);
        if (!def) return t;
        return { ...def, ...t, axis: t.axis ?? def.axis };
      })
    : LONG_MARCH_DATA.tactics;

  return {
    meta: { ...LONG_MARCH_DATA.meta, ...(override.meta || {}) },
    thesis: override.thesis ?? LONG_MARCH_DATA.thesis,
    timeline: mergedTimeline,
    tactics: mergedTactics,
    engine: override.engine ?? LONG_MARCH_DATA.engine,
    closing: override.closing ?? LONG_MARCH_DATA.closing,
  };
}

export default function LongMarchPage() {
  const { data: saved } = useQuery({
    queryKey: ["/api/page-content/long-march"],
    queryFn: () => getPageContent<Partial<TimelineData>>("long-march"),
    staleTime: 30_000,
    retry: 1,
  });
  const D = mergeData(saved);

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

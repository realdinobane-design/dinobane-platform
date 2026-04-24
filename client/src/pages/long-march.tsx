import { useQuery } from "@tanstack/react-query";
import { PageStatusGate } from "@/components/page-status-gate";
import { TimelineRenderer, type TimelineData } from "@/components/timeline-renderer";
import { getPageContent } from "@/lib/page-status";

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

/** Kept for backwards compat with the admin editor import. */
export type LongMarchData = TimelineData;

// Deep-merge admin-edited content over the hardcoded defaults so that
// partial overrides still yield a complete data structure.
function mergeData(override: Partial<TimelineData> | null | undefined): TimelineData {
  if (!override || typeof override !== "object") return LONG_MARCH_DATA;
  return {
    meta: { ...LONG_MARCH_DATA.meta, ...(override.meta || {}) },
    thesis: override.thesis ?? LONG_MARCH_DATA.thesis,
    timeline: override.timeline ?? LONG_MARCH_DATA.timeline,
    tactics: override.tactics ?? LONG_MARCH_DATA.tactics,
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
    <PageStatusGate slug="long-march" name="The Long March">
      <TimelineRenderer data={D} />
    </PageStatusGate>
  );
}

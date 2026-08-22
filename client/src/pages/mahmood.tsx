import { useQuery } from "@tanstack/react-query";
import { PageStatusGate } from "@/components/page-status-gate";
import { TimelineRenderer, type TimelineData } from "@/components/timeline-renderer";
import { getPageContent } from "@/lib/page-status";
import { MembersOnlyBanner } from "@/components/members-only-banner";
import { TimelineReactions } from "@/components/timeline-reactions";

/* =========================================================
   MAHMOOD — DOSSIER TIMELINE
   ---------------------------------------------------------
   Evidence-led political-intelligence timeline on
   Shabana Mahmood — MP for Birmingham Ladywood since 2010,
   Lord Chancellor 2024–25, Home Secretary since Sept 2025.
   Four acts:
     I.   Origins (1980–2010)
     II.  Opposition (2010–2024)
     III. The Lord Chancellor (2024–2025)
     IV.  The Home Office (2025–present)
   Every event is sourced (Hansard, TheyWorkForYou, gov.uk,
   court judgments, official statistics, named press).
   Power Map deep links: /rings-of-power/index.html#n=<node>
   ========================================================= */

export const MAHMOOD_CONTENT_VERSION = 1;

/** Deep link into the UK Power Map, focused on a node. */
const MAP = (id: string) => `/rings-of-power/index.html#n=${id}`;

export const MAHMOOD_DATA: TimelineData = {
  contentVersion: MAHMOOD_CONTENT_VERSION,
  meta: {
    dossierCode: "DOSSIER // DB-SM-007",
    eyesOnly: "EYES ONLY — MEMBERS",
    fileTag: "FILE: MAHMOOD / v1.0",
    title: "Shabana Mahmood",
    subtitle: "An evidence-led political-intelligence timeline of the Home Secretary",
    byline: "Filed by DinoBane Intel · dinobane.com",
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/cd/Shabana_Mahmood_Official_Cabinet_Portrait%2C_September_2025_%28cropped%29.jpg",
  },
  thesis: [
    "Shabana Mahmood holds more of the British state's coercive machinery than any other politician alive: as Home Secretary she oversees MI5, the police, Prevent, proscription and the borders; as Lord Chancellor before that she ran the courts, sentencing and the prisons; and as chair of Labour's National Executive Committee she helped decide who would be Prime Minister. This dossier tracks what she did with each lever — and what she voted for before she ever held one.",
    "The record comes in two halves. Between 2010 and 2024 she compiled one of the most consistently liberal voting records on asylum and immigration in the Commons — nineteen votes against a stricter asylum system, votes against enforcement, against the Rwanda scheme, and a signature on the 2020 letter that sought to halt a deportation flight to Jamaica. From September 2025, at the Home Office, she authored the most restrictive asylum package since at least the 1990s: thirty-month refugee leave, twenty-year settlement, an appeals body of non-legally-qualified adjudicators, and a £10,000 'refugee tax'.",
    "The thesis is not a character verdict. It is an audit. Where her words and her record diverge — in either direction — they are placed side by side, sourced, and left to speak. Every event below carries its sources, and every node of her network links straight into the UK Power Map.",
  ],
  acts: [
    {
      id: "origins",
      label: "Act I",
      kicker: "Act I · Origins",
      title: "Mirpur, Taif, Oxford, Ladywood",
      years: "1980 — 2010",
      lede: "A Birmingham childhood split between Small Heath and Saudi Arabia, a grammar school, Oxford law, the Bar — and a seat in Parliament at twenty-nine, among the first three Muslim women ever elected to the Commons.",
    },
    {
      id: "opposition",
      label: "Act II",
      kicker: "Act II · Opposition",
      title: "Fourteen Years of Voting Against",
      years: "2010 — 2024",
      lede: "The fingerprint years. Bill after bill on asylum, enforcement, citizenship and deportation — and a voting record that never once broke the whip. Then, in 2024, the seat itself nearly went: a sectarian campaign, a 23,868 majority cut to 3,421.",
    },
    {
      id: "justice",
      label: "Act III",
      kicker: "Act III · The Lord Chancellor",
      title: "Courts, Sentencing and Early Release",
      years: "2024 — 2025",
      lede: "Sworn in on the Quran, she ran the justice system for fourteen months: the SDS40 early-release scheme, a record court backlog, a war with the Sentencing Council over 'two-tier' pre-sentence reports — and a vote against a national grooming-gangs inquiry she would later chair by appointment.",
    },
    {
      id: "home-office",
      label: "Act IV",
      kicker: "Act IV · The Home Office",
      title: "The Levers of the State",
      years: "2025 — present",
      lede: "Home Secretary under Starmer, reappointed under Burnham. The harshest asylum package in a generation, a dispersal system tripled in price, a de-proscribed militia, a vacant counter-extremism strategy — and a Times interview promising to spread asylum accommodation 'fairly' across the country.",
    },
  ],
  timeline: [
    /* ------------------------------------------------ Act I */
    {
      year: "1980",
      title: "Born into two countries",
      place: "Birmingham",
      key: false,
      act: "origins",
      body: "Born 17 September 1980 in Birmingham to parents from Mirpur, Azad Kashmir. From 1981 to 1986 the family lived in Taif, Saudi Arabia, where her father worked as a civil engineer — an early childhood split between Small Heath and the Kingdom. On their return she attended the selective King Edward VI Camp Hill School for Girls.",
      links: [
        { label: "Power Map: Shabana Mahmood", url: MAP("mahmood") },
        { label: "Power Map: Pakistan", url: MAP("pakistan") },
      ],
    },
    {
      year: "2002",
      title: "Oxford, then the Bar",
      place: "Oxford / London",
      key: false,
      act: "origins",
      body: "Law at Lincoln College, Oxford; called to the Bar in 2003 and practised as a barrister — the legal formation that would later carry her to the Lord Chancellorship.",
      links: [],
    },
    {
      year: "2010",
      title: "One of the first three",
      place: "Birmingham Ladywood",
      key: true,
      act: "origins",
      body: "Elected MP for Birmingham Ladywood on 6 May 2010 — with Rushanara Ali and Yasmin Qureshi, one of the first three Muslim women ever to sit in the House of Commons. Ladywood: inner-city, majority-minority, one of the most deprived constituencies in England — roughly 22% white, around 64% of neighbourhoods highly deprived. The seat will shape everything that follows.",
      links: [
        { label: "Power Map: Labour Party", url: MAP("labour") },
        { label: "Power Map: Islam in Britain", url: MAP("islam") },
      ],
    },
    {
      year: "2014",
      title: "The MEND panel",
      place: "London",
      key: false,
      act: "origins",
      body: "Named in MEND's own 2014 Activity Report as a panellist at its Islamophobia Awareness Month conference (November 2014); spoke again at a MEND-covered Ramadan Tent Project Open Iftar in 2018. MEND — Muslim Engagement and Development — would later be cited by MP Nick Timothy in a September 2025 open letter challenging her appointment as Home Secretary; her appearance is documented, the significance contested.",
      detail: "Timothy's letter also claimed she had 'endorsed the Muslim Council of Britain'. No primary evidence of a direct MCB endorsement exists — the link runs through her support for the 2018 APPG definition of Islamophobia, which the MCB championed. The distinction matters: one claim is documented, the other is inference.",
      links: [
        { label: "Power Map: Islam in Britain", url: MAP("islam") },
        { label: "Power Map: Muslim Brotherhood network", url: MAP("mb") },
      ],
    },
    /* ------------------------------------------------ Act II */
    {
      year: "2015",
      title: "First votes against the line",
      place: "Westminster",
      key: false,
      act: "opposition",
      body: "Votes against the Immigration Bill 2015 at second and third reading — the opening entries in what becomes a fourteen-year pattern.",
      links: [
        { label: "TheyWorkForYou voting record", url: "https://www.theyworkforyou.com/mp/24778/shabana_mahmood/birmingham%2C_ladywood/votes" },
      ],
    },
    {
      year: "2015–26",
      title: "The fingerprint: nineteen votes against",
      place: "Westminster",
      key: true,
      act: "opposition",
      body: "TheyWorkForYou's compiled record, verbatim: 'Almost always voted against a stricter asylum system — 19 votes against, 8 absences, between 2015 and 2026.' Also: 'generally voted against stronger laws and enforcement of immigration rules' and 'almost always voted against making it easier to remove someone's British citizenship.' Across 2010–2024, zero rebellions against the Labour whip.",
      pullQuote: {
        text: "Almost always voted against a stricter asylum system — 19 votes against, 8 absences, between 2015 and 2026.",
        attribution: "TheyWorkForYou, compiled voting record",
      },
      links: [
        { label: "TheyWorkForYou voting record", url: "https://www.theyworkforyou.com/mp/24778/shabana_mahmood/birmingham%2C_ladywood/votes" },
      ],
    },
    {
      year: "2020",
      title: "The Jamaica flight letter",
      place: "Westminster",
      key: true,
      act: "opposition",
      body: "Co-signs the 9 February 2020 cross-party letter (organised by Diane Abbott and Lord David Blunkett's successor signatures, fronted by Abbott and Sir Ed Davey) demanding the Home Office halt a deportation flight to Jamaica. Among those whose removal the letter sought to stop were offenders convicted of serious crimes.",
      detail: "On 5 January 2026, now-Home Secretary Mahmood was confronted with her own signature in the Commons by Conservative MP Ben Obese-Jecty. The exchange is in Hansard: the woman who once signed to stop the flight now defending the returns operation she runs.",
      links: [
        { label: "Power Map: Labour Party", url: MAP("labour") },
      ],
    },
    {
      year: "2022",
      title: "Against the Nationality and Borders Bill",
      place: "Westminster",
      key: false,
      act: "opposition",
      body: "Votes against the Nationality and Borders Bill at second reading; absent from the third-reading division. The Bill — the Conservative centrepiece on asylum differentiation and offshore processing — passes anyway.",
      links: [],
    },
    {
      year: "2023",
      title: "Against the Illegal Migration Bill — and the Gaza abstention",
      place: "Westminster",
      key: false,
      act: "opposition",
      body: "Votes against the Illegal Migration Bill at second and third reading — the legislation her own 2025–26 package would later be compared against. On 15 November 2023 she follows the whip into abstention on the SNP's Gaza ceasefire amendment, declining to join the fifty-six Labour rebels.",
      links: [],
    },
    {
      year: "2024",
      title: "Against Rwanda, third reading",
      place: "Westminster",
      key: false,
      act: "opposition",
      body: "17 January 2024: votes against the Safety of Rwanda Bill at third reading. Within two years she would be defending her own removals architecture from the dispatch box — different mechanism, same direction of travel, opposite vote.",
      links: [],
    },
    {
      year: "2024",
      title: "\u201cThe most important thing in my life\u201d",
      place: "British Muslim TV",
      key: true,
      act: "opposition",
      body: "In a pre-election interview with British Muslim TV, asked what Islam means to her, she answers without hedging. The quote circulates widely after her Home Office appointment; the clip is genuine and the wording verified across three independent carriers.",
      pullQuote: {
        text: "Islam, my own religion, like a lot of practising Muslims, my faith is the most important thing in my life. It is the absolute driver of everything that I do. I feel a very strong calling of my own conscience and my conscience calls me to God.",
        attribution: "Shabana Mahmood, British Muslim TV interview, 2024",
      },
      detail: "Two months later she tells The Times' Rachel Sylvester (October 2024) that her faith is 'the core of who I am'; in December 2025, 'life is a test and you are accountable to God'. The consistency is the point: this is not a private belief occasionally acknowledged — it is offered, repeatedly, as the driver of the work.",
      links: [
        { label: "Power Map: Islam in Britain", url: MAP("islam") },
      ],
    },
    {
      year: "2024",
      title: "Three thousand four hundred and twenty-one",
      place: "Birmingham Ladywood",
      key: true,
      act: "opposition",
      body: "5 July 2024: holds Ladywood by 3,421 votes (9.4%) against pro-Gaza independent Akhmed Yakoob's 33.2% — a majority of 23,868 all but wiped out. A leaked Labour submission to the party's internal review, reported by the Guardian, documented a sectarian intimidation campaign: men told to 'shave their beards' if they supported Labour, a truck broadcasting that 'Allah will judge you', police called repeatedly.",
      pullQuote: {
        text: "I know what a Muslim looks like, a Muslim looks like me… Muslim values are mine. And they are British values too.",
        attribution: "Shabana Mahmood, acceptance speech, 5 July 2024",
      },
      detail: "The near-loss is the hinge of her national politics. The Muslim Vote's eighteen demands had been published that spring; her majority now depends on rebuilding the coalition that just tried to remove her — or on a national repositioning hard enough to survive without it.",
      links: [
        { label: "Power Map: Labour Party", url: MAP("labour") },
        { label: "Power Map: Islam in Britain", url: MAP("islam") },
      ],
    },
    /* ------------------------------------------------ Act III */
    {
      year: "2024",
      title: "Sworn in on the Quran",
      place: "Royal Courts of Justice",
      key: false,
      act: "justice",
      body: "16 July 2024: appointed Lord Chancellor and Secretary of State for Justice on 5 July, sworn in eleven days later on the Quran — the first Muslim woman to hold a great office of state. The courts, the prisons, sentencing and the probation service are now hers.",
      links: [
        { label: "Power Map: Shabana Mahmood", url: MAP("mahmood") },
      ],
    },
    {
      year: "2024",
      title: "SDS40: the early-release gamble",
      place: "Ministry of Justice",
      key: true,
      act: "justice",
      body: "18 July 2024, with prisons at 99% capacity: announces SDS40, cutting the automatic release point from 50% to 40% of sentence. Her defence — 'the safest way forward'. By June 2025 the scheme has released 38,042 prisoners; a releasee is charged with a sexual assault on the day of his release; 37 restraining-order breachers are wrongly freed; releases in error rise 128%. The scheme carries no specific exclusion for the Southport rioters sentenced that same summer.",
      pullQuote: {
        text: "This is the safest way forward.",
        attribution: "Shabana Mahmood, Commons statement on SDS40, 18 July 2024",
      },
      detail: "In opposition she had attacked the Conservatives' early-release secrecy. In office, her own scheme released more people, faster, with documented errors — and the rioters she promised would 'languish' in jail were eligible under the same instrument.",
      links: [],
    },
    {
      year: "2025",
      title: "The grooming-inquiry vote",
      place: "Westminster",
      key: true,
      act: "justice",
      body: "8 January 2025: votes against the Conservative amendment demanding a national statutory inquiry into grooming gangs — the government calls it a wrecking amendment and whips against it. Eleven months later, as Home Secretary, she appoints Anne Longfield to chair a national inquiry with an explicit ethnicity remit. Against the inquiry when the Opposition proposed it; in control of it once it is hers to appoint.",
      links: [
        { label: "Power Map: Grooming gangs inquiries", url: MAP("grooming") },
      ],
    },
    {
      year: "2025",
      title: "The two-tier sentencing war",
      place: "Westminster",
      key: true,
      act: "justice",
      body: "March–April 2025: the Sentencing Council issues guidance directing courts to consider pre-sentence reports for offenders from ethnic, cultural and faith minorities. Mahmood declares war on it — 'There will never be a two-tier sentencing approach under my watch' (5 March) — the Council refuses (27 March), and she passes emergency legislation, the Sentencing Guidelines (Pre-sentence Reports) Act 2025, with a Clause 19 dual veto giving ministers control over future guidance.",
      pullQuote: {
        text: "There will never be a two-tier sentencing approach under my watch.",
        attribution: "Shabana Mahmood, Commons, 5 March 2025",
      },
      detail: "The irony is documented, not alleged: the minister who legislated against 'two-tier' sentencing would, months later, dismiss 'two-tier policing' as a conspiracy theory — one standard for the courts, another for the streets.",
      links: [],
    },
    {
      year: "2025",
      title: "Record backlog — and the blasphemy-law line",
      place: "Ministry of Justice",
      key: false,
      act: "justice",
      body: "June 2025: the Crown Court backlog hits a record 78,329 cases. The same month, in the Commons, she draws a bright line on speech and religion: 'We do not have a blasphemy law, and we are not going to have a blasphemy law' — even as she resists pressure over the Islamophobia definition she had previously championed.",
      links: [],
    },
    /* ------------------------------------------------ Act IV */
    {
      year: "2025",
      title: "Home Secretary",
      place: "2 Marsham Street",
      key: true,
      act: "home-office",
      body: "5 September 2025: appointed Home Secretary in Starmer's post-Rayner reshuffle — the first female Muslim Home Secretary, holding MI5 oversight, counter-terrorism, Prevent, proscription, policing and the borders. RICU, the Home Office's covert communications unit, now sits in her department.",
      links: [
        { label: "Power Map: Shabana Mahmood", url: MAP("mahmood") },
        { label: "Power Map: RICU", url: MAP("ricu") },
      ],
    },
    {
      year: "2025",
      title: "Defending the definition",
      place: "Westminster",
      key: false,
      act: "home-office",
      body: "15 September 2025: challenged in the Commons by Nick Timothy over her promotion of the 2018 APPG 'Islamophobia' definition, she defends it as giving 'context to patterns of behaviour' while pledging no infringement of free speech. Days later, briefing emerges of her reservations about adopting the definition — the reservation and the defence documented within the same fortnight.",
      links: [
        { label: "Power Map: Islam in Britain", url: MAP("islam") },
      ],
    },
    {
      year: "2025",
      title: "Heaton Park — and the HTS delisting",
      place: "Manchester / Westminster",
      key: true,
      act: "home-office",
      body: "2 October 2025: the Heaton Park synagogue attack kills two worshippers — an Islamist terrorist striking on her watch, nineteen days into the job. Nineteen days after that, 21 October, her department de-proscribes Hay'at Tahrir al-Sham — the former al-Qaeda franchise now running Syria — removing it from the banned-organisations list. No new organisation is proscribed under her tenure.",
      links: [
        { label: "Power Map: Islam in Britain", url: MAP("islam") },
      ],
    },
    {
      year: "2025",
      title: "\u201cRestoring Order and Control\u201d",
      place: "House of Commons",
      key: true,
      act: "home-office",
      body: "17 November 2025: the most restrictive asylum package since at least the 1990s — thirty-month refugee leave, twenty-year wait for settlement, family reunion ended, support converted from duty to discretion. She frames the stakes as civilisational for the system itself: the 'public consent for having an asylum system at all' is fraying. Asked about dispersal, she is blunt: 'we already run a dispersal model… and we will carry on doing so.' When a Labour MP raises racist abuse, she answers with her own: 'fucking Paki' — the retort is in Hansard.",
      pullQuote: {
        text: "I am not prepared to watch public consent for having an asylum system at all drain away.",
        attribution: "Shabana Mahmood, Commons statement, 17 November 2025",
      },
      detail: "The MP who cast nineteen votes against a stricter asylum system now authors one. Tommy Robinson praises the plans; fourteen of her own backbenchers rebel. The pivot is not gradual — it is datable to this autumn.",
      links: [
        { label: "Power Map: Asylum accommodation contracts", url: MAP("asylumhotels") },
        { label: "Power Map: Tommy Robinson", url: MAP("robinson") },
      ],
    },
    {
      year: "2025–26",
      title: "The chair and the crown",
      place: "Labour NEC",
      key: true,
      act: "home-office",
      body: "As chair of Labour's NEC: on 5 January 2026 she is confronted in the Commons with her 2020 Jamaica-flight signature; on 25 January her NEC panel blocks Andy Burnham's bid for the Gorton & Denton by-election seat; on 17 July 2026 — herself one of twenty-three MPs who never nominated him — she announces Burnham's leadership victory; on 20 July, Prime Minister Burnham reappoints her Home Secretary. She blocked his route, announced his crown, and kept her office.",
      links: [
        { label: "Power Map: Andy Burnham", url: MAP("burnham") },
        { label: "Power Map: Labour Party", url: MAP("labour") },
      ],
    },
    {
      year: "2026",
      title: "The extremism ledger",
      place: "Home Office",
      key: true,
      act: "home-office",
      body: "February–June 2026: the Palestine Action ban she inherited is ruled unlawful by the High Court (13 February) and restored by the Court of Appeal (15 June, [2026] EWCA Civ 721) with 3,000+ arrested under it. A non-statutory 'anti-Muslim hostility' definition is adopted for England (9 March). Non-crime hate incidents are abolished (26 March). The Fulford inquiry finds the Southport attack 'foreseeable and avoidable' (13 April). The threat level rises to SEVERE after the Golders Green stabbing (30 April). And through it all the counter-extremism commissioner post sits vacant — 'Remarkably, there is no government counter-extremism strategy' (Lord Goodman).",
      detail: "Prevent referrals hit records on her watch — 10,293 in the year to September 2025 — with extreme-right referrals (20%) more than double the Islamist share (8%) and 56% logged with no ideology at all, even as MI5's caseload runs 75% Islamist. February 2026 guidance reverses the Shawcross review: ideology is no longer needed for referral.",
      links: [
        { label: "Power Map: RICU", url: MAP("ricu") },
        { label: "Power Map: Islam in Britain", url: MAP("islam") },
      ],
    },
    {
      year: "2026",
      title: "The Bill and the £10,000 door",
      place: "Westminster",
      key: true,
      act: "home-office",
      body: "30 June 2026: the Immigration and Asylum Bill 2026 is published — 53 clauses, an appeals body (the IIAA) staffed by non-legally-qualified adjudicators, Article 8 family-life protections narrowed, and clauses 23–24 imposing a contribution of roughly £10,000 on refugees — the 'refugee tax'. Second reading passes 264–90 on 13 July with fourteen Labour rebels. The right calls it tinkering; the refugee sector calls it a shakedown; the Bill proceeds.",
      links: [
        { label: "Power Map: Labour Party", url: MAP("labour") },
      ],
    },
    {
      year: "2026",
      title: "\u201cA fair spread\u201d",
      place: "The Times interview",
      key: true,
      act: "home-office",
      body: "19–20 August 2026: she tells The Times the asylum accommodation system will be redistributed across the country — into communities that have hosted nobody, including wealthier ones. The verbatim words matter, because they have been misquoted ever since: she said 'asylum seekers', and the fairness she means is geographic.",
      pullQuote: {
        text: "You've got to get a fair spread and what we are doing with the new model of asylum accommodation and the future of asylum accommodation is think carefully about how you have a fair spread that doesn't end up being in one community or one type of community.",
        attribution: "Shabana Mahmood, The Times, 19–20 August 2026",
      },
      detail: "Behind the quote: hotel numbers down from 213 to around 160 but the exit date slipped to 2029; five military sites named, two opened; the accommodation contracts tripled from £4.5 billion to more than £15 billion; the three providers booking £383 million in profit. The dispersal is not a soundbite — it is a permanent, expanded, redistributed architecture.",
      links: [
        { label: "Power Map: Asylum accommodation contracts", url: MAP("asylumhotels") },
        { label: "Power Map: Shabana Mahmood", url: MAP("mahmood") },
      ],
    },
  ],
  tactics: [
    {
      name: "The Two Registers",
      use: "Faith as 'the absolute driver of everything that I do' for one audience; 'tearing our country apart' for another. Both registers are on the record, verbatim — the dossier does not allege insincerity, it documents the pairing.",
      axis: "identity",
    },
    {
      name: "The Whip's Discipline",
      use: "Zero rebellions in fourteen years of opposition. Loyalty compiled as career capital — cashed in as Lord Chancellor at forty-three, Home Secretary at forty-four.",
      axis: "institutional",
    },
    {
      name: "The Datable Pivot",
      use: "Nineteen votes against a stricter asylum system — then, in a single autumn, the harshest package in a generation. Conversion, calculation or seat survival: the motives are argued, the pivot is not.",
      axis: "institutional",
    },
    {
      name: "The Chair's Veto",
      use: "As NEC chair, a hand on the party's machinery: Burnham's by-election route blocked in January, his victory announced by her in July, her office kept either way.",
      axis: "institutional",
    },
    {
      name: "Definition Politics",
      use: "An 'anti-Muslim hostility' definition adopted while the counter-extremism strategy sits absent and the commissioner post vacant — the boundaries of speech moved by guidance, not statute.",
      axis: "cultural",
    },
    {
      name: "Toughness as Announcement",
      use: "'Smash the gangs' against 59 convictions and 41,472 crossings; 'record returns' ruled false by Full Fact; £1 billion of savings against her own £500 million figure. The claim is always one season ahead of the record.",
      axis: "demographic",
    },
  ],
  engine: [
    {
      step: "01",
      title: "The Base",
      body: "Ladywood: 22% white, 64% deprived, a majority cut to 3,421 by a sectarian challenger. Every national move she makes is read against the arithmetic of that seat.",
    },
    {
      step: "02",
      title: "The Record",
      body: "Fourteen years of Commons divisions compiled into a TheyWorkForYou fingerprint — nineteen votes against a stricter asylum system, zero rebellions. The record does not forget, and neither do her opponents.",
    },
    {
      step: "03",
      title: "The Office",
      body: "First the courts, sentencing and prisons; then MI5, the police, Prevent, proscription and the borders. The machinery she once voted to restrain is now the machinery she runs.",
    },
    {
      step: "04",
      title: "The Spread",
      body: "Dispersal as permanent architecture: £15 billion in contracts, military camps, a 2029 hotel horizon, and a 'fair spread' into every community in the country — in her own words, on the record.",
    },
  ],
  closing: [
    "What the record establishes is power and its use: a politician who voted against every restrictive instrument for fourteen years, then built the most restrictive asylum architecture in a generation; who fought 'two-tier' sentencing in the courts and dismissed 'two-tier policing' in the streets; who de-proscribed a former al-Qaeda franchise while 3,000 people were arrested under a ban she inherited and defended.",
    "What the record does not establish is the caricature — in either direction. She did not say 'illegal migrants' in the Times interview; the Prevent budget rose in cash terms under her tenure; the Kebatu release was her successor's at Justice, not hers. Those corrections are in this file because a dossier that keeps the false claims will be disbelieved in the true ones.",
    "The network around this file — the party, the seat, the contracts, the departments, the lobby — is mapped, node by node, in the UK Power Map. This timeline is the chronology; the map is the machine. Read them together.",
  ],
  extraSections: [],
};

export type MahmoodData = TimelineData;

/* =========================================================
   DEEP MERGE — admin override over hardcoded defaults
   ---------------------------------------------------------
   Identical pattern to starmer.tsx / long-march.tsx: every
   top-level field is per-field merged so shipping new default
   copy does NOT require a re-save from the admin UI.
   ========================================================= */
function nonEmptyArray<T>(a: T[] | undefined | null): a is T[] {
  return Array.isArray(a) && a.length > 0;
}

function nonEmptyString(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function mergeData(override: Partial<TimelineData> | null | undefined): TimelineData {
  if (!override || typeof override !== "object") return MAHMOOD_DATA;

  const defaultEventByKey = new Map(
    MAHMOOD_DATA.timeline.map((e) => [`${e.year}|${e.title}`, e]),
  );
  const mergedTimeline = nonEmptyArray(override.timeline)
    ? override.timeline.map((e, i) => {
        const def =
          defaultEventByKey.get(`${e.year}|${e.title}`) ??
          MAHMOOD_DATA.timeline[i];
        if (!def) return e;
        return {
          ...def,
          ...e,
          act: e.act ?? def.act,
          detail: nonEmptyString(e.detail) ? e.detail : def.detail,
          pullQuote: e.pullQuote ?? def.pullQuote,
          imageUrl: e.imageUrl || def.imageUrl,
          links: nonEmptyArray(e.links) ? e.links : def.links,
        };
      })
    : MAHMOOD_DATA.timeline;

  const defaultTacticByName = new Map(
    MAHMOOD_DATA.tactics.map((t) => [t.name, t]),
  );
  const mergedTactics = nonEmptyArray(override.tactics)
    ? override.tactics.map((t) => {
        const def = defaultTacticByName.get(t.name);
        if (!def) return t;
        return { ...def, ...t, axis: t.axis ?? def.axis };
      })
    : MAHMOOD_DATA.tactics;

  const defaultEngineByStep = new Map(
    MAHMOOD_DATA.engine.map((s) => [s.step, s]),
  );
  const mergedEngine = nonEmptyArray(override.engine)
    ? override.engine.map((s, i) => {
        const def =
          defaultEngineByStep.get(s.step) ?? MAHMOOD_DATA.engine[i];
        if (!def) return s;
        return {
          ...def,
          ...s,
          title: nonEmptyString(s.title) ? s.title : def.title,
          body: nonEmptyString(s.body) ? s.body : def.body,
        };
      })
    : MAHMOOD_DATA.engine;

  const mergedThesis = nonEmptyArray(override.thesis)
    ? override.thesis.filter(nonEmptyString)
    : MAHMOOD_DATA.thesis;
  const finalThesis = nonEmptyArray(mergedThesis) ? mergedThesis : MAHMOOD_DATA.thesis;

  const mergedClosing = nonEmptyArray(override.closing)
    ? override.closing.filter(nonEmptyString)
    : MAHMOOD_DATA.closing;
  const finalClosing = nonEmptyArray(mergedClosing) ? mergedClosing : MAHMOOD_DATA.closing;

  return {
    contentVersion: override.contentVersion ?? MAHMOOD_DATA.contentVersion,
    meta: { ...MAHMOOD_DATA.meta, ...(override.meta || {}) },
    thesis: finalThesis,
    acts: nonEmptyArray(override.acts) ? override.acts : MAHMOOD_DATA.acts,
    timeline: mergedTimeline,
    tactics: mergedTactics,
    engine: mergedEngine,
    closing: finalClosing,
    extraSections: override.extraSections ?? MAHMOOD_DATA.extraSections,
  };
}

export default function MahmoodPage() {
  const { data: saved } = useQuery({
    queryKey: ["/api/page-content/mahmood"],
    queryFn: () => getPageContent<Partial<TimelineData>>("mahmood"),
    staleTime: 30_000,
    retry: 1,
  });

  const useDefaults =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("defaults") === "1";

  const D = useDefaults ? MAHMOOD_DATA : mergeData(saved);

  return (
    <>
      <MembersOnlyBanner variant="auto" />
      <PageStatusGate slug="mahmood" name="Shabana Mahmood">
        <TimelineRenderer data={D} />
        <TimelineReactions slug="mahmood" />
      </PageStatusGate>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { PageStatusGate } from "@/components/page-status-gate";
import { TimelineRenderer, type TimelineData } from "@/components/timeline-renderer";
import { getPageContent } from "@/lib/page-status";
import { getMe } from "@/lib/auth";
import { MembersOnlyBanner } from "@/components/members-only-banner";
import { TimelineReactions } from "@/components/timeline-reactions";

/* =========================================================
   STARMER — DOSSIER TIMELINE
   ---------------------------------------------------------
   Critical, sceptical political-intelligence timeline on
   Sir Keir Starmer KCB KC. Four acts:
     I.   Early Life & Education
     II.  Legal Career
     III. Politics (opposition)
     IV.  In Office — twenty scandals
   British English throughout. Sources: BBC, Reuters,
   Guardian, Independent, Spectator, Sky News, AP, NYT,
   YouGov, FullFact, Byline Times, Lord Ashcroft,
   Declassified UK, Al Jazeera, Wikipedia.
   ========================================================= */

export const STARMER_CONTENT_VERSION = 1;

export const STARMER_DATA: TimelineData = {
  contentVersion: STARMER_CONTENT_VERSION,
  meta: {
    dossierCode: "DOSSIER // DB-KS-005",
    eyesOnly: "EYES ONLY — ADMIN",
    fileTag: "FILE: STARMER / v1.0",
    title: "Sir Keir Starmer",
    subtitle: "A sceptical political-intelligence timeline of the 58th Prime Minister",
    byline: "Filed by DinoBane Intel · dinobane.com",
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/2d/Keir_Starmer_official_portrait.jpg",
  },
  thesis: [
    "Sir Keir Starmer arrived in Downing Street on 5 July 2024 with a 174-seat majority built on 33.7% of votes cast — the lowest vote share for any governing party in recorded British electoral history. The mandate was structural, not popular: a Conservative collapse, a Reform surge, and a first-past-the-post system that converted one third of the country into two thirds of the seats.",
    "This dossier follows him from a Surrey commuter-belt childhood, through human-rights lawyering and a five-year tenure as Director of Public Prosecutions, into Parliament, the Labour leadership, and the office of Prime Minister. It tracks the ten leadership pledges, their methodical retirement, and the twenty scandals — gifts, departures, U-turns, abolitions and humiliations — that have defined the first 22 months of government.",
    "The thesis is not that he holds no values. It is that he treats political pledges instrumentally — as recruitment devices for one audience, then as fiscal-realism casualties for the next — and that the cumulative effect is a leadership defined less by what it does than by what it eventually concedes under sustained pressure.",
  ],
  acts: [
    {
      id: "early-life",
      label: "Act I",
      kicker: "Act I · Origins",
      title: "Toolmaker's Son, Bursaried Pupil, Middle-Class Radical",
      years: "1962 — 1985",
      lede: "A Surrey boyhood, a fee-paying school he likes to call state, a teenage Marxist magazine in the Thatcher years, a first-in-family-to-university first-class law degree. The biographical raw material from which a Prime Minister's identity will be repeatedly reassembled.",
    },
    {
      id: "legal-career",
      label: "Act II",
      kicker: "Act II · The Bar",
      title: "Doughty Street to the Director's Office",
      years: "1987 — 2013",
      lede: "Twenty-six years at the Bar: human-rights advocate, McLibel pro bono, Queen's Counsel, then five years running the Crown Prosecution Service. The legal career is the foundation of the political brand — and the source of its most uncomfortable questions.",
    },
    {
      id: "politics",
      label: "Act III",
      kicker: "Act III · Westminster",
      title: "Ten Pledges, Two Leaders, One Landslide",
      years: "2015 — July 2024",
      lede: "From Holborn back-bench to Shadow Brexit Secretary, from the Corbyn shadow cabinet to the leadership won on ten radical pledges, to a 174-seat majority on 33.7% of the vote — the structural gift, not the popular mandate.",
    },
    {
      id: "in-office",
      label: "Act IV",
      kicker: "Act IV · In Office",
      title: "The Twenty Scandals",
      years: "July 2024 — May 2026",
      lede: "Twenty-two months in Downing Street; net approval of −54 by November 2025; 1,496 councillors lost in May 2026. Each entry below is a separate episode — gifts, sackings, U-turns, abolitions — that together describe a method.",
    },
  ],
  timeline: [
    /* ─── ACT I · EARLY LIFE & EDUCATION ─────────────────── */
    {
      act: "early-life",
      year: "1962",
      title: "Born in Southwark, named for Keir Hardie",
      place: "Southwark, London → Oxted, Surrey",
      key: true,
      body: "Keir Rodney Starmer is born on 2 September 1962. His father Rodney is a toolmaker; his mother Josephine, a nurse with Still's disease. The parents — Labour activists — name him after Keir Hardie, the Scottish miner who co-founded the Labour Party in 1900.",
      detail:
        "Two facts will be used and reused across his career, and one of them will be quietly fudged. The toolmaker father is real — and Starmer's most-deployed rhetorical line in conference speeches and PMQs is 'my dad was a toolmaker.' Critics note the calibration: Oxted is among Surrey's more prosperous commuter-belt towns, and the family was modestly middle-working-class rather than industrial poor. The naming after Hardie is also real, and is offered by supporters as evidence of socialist heritage. The symbolic distance between Hardie — an uncompromising advocate of independent working-class representation, pacifism and women's suffrage — and Starmer's centrist governing record has not gone unremarked. He will repeatedly invoke the household telephone being disconnected at times of hardship; he will much less often invoke the bursary that paid for his sixth form at an independent school.",
      pullQuote: {
        text: "My dad was a toolmaker working in a factory and working every hour, basically.",
        attribution: "Keir Starmer, BBC interview with Nick Robinson, March 2018",
      },
      imageUrl: "https://c.files.bbci.co.uk/b587/live/fb93aa40-3acd-11ef-a044-9d4367d5b599.jpg",
      links: [
        { label: "BBC profile — Labour leader hoping for keys to Downing Street", url: "https://www.bbc.com/news/uk-politics-66304053" },
        { label: "Lord Ashcroft — King of the Middle-Class Radicals", url: "https://www.lordashcroft.com/2021/06/king-of-the-middle-class-radicals-that-was-grammar-school-educated-sir-keir-starmers-university-nickname/" },
      ],
    },
    {
      act: "early-life",
      year: "1974–1981",
      title: "Reigate Grammar — the \"state school\" controversy",
      place: "Reigate, Surrey",
      key: true,
      body: "He enters Reigate Grammar in 1974 when it is state-funded. Two years later it converts to an independent fee-paying school. Surrey County Council honours fees for pupils already enrolled; at 16, the school awards him a bursary. He pays nothing — but is taught at an independent school for five of his seven years.",
      detail:
        "The controversy reignited in January 2025 when Starmer's government imposed 20% VAT on private school fees — affecting the very institution he had attended under different funding arrangements. Sir Peter Lampl, founder of the Sutton Trust and a fellow Reigate Grammar alumnus, accused Starmer of 'fudging the facts' by presenting himself as a state-school pupil to contrast with privately educated opponents. Starmer's defence — that his family paid no fees — is technically accurate, but his school was an independent institution offering substantially more co-curricular resources than neighbouring state schools, and is today fee-paying with an annual cost of approximately £20,000. The pattern — a biographical claim that survives a narrow factual test while obscuring an inconvenient wider context — will recur.",
      pullQuote: {
        text: "I don't pretend the school we went to was a state school. Starmer does. But he is fudging the facts.",
        attribution: "Sir Peter Lampl, Sutton Trust founder and fellow Reigate Grammar alumnus, January 2025",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Reigate_Grammar_School.jpg",
      links: [
        { label: "Sunday Times via Yahoo — Starmer accused of 'fudging the facts'", url: "https://uk.news.yahoo.com/starmer-accused-fudging-facts-schooling-231936555.html" },
        { label: "GB News — Starmer accused of 'pretending' he attended state school", url: "https://www.gbnews.com/politics/keir-starmer-reigate-grammar-school-private-state" },
      ],
    },
    {
      act: "early-life",
      year: "c.1978–1980",
      title: "East Surrey Young Socialists & Socialist Alternatives",
      place: "Oxted / East Surrey",
      key: false,
      body: "At 16, he joins the East Surrey Young Socialists. He becomes a co-editor of Socialist Alternatives, a small-circulation Marxist-inflected magazine published in the early-1980s. A brief, authentic engagement with the hard left in the Thatcher era.",
      detail:
        "The biographical record is scant on what specifically he wrote, but his contemporaneous association with the far-left margin of Labour is well-attested — confirmed in his 2020 Desert Island Discs interview. The arc that follows is the dossier in miniature: Thatcherite-era teenage Marxism → human-rights lawyering → centrist triangulation as PM. Critics argue this is radical politics as a phase rather than a conviction; defenders argue political maturation is normal. What is not in dispute is that the trajectory has been steady, in one direction, and that nothing remains of the original positions.",
      imageUrl: "https://c.files.bbci.co.uk/b587/live/fb93aa40-3acd-11ef-a044-9d4367d5b599.jpg",
      links: [
        { label: "Desert Island Discs — Starmer on his political awakening", url: "https://podcasts.apple.com/it/podcast/sir-keir-starmer-leader-of-the-opposition/id342735925?i=1000498668648" },
      ],
    },
    {
      act: "early-life",
      year: "1982–1986",
      title: "Leeds (1st class) and Oxford BCL",
      place: "Leeds → Oxford",
      key: false,
      body: "Reads Law at Leeds, graduating with a first-class degree in 1985 — the first member of his family to attend university. Takes the BCL postgraduate law degree at St Edmund Hall, Oxford in 1986.",
      detail:
        "Leeds was and remains a Russell Group institution; St Edmund Hall is a mid-ranking but solidly academic Oxford college. The BCL is a postgraduate taught degree which gave Starmer a grounding in comparative and European law that would prove professionally useful. His university nickname, according to Lord Ashcroft's reporting, was 'the middle-class radical' — a sobriquet that has proved remarkably durable.",
      imageUrl: "https://c.files.bbci.co.uk/b587/live/fb93aa40-3acd-11ef-a044-9d4367d5b599.jpg",
      links: [
        { label: "Lord Ashcroft profile", url: "https://www.lordashcroft.com/2021/06/king-of-the-middle-class-radicals-that-was-grammar-school-educated-sir-keir-starmers-university-nickname/" },
      ],
    },

    /* ─── ACT II · LEGAL CAREER ──────────────────────────── */
    {
      act: "legal-career",
      year: "1987",
      title: "Called to the Bar",
      place: "London",
      key: false,
      body: "Starmer is called to the Bar in 1987 and begins practising criminal defence and human-rights law. He is associated with Doughty Street Chambers — one of Britain's leading human-rights sets — from its co-founding in 1990, and serves as secretary of the Haldane Society of Socialist Lawyers.",
      detail:
        "Doughty Street became closely associated with the European Convention on Human Rights and the Human Rights Act — legal architecture that Starmer would later defend, as both DPP and PM, against Conservative proposals for a British Bill of Rights. His early years are characterised by pro bono work for defendants who would not otherwise have had effective representation — the credentialing period that supplies the lifelong rhetorical inoculation against accusations of metropolitan elitism.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/68/Doughty_Street_Chambers_04.JPG",
      links: [
        { label: "Wikipedia — Legal career of Keir Starmer", url: "https://en.wikipedia.org/wiki/Legal_career_of_Keir_Starmer" },
      ],
    },
    {
      act: "legal-career",
      year: "1990s — 2005",
      title: "McLibel — McDonald's vs two environmentalists",
      place: "London / European Court of Human Rights",
      key: true,
      body: "Starmer provides extensive pro bono assistance to Helen Steel and Dave Morris, sued by McDonald's for distributing a critical leaflet — the longest civil trial in English legal history. After they lose at trial, he wins their appeal at the ECtHR in 2005, ruling that the UK's refusal of libel legal aid breached Articles 6 and 10 of the Convention.",
      detail:
        "Steel later described Starmer as 'a socialist lawyer' who 'helped us for free for a very, very long time.' The case remains one of the most-cited examples of Starmer's pre-political credentials among supporters. From a sceptical standpoint, the McLibel association provides durable, media-friendly human-interest cover for the later centrist repositioning: 'see, he once defended two people against a multinational' functions as rhetorical inoculation against left-wing criticism of any subsequent pivot.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/%22What%27s_wrong_with_McDonalds_-_everything_they_don%27t_want_you_to_know%22_leaflet_cover.jpg/250px-%22What%27s_wrong_with_McDonalds_-_everything_they_don%27t_want_you_to_know%22_leaflet_cover.jpg",
      links: [
        { label: "Wikipedia — McLibel case", url: "https://en.wikipedia.org/wiki/McLibel_case" },
        { label: "Politics Home — When Keir Took On McDonald's", url: "https://www.politicshome.com/thehouse/article/keir-took-mcdonalds" },
      ],
    },
    {
      act: "legal-career",
      year: "2002",
      title: "Queen's Counsel",
      place: "London",
      key: false,
      body: "Takes silk in 2002, becoming a Queen's Counsel at 39. Continues practising at Doughty Street: anti–death penalty work in the Caribbean, IRA-suspect cases, appellate and ECHR work.",
      imageUrl: "https://www.doughtystreet.co.uk/sites/default/files/media/images/doughty_street-3497-old-keir.jpg",
      links: [
        { label: "Wikipedia — Legal career of Keir Starmer", url: "https://en.wikipedia.org/wiki/Legal_career_of_Keir_Starmer" },
      ],
    },
    {
      act: "legal-career",
      year: "Nov 2008",
      title: "Director of Public Prosecutions",
      place: "Westminster / London",
      key: true,
      body: "Appointed by Attorney General Patricia Scotland as Director of Public Prosecutions and head of the Crown Prosecution Service. Five-year tenure from 1 November 2008 until November 2013. The role places him at the top of the principal prosecuting authority for England and Wales during a period of acute political sensitivity.",
      detail:
        "His tenure produced significant institutional reform — modernising the CPS approach to rape prosecutions, introducing the Victims' Right to Review, pushing for early charge decisions. It also produced the decisions that would later attract sustained scrutiny: the 2009 Savile non-prosecution, the 2008–09 Rochdale non-prosecution, the Assange extradition trips to Washington, and the 2011 riots prosecutorial sprint. Almost all of them are now defended on the same template: not personal — institutional. Personally unaware. The advice was independent. The records were destroyed.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/DPP_Keir_Starmer_in_2009_%28cropped%29.jpg/250px-DPP_Keir_Starmer_in_2009_%28cropped%29.jpg",
      links: [
        { label: "Labour Party — Starmer's time as DPP", url: "https://labour.org.uk/updates/stories/keir-starmers-time-as-director-of-public-prosecutions/" },
      ],
    },
    {
      act: "legal-career",
      year: "Oct 2009",
      title: "Jimmy Savile — CPS decision not to prosecute",
      place: "Surrey",
      key: true,
      body: "In October 2009 — 11 months into Starmer's DPP tenure — the CPS advises Surrey Police not to charge Savile, citing reluctant complainants and insufficient evidence. The file is later destroyed on 26 October 2010. Starmer maintains he was personally unaware. In January 2013 he issues a formal apology for 'shortcomings in the part played by the CPS'.",
      detail:
        "The Levitt inquiry (January 2013) found 'no reference within the report to any involvement from the DPP in the decision-making' and concluded the decision was made 'in good faith' but that the CPS had been 'overly cautious.' Lord Ashcroft's May 2025 investigation raises pointed questions which remain unresolved: three CPS meetings with Surrey Police occurred during Starmer's first year as DPP; the file was destroyed under his watch in October 2010; and the January 2013 apology implicitly acknowledged institutional failure regardless of personal knowledge. Critics contend that an institution processing 900,000 prosecutions a year cannot plausibly be led by someone who knew nothing of one of the most high-profile cases of the era. Supporters reply that DPPs are not file-by-file decision-makers.",
      pullQuote: {
        text: "I would like to take the opportunity to apologise for the shortcomings in the part played by the CPS in these cases.",
        attribution: "Keir Starmer, January 2013, following the Levitt report",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/DPP_Keir_Starmer_in_2009_%28cropped%29.jpg/400px-DPP_Keir_Starmer_in_2009_%28cropped%29.jpg",
      links: [
        { label: "BBC Reality Check — Boris Johnson's Savile claim", url: "https://www.bbc.com/news/60213975" },
        { label: "Lord Ashcroft — Troubling questions on Savile (May 2025)", url: "https://www.lordashcroft.com/2025/05/keir-starmer-must-answer-troubling-questions-about-jimmy-savile-scandal/" },
        { label: "Politics.co.uk — Keir Starmer Jimmy Savile reference", url: "https://www.politics.co.uk/reference/keir-starmer-jimmy-savile/" },
      ],
    },
    {
      act: "legal-career",
      year: "2008–2009",
      title: "Rochdale grooming — CPS declines to prosecute",
      place: "Rochdale, Greater Manchester",
      key: false,
      body: "During 2008–09, the CPS reviews a Rochdale child-sexual-exploitation investigation and declines to prosecute on the grounds that the principal victim is 'unreliable.' In 2011, Nazir Afzal — appointed Chief Crown Prosecutor for the North West by Starmer himself — overturns the decision. Nine men are subsequently convicted.",
      detail:
        "FullFact found no evidence Starmer was personally involved in the original 2008–09 decision; Afzal has publicly stated Starmer was '100% behind' the 2011 reversal and the subsequent public admission that the CPS had 'got it wrong.' The episode sits at the heart of the 2025 grooming-gangs row (see Scandal 11 below). For now, what it adds to the DPP ledger is the second of a series of high-profile non-prosecutions during his tenure — institutional failures defensible as not personal, but unavoidable as record.",
      imageUrl: "https://c.files.bbci.co.uk/9cf3/live/346862e0-eaf8-11ef-bd1b-d536627785f2.jpg",
      links: [
        { label: "BBC — Starmer's record on prosecuting grooming gangs", url: "https://www.bbc.com/news/articles/cvgn2wvxx5qo" },
        { label: "FullFact — Starmer and Muslim grooming prosecutions", url: "https://fullfact.org/online/starmer-muslim-grooming-prosecution-crime/" },
      ],
    },
    {
      act: "legal-career",
      year: "2010–2013",
      title: "Julian Assange — four Washington trips, destroyed records",
      place: "London / Washington DC",
      key: true,
      body: "During Starmer's DPP tenure, the CPS oversees the attempt to extradite Assange to Sweden. Starmer makes four official trips to Washington (2009, 2011, 2012, 2013) costing £21,603, meeting US Attorney General Eric Holder and national-security officials. All records of those trips were subsequently destroyed by the CPS.",
      detail:
        "Investigative reporting by Declassified UK (via FOI) revealed in 2023 that the CPS had deleted itineraries, briefing notes and meeting records from the Washington trips. The CPS's Italian-language FOI response to journalist Stefania Maurizi further revealed that a CPS lawyer had advised Swedish prosecutors in 2010 or 2011 not to travel to London to interview Assange — advice that critics argue prolonged Assange's legal limbo by years. Starmer's defenders say the trips were routine for a DPP maintaining international prosecutorial relationships; Starmer himself has said he played no personal role in the Assange extradition strategy. The destruction of records prevents independent verification of either claim.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/DPP_Keir_Starmer_in_2009_%28cropped%29.jpg/500px-DPP_Keir_Starmer_in_2009_%28cropped%29.jpg",
      links: [
        { label: "Declassified UK — CPS destroyed records of Starmer's Washington trips", url: "https://www.declassifieduk.org/cps-has-destroyed-all-records-of-keir-starmers-four-trips-to-washington/" },
      ],
    },
    {
      act: "legal-career",
      year: "Dec 2013",
      title: "Knighthood — KCB",
      place: "London",
      key: false,
      body: "Appointed a Knight Commander of the Order of the Bath in the 2014 New Year Honours for his services as Director of Public Prosecutions. Leaves the DPP post in November 2013, an established member of the British legal establishment.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Keir_Starmer_official_portrait.jpg",
      links: [
        { label: "GOV.UK — The New Year's Honours 2014", url: "https://www.gov.uk/government/news/the-new-years-honours-2014" },
      ],
    },

    /* ─── ACT III · POLITICS ─────────────────────────────── */
    {
      act: "politics",
      year: "May 2015",
      title: "MP for Holborn and St Pancras",
      place: "Westminster",
      key: false,
      body: "Elected as the Labour MP for Holborn and St Pancras at the 2015 general election, aged 52, with no prior elected experience. Enters the shadow cabinet almost immediately under Jeremy Corbyn, who becomes Labour leader four months later.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Keir_Starmer_official_portrait.jpg",
      links: [
        { label: "BBC profile", url: "https://www.bbc.com/news/uk-politics-66304053" },
      ],
    },
    {
      act: "politics",
      year: "Oct 2016",
      title: "Shadow Brexit Secretary — the second-referendum push",
      place: "Westminster",
      key: true,
      body: "Appointed Shadow Secretary of State for Exiting the European Union. Over the following three years, he becomes the principal internal advocate for a 'confirmatory vote' on any Brexit deal — the role that more than any other shaped Labour's pro-second-referendum 2019 stance.",
      detail:
        "Former Downing Street chief of staff Gavin Barwell has stated in memoirs that during 2019 cross-party talks Starmer 'was not prepared to settle for anything that didn't include a confirmatory vote.' Starmer himself told a Labour conference in 2018: 'Nobody is ruling out Remain as an option!' — his first standing ovation. Labour lost 60 seats at the December 2019 election; analysis pointed heavily to Leave-voting northern constituencies abandoning the party in response to a Brexit stance Starmer had done more than almost anyone else to shape. He has spent the period since attempting, with limited success, to detach his political identity from that of the second-referendum movement that helped collapse the 'red wall.'",
      pullQuote: {
        text: "Nobody is ruling out Remain as an option!",
        attribution: "Keir Starmer, Labour Party conference, 2018",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5d/People%27s_Vote_March_2018-10-20_-_Brexit_is_it_worth_it.jpg",
      links: [
        { label: "Evening Standard — 'Brexit can be stopped'", url: "https://www.standard.co.uk/news/politics/labour-shadow-brexit-secretary-sir-keir-starmer-brexit-can-be-stopped-a3987241.html" },
      ],
    },
    {
      act: "politics",
      year: "Apr 2020",
      title: "Labour leadership — the Ten Pledges",
      place: "Westminster",
      key: true,
      body: "Wins the Labour leadership on 4 April 2020 with 56.2% in the first round. The campaign is built around ten explicit pledges — radical redistribution, common ownership, free movement, abolition of tuition fees, abolition of the two-child benefit cap — explicitly designed to appeal to Labour members who had voted for Corbyn. Almost every one will be quietly retired, redefined or abandoned before the 2024 election.",
      detail:
        "The pledges: (1) tax rises for the top 5%; (2) corporation-tax rises; (3) scrap Universal Credit; (4) scrap the two-child cap and punitive sanctions; (5) defend free movement; (6) common ownership of rail, mail, energy, water; end NHS outsourcing; (7) abolish tuition fees; (8) no compromise on workers' rights in Brexit; (9) £10/hr minimum wage; (10) proportional representation. By 2024 the position had become: free movement explicitly dropped (November 2022); nationalisation narrowed to a state-owned energy company; tuition fees — 'we are likely to move on from that commitment' (May 2024); the two-child cap maintained for 17 months in government before scrapping (November 2025, effective April 2026); top-5% taxes quietly shelved. The Big Issue maintains a running ledger.",
      pullQuote: {
        text: "Too many people today are struggling to make ends meet, held back by jobs that don't pay enough; a social security system that has subjected people to the most appalling indignity.",
        attribution: "Keir Starmer, leadership campaign tweet, 2020",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Keir_Starmer%2C_2020_Labour_Party_leadership_election_hustings%2C_Bristol_4.jpg",
      links: [
        { label: "Big Issue — All of Keir Starmer's U-turns and abandoned pledges", url: "https://www.bigissue.com/news/politics/keir-starmer-broken-promises-tuition-fees-nationalisation-u-turn/" },
      ],
    },
    {
      act: "politics",
      year: "Oct 2020",
      title: "Corbyn suspended after EHRC report",
      place: "Westminster",
      key: false,
      body: "On 29 October 2020 the Equality and Human Rights Commission publishes its report into Labour antisemitism. Within hours Corbyn issues a statement suggesting the extent of the problem had been 'dramatically overstated for political reasons.' Starmer suspends him from the Parliamentary Labour Party the same day; the whip is never returned. Corbyn stands as an independent in 2024 and wins Islington North with a 7,000 majority.",
      detail:
        "The suspension was legally controversial: Corbyn was reinstated as a party member in November 2020, but Starmer refused to return the whip. The 2024 Islington North result — a previously safe Labour seat lost to its previous leader running as an independent — is widely interpreted as a rebuke to the Starmer leadership from a traditionally loyal seat. The episode is the bookend of the Forde-Report era (see below) — a leadership that came to power as a reset from Corbynism, and which arrived in office having taken pieces of the membership permanently with it as an opposition.",
      links: [
        { label: "BBC — Starmer defends Corbyn suspension", url: "https://www.bbc.com/news/uk-politics-54742096" },
        { label: "CNN — Jeremy Corbyn suspension", url: "https://www.cnn.com/2020/10/29/uk/labour-corbyn-anti-semitism-report-scli-intl-gbr" },
      ],
      imageUrl: "https://www.aljazeera.com/wp-content/uploads/2020/11/2019-11-05T105952Z_1400660169_RC171ABA53D0_RTRMADP_3_BRITAIN-ELECTION-CORBYN.jpg",
    },
    {
      act: "politics",
      year: "Jul 2022",
      title: "Forde Report — factionalism on the record",
      place: "Westminster",
      key: false,
      body: "Martin Forde KC's report — commissioned in 2020 — finds that elements of Labour's senior management had deliberately diverted resources away from pro-Corbyn candidates, and that antisemitism had been 'weaponised' by both sides. It establishes that senior Labour staff had expressed racist attitudes about Diane Abbott and Corbyn allies, and had deliberately thrown elections in Labour-held seats.",
      detail:
        "The Forde Report did not directly implicate Starmer in the factional conduct, which largely predated his leadership. But it was devastating for the party's institutional reputation and embarrassing for a senior figure of the Corbyn-era opposition. Starmer responded by accepting the findings, establishing new complaints processes, and commissioning further work — while critics noted that most of the individuals identified in the leaked WhatsApp messages faced no disciplinary consequences. The pattern — accept 'institutional' failure, announce a process, move on — will recur throughout the in-office period.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Keir_Starmer_official_portrait.jpg",
      links: [
        { label: "Labour Party — The Forde Report", url: "https://labour.org.uk/resources/the-forde-report/" },
        { label: "Jacobin — Forde Report exposes Starmerism's foundations", url: "https://jacobin.com/2022/07/forde-report-starmer-corbyn-labour-antisemitism" },
      ],
    },
    {
      act: "politics",
      year: "4 Jul 2024",
      title: "Landslide without majority of votes",
      place: "Westminster",
      key: true,
      body: "Labour wins 411 seats and a 174-seat majority — the third-best result in its history — on 33.7% of the vote, the lowest vote share for any governing party in recorded British electoral history. Reform UK takes 14.3% and 5 seats; the Greens take 6.7% and 4. Starmer enters Downing Street on 5 July, appointed by King Charles III.",
      detail:
        "The paradox of 2024 is central to any assessment of the Starmer mandate. A 174-seat majority on one-third of votes represents not a positive endorsement but a catastrophic collapse in the Conservative vote (from 43.6% in 2019 to 23.7% in 2024) combined with the effects of first-past-the-post on a split opposition. Starmer himself acknowledged the result was 'beyond what I dared to hope' — language that implicitly conceded the result was not a popular mandate. The disproportion will be felt sharply in two years' time, when Reform UK outpolls Labour in the May 2026 locals (see Scandal 20).",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/88/Prime_Minister_Sir_Keir_Starmer_arrives_at_10_Downing_Street_%2853837066630%29.jpg",
      links: [
        { label: "Wikipedia — 2024 United Kingdom general election", url: "https://en.wikipedia.org/wiki/2024_United_Kingdom_general_election" },
        { label: "BBC — 2024 results in maps and charts", url: "https://www.bbc.co.uk/news/articles/c4nglegege1o" },
      ],
    },

    /* ─── ACT IV · IN OFFICE — 20 SCANDALS ───────────────── */
    {
      act: "in-office",
      year: "Aug–Oct 2024",
      title: "Scandal 1 · Giftgate — Lord Alli, the freebies, the £6k refund",
      place: "Westminster / London",
      key: true,
      body: "Starmer accepts more gifts than any other MP since 2019 — totalling around £82,000, a third from Labour peer Lord Waheed Alli. Spectacles worth £2,435; clothing worth at least £16,000 declared to his 'private office'; an undisclosed £5,000 of gifts including a personal shopper for his wife; six Taylor Swift tickets worth £2,800; race day tickets; accommodation worth over £20,000. Alli is granted an unrestricted Downing Street security pass despite holding no government role. On 2 October 2024, Starmer pays back £6,000 of gifts.",
      detail:
        "The political damage was compounded by two factors: Labour had campaigned explicitly on 'cleaning up politics,' and the government had simultaneously means-tested winter fuel payments and maintained the two-child cap. Rosie Duffield MP resigned the Labour whip on 28 September 2024 in protest, accusing Starmer of 'sleaze, nepotism and apparent avarice off the scale' and calling him a hypocrite for accepting gifts while pursuing 'cruel and unnecessary' welfare cuts. The Standards Commissioner investigation was closed in March 2025 without a finding of misconduct. The episode crystallised the central political vulnerability of the 'change' brand: that it applied to others rather than to Labour itself.",
      pullQuote: {
        text: "Sleaze, nepotism and apparent avarice off the scale.",
        attribution: "Rosie Duffield MP, resignation statement, 28 September 2024",
      },
      imageUrl: "https://c.files.bbci.co.uk/7a30/live/38fca1c0-7cff-11ef-bd2c-0185b56882c9.jpg",
      links: [
        { label: "BBC — Starmer may have broken rules over donor's gifts to wife", url: "https://www.bbc.com/news/articles/c8djply3z18o" },
        { label: "Sky News — Starmer pays back £6,000 worth of gifts", url: "https://news.sky.com/story/sir-keir-starmer-pays-back-6-000-worth-of-gifts-including-taylor-swift-tickets-13226677" },
        { label: "Wikipedia — 2024 Labour Party freebies controversy", url: "https://en.wikipedia.org/wiki/2024_Labour_Party_freebies_controversy" },
      ],
    },
    {
      act: "in-office",
      year: "Sep–Nov 2024",
      title: "Scandal 2 · Sue Gray — paid more than the PM, then leaked out",
      place: "Downing Street",
      key: true,
      body: "In September 2024 the BBC reveals Starmer's Chief of Staff Sue Gray earns £170,000 — £3,000 more than the Prime Minister. The leak is attributed to internal allies of Starmer's chief political adviser Morgan McSweeney. On 6 October 2024, Gray resigns. Starmer offers her a new 'envoy to the nations and regions' role; on Cabinet Secretary Simon Case's recommendation it is withdrawn — an unprecedented public humiliation.",
      detail:
        "Gray had led the Partygate investigation into Boris Johnson — an appointment that had attracted Conservative accusations of politicising the civil service. Inside No. 10 she was perceived as insufficiently political and slow to adapt from Whitehall to a political chief of staff role. The internal briefing war against her was brutal enough to prompt a senior official to leak a confidential salary figure to the BBC — a measure of how dysfunctional relations had become. Starmer subsequently told Civil Service World she was 'the wrong person for the job' — a post-hoc justification for a departure engineered from within his own operation.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Sue_Gray_%28civil_servant%29_official_portrait_%28cropped%29.jpg",
      links: [
        { label: "BBC — Sue Gray quits as chief of staff", url: "https://www.bbc.com/news/articles/cdenx2p32jxo" },
        { label: "Spectator — Sue Gray paid more than the Prime Minister", url: "https://spectator.com/article/sue-gray-paid-more-than-the-prime-minister/" },
        { label: "Sky News — Gray rejects Starmer's envoy offer", url: "https://news.sky.com/story/sue-gray-rejects-starmers-job-offer-after-quitting-as-chief-of-staff-13253141" },
      ],
    },
    {
      act: "in-office",
      year: "Jul 2024 → Jun 2025",
      title: "Scandal 3 · Winter Fuel Payments — cut, then quietly restored",
      place: "Westminster",
      key: true,
      body: "Chancellor Rachel Reeves restricts the Winter Fuel Payment (£200–£300/year) to pensioners on Pension Credit, removing it from approximately 9 million pensioners with no pre-election warning. On 21 May 2025 Starmer announces a partial U-turn at PMQs; on 9 June 2025 the restoration is formally confirmed for all but those earning over £35,000 — too late for winter 2024.",
      detail:
        "Age UK estimated the cut would force 50,000 additional pensioners into poverty. The decision was widely credited with accelerating pensioner defections to Reform UK and contributed materially to Labour's poll collapse through autumn and winter 2024. The U-turn came almost exactly 11 months after the original cut — a reversal that simultaneously undermined the government's central 'fiscal credibility' argument (having depicted the cut as financially unavoidable, Reeves found the money within a year) and confirmed the operating template: cut → deny → reverse → frame as 'listening.'",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Official_portrait_of_Rachel_Reeves.jpg",
      links: [
        { label: "BBC — Starmer announces winter fuel U-turn", url: "https://www.bbc.com/news/articles/c93yy2x40e0o" },
        { label: "Reuters — UK to restore winter fuel payments", url: "https://www.reuters.com/world/uk/uk-restore-winter-fuel-payments-millions-pensioners-major-u-turn-2025-06-09/" },
      ],
    },
    {
      act: "in-office",
      year: "Dec 2024",
      title: "Scandal 4 · WASPI women — pledge ignored",
      place: "Westminster",
      key: false,
      body: "On 17 December 2024 Work and Pensions Secretary Liz Kendall announces that the government will not compensate the 3.8 million women born in the 1950s inadequately informed of the increase in the state pension age. The Parliamentary and Health Service Ombudsman had recommended £1,000–£2,950 per woman; the government cites a £10.5 billion cost in refusing.",
      detail:
        "The decision was particularly striking given that Labour MPs — including Starmer and Kendall — had prominently supported the WASPI campaign in opposition, photographed alongside activists. Kendall personally had signed WASPI pledges. The 2017 and 2019 Labour manifestos included a commitment; the pledge was absent from 2024, but the personal associations remained politically salient. The Ombudsman noted it was 'exceptionally rare' for a government to ignore its recommendations. Critics characterised it as the clearest example of treating pre-election photo opportunities as binding on others but not on itself.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Keir_Starmer_official_portrait.jpg",
      links: [
        { label: "BBC — WASPI women refused payouts", url: "https://www.bbc.com/news/articles/c36ejg2jk45o" },
        { label: "GOV.UK — Government response to PHSO report", url: "https://www.gov.uk/government/speeches/government-response-to-parliamentary-and-health-service-ombudsman-phso-report" },
      ],
    },
    {
      act: "in-office",
      year: "Aug 2024",
      title: "Scandal 5 · Southport, Lucy Connolly and \"two-tier policing\"",
      place: "Southport / nationwide",
      key: false,
      body: "On 29 July 2024 Axel Rudakubana murders three young girls at a Taylor Swift-themed dance class. Riots follow across England. Starmer's response includes fast-track prosecutions of those who posted inflammatory content online: nursery worker Lucy Connolly is sentenced to 31 months for an X post calling for 'mass deportation.' Critics argue the speed and severity for online speech contrasts with slower prosecutions of pro-Palestinian and Just Stop Oil protesters — 'two-tier policing.'",
      detail:
        "The 'two-tier policing' accusation became a running critique throughout the first year, with Reform UK and sections of the right arguing the state applied different standards to right-wing and left-wing disorder. Connolly's 31-month sentence — while individuals convicted of mosque vandalism received shorter sentences — became a cause célèbre on the right. The May 2025 Court of Appeal rejected her appeal; she was released later in 2025. The Southport case also reignited the grooming-gangs debate (see Scandal 11), since the murderer Rudakubana was repeatedly conflated in online misinformation with asylum-seekers and grooming-gangs entirely separately.",
      imageUrl: "https://c.files.bbci.co.uk/e5c1/live/5e188070-535e-11ef-bc1f-15fb2283b836.jpg",
      links: [
        { label: "Reuters Fact Check — Southport sentencing comparison", url: "https://www.reuters.com/fact-check/online-comparison-sentencing-southport-posts-mosque-violence-lacks-context-2025-04-21/" },
        { label: "BBC — Lucy Connolly released from prison", url: "https://www.bbc.com/news/articles/c5yl7p4l11po" },
      ],
    },
    {
      act: "in-office",
      year: "Oct 2024 → Dec 2025",
      title: "Scandal 6 · Farmers' Inheritance Tax — the \"Tractor Tax\"",
      place: "Westminster / Whitehall",
      key: true,
      body: "The October 2024 Budget extends inheritance tax to working farms over £1 million, at an effective 20%. The NFU and farming groups warn that family farms — worth over £1m on paper due to land values but generating modest profits — will be broken up. Mass tractor protests fill Whitehall in November 2024. On 23 December 2025 the government climbs down: the threshold rises from £1m to £2.5m, halving the number of affected estates.",
      detail:
        "Starmer had courted the farming community before the 2024 election. The NFU described the policy as 'a breach of trust.' The political damage concentrated in rural constituencies, where Labour had hoped to make gains from the Conservatives. One farmer, whose father died by suicide the day before the October Budget over fears about the tax changes, said the climbdown was 'the best Christmas present for a lot of farmers' but accused ministers of 'a complete lack of understanding and compassion.' The episode followed the pattern of other Starmer reversals: policy announced with confidence, sustained protest, quiet recalibration described as 'listening.'",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/64/Farmers%27_Protests_in_London%2C_Wed_20th_November_2024.jpg",
      links: [
        { label: "BBC — Farmers protest as Starmer defends Budget", url: "https://www.bbc.com/news/articles/c39n4mwyx12o" },
        { label: "Independent — Farmers rejoice as Starmer caves in to pressure", url: "https://www.the-independent.com/news/uk/politics/inheritance-tax-farmers-labour-starmer-b2889532.html" },
      ],
    },
    {
      act: "in-office",
      year: "Oct 2024",
      title: "Scandal 7 · Employer NI rise — the semantic dodge",
      place: "Westminster",
      key: false,
      body: "The October 2024 Budget raises the employer National Insurance rate from 13.8% to 15.0% and cuts the per-employee threshold from £9,100 to £5,000 — raising about £25 billion a year. Labour's manifesto had pledged: 'We will not increase National Insurance.' The government argues this applied to employees, not employers.",
      detail:
        "FullFact described the claim as 'disputed'; business groups, the Conservatives and many economists rejected the distinction as a semantic dodge. The Office for Budget Responsibility noted that employer NI rises are typically passed through to workers via lower real wages and higher prices — meaning the pledge may have been technically honoured at the top-line worker rate while being economically violated for take-home pay. The Federation of Small Businesses and retail groups warned of job cuts and price rises. The episode is the cleanest live example of pledge-as-instrument: a sentence in a manifesto retained on the page but voided in effect.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Official_portrait_of_Rachel_Reeves.jpg",
      links: [
        { label: "Reuters — Reeves raises employers' National Insurance", url: "https://www.reuters.com/world/uk/uks-reeves-raises-employers-national-insurance-contributions-2024-10-30/" },
        { label: "FullFact — Has Labour broken its NI promise?", url: "https://fullfact.org/economy/has-labour-broken-ni-promise/" },
      ],
    },
    {
      act: "in-office",
      year: "Nov 2024",
      title: "Scandal 8 · Louise Haigh resigns — fraud conviction",
      place: "Westminster",
      key: false,
      body: "On 29 November 2024 Transport Secretary Louise Haigh resigns after it emerges she had pleaded guilty in 2014 to making a false statement, claiming her mobile phone had been stolen in a mugging. The conviction had been disclosed to Labour but not publicly acknowledged. She had served five months in Cabinet. The first Cabinet resignation of the Starmer government.",
      detail:
        "The episode raised questions about the rigour of vetting procedures in a government that had campaigned on restoring 'integrity.' Haigh maintained she had been open with Labour; the party's decision to appoint her to Cabinet despite the conviction was the substantive criticism. The timing compounded an already difficult autumn following the freebies row and Sue Gray's departure.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Official_portrait_of_Louise_Haigh_MP_crop_2%2C_2024.jpg",
      links: [
        { label: "BBC — Louise Haigh quits after fraud offence revealed", url: "https://www.bbc.com/news/articles/cdxy1kp73y9o" },
        { label: "AP — UK transport secretary quits over decade-old cellphone fraud", url: "https://apnews.com/article/uk-transport-minister-louise-haigh-resigns-fa79807d1ef320098e6f76faf7147a8b" },
      ],
    },
    {
      act: "in-office",
      year: "Jan 2025",
      title: "Scandal 9 · Tulip Siddiq resigns — Bangladesh probe",
      place: "Westminster / Dhaka",
      key: false,
      body: "On 14 January 2025 Tulip Siddiq resigns as Economic Secretary to the Treasury — the government's anti-corruption minister — after weeks of scrutiny over family connections to her aunt, deposed Bangladeshi PM Sheikh Hasina. Bangladesh's Anti-Corruption Commission had named Siddiq in an investigation alleging Hasina and her allies misappropriated billions, some allegedly channelled into UK property. Starmer had publicly declared 'complete trust' in her a week before.",
      detail:
        "Laurie Magnus, the Independent Adviser on Ministers' Interests, found 'no evidence of financial misconduct' on Siddiq's part but said it was 'regrettable' she had not been 'more alert to the potential reputational risks.' Hasina had been ousted in a student uprising and fled Bangladesh in August 2024, making the investigations a live and fast-moving story with UK dimensions. Siddiq maintained her innocence throughout and was not charged with any offence. The political irony — an anti-corruption minister under investigation by a foreign anti-corruption authority — was sustained.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Official_portrait_of_Tulip_Siddiq_crop_2.jpg",
      links: [
        { label: "Al Jazeera — Siddiq resigns after Bangladesh probe", url: "https://www.aljazeera.com/news/2025/1/14/uk-minister-resigns-after-being-named-in-bangladesh-corruption-probe" },
        { label: "ICIJ — UK anti-corruption minister resigns", url: "https://www.icij.org/investigations/panama-papers/uk-anti-corruption-minister-resigns-amid-bangladeshi-corruption-probe-into-her-family/" },
      ],
    },
    {
      act: "in-office",
      year: "Feb 2025",
      title: "Scandal 10 · Andrew Gwynne sacked — WhatsApp messages",
      place: "Westminster",
      key: false,
      body: "In February 2025 Andrew Gwynne — health minister and former Labour campaign director — is sacked after the contents of a private WhatsApp group are reported. The BBC describes the messages as 'completely unacceptable.' He is suspended from Labour membership and faces a parliamentary standards investigation for 'actions causing significant damage to the reputation of the House.'",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/62/Official_portrait_of_Andrew_Gwynne_MP_crop_2.jpg",
      links: [
        { label: "BBC — Gwynne sacked over WhatsApp messages, faces standards inquiry", url: "https://www.bbc.com/news/articles/cj4ndry4k54o" },
      ],
    },
    {
      act: "in-office",
      year: "Jan → Jun 2025",
      title: "Scandal 11 · Grooming gangs — \"far-right lies\" then full U-turn",
      place: "Westminster / national",
      key: true,
      body: "January 2025: Safeguarding minister Jess Phillips rejects Oldham Council's request for a national inquiry into child sexual exploitation. Elon Musk launches a sustained X campaign. On 6 January Starmer accuses critics of 'spreading lies and misinformation' and 'amplifying far-right narratives.' June 2025: Baroness Casey's rapid audit — commissioned by Starmer himself — finds systemic institutional failures and recommends a national public inquiry. On 16 June Starmer accepts all 12 of Casey's recommendations. A direct reversal of the position held five months earlier.",
      detail:
        "Casey's audit identified disproportionate numbers of men from ethnic-minority backgrounds as suspects in three police areas; this was the politically toxic finding that Starmer in January had characterised as 'far-right.' His January 2025 framing was contested even by Nazir Afzal — the former CPS chief prosecutor whom Starmer had himself appointed and who prosecuted the Rochdale grooming gangs. The U-turn was substantial: having accused critics of amplifying far-right narratives in January, Starmer in June accepted that institutional failure had been real and disproportionately affected by racial considerations. The grooming-gangs episode is the clearest demonstration of Tactic 2 (frame critics as extremists → quietly adopt their position when its momentum is unstoppable).",
      pullQuote: {
        text: "Earlier this year, Sir Keir criticised those demanding a national inquiry, accusing them of jumping on a bandwagon and amplifying far-right sentiments.",
        attribution: "BBC News, 17 June 2025, on the U-turn",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Dame_Louise_Casey.jpg",
      links: [
        { label: "BBC — Starmer attacks those 'spreading lies' on grooming gangs", url: "https://www.bbc.com/news/articles/c75wp53vk1lo" },
        { label: "BBC — Starmer defends U-turn on grooming gangs inquiry", url: "https://www.bbc.com/news/articles/cvg1xje9wzlo" },
        { label: "Al Jazeera — What is the Casey report and why did Labour U-turn?", url: "https://www.aljazeera.com/news/2025/6/17/what-is-the-casey-report-on-uk-grooming-gangs-and-why-did-labour-u-turn" },
      ],
    },
    {
      act: "in-office",
      year: "Mar–Apr 2025",
      title: "Scandal 12 · Sentencing Council \"two-tier justice\" row",
      place: "Westminster",
      key: false,
      body: "The Sentencing Council proposes guidelines recommending pre-sentence reports in all cases involving ethnic-minority defendants. Justice Secretary Shabana Mahmood publicly opposes the guidelines as creating 'two-tier' justice. Lord Chief Justice William Davis replies that the suggestion the guidelines would produce 'more lenient sentences for ethnic minorities' is 'completely wrong.' Mahmood — backed by Starmer — introduces emergency legislation to make the guidelines unlawful.",
      detail:
        "The episode generated an unusual constitutional row: a government minister using emergency legislation to overrule an independent statutory body established precisely to ensure the independence of sentencing guidance from political interference. Critics from the legal establishment argued the government was capitulating to a tabloid-driven narrative; supporters argued that guidelines producing different outcomes on the basis of protected characteristics were incompatible with equality before the law. The Sentencing Council eventually suspended the guidance.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Shabana_Mahmood_Official_Cabinet_Portrait%2C_September_2025_%28cropped%29.jpg",
      links: [
        { label: "BBC — Sentencing guidelines delayed after 'two-tier' row", url: "https://www.bbc.com/news/articles/c5yg887m6qdo" },
        { label: "The Week — Two-tier justice row", url: "https://theweek.com/law/the-two-tier-sentencing-council-shabana-mahmood" },
      ],
    },
    {
      act: "in-office",
      year: "Oct 2024 → May 2025",
      title: "Scandal 13 · Chagos handover — £9bn over 99 years",
      place: "Indian Ocean / Westminster",
      key: true,
      body: "In October 2024 the UK reaches a deal to cede sovereignty of the Chagos Islands to Mauritius while leasing back Diego Garcia for 99 years at £101m/year (first three years at £165m). Total cost over the lease: an estimated £9bn+ adjusted for inflation. A £40m Chagossian trust fund is added. On 22 May 2025 a High Court judge issues a last-minute injunction blocking the signing ceremony; legal challenges continue into 2026.",
      detail:
        "The deal attracted sustained criticism from the Conservatives (Priti Patel: 'one of the worst foreign policy failures in British history'), Reform UK (Farage: 'eye-watering amounts to Mauritius'), and US officials under the Trump administration, who expressed concerns about Chinese access to Diego Garcia. Newly elected Mauritian PM Navin Ramgoolam sought further modifications. The British government initially kept the financial terms from parliament. Supporters argued the deal secured the base, ended a costly legal exposure, and rehabilitated the UK's international reputation following the 2019 ICJ ruling. Critics noted the UK was paying for the privilege of giving back territory it had been told it had no right to hold.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Diego_Garcia_%28satellite%29.jpg",
      links: [
        { label: "BBC — What is the UK's Chagos Islands deal?", url: "https://www.bbc.com/news/articles/c9dqg3nqynlo" },
        { label: "BBC — UK signs £101m-a-year deal to hand over Chagos", url: "https://www.bbc.com/news/articles/c9914ndy82po" },
      ],
    },
    {
      act: "in-office",
      year: "Jan 2025",
      title: "Scandal 14 · VAT on private schools — 100+ closures",
      place: "Westminster",
      key: false,
      body: "From 1 January 2025 the government imposes 20% VAT on private school fees, projected to generate £1.7bn for state education. By early 2026, more than 100 independent schools have closed. Critics argue the policy created mid-year disruption for families, disproportionately affected special-needs provision, and damaged a sector already under financial pressure.",
      detail:
        "The policy was consistent with the 2024 Labour manifesto. The controversy attached to implementation: families received approximately one term's notice for a policy that required significant financial adjustment, some mid-year. Education Secretary Bridget Phillipson championed the measure as fulfilling a core commitment. The schools-closure data by early 2026 fed a narrative that the policy had caused collateral damage beyond the elite sector it was designed to target. The episode is also where Starmer's own Reigate Grammar history (Act I) became newly salient — that he was, on the family-paid-fees test, a non-fee-paying pupil at a fee-paying school.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/Official_portrait_of_Bridget_Phillipson_crop_2.jpg",
      links: [
        { label: "Independent — School VAT raid to go ahead", url: "https://www.independent.co.uk/news/uk/politics/private-schools-vat-bridget-phillipson-b2624650.html" },
        { label: "BBC — Private schools could face higher Ofsted fees", url: "https://www.bbc.com/news/articles/cwy8xyrwkgwo" },
      ],
    },
    {
      act: "in-office",
      year: "Sep–Nov 2024",
      title: "Scandal 15 · Israel/Gaza — 30 of 350 licences suspended, ICC silence",
      place: "Westminster",
      key: false,
      body: "On 2 September 2024 Foreign Secretary David Lammy suspends 30 of approximately 350 UK arms export licences to Israel, citing a 'clear risk' of breaches of international humanitarian law. The remaining 320 licences stay in force. Campaign Against Arms Trade reports Labour licensed approximately £11m in arms to Israel in its first three months. In November 2024 the ICC issues warrants for Netanyahu and Gallant; the government declines to confirm it would arrest Netanyahu if he entered the UK.",
      detail:
        "The partial suspension satisfied neither critics arguing any arms supply was complicity in unlawful killing, nor those arguing the suspension was a political gesture damaging UK-Israel and UK-US relations. The government's position on the ICC warrants — that it would 'consider its legal obligations' — was criticised by international lawyers as evasive: the UK has an obligation under the Rome Statute to arrest any ICC-indicted individual on its territory. The ICC issue intersected with UK-US relations under Trump, adding diplomatic complexity.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0d/David_Lammy_Official_Cabinet_Portrait%2C_July_2024.jpg",
      links: [
        { label: "BBC — UK suspends some arms exports to Israel", url: "https://www.bbc.com/news/articles/cd05pk95j2xo" },
        { label: "GOV.UK — Foreign Secretary statement on arms licences", url: "https://www.gov.uk/government/speeches/foreign-secretary-statement-on-uk-policy-on-arms-export-licenses-to-israel" },
        { label: "CAAT — Labour licensed nearly £11m in arms exports", url: "https://caat.org.uk/news/labour-licensed-nearly-11m-in-arms-exports-to-israel-in-first-three-months-in-office/" },
      ],
    },
    {
      act: "in-office",
      year: "Feb 2025",
      title: "Scandal 16 · Lord Walney's anti-extremism role abolished",
      place: "Westminster",
      key: false,
      body: "On 14 February 2025 the government abolishes the role of Independent Adviser on Political Violence and Disruption, held by Lord Walney (John Woodcock), with immediate effect. Woodcock — a former Labour MP who had lost the whip in 2018 over a complaint of sexual harassment (unproven) — had been reappointed by Starmer. He leaves making a final call for 'more action against the menace of extreme protestors.'",
      detail:
        "Civil-liberties organisations had argued his remit was disproportionately focused on legitimate protest. The abolition was nonetheless awkwardly timed: Walney's reports had been highly critical of pro-Palestinian and Just Stop Oil protest movements, and the abolition was widely read as an accommodation of the wing of Labour most uncomfortable with that framing — without the political honesty of saying so.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/11/Official_portrait_of_Lord_Walney_crop_2%2C_2025.jpg",
      links: [
        { label: "BBC — Government axes political violence adviser role", url: "https://www.bbc.com/news/articles/cx2pddvwgg8o" },
        { label: "Byline Times — Starmer's government axes Walney", url: "https://bylinetimes.com/2025/02/14/keir-starmers-government-axes-controversial-anti-extremism-adviser-lord-walney-from-government-role/" },
      ],
    },
    {
      act: "in-office",
      year: "Jul 2024 → Apr 2026",
      title: "Scandal 17 · Two-child cap — maintained 21 months, then lifted",
      place: "Westminster",
      key: true,
      body: "Scrapping the two-child cap was 'number one on the list' of Starmer's 'in an ideal world' commitments in 2020. After the 2024 election the government maintained it, citing fiscal constraints. In November 2025's budget Reeves announces the cap will be scrapped from April 2026; the Universal Credit (Removal of Two Child Limit Act) receives Royal Assent on 18 March 2026 and comes into force on 6 April 2026. Approximately 450,000 children are lifted out of poverty.",
      detail:
        "The cap was maintained for 21 months in government before being lifted. Internal BBC analysis suggested the government could have scrapped the cap earlier but chose to delay for fiscal-framing reasons. The episode illustrates the Starmer pattern most clearly: pledge in opposition → defer in government under 'fiscal responsibility' cover → reverse when politically unavoidable. The fact that the eventual reversal lifted 450,000 children out of poverty is also the fact that the prior 21 months had kept them in it.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Keir_Starmer_official_portrait.jpg",
      links: [
        { label: "BBC — Pressure growing to scrap two-child limit", url: "https://www.bbc.com/news/articles/c80xv9qqn85o" },
        { label: "BBC — Starmer could have scrapped child benefit cap last year", url: "https://www.bbc.com/news/articles/cvgqp71p2nqo" },
        { label: "GOV.UK — Two-child limit scrapped as historic Bill becomes law", url: "https://www.gov.uk/government/news/two-child-limit-scrapped-as-historic-bill-to-lift-450000-children-out-of-poverty-becomes-law" },
      ],
    },
    {
      act: "in-office",
      year: "Sep 2025 / Apr 2026",
      title: "Scandal 18 · Peter Mandelson — Epstein dismissal, vetting override",
      place: "Washington / Westminster",
      key: true,
      body: "In early 2025 Starmer appoints Lord Mandelson — twice forced out of Cabinet under Blair — as UK Ambassador to Washington. On 28 January 2025 UK Security Vetting denies him the highest level of clearance; two days later the Foreign Office overrules the recommendation. On 11 September 2025 Mandelson is dismissed after emails surface in which he called Jeffrey Epstein his 'best pal' and expressed distress about Epstein's prosecution. In April 2026 the Guardian reports the security vetting refusal; Starmer admits 'the wrong judgment.'",
      detail:
        "The episode crystallised questions about Starmer's judgment in appointments and his relationship with the Blairite wing of the party. Mandelson had been twice removed from Blair's Cabinet — first in 1998 over an undeclared loan from Geoffrey Robinson, again in 2001 over passport allegations. His appointment as ambassador despite a security-vetting refusal raised unresolved questions about who in the FCDO overruled UKSV and why. Starmer's April 2026 admission that it was 'the wrong judgment' came only after the Guardian published the vetting refusal story — not as a proactive disclosure.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Peter_Mandelson_in_2025_%28cropped%29.jpg",
      links: [
        { label: "NPR — UK fires ambassador over Epstein links", url: "https://www.npr.org/2025/09/11/nx-s1-5537814/jeffrey-epstein-uk-ambassador-mandelson" },
        { label: "NYT — Mandelson became ambassador despite vetting refusal", url: "https://www.nytimes.com/2026/04/16/world/europe/peter-mandelson-epstein-starmer-security.html" },
        { label: "PBS — Starmer says he made wrong judgment on Mandelson", url: "https://www.pbs.org/newshour/world/starmer-says-he-made-wrong-judgment-in-appointing-peter-mandelson-as-ambassador" },
      ],
    },
    {
      act: "in-office",
      year: "Nov 2025",
      title: "Scandal 19 · Approval rating collapses to −54",
      place: "National",
      key: false,
      body: "By November 2025 YouGov records only 19% of Britons holding a favourable opinion of Starmer against 73% unfavourable — a net rating of −54. The same level as Boris Johnson on the day of his resignation, and as Jeremy Corbyn at his nadir. 52% of those who voted Labour in 2024 now hold an unfavourable opinion of Starmer; 57% an unfavourable opinion of Rachel Reeves.",
      detail:
        "The break with the 2024 voter coalition is the politically significant figure: not the rebellion of opponents, but the disaffection of the people who actually elected him 17 months earlier. The figures will translate into the May 2026 local elections (Scandal 20) almost exactly.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Keir_Starmer_official_portrait.jpg",
      links: [
        { label: "YouGov — Political favourability ratings, November 2025", url: "https://yougov.co.uk/politics/articles/53439-political-favourability-ratings-november-2025" },
        { label: "YouGov — How has political opinion changed over 2025?", url: "https://yougov.co.uk/politics/articles/53758-how-has-political-opinion-changed-over-2025" },
      ],
    },
    {
      act: "in-office",
      year: "May 2026",
      title: "Scandal 20 · Local-election catastrophe — 1,496 councillors lost",
      place: "National / Westminster",
      key: true,
      body: "At the 7 May 2026 local elections Labour loses approximately 1,496 councillors and control of 38 councils. Reform UK gains over 1,400 seats and takes 26–27% of the national vote. On 9 May, MP Catherine West publicly calls on a cabinet minister to challenge Starmer for the leadership. By 11 May six ministerial aides have resigned; 72 Labour MPs have publicly called for Starmer to resign or set a timetable for departure. Health Secretary Wes Streeting is widely reported as considering a leadership challenge. Over 100 Labour MPs sign a counter-statement saying 'now is not the right moment for a leadership contest' — organised with government whips. Starmer announces a '10-year project of renewal' and refuses to resign.",
      detail:
        "The catastrophe is the structural cost of the 2024 landslide cashed in. A 174-seat majority on 33.7% of votes was always going to be vulnerable to a reshuffling of the right-wing vote behind Reform. The 2026 locals were the first national-scale test, and Labour lost approximately 1,500 councillors in a single night. The 100-MP counter-statement is also revealing: that 72 MPs publicly called for departure while 100+ had to be whipped into signing a 'now is not the moment' letter, against a sitting Labour PM with a 174-seat majority, is — in itself — the data point. Starmer's stated 10-year project is the response of a leader who has elected to hold the position rather than the line.",
      pullQuote: {
        text: "The election results were exceptionally challenging.",
        attribution: "Keir Starmer, response to the 2026 local election results",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Official_portrait_of_Nigel_Farage_MP_%283x4_cropped%29.jpg",
      links: [
        { label: "NYT live — Starmer's party suffers stark losses", url: "https://www.nytimes.com/live/2026/05/08/world/uk-local-elections-results" },
        { label: "BBC — Is Starmer's leadership under serious threat?", url: "https://www.bbc.com/news/articles/c8d81m665q5o" },
        { label: "Al Jazeera — Who could challenge Starmer?", url: "https://www.aljazeera.com/news/2026/5/11/who-could-challenge-keir-starmer-for-the-uk-pms-job-meet-the-candidates" },
        { label: "Guardian — 100+ Labour MPs sign anti-challenge statement", url: "https://www.theguardian.com/politics/2026/may/12/labour-mps-sign-statement-against-starmer-leadership-challenge" },
      ],
    },
  ],
  tactics: [
    {
      axis: "capital",
      name: "Pre-Election Pledge, Post-Election Reverse",
      use: "Secure a leadership or electoral coalition with maximalist commitments — Ten Pledges, manifesto guarantees, photo-op signings — then govern from a different position once in office, citing changed 'fiscal realities' or 'national interest.' The arc runs from the 2020 Ten Pledges through the winter fuel cut, WASPI refusal, and the 21-month retention of the two-child cap. Each reversal is framed as responsible governance rather than political abandonment.",
    },
    {
      axis: "identity",
      name: "Frame Critics as Extremists",
      use: "When a policy position becomes politically untenable, categorise critics as 'far-right,' 'populist' or 'bad-faith' to delay engagement, then quietly adopt their position once its political momentum is unstoppable. Most clearly demonstrated in the grooming-gangs episode: January 2025 critics were 'spreading lies and amplifying far-right narratives'; June 2025, all 12 of Casey's recommendations — including the national inquiry — were accepted.",
    },
    {
      axis: "institutional",
      name: "Promote Ally, Demote When Inconvenient",
      use: "Elevate a trusted lieutenant to a high-profile role; when they become a political liability, engineer their departure through leak or internal pressure, and then distance. Exemplified by the Sue Gray affair: recruited for Partygate credibility; marginalised when she became the focus of internal factional briefing; resigned under pressure from leaks almost certainly sanctioned from within Starmer's own operation; her replacement role then withdrawn without public explanation.",
    },
    {
      axis: "demographic",
      name: "Quiet U-Turn After Backlash",
      use: "Deny an intention to reverse; allow pressure to build; announce a 'review' or 'reassessment'; implement the reversal in the language of 'listening.' The winter fuel U-turn (May 2025), the farmers' inheritance tax climbdown (December 2025), the two-child cap abolition (November 2025). In each case, the reversal was presented as the product of 'listening' rather than political collapse.",
    },
    {
      axis: "institutional",
      name: "Institutional Cover for Personal Insulation",
      use: "When a decision under personal or institutional leadership is subsequently criticised, cite the independence of the relevant official body, the scale of caseload, or the advice received, to create distance from personal accountability. Applied consistently to the DPP record: Savile ('I was personally unaware'); Rochdale ('Nazir Afzal later overturned it — and I appointed him'); Assange (records destroyed, unable to verify); the Sentencing Council (Council's independence cited until it was overruled by emergency legislation).",
    },
    {
      axis: "cultural",
      name: "Biographical Identity as Inoculation",
      use: "Repeatedly deploy working-class origins and pre-political career as protective framing against accusations of metropolitan elitism or ideological betrayal. 'My dad was a toolmaker' becomes the most-deployed rhetorical device of the era — at conferences, PMQs and interviews. The socialist-named, Reigate Grammar-bursaried, Doughty Street-founding KC presents a complex biographical identity; selective emphasis on factory-floor origins and nurse-mother hardship functions as a credibility claim that simplifies the picture.",
    },
  ],
  engine: [
    {
      step: "Action",
      title: "Make an ambiguous or maximalist pre-election pledge",
      body: "To secure a coalition: left-wing members in 2020 (Ten Pledges); general voters in 2024 (manifesto, photo-ops, WASPI signatures, NFU outreach). The pledge is the entry ticket; its operational substance is left deliberately unspecified or aspirational.",
    },
    {
      step: "Problem",
      title: "The pledge becomes politically costly in office",
      body: "Fiscal inconvenience (two-child cap, winter fuel), diplomatic sensitivity (Israel arms, Chagos), or political conflict within the operation (Sue Gray, Mandelson). The cost of honouring is higher than the cost of dishonouring — provided the dishonouring can be framed.",
    },
    {
      step: "Solution",
      title: "Redefine, defer, or quietly reverse",
      body: "Redefine the pledge as inapplicable ('employee not employer NICs'); cite changed circumstances ('fiscal inheritance'); or quietly U-turn after sufficient pressure, framing reversal as 'listening' rather than retreat. The retrospective characterisation is always institutional, not personal: a failure of the appointment process, not the appointer; of the inherited finances, not the campaigning.",
    },
  ],
  closing: [
    "Keir Starmer arrived in Downing Street on 5 July 2024 with a 174-seat majority built on 33.7% of votes cast — a structural gift from vote-splitting and a broken Conservative Party rather than a positive mandate. The paradox was visible from the outset: a government with enormous parliamentary power and minimal popular enthusiasm, led by a man whose defining political characteristic had been the willingness to accommodate whatever his audience most wanted to hear in the moment.",
    "The evidence accumulated over the first 22 months suggests not so much that Starmer lacks values — his human-rights lawyering was real and his long-term commitment to social-democratic governance is probably genuine — as that he treats political pledges instrumentally. The Ten Pledges were a recruitment mechanism for Corbynites, not a governing programme. The 2024 manifesto's austerity framing was a device to neutralise Conservative attacks, not a ceiling on ambition. The problem is that each instrument eventually runs into the human cost of its implementation: nine million pensioners losing heating money in winter; 450,000 children kept in poverty for 21 months while the government found reasons to delay scrapping a cap it had pledged to abolish; grooming-gang victims whose advocates were characterised as far-right before a national inquiry was belatedly accepted.",
    "By May 2026 — 72 Labour MPs publicly calling for his resignation or departure timeline, Reform UK outperforming Labour in local elections, a net approval rating of approximately −54 — the '10-year project of renewal' announced in a Sunday interview looks less like a plan than a defiance response. The structural question for the remainder of the Parliament is whether Starmer's instinct for deferral and eventual accommodation — reliable enough in opposition — can survive the velocity of governing crises; and whether a party that won power on a 'change' message can survive the accumulating evidence that the change, for much of its base, was not what they had been told to expect.",
    "The Hardie name was a parental hope. The toolmaker was a real father. Reigate Grammar was both state and private depending on the year of the question. The McLibel pro bono work was genuine. The DPP record is, on balance, more institutional than personal. The Ten Pledges were a campaign device. The 174-seat majority was a structural artefact. None of these things, in itself, is fatal to a political character. The dossier merely records that when you assemble them, the recurring feature is a willingness to be whatever the audience requires — and the cumulative weight of that willingness is the weight under which the leadership currently sits.",
  ],
};

/** Kept for symmetry with the long-march editor import shape. */
export type StarmerData = TimelineData;

/* =========================================================
   DEEP MERGE — admin override over hardcoded defaults
   ---------------------------------------------------------
   Identical pattern to long-march.tsx: every top-level
   field is per-field merged so shipping new default copy
   does NOT require a re-save from the admin UI.
   ========================================================= */
function nonEmptyArray<T>(a: T[] | undefined | null): a is T[] {
  return Array.isArray(a) && a.length > 0;
}

function nonEmptyString(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function mergeData(override: Partial<TimelineData> | null | undefined): TimelineData {
  if (!override || typeof override !== "object") return STARMER_DATA;

  const defaultEventByKey = new Map(
    STARMER_DATA.timeline.map((e) => [`${e.year}|${e.title}`, e]),
  );
  const mergedTimeline = nonEmptyArray(override.timeline)
    ? override.timeline.map((e, i) => {
        const def =
          defaultEventByKey.get(`${e.year}|${e.title}`) ??
          STARMER_DATA.timeline[i];
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
    : STARMER_DATA.timeline;

  const defaultTacticByName = new Map(
    STARMER_DATA.tactics.map((t) => [t.name, t]),
  );
  const mergedTactics = nonEmptyArray(override.tactics)
    ? override.tactics.map((t) => {
        const def = defaultTacticByName.get(t.name);
        if (!def) return t;
        return { ...def, ...t, axis: t.axis ?? def.axis };
      })
    : STARMER_DATA.tactics;

  const defaultEngineByStep = new Map(
    STARMER_DATA.engine.map((s) => [s.step, s]),
  );
  const mergedEngine = nonEmptyArray(override.engine)
    ? override.engine.map((s, i) => {
        const def =
          defaultEngineByStep.get(s.step) ?? STARMER_DATA.engine[i];
        if (!def) return s;
        return {
          ...def,
          ...s,
          title: nonEmptyString(s.title) ? s.title : def.title,
          body: nonEmptyString(s.body) ? s.body : def.body,
        };
      })
    : STARMER_DATA.engine;

  const mergedThesis = nonEmptyArray(override.thesis)
    ? override.thesis.filter(nonEmptyString)
    : STARMER_DATA.thesis;
  const finalThesis = nonEmptyArray(mergedThesis) ? mergedThesis : STARMER_DATA.thesis;

  const mergedClosing = nonEmptyArray(override.closing)
    ? override.closing.filter(nonEmptyString)
    : STARMER_DATA.closing;
  const finalClosing = nonEmptyArray(mergedClosing) ? mergedClosing : STARMER_DATA.closing;

  return {
    contentVersion: override.contentVersion ?? STARMER_DATA.contentVersion,
    meta: { ...STARMER_DATA.meta, ...(override.meta || {}) },
    thesis: finalThesis,
    acts: nonEmptyArray(override.acts) ? override.acts : STARMER_DATA.acts,
    timeline: mergedTimeline,
    tactics: mergedTactics,
    engine: mergedEngine,
    closing: finalClosing,
    extraSections: override.extraSections ?? STARMER_DATA.extraSections,
  };
}

export default function StarmerPage() {
  const { data: authUser } = useQuery({ queryKey: ["/api/auth/me"], queryFn: getMe, retry: false, staleTime: 300_000 });
  const locked = !authUser?.isMember;
  const { data: saved } = useQuery({
    queryKey: ["/api/page-content/starmer"],
    queryFn: () => getPageContent<Partial<TimelineData>>("starmer"),
    staleTime: 30_000,
    retry: 1,
  });

  const useDefaults =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("defaults") === "1";

  const D = useDefaults ? STARMER_DATA : mergeData(saved);

  return (
    <>
      <MembersOnlyBanner variant="auto" />
      <PageStatusGate slug="starmer" name="Sir Keir Starmer">
        <TimelineRenderer data={D} locked={locked} />
        {!locked && <TimelineReactions slug="starmer" />}
      </PageStatusGate>
    </>
  );
}

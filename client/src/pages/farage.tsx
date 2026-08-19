import { useQuery } from "@tanstack/react-query";
import { PageStatusGate } from "@/components/page-status-gate";
import { TimelineRenderer, type TimelineData } from "@/components/timeline-renderer";
import { getPageContent } from "@/lib/page-status";
import { MembersOnlyBanner } from "@/components/members-only-banner";
import { TimelineReactions } from "@/components/timeline-reactions";

/* =========================================================
   FARAGE — DOSSIER TIMELINE
   ---------------------------------------------------------
   Critical, sceptical political-intelligence timeline on
   Nigel Paul Farage. Four acts:
     I.   Origins — The City, the first accidents, the cause
     II.  UKIP — the first machine
     III. The Succession — every successor a casualty
     IV.  Reform — power, money and the purge
   British English throughout. Sources: BBC, Sky News,
   Guardian, Telegraph, ITV, Channel 4, Reuters, NCA,
   Electoral Commission, Hansard, Parliament, YouGov,
   Wikipedia.
   ========================================================= */

export const FARAGE_CONTENT_VERSION = 1;

export const FARAGE_DATA: TimelineData = {
  contentVersion: FARAGE_CONTENT_VERSION,
  meta: {
    dossierCode: "DOSSIER // DB-NF-006",
    eyesOnly: "EYES ONLY — ADMIN",
    fileTag: "FILE: FARAGE / v1.0",
    title: "Nigel Farage",
    subtitle: "A sceptical political-intelligence timeline of the man who has burned three parties to keep one career warm",
    byline: "Filed by DinoBane Intel · dinobane.com",
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/bf/Official_portrait_of_Nigel_Farage_MP.jpg",
  },
  thesis: [
    "Nigel Farage has never won a general election seat on his first seven attempts, has resigned from leadership five times, and has outlived every party, deputy, donor and defender he has ever used. He is, by any honest ledger, the most consequential British politician never to hold ministerial office — the man who forced a referendum, won it, and then walked away from the wreckage to build the next machine.",
    "This dossier follows him from a Dulwich College childhood and the City metals pits, through the co-founding of UKIP and twenty years in the European Parliament he despised, to the referendum, the Brexit Party, and Reform UK. It tracks the accidents — run down in Orpington in 1985, cancer at 22, the election-day plane crash of 2010 — and the betrayals: Kilroy-Silk, Carswell, Diane James, Woolfe, Nuttall, Bolton, Batten, Tice, and most recently Rupert Lowe, the MP his party suspended and reported to the police two days after Lowe questioned his leadership.",
    "The thesis is not that he lacks conviction — the Brexit conviction is forty years deep and entirely genuine. It is that loyalty in the Farage orbit runs in one direction only: colleagues, parties and donors exist to be spent. The record is a repeating pattern of vehicles built, rivals purged, money unexplained, and exits timed to the precise moment the machine is about to be blamed on him.",
  ],
  acts: [
    {
      id: "city-origins",
      label: "Act I",
      kicker: "Act I · Origins",
      title: "The Trader, the Car Crash, the Cancer, the Cause",
      years: "1964 — 1993",
      lede: "A stockbroker's son at fee-paying Dulwich, a commodities pit instead of a university, two near-deaths before the age of twenty-five, and a walk-out from the Conservative Party over Maastricht. The raw material of the permanent insurgent.",
    },
    {
      id: "ukip-machine",
      label: "Act II",
      kicker: "Act II · UKIP",
      title: "The First Machine",
      years: "1999 — 2016",
      lede: "Twenty years as an MEP on the institution's payroll, four leadership stints, one plane crash on polling day, one un-resignation, one poster that defined a referendum, and one victory speech followed by a resignation forty years in the making.",
    },
    {
      id: "the-succession",
      label: "Act III",
      kicker: "Act III · The Succession",
      title: "Every Successor a Casualty",
      years: "2016 — 2019",
      lede: "Eighteen days, a Strasbourg fistfight, a Hillsborough stain, a girlfriend's text messages, and a leader who hired Tommy Robinson. UKIP after Farage ate itself in twenty-six months — while he built the Brexit Party and then stood down three hundred and seventeen of its own candidates.",
    },
    {
      id: "reform",
      label: "Act IV",
      kicker: "Act IV · Reform",
      title: "Power, Money and the Purge",
      years: "2021 — August 2026",
      lede: "A leadership handed back mid-campaign, a seat won at the eighth attempt, a billionaire's £5 million gift that slipped the register of interests, an MP reported to the police by his own chairman, a chairman who resigned for forty-eight hours, a by-election against a man in a bin — and, at the end of it, the favourite to be the next Prime Minister.",
    },
  ],
  timeline: [
    /* ─── ACT I · ORIGINS ────────────────────────────────── */
    {
      act: "city-origins",
      year: "1964",
      title: "Born Farnborough, Kent — a stockbroker's son",
      place: "Farnborough, Kent → Dulwich, London",
      key: true,
      body: "Nigel Paul Farage is born on 3 April 1964 to Guy Justus Oscar Farage, a City stockbroker who leaves the family when Nigel is five, and Barbara Stevens. He is educated at Dulwich College, a fee-paying independent school in south London, from 1975 to 1982.",
      detail:
        "The father was an alcoholic who gave up drinking, rebuilt his career and remained a glamorous, absent figure — the template, biographers note, for a son who would always perform bonhomie at one remove from intimacy. Dulwich College today charges over £25,000 a year; contemporaries remember a boy already obsessed with politics, cadet force and provocation. The school's archives would return to haunt him sixty years later (Act IV): a 1981 letter from a teacher describes the teenage Farage as a 'publicly professed racist' with 'neo-fascist views' who marched through a Sussex village 'shouting Hitler Youth songs'. Farage has always denied holding such views, calling the claims smears.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Nigel_Farage_MEP_portrait.jpg",
      links: [
        { label: "Wikipedia — Nigel Farage", url: "https://en.wikipedia.org/wiki/Nigel_Farage" },
        { label: "ITV — Timeline of racism allegations and Farage's responses", url: "https://www.itv.com/news/2025-12-05/timeline-of-allegations-of-racism-against-nigel-farage-and-his-responses" },
      ],
    },
    {
      act: "city-origins",
      year: "1985–1986",
      title: "The first accidents — run down in Orpington, then cancer",
      place: "Orpington, Kent",
      key: false,
      body: "In November 1985, aged 21, Farage is run over by a car in Orpington after an evening in the pub, sustaining severe head and leg injuries and spending months in recovery. A year later he is diagnosed with testicular cancer; he survives after surgery. The plane crash of 2010 (Act II) completes a hat-trick of near-deaths that he has spent forty years converting into destiny.",
      detail:
        "He has written that the car crash taught him 'you cannot take anything for granted' and the cancer that he would 'grab every opportunity'. Both are also the founding exemptions of the brand: the man who has been hit by a car, cancer and an aircraft is licensed, in his own telling, to say anything. When ITV's I'm a Celebrity booked him in 2023 he cited the accumulated injuries as grounds to skip physical trials — the accidents, by then, were part of the CV.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Nigel_Farage_2010_MEP_portrait.jpg",
      links: [
        { label: "Independent — Farage on his injuries, I'm a Celebrity", url: "https://www.the-independent.com/news/uk/home-news/nigel-farage-plane-crash-im-a-celeb-brexit-b2451501.html" },
      ],
    },
    {
      act: "city-origins",
      year: "1982–2003",
      title: "The City — metals pits, not university",
      place: "City of London",
      key: false,
      body: "Farage skips university and goes straight into the City as a commodities trader at eighteen: Drexel Burnham Lambert until its 1990 collapse, then Credit Lyonnais Rouse, Refco and finally Natexis Metals, trading tin, lead and zinc. Twenty years of pit trading — the training in nerve, bluff and the value of a loud voice.",
      detail:
        "The City years are the least examined and most explanatory. The London Metal Exchange pit was a closed male arena where the loudest confident voice set the price; Farage's entire later method — the pub-style certainty, the contempt for expertise, the read of a crowd — is the pit method transposed to politics. It also made him wealthy and established the network of traders, brokers and money men from which his political funding would later flow. He remained a working metals trader until 2003, a decade into his political career — the 'man of the people' was, professionally, a man of the markets.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Nigel_Farage_%2816778543012%29.jpg",
      links: [
        { label: "Wikipedia — Nigel Farage, early career", url: "https://en.wikipedia.org/wiki/Nigel_Farage" },
      ],
    },
    {
      act: "city-origins",
      year: "1992–1993",
      title: "Leaves the Tories over Maastricht — co-founds UKIP",
      place: "London",
      key: true,
      body: "A Conservative since his teens, Farage rips up his membership when John Major signs the Maastricht Treaty in 1992. He joins Alan Sked's Anti-Federalist League, which becomes the UK Independence Party in September 1993. Farage is a founding member — the beginning of the first machine.",
      detail:
        "Sked, the LSE academic who founded the party, would later describe Farage's UKIP as a vehicle that abandoned policy for populism; he quit his own creation in 1997, calling it a 'far-right' magnet. The founder-out pattern is thus present from the very beginning: everyone who builds a party with Nigel Farage eventually discovers they have built it for Nigel Farage. Sked spent the next two decades warning anyone who would listen. Almost nobody did, until the exit door had a queue at it.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/Starcross_%2C_The_Strand%2C_UKIP_Poster_and_Starcross_Sign_-_geograph.org.uk_-_1345072.jpg",
      links: [
        { label: "Wikipedia — UK Independence Party", url: "https://en.wikipedia.org/wiki/UK_Independence_Party" },
      ],
    },

    /* ─── ACT II · UKIP — THE FIRST MACHINE ──────────────── */
    {
      act: "ukip-machine",
      year: "1999",
      title: "MEP for South East England — twenty years on the payroll",
      place: "Brussels / Strasbourg",
      key: false,
      body: "Elected to the European Parliament in 1999, and re-elected in 2004, 2009, 2014 and 2019 — with UKIP, then with the Brexit Party. He spends two decades drawing an MEP's salary, allowances and pension entitlements from the institution he exists to abolish.",
      detail:
        "In 2009 he boasted on camera that he had received £2 million of taxpayers' money in expenses and allowances over ten years as an MEP. In 2018 the European Parliament docked his pay after finding EU funds had been misspent on UKIP work; in 2017 EU auditors found his EFDD group had misused hundreds of thousands of euros of European money on British campaigning. The answer was always the same: everyone does it, the system is corrupt, and he is merely exposing it by milking it. The intellectual energy of the position — we take their money to prove they waste money — was never seriously tested, because he never seriously answered it.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Nigel_Farage_MEP_1%2C_Strasbourg_-_Diliff.jpg",
      links: [
        { label: "Wikipedia — Nigel Farage, MEP career", url: "https://en.wikipedia.org/wiki/Nigel_Farage" },
      ],
    },
    {
      act: "ukip-machine",
      year: "2004–2005",
      title: "Kilroy-Silk — the first rival shown the door",
      place: "Westminster / Brussels",
      key: false,
      body: "Daytime-TV celebrity Robert Kilroy-Silk joins UKIP in 2004, makes no secret that he wants the leadership — 'I want to lead it' — and begins manoeuvring against the party's existing management. The NEC closes ranks around Farage. Within months Kilroy-Silk is gone; he later forms his own party, Veritas, which vanishes.",
      detail:
        "The first demonstration of the rule that governs the next twenty years: any figure whose celebrity approaches Farage's is treated as an existential threat and removed — not by open contest but by the machinery of the party executive. The Kilroy-Silk episode also established the counter-narrative Farage deploys every time: it is always the rival who is vain, disloyal, a one-man band. UKIP's longest-serving leader is somehow never the author of its purges; they are always what the party collectively and reluctantly required.",
      links: [
        { label: "Wikipedia — Robert Kilroy-Silk", url: "https://en.wikipedia.org/wiki/Robert_Kilroy-Silk" },
      ],
    },
    {
      act: "ukip-machine",
      year: "Sep 2006",
      title: "Leader of UKIP — first stint",
      place: "Westminster",
      key: false,
      body: "Farage wins the UKIP leadership in September 2006 with around 45% of the members' vote, promising to turn a single-issue pressure group into a national political force. UKIP under him will become the first party outside Labour and the Conservatives to top a UK-wide election in a century — and he will resign from the leadership four separate times.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ed/MEP_Nigel_Farage_%285266070274%29.jpg",
      links: [
        { label: "Wikipedia — September 2006 UKIP leadership election", url: "https://en.wikipedia.org/wiki/September_2006_UK_Independence_Party_leadership_election" },
      ],
    },
    {
      act: "ukip-machine",
      year: "Sep 2009",
      title: "Resigns to fight the Speaker — loses, badly",
      place: "Buckingham",
      key: false,
      body: "Farage resigns the leadership to stand against Speaker John Bercow at the 2010 general election in Buckingham. He finishes third with 17.4%, behind an independent former UKIP member. Lord Pearson of Rannoch — a genial, self-effacing peer who cheerfully admits he is 'not much good' at the job — is installed as leader. The first of Farage's caretakers takes the throne he is expected to keep warm.",
      detail:
        "The Buckingham episode is the template for every Farage resignation: walk away at a moment of maximum drama into a role with no responsibilities, let a caretaker absorb the institution's failures, return when the contrast is unanswerable. Pearson lasted fourteen months and gave a car-crash interview in which he could not name his own manifesto's policies; Farage's restoration followed as night follows day.",
      links: [
        { label: "Wikipedia — Buckingham, 2010 general election", url: "https://en.wikipedia.org/wiki/Buckingham_(UK_Parliament_constituency)" },
      ],
    },
    {
      act: "ukip-machine",
      year: "6 May 2010",
      title: "The Accident — the polling-day plane crash",
      place: "Hinton Airfield, Brackley, Northamptonshire",
      key: true,
      body: "On the morning of the 2010 general election, Farage is a passenger in a two-seater light aircraft towing a banner reading 'Vote for your country – Vote UKIP'. The banner wraps around the tail; the plane nosedives into a field. Farage — pulled out covered in blood, asking for a cigarette — suffers a punctured lung, chipped vertebrae, a fractured sternum and fractured ribs. The pilot, Justin Adams, is cut out with serious injuries.",
      detail:
        "The aftermath is darker than the stunt. Cleared of blame after a two-year inquiry, Adams blamed the crash for the collapse of his business and marriage and was convicted in 2011 of five counts of threatening to kill Farage and the CAA's chief investigator, telling a 999 operator: 'I've lost my wife, my house, my child. I've only got eight bullets, but I only need four.' He was given a community order; in November 2013 he was found dead at home, aged 48 — no suspicious circumstances. Farage turned the crash into resurrection mythology ('I do recall the explosion, the plane flipping over, being stuck in there, everything broken'). For Adams it was the end of everything. The dossier records both.",
      pullQuote: {
        text: "I don't recall being unconscious, but I do recall the explosion, the plane flipping over, being stuck in there, everything broken… every rib front and back, split sternum, punctured lung… it was bad.",
        attribution: "Nigel Farage, I'm a Celebrity… Get Me Out of Here, November 2023",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Nigel_Farage_2010_MEP_portrait.jpg",
      links: [
        { label: "Independent — the 2010 crash and what happened to the pilot", url: "https://www.the-independent.com/news/uk/home-news/nigel-farage-plane-crash-im-a-celeb-brexit-b2451501.html" },
        { label: "Yahoo/PA — crash pilot who threatened Farage found dead", url: "https://www.yahoo.com/lifestyle/crash-pilot-threatened-ukip-leader-221432731.html" },
      ],
    },
    {
      act: "ukip-machine",
      year: "Nov 2010",
      title: "Leader again — the first resurrection",
      place: "Westminster",
      key: false,
      body: "Pearson resigns in August 2010 after admitting he is 'not much good' at party politics. Farage, still recovering from the crash, wins the leadership back in November 2010. UKIP now enters its golden period: second in a string of by-elections, top of the polls' outsider slot, and Farage the fixed point of broadcast politics.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/01/Nigel_Farage%2C_Leader%2C_UK_Independence_Party_%28UKIP%29_%2813842646613%29.jpg",
      links: [
        { label: "Wikipedia — November 2010 UKIP leadership election", url: "https://en.wikipedia.org/wiki/November_2010_UK_Independence_Party_leadership_election" },
      ],
    },
    {
      act: "ukip-machine",
      year: "May 2014",
      title: "UKIP wins the European elections",
      place: "Nationwide",
      key: true,
      body: "UKIP tops the 2014 European Parliament elections with 27.5% of the vote and 24 seats — the first time since 1906 that a party other than Labour or the Conservatives has won a UK-wide election. Farage calls it an earthquake. In August 2014 the Eurosceptic Tory MP Douglas Carswell defects; in October he wins Clacton for UKIP in a by-election — the party's first elected MP.",
      detail:
        "The high-water mark of the first machine. It is also where the dossier's central relationship begins: Carswell, the only man to win a Westminster seat under the UKIP banner, immediately becomes the internal opposition — arguing for a moderate, optimistic, 'classically liberal' UKIP against Farage's instinct for the jugular. For three years the party's only MP and its only leader wage a cold war over tone, strategy and — memorably — whether Farage should get a knighthood. It ends, as these things end, with the MP out of the party and Farage unchallenged.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Douglas_Carswell%2C_May_2009.jpg",
      links: [
        { label: "Wikipedia — 2014 European Parliament election in the UK", url: "https://en.wikipedia.org/wiki/2014_European_Parliament_election_in_the_United_Kingdom" },
      ],
    },
    {
      act: "ukip-machine",
      year: "2014–2017",
      title: "The Carswell feud — 'the time for him to go is now'",
      place: "Westminster",
      key: true,
      body: "By 2016 the Farage camp — Farage, donor Arron Banks and their allies — are openly briefing against UKIP's only MP. Leaked emails show the camp blaming Carswell for blocking a Farage knighthood; Carswell jokes publicly that Farage should get an OBE 'for services to headline writers'. In March 2017 Farage writes in the Telegraph that 'there is little future for UKIP with him staying inside this party. The time for him to go is now.' Days later Carswell quits to sit as an independent.",
      detail:
        "Carswell's analysis of why he had to go was precise: he argued the referendum was won by reassuring moderate voters, while Farage wanted to run the movement on grievance. History awarded both men their points — the referendum was won, and the grievance machine outlasted everything. But the method matters to this dossier: the only elected parliamentarian UKIP ever produced was driven out by the leader's court, with the donor who paid for the party leading the cheering. Banks even declared he would stand against Carswell in his own seat. UKIP has never again held a Westminster constituency.",
      pullQuote: {
        text: "There is little future for UKIP with him staying inside this party. The time for him to go is now.",
        attribution: "Nigel Farage, Daily Telegraph, March 2017",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Douglas_Carswell%2C_May_2009.jpg",
      links: [
        { label: "Wikipedia — Nigel Farage, political career", url: "https://en.wikipedia.org/wiki/Nigel_Farage" },
      ],
    },
    {
      act: "ukip-machine",
      year: "May 2015",
      title: "Thanet South — the resignation that lasted three days",
      place: "Thanet, Kent",
      key: true,
      body: "Having promised to quit 'within ten minutes' if he failed to win a seat, Farage loses Thanet South to the Conservatives' Craig Mackinlay by 2,812 votes on 8 May 2015 and duly resigns: 'I'm a man of my word — and I don't break my word.' Three days later UKIP's National Executive unanimously rejects his resignation and he un-resigns. He remains leader.",
      detail:
        "The episode fixed in the public mind the thing allies say privately: the party's constitution, its NEC, its very purpose exist to ensure that Nigel Farage's resignation is a negotiating position rather than an event. He had written in his own memoir that it was 'frankly just not credible' to lead without a Westminster seat; he led for another year without one, lost again in spirit but never in fact. Seven failed parliamentary candidacies (1994, 1997, 2001, 2005, 2006, 2010, 2015) are part of the record. The eighth, in 2024, is Act IV.",
      pullQuote: {
        text: "I'm a man of my word – and I don't break my word. So I shall be writing to the UKIP national executive in a few minutes and saying that I am standing down as leader of UKIP.",
        attribution: "Nigel Farage, 8 May 2015 — three days before un-resigning",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Nigel_Farage_in_Conservative_Political_Action_Conference_2015.jpg",
      links: [
        { label: "Channel 4 — Farage resigns after South Thanet loss", url: "https://www.channel4.com/news/nigel-farage-fails-in-ukip-bid-to-win-south-thanet" },
        { label: "HuffPost — Farage un-resigns after NEC rejects decision", url: "https://www.huffingtonpost.co.uk/2015/05/11/farage-is-staying-as-ukip-leader-whether-he-likes-it-or-not_n_7257044.html" },
      ],
    },
    {
      act: "ukip-machine",
      year: "16 Jun 2016",
      title: "Breaking Point — the poster",
      place: "Westminster",
      key: true,
      body: "One week before the referendum, Farage unveils a poster showing a 2015 queue of Syrian and Afghan refugees at the Croatia–Slovenia border beneath the words 'BREAKING POINT' and 'the EU has failed us all'. It is unveiled hours before the murder of Jo Cox MP. Michael Gove says he 'shuddered'; George Osborne compares it to 1930s propaganda; nearly 40,000 people sign a petition asking police to investigate it for incitement.",
      detail:
        "Farage never apologised and has repeatedly claimed the poster's effectiveness: in 2017 he told the New Statesman that Rees-Mogg credited it with winning the referendum — 'The establishment hated it, the posh boys at Vote Leave hated it, but it was the right thing to do.' Vote Leave, the official campaign, had spent the whole referendum keeping UKIP's leader off its broadcasts precisely because of moments like this. The dossier notes the division of labour that won 2016: Vote Leave supplied the respectable case; Farage supplied the feeling. The fee for supplying the feeling was collected in Act IV.",
      pullQuote: {
        text: "The establishment hated it, the posh boys at Vote Leave hated it, but it was the right thing to do.",
        attribution: "Nigel Farage, New Statesman interview, 2017, on the Breaking Point poster",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/54/Leave.EU_group_%2825077634491%29.jpg",
      links: [
        { label: "Wikipedia — Breaking Point (UKIP poster)", url: "https://en.wikipedia.org/wiki/Breaking_Point_(UKIP_poster)" },
      ],
    },
    {
      act: "ukip-machine",
      year: "23 Jun – 4 Jul 2016",
      title: "The referendum — won; 'I want my life back'",
      place: "Nationwide",
      key: true,
      body: "Britain votes 52–48 to leave the European Union. Eleven days later, at a press conference in Westminster, Farage resigns as UKIP leader: 'I have done my bit… I couldn't possibly achieve more than I managed to get in that referendum. So I feel it's right that I should now stand aside as leader of UKIP… I want my life back.'",
      detail:
        "The zenith and the tell. At the exact moment the forty-year project triumphs, its author leaves the stage — before the negotiation, before the bill, before the blame. Every subsequent Farage vehicle repeats the geometry: he is present for the feeling and absent for the spreadsheet. What follows — Act III — is what happens to the machine the moment his hands leave the wheel, and it is the strongest evidence in this file for the argument that the machine was never anything but him.",
      pullQuote: {
        text: "I have done my bit. Now I want my life back.",
        attribution: "Nigel Farage, resignation statement, 4 July 2016",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Nigel_Farage_MEP_1%2C_Strasbourg_-_Diliff.jpg",
      links: [
        { label: "Wikipedia — 2016 EU referendum", url: "https://en.wikipedia.org/wiki/2016_United_Kingdom_European_Union_membership_referendum" },
      ],
    },

    /* ─── ACT III · THE SUCCESSION ───────────────────────── */
    {
      act: "the-succession",
      year: "Sep–Oct 2016",
      title: "Diane James — eighteen days, then 'irrational selfishness'",
      place: "Bournemouth / Westminster",
      key: false,
      body: "Diane James is elected UKIP leader on 16 September 2016 with the membership's overwhelming endorsement — and stands down after eighteen days, saying she has 'no support within the executive'. Farage returns as interim leader. When she quits the party entirely weeks later, he brands her conduct 'yet another act of irrational selfishness' and declares her 'unfit to continue as an MEP'.",
      detail:
        "James's account — that she won the membership's vote and was then denied any cooperation by a party machine loyal only to Farage — was never seriously disputed by anyone in a position to know. The pattern is the point: UKIP could hold a leadership election, but it could not transfer leadership, because the institution's nervous system answered to one man whether or not he held the title. The 'irrational selfishness' formulation — the woman who tried to leave blamed for the party that refused to be led — is the purest available sample of the court dialect.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Diane_James_at_Eastleigh.png",
      links: [
        { label: "Sky News — Farage accuses James of 'irrational selfishness'", url: "https://news.sky.com/story/former-ukip-leader-diane-james-quits-party-10666465" },
      ],
    },
    {
      act: "the-succession",
      year: "6 Oct 2016",
      title: "Woolfe v Hookem — the party literally comes to blows",
      place: "European Parliament, Strasbourg",
      key: true,
      body: "At a closed meeting of UKIP MEPs, Steven Woolfe — the leadership favourite and Farage's anointed successor-in-waiting — confronts Mike Hookem over reports Woolfe had discussed defecting to the Conservatives. It comes to blows; Woolfe collapses hours later with two seizures and is hospitalised. Eleven days later he quits the party, declaring UKIP 'ungovernable without Nigel Farage leading it and the referendum cause to unite it' and in a 'death spiral'.",
      detail:
        "The most honest sentence ever written about the Farage system was written by the man fleeing it: the party was ungovernable without him — by design. Woolfe, a Manchester-raised mixed-race MEP with real working-class credentials, was the one internal figure who might have built UKIP beyond its leader; he was also the man whose candidacy paperwork the party had already rejected over a seventeen-minute deadline earlier that summer. Hookem denied punching him; no one was disciplined. Woolfe died in 2025, still outside politics. UKIP's death spiral took the form he predicted, on the schedule he predicted.",
      pullQuote: {
        text: "I have come to the conclusion that UKIP is ungovernable without Nigel Farage leading it and the referendum cause to unite it.",
        attribution: "Steven Woolfe MEP, resignation statement, 17 October 2016",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Steven_Woolfe_UKIPNEC.jpg",
      links: [
        { label: "Holyrood — Woolfe quits 'ungovernable' UKIP", url: "https://www.holyrood.com/news/view,fresh-trouble-for-ukip-as-steven-woolfe-quits-party_12531.htm" },
        { label: "Wikipedia — Oct–Nov 2016 UKIP leadership election", url: "https://en.wikipedia.org/wiki/October%E2%80%93November_2016_UK_Independence_Party_leadership_election" },
      ],
    },
    {
      act: "the-succession",
      year: "Nov 2016",
      title: "The golden elevator — Trump Tower, and the Banks money",
      place: "New York",
      key: false,
      body: "Days after the US election, Farage becomes the first foreign politician to meet President-elect Trump, grinning beside him in front of a gilded Trump Tower door. He openly lobbies to be made Britain's ambassador; Downing Street declines. His post-referendum lifestyle — a Chelsea house, a car and driver, American trips — is funded to the tune of some £450,000 by Arron Banks, as Channel 4 later reveals.",
      detail:
        "The Banks relationship is the hinge between eras. Banks bankrolled Leave.EU — £8 million in loans and donations that the Electoral Commission suspected might not have been his to give, referring the matter to the National Crime Agency in 2018. The NCA found no evidence of criminal offences; Banks was always entitled to the money he moved through his own Isle of Man companies. But the questions were never about legality so much as dependence: a movement that ran on the slogan of sovereignty was, at the personal level, a leader kept by one donor. When Banks drifted, the next donor was always waiting — see Act IV.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/President_Donald_Trump_and_Nigel_Farage.jpg",
      links: [
        { label: "NCA — statement on Leave.EU / Banks investigation", url: "https://www.nationalcrimeagency.gov.uk/news/public-statement-on-nca-investigation-into-suspected-eu-referendum-offences" },
        { label: "Electoral Commission — referral of Banks / Leave.EU", url: "https://www.electoralcommission.org.uk/political-registration-and-regulation/our-enforcement-work/investigations/investigation-payments-made-better-country-and-leaveeu" },
      ],
    },
    {
      act: "the-succession",
      year: "Nov 2016 – Jun 2017",
      title: "Nuttall — Stoke, Hillsborough, wipeout",
      place: "Westminster / Stoke-on-Trent",
      key: false,
      body: "Paul Nuttall wins the November 2016 leadership with 63%. His defining test is the Stoke-on-Trent Central by-election, where it emerges his website falsely claimed he lost 'close personal friends' at Hillsborough; he loses the seat Labour always wins. At the June 2017 general election — the one Farage declines to contest — UKIP's vote collapses to 1.8%. Nuttall resigns.",
      detail:
        "Nuttall was the most plausible working-class successor UKIP produced, and the most thoroughly humiliated. The Hillsborough claim was his own, but the machine's betrayal was subtler: Farage handed over a party whose funding, media operation and candidate discipline had never been built to outlive him, then withheld the one thing — his own candidacy — that might have held the vote. UKIP's 2017 collapse was widely read as the Brexit mission accomplished. It was also, structurally, the removal of the only man on the ballot.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Nuttall_Millbank_%2833257448610%29.jpg",
      links: [
        { label: "Wikipedia — Paul Nuttall", url: "https://en.wikipedia.org/wiki/Paul_Nuttall" },
      ],
    },
    {
      act: "the-succession",
      year: "Sep 2017 – Feb 2018",
      title: "Bolton & the Marney texts",
      place: "Westminster",
      key: false,
      body: "Henry Bolton, an ex-Army officer and former Lib Dem candidate, becomes UKIP's fourth leader in eighteen months. Within weeks his 25-year-old girlfriend Jo Marney is exposed sending racist texts about Meghan Markle. Farage first warns that ousting Bolton would make the party a laughing stock, then lets the execution proceed: at an extraordinary general meeting in February 2018, members sack Bolton 867–500.",
      detail:
        "Bolton's own account, given repeatedly afterwards, was that the Farage loyalists who ran the party never accepted him and used the Marney affair to finish him — the same account, in substance, as Diane James's. By early 2018 UKIP had cycled through four leaders since the referendum, lost its only MP, been docked EU funds, and was polling under 5%. The courtiers around Farage now reached the conclusion the dossier had long since reached: the machine could not be repaired, only replaced. Its replacement was already registered.",
      links: [
        { label: "Wikipedia — Henry Bolton", url: "https://en.wikipedia.org/wiki/Henry_Bolton_(politician)" },
      ],
    },
    {
      act: "the-succession",
      year: "4 Dec 2018",
      title: "Quits his own party — 'with a heavy heart'",
      place: "LBC studio, London",
      key: true,
      body: "After Gerard Batten appoints Tommy Robinson as an adviser on 'grooming gangs and prison reform' — and UKIP's NEC fails to pass a no-confidence motion — Farage announces on his LBC show that he is resigning his membership of the party he co-founded twenty-five years earlier. 'The very idea of Tommy Robinson being at the centre of the Brexit debate is too awful to contemplate.' Batten replies: sour grapes.",
      detail:
        "It is the strangest entry in the betrayals ledger, because the betrayed party is his own. Farage's reasoning was not dishonourable — Robinson genuinely was a red line, and Batten genuinely was marching the party towards street far-right activism — but the structural fact is the one that matters: he did not stay to fight for the institution he built, because institutions were never the asset. Within weeks of his exit, Nuttall, Suzanne Evans and most of the party's remaining talent followed. UKIP was finished as a national force. The Brexit Party was registered the following month.",
      pullQuote: {
        text: "And so, with a heavy heart, and after all my years of devotion to the party, I am leaving UKIP today. There is a huge space for a Brexit party in British politics, but it won't be filled by UKIP.",
        attribution: "Nigel Farage, Daily Telegraph, 4 December 2018",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Gerald_Batten_MEP_portrait_2010.jpg",
      links: [
        { label: "Politico — Nigel Farage quits UKIP", url: "https://www.politico.eu/article/nigel-farage-quits-ukip/" },
        { label: "Sky News — Batten accuses Farage of 'sour grapes'", url: "https://news.sky.com/story/ukip-leader-gerard-batten-accuses-nigel-farage-of-sour-grapes-for-quitting-party-11573106" },
      ],
    },
    {
      act: "the-succession",
      year: "Apr – May 2019",
      title: "The Brexit Party — built in weeks, wins in six",
      place: "Nationwide",
      key: true,
      body: "The Brexit Party — incorporated in January 2019 by Catherine Blaiklock, who resigns within weeks over anti-Islam tweets — launches on 12 April 2019 with Farage as leader. Six weeks later it wins the European elections with around 30.5% of the vote and 29 seats, reducing the governing Conservatives to fifth place on 9%.",
      detail:
        "The new machine corrected the old one's flaws by removing them: no elected NEC with independent power, no troublesome membership constitution — a company structure with Farage in control and Banks money in the bank. Ann Widdecombe, Annunziata Rees-Mogg and a slate of celebrity candidates provided the respectability; Farage provided everything else. It is the purest expression of his theory of politics: a party should be a vehicle with one driver, scrapped the moment the destination changes. The destination was about to change.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b9/European_Elections_2019_-_Vote_Nigel_Farage_%28EFDD%2C_UK%29%2C_EFDD_Group_leader_in_the_UK_01.jpg",
      links: [
        { label: "Wikipedia — Brexit Party", url: "https://en.wikipedia.org/wiki/Brexit_Party" },
        { label: "Wikipedia — 2019 European Parliament election in the UK", url: "https://en.wikipedia.org/wiki/2019_European_Parliament_election_in_the_United_Kingdom" },
      ],
    },
    {
      act: "the-succession",
      year: "Nov – Dec 2019",
      title: "The Great Stand-Down — 317 candidates withdrawn",
      place: "Nationwide",
      key: true,
      body: "On 11 November 2019, with the general election under way, Farage announces that the Brexit Party will not contest the 317 seats won by the Conservatives in 2017 — a unilateral withdrawal made without consulting candidates who had paid deposits, left jobs and spent their own money. In December the party wins no seats and 2% of the vote. Johnson's majority is eighty. Farage never stands himself.",
      detail:
        "Veterans of the stand-down still describe it as the party's stab in the back: some candidates learned of their withdrawal from the television. Farage's defence — that splitting the Leave vote risked a second referendum — was strategically coherent and personally convenient in equal measure: it preserved his role as Brexit's guarantor while avoiding an eighth Westminster candidacy. Within a year the Brexit Party was moribund, renamed Reform UK in January 2021 with Richard Tice at the front and Farage as 'honorary president'. The chair was being kept warm again.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/67/Brexit_Now_%2848797794727%29.jpg",
      links: [
        { label: "Wikipedia — Brexit Party, 2019 general election", url: "https://en.wikipedia.org/wiki/Brexit_Party" },
      ],
    },

    /* ─── ACT IV · REFORM ────────────────────────────────── */
    {
      act: "reform",
      year: "2021 – 2023",
      title: "The wilderness years — GB News, the jungle, the brand",
      place: "London / Queensland",
      key: false,
      body: "Tice becomes Reform UK leader in March 2021; Farage is honorary president, a broadcaster on GB News from June, and a highly paid traveller. In November 2023 he enters I'm a Celebrity… Get Me Out of Here! — reportedly for around £1.5 million — and finishes third. Outside income will make him one of the highest-earning MPs in history before he is even an MP.",
      detail:
        "The wilderness years look like retirement and function like maintenance: the brand kept warm on television, the machine kept in storage under a caretaker, the optionality preserved. When Reform UK polled 1–2%, Farage was a broadcaster; the moment a general election made the machinery valuable again, the broadcaster remembered he had always been the leader. Tice's own verdict, delivered with a straight face in June 2024, was that handing the party back was something he had always intended. Perhaps.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Official_portrait_of_Nigel_Farage_as_an_MEP_2019.jpg",
      links: [
        { label: "Wikipedia — Reform UK", url: "https://en.wikipedia.org/wiki/Reform_UK" },
      ],
    },
    {
      act: "reform",
      year: "3 Jun 2024",
      title: "The handover — Tice steps aside mid-campaign",
      place: "Westminster",
      key: true,
      body: "Five weeks into the general election campaign — and eleven days after saying he would not stand — Farage announces he is taking over as leader of Reform UK and standing in Clacton. Richard Tice, who has led the party for three years and spent millions on it, calls an emergency press conference to announce his own demotion and hails it as a plan executed to perfection.",
      detail:
        "It was the reverse of a betrayal and the same mechanism: in the Farage system, offices are occupied at his pleasure, whether the movement is his arrival or his exit. Tice was rewarded with chairmanship, then the deputy leadership, then the DOGE brief — always close, never sovereign. The polling effect was immediate: Reform surged from ~11% to within touching distance of the Conservatives. The lesson for every colleague was identical to the one Kilroy-Silk learned in 2004: proximity to the throne is conditional, revocable, and never to be mistaken for succession.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Nigel_Farage_Trago_Mills_June_2024.jpg",
      links: [
        { label: "Wikipedia — Nigel Farage, Reform UK leader", url: "https://en.wikipedia.org/wiki/Nigel_Farage" },
        { label: "Guardian — Farage stirs tensions as he ousts deputies", url: "https://www.theguardian.com/politics/article/2024/jul/11/nigel-farage-stirs-tensions-in-reform-uk-as-he-ousts-deputies" },
      ],
    },
    {
      act: "reform",
      year: "Jun 2024",
      title: "'We provoked this war' — the Ukraine interview",
      place: "BBC Broadcasting House",
      key: false,
      body: "In a Panorama interview on 21 June 2024, Farage says of Russia's invasion of Ukraine: 'It was obvious to me that the ever-eastward expansion of Nato and the European Union was giving this man a reason… to say, they're coming for us again.' He insists Putin is to blame 'but we've provoked this war'. Days later Channel 4 films a Reform canvasser calling Rishi Sunak a racial slur; Farage says the party was stitched up.",
      detail:
        "The Ukraine comments were a decade in the making — he had named Putin the world leader he most admired 'as an operator' in 2014, and appeared on Russia Today dozens of times — but the timing converted them from colour into character testimony mid-campaign. Sunak called the remarks wrong; Wallace said he was 'a pub bore'. The canvasser episode produced the counter-pattern: the party that trades in plain speaking discovered, when its own plain speakers were filmed, that the footage must be fake. Both stories were absorbed without cost. Reform's vote held; the provocation economy paid out again.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Nigel_Farage_June_2024.png",
      links: [
        { label: "BBC — 'We provoked this war' (Panorama clip)", url: "https://www.bbc.co.uk/news/videos/c8vv3vgngd0o" },
      ],
    },
    {
      act: "reform",
      year: "4 Jul 2024",
      title: "Clacton — the eighth attempt lands",
      place: "Clacton-on-Sea, Essex",
      key: true,
      body: "At his eighth attempt, Nigel Farage is elected to the House of Commons: Clacton, 21,225 votes, 46.2%, a majority of 8,405. Reform UK wins five seats on 14.3% of the vote — the third-largest vote share in the country. The next day a woman who threw a milkshake over him at his campaign launch is in court; the nation, for once, has bigger things to discuss.",
      detail:
        "The seat was chosen with care: Clacton returned UKIP's only ever by-election winner (Carswell, 2014), voted Leave by roughly 70%, and contained the most-deprived neighbourhood in England. Farage's victory completed a strange thirty-year arc — the permanent protester entering the institution he had spent his life besieging, at the head of a party with more votes than the Liberal Democrats and a fraction of their seats. Within a year, two of the five Reform MPs elected that night would have been purged or self-suspended: Rupert Lowe and James McMurdock. The machine had arrived in Westminster; it immediately began eating itself, on schedule.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Clacton_Pier%2C_outdoor_amusements.JPG",
      links: [
        { label: "UK Parliament — Clacton 2024 result", url: "https://members.parliament.uk/constituency/3989/election/559" },
        { label: "Wikipedia — 2024 general election", url: "https://en.wikipedia.org/wiki/2024_United_Kingdom_general_election" },
      ],
    },
    {
      act: "reform",
      year: "Dec 2024 – Jan 2025",
      title: "Musk — the $100m courtship and the unfollow",
      place: "Mar-a-Lago, Florida",
      key: false,
      body: "In December 2024 Farage and Arron Banks fly to Mar-a-Lago to meet Elon Musk; a donation of up to $100 million is briefed to the Sunday Times. Three weeks later Musk posts that Farage 'doesn't have what it takes' to lead Reform — and suggests Rupert Lowe instead. The world's richest donor installs the idea of a rival before Reform's most fragile quarter.",
      detail:
        "The sequence matters for what follows. Musk's intervention made Lowe — until then a little-known ex-football-club chairman and first-term MP — the vehicle of every doubt about Farage's leadership, at exactly the moment Reform was professionalising for the local elections. Lowe's Daily Mail interview questioning whether 'Nigel will deliver' came six weeks after Musk's endorsement of his statements. When the purge came, it came fast. The dossier draws no conclusion about causation; it records the order of events, which is suggestive enough.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/President_Donald_Trump_and_Nigel_Farage.jpg",
      links: [
        { label: "Perspective Media — timeline of the Lowe–Farage fallout", url: "https://www.perspectivemedia.com/timeline-of-rupert-lowes-fallout-with-reform-uk-and-nigel-farage/" },
      ],
    },
    {
      act: "reform",
      year: "7 Mar 2025",
      title: "The Lowe Purge — suspended, reported to the police",
      place: "Westminster",
      key: true,
      body: "Two days after Rupert Lowe tells the Daily Mail that Reform is 'a protest party led by the Messiah', Reform UK suspends him and reports him to the Metropolitan Police, alleging 'threats of physical violence' against chairman Zia Yusuf — plus bullying complaints from two staffers. Leaked WhatsApps show Farage's private verdict: Lowe is 'disgusting', 'contemptible', 'damaging the party just before elections'.",
      detail:
        "On 14 May 2025 the Crown Prosecution Service declined to bring any charges — 'insufficient evidence to provide a realistic prospect of conviction' — and Lowe marked the occasion by calling Farage 'a coward and a viper' and declaring that 'Nigel Farage must never be prime minister'. He sits as an independent, then founds his own outfit, Restore Britain. Reform's line — that the police referral and the criticism were unrelated — is undermined by the leader's own leaked messages tying the suspension to electoral damage. The template is Carswell's, accelerated: no briefing war this time, just a police referral within forty-eight hours of the offence of independence. Even Farage later hinted on GB News that calling the police might have been 'one wrong' among a hundred things. It remains the defining act of his Reform leadership: the moment the party demonstrated what happens to tall poppies.",
      pullQuote: {
        text: "I will not work with the rotten and deceitful Reform leadership… Nigel Farage must never be prime minister.",
        attribution: "Rupert Lowe MP, March 2025",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Official_portrait_of_Rupert_Lowe_MP.jpg",
      links: [
        { label: "BBC — leaked messages reveal Farage fury with Lowe", url: "https://www.bbc.co.uk/news/articles/cj0qgnvqmm5o" },
        { label: "Telegraph — 'a coward and a viper': CPS drops Lowe case", url: "https://www.telegraph.co.uk/politics/2025/05/14/rupert-lowe-not-prosecuted-reform-bullying-allegations/" },
        { label: "Sky News — Met launches investigation into Lowe", url: "https://news.sky.com/story/met-police-launches-investigation-into-suspended-reform-mp-rupert-lowe-over-verbal-threats-13326300" },
      ],
    },
    {
      act: "reform",
      year: "1 May 2025",
      title: "The sweep — 677 seats, ten councils, six votes",
      place: "Nationwide / Runcorn",
      key: true,
      body: "At the 2025 local elections Reform wins 677 council seats and control of ten councils, with a projected 30% national share — the first time neither Labour nor the Conservatives has topped a local-election projection. The same day, Sarah Pochin takes Runcorn and Helsby from Labour by six votes — 12,645 to 12,639 — overturning a majority of 14,696 in the closest post-war by-election.",
      detail:
        "The night Reform became a governing fact rather than a polling vibe: Durham, Kent, Staffordshire and seven more councils, plus the Greater Lincolnshire mayoralty for Andrea Jenkyns. Farage called it 'a very big moment'. It was also the moment the party's internal contradictions became expensive: a party built to win protest votes now had bins to collect, budgets to set, and a parliamentary party of five containing a former police-complaint suspect, a former loan-scandal suspect, and a Messiah. The month after the sweep, the chairman resigned. The month after that, an MP surrendered the whip. The dossier calls this 'governing altitude sickness'.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/da/Official_portrait_of_Sarah_Pochin_MP%2C_2025.jpg",
      links: [
        { label: "Wikipedia — 2025 UK local elections", url: "https://en.wikipedia.org/wiki/2025_United_Kingdom_local_elections" },
        { label: "UK Parliament — Runcorn and Helsby by-election result", url: "https://electionresults.parliament.uk/elections/3929" },
      ],
    },
    {
      act: "reform",
      year: "5 – 7 Jun 2025",
      title: "Yusuf's forty-eight hours — the burqa-row resignation",
      place: "Westminster",
      key: false,
      body: "Hours after new MP Sarah Pochin asks the Prime Minister to ban the burqa at PMQs, chairman Zia Yusuf — Reform's largest 2024 donor and the architect of its professionalisation — calls her question 'dumb' on X and resigns: 'I no longer believe working to get a Reform government elected is a good use of my time.' Forty-eight hours later, after talks with Farage, he is back — to run the party's DOGE unit, then policy, then, by February 2026, the home affairs brief.",
      detail:
        "The resignation-that-wasn't completed a tidy quadrilogy of Farage-era personnel events: the MP purged (Lowe), the whip surrendered (McMurdock, July 2025, amid questions over his business's Covid loans), the chairman un-resigned (Yusuf), the leader blameless. Farage's explanation for the whole episode pointed outward — 'I think it comes from the very hard extreme right… They're Indian bots. Someone's paying for it to happen. I've no idea who it is.' Kemi Badenoch called Reform 'a fan club'; the fan club was, at that moment, leading the polls at 30%.",
      pullQuote: {
        text: "I no longer believe working to get a Reform government elected is a good use of my time, and hereby resign the office.",
        attribution: "Zia Yusuf, 5 June 2025 — rescinded 7 June 2025",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Zia_Yusuf_addresses_Reform_UK_30th_June_2024_-_Birmingham_NEC.jpg",
      links: [
        { label: "The Conversation — Yusuf's resignation leaves Farage weakened", url: "https://theconversation.com/zia-yusuf-turned-reform-into-an-election-winner-his-angry-resignation-leaves-nigel-farage-weakened-258382" },
        { label: "Wikipedia — Zia Yusuf", url: "https://en.wikipedia.org/wiki/Zia_Yusuf" },
      ],
    },
    {
      act: "reform",
      year: "26 Aug 2025",
      title: "Operation Restoring Justice — the mass-deportation plan",
      place: "Airport hangar, Oxfordshire",
      key: true,
      body: "Flanked by a mocked-up airport departures board listing flights to Afghanistan, Eritrea and Iran, Farage unveils Reform's plan to leave the ECHR, repeal the Human Rights Act, 'disapply' the Refugee Convention for five years, and detain and deport 'up to 600,000' people — five charter flights a day, detention for 24,000, a UK Deportation Command, at a gross cost of around £10 billion.",
      detail:
        "'Look, I can't be responsible for despotic regimes all over the world,' he told The Times, defending the abandonment of the non-refoulement principle that has anchored the asylum system since 1951. The Institute for Government walked through the legal obstacles at length; the plan's architects, undeterred, noted that leaving the ECHR would require renegotiating the Good Friday Agreement and declared that possible too. Politically it did what it was designed to do: reset the immigration bidding war at a price neither Labour nor the Conservatives could match, twelve weeks after Labour had called his politics far-right. The dossier notes the recurring economics: the proposal is the punishment.",
      pullQuote: {
        text: "Look, I can't be responsible for despotic regimes all over the world.",
        attribution: "Nigel Farage, The Times, August 2025",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Nigel_Farage_June_2024.png",
      links: [
        { label: "IfG — are Reform's migration plans legally feasible?", url: "https://www.instituteforgovernment.org.uk/comment/reform-uk-migration-policy-legally-feasible" },
        { label: "Oxford COMPAS — the most radical part of Reform's deportation plans", url: "https://www.compas.ox.ac.uk/article/the-most-radical-part-of-reforms-deportation-plans" },
      ],
    },
    {
      act: "reform",
      year: "Sep 2025 – Jan 2026",
      title: "The Tory pipeline — Kruger, Zahawi, Jenrick",
      place: "Westminster",
      key: false,
      body: "Danny Kruger becomes the first sitting Conservative MP to defect to Reform in September 2025. In January 2026 Kemi Badenoch sacks Robert Jenrick from her shadow cabinet with 'clear, irrefutable evidence' he was plotting to defect 'in the most damaging way possible'; he is unveiled by Farage hours later, the same week as former chancellor Nadhim Zahawi. Jenrick's leaked defection plan reportedly styled him 'the new sheriff in town'.",
      detail:
        "The defections are the mirror image of the purges: what leaves Reform in disgrace arrives from the Conservatives in triumph. Farage set a deadline — 7 May 2026 — after which no more Tory defectors would be taken, a device for converting drift into a stampede. The structural question the dossier poses is whether a party defined by insurgency can metabolise the political class it exists to punish; by spring 2026 Reform's front bench read like a reunion of the governments its voters most despised. Yusuf's formulation was blunter: 'There isn't space for two centre-right parties… we must replace the Tory.'",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/62/Official_portrait_of_Robert_Jenrick_MP%2C_2024.jpg",
      links: [
        { label: "Sky News — Jenrick defection a 'milestone', says Yusuf", url: "https://news.sky.com/story/jenrick-defection-makes-it-more-likely-reform-will-win-general-election-says-senior-party-figure-zia-yusuf-13495813" },
        { label: "Economist — where Jenrick's defection leaves the Tories", url: "https://www.economist.com/britain/2026/01/15/where-robert-jenricks-defection-to-reform-uk-leaves-the-tories" },
      ],
    },
    {
      act: "reform",
      year: "Sep – Nov 2025",
      title: "Nathan Gill — the Russia conviction",
      place: "Old Bailey, London",
      key: true,
      body: "On 26 September 2025 Nathan Gill — Reform UK's former leader in Wales, and a UKIP then Brexit Party MEP alongside Farage for six years — pleads guilty at the Old Bailey to eight counts of bribery: taking money from Kremlin-linked figures Oleg Voloshyn and Viktor Medvedchuk to make pro-Russian statements in the European Parliament and to media. On 21 November he is jailed for ten and a half years.",
      detail:
        "Gill's offences (2018–19) predated Reform's existence, and no evidence linked Farage to the payments — Counter Terrorism Policing identified the bribes through WhatsApp traffic after Gill was stopped at Manchester airport in 2021. But the conviction landed on a party whose leader had spent a decade being asked about Russia: the RT appearances, the 'admired as an operator' line, 'we provoked this war', and the 2025 debate over whether Reform would defend Ukraine. The judge's words — 'when you say what someone has paid you to say, you are not speaking with sincerity' — were about Gill. The electorate was invited, by Farage's opponents, to consider the sentence in a wider context. Reform called Gill a marginal figure; he had led the party in an entire nation.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Nathan_Gill_official_portrait_as_an_MEP_in_2019.jpg",
      links: [
        { label: "Counter Terrorism Policing — Gill pleads guilty to bribery", url: "https://www.counterterrorism.police.uk/news/former-mep-pleads-guilty-to-bribery-following-investigation/" },
        { label: "Sky News — Gill jailed for pro-Russian bribes", url: "https://www.youtube.com/watch?v=Ki9pjZpBxlg" },
      ],
    },
    {
      act: "reform",
      year: "Nov – Dec 2025",
      title: "The Dulwich files — twenty contemporaries",
      place: "Dulwich College / Westminster",
      key: true,
      body: "The Guardian publishes testimony from more than a dozen — eventually over twenty — of Farage's Dulwich contemporaries. Bafta-winning director Peter Ettedgui, who is Jewish, says the teenage Farage would 'sidle up to me and growl: Hitler was right, or Gas them, sometimes adding a long hiss to simulate the sound of the gas showers.' Others describe 'gas them all' chants, Oswald Mosley songs, and minority pupils told to 'go home'. Starmer calls Farage 'spineless' and 'a coward'.",
      detail:
        "The response evolved in the classic pattern: from a spokesperson's flat denial ('entirely without foundation'), to Farage's 'I have never hurt anyone with intent', to 'it's 49 years ago… banter in a playground', to a December press-conference tirade accusing the BBC and ITV of double standards for having aired racist programmes. Contemporaries kept coming — Ettedgui on GMB ('I do not want to see a school bully become my prime minister'), Stefan Benarroch ('Hitler should have gassssed you all'), Cyrus Oshidar ('Being called a P**i isn't hurtful?'). Against a backdrop of MP Sarah Pochin's remark that adverts 'full of black people, full of Asian people' drove her mad, the question was no longer about a schoolboy. It was about the candidate for prime minister, and which version of his answer was operative.",
      pullQuote: {
        text: "Have I said things 50 years ago that you could interpret as being banter in a playground that you could interpret in the modern light of day in some sort of way? Yes. Have I ever been part of an extremist organisation or engaged in direct, unpleasant, personal abuse, genuine abuse on that basis? No.",
        attribution: "Nigel Farage, broadcast interview, 24 November 2025",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Official_portrait_of_Nigel_Farage_MP.jpg",
      links: [
        { label: "ITV — timeline of the allegations and responses", url: "https://www.itv.com/news/2025-12-05/timeline-of-allegations-of-racism-against-nigel-farage-and-his-responses" },
        { label: "The Week — was Nigel Farage a teenage racist?", url: "https://theweek.com/politics/nigel-farage-was-he-a-teenage-racist" },
      ],
    },
    {
      act: "reform",
      year: "Apr – May 2026",
      title: "The £5m gift — Harborne, the house, the probe",
      place: "Westminster / Surrey",
      key: true,
      body: "The Guardian reveals that Christopher Harborne — Thailand-based crypto billionaire and Reform's largest donor, who gave the party £12m in 2025 including a record £9m single donation — also gave Farage £5 million personally in early 2024. It was never declared. Sky News reports that Farage completed on a £1.4m Surrey house, in cash, on 10 May 2024. On 13 May 2026 the Parliamentary Commissioner for Standards opens an investigation into failure to register an interest.",
      detail:
        "The explanations migrated: it was for personal security (he had been 'the most attacked and endangered politician in Britain'); it was 'purely private', 'wasn't political in any sense at all'; it was 'a reward for campaigning for Brexit'; it was 'an unconditional gift — I can spend it on cars if I want to… it's entirely up to me.' The Sunday Times then reported that staff and security for Farage had been funded by George Cottrell — 'Posh George', his longtime aide and a convicted fraudster. Parliamentary rules are unambiguous that gifts within twelve months of election must be registered where any doubt exists; doubt existed in abundance. Reform's crypto-deregulation platform, Farage insisted, was long-standing and uninfluenced by the industry funding him. The probe paused when he resigned his seat in July — and resumed the day after he won it back.",
      pullQuote: {
        text: "It was an unconditional gift; I can spend it on cars if I want to. It's entirely up to me.",
        attribution: "Nigel Farage, BBC, 23 June 2026, on the £5m",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Official_portrait_of_Nigel_Farage_MP.jpg",
      links: [
        { label: "Channel 4 FactCheck — the £5m gift and the resignation", url: "https://www.channel4.com/news/factcheck/factcheck-the-latest-on-nigel-farages-5m-gift-and-his-resignation-as-clacton-mp" },
        { label: "iNews — investigation into £5m gift reopens", url: "https://inews.co.uk/news/politics/investigation-into-farage-5m-gift-crypto-billionaire-reopen-4706764" },
      ],
    },
    {
      act: "reform",
      year: "7 May 2026",
      title: "The triumph — Reform tops a national election day",
      place: "Nationwide",
      key: true,
      body: "At the 2026 local elections Reform gains around 1,450 councillors and fourteen councils on a projected 26–27% national vote share — top of the pile for the second year running. Labour loses 1,496 councillors and 38 councils; the collapse forces Keir Starmer's resignation as Prime Minister. Andy Burnham succeeds him. Farage, bookmakers and pollsters agree, is now the favourite to be the next occupant of Downing Street.",
      detail:
        "The structural irony is the dossier's final symmetry: the man who spent forty years as British politics' demolition charge is now its load-bearing wall. Reform's machine — branches, donors, councillors, defectors, a front bench of ex-Tories — is at last an institution rather than a vehicle, which is precisely the kind of thing its leader has historically disposed of. Two months after the triumph, with a standards probe circling his finances, he would test the machine's loyalty with the strangest resignation of his career. It held. Of course it held. It was his.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Official_portrait_of_Nigel_Farage_MP.jpg",
      links: [
        { label: "Wikipedia — 2026 UK local elections", url: "https://en.wikipedia.org/wiki/2026_United_Kingdom_local_elections" },
        { label: "Kellner — the 2026 elections analysed", url: "https://kellnerp.substack.com/p/yesterdays-elections-the-story-so" },
      ],
    },
    {
      act: "reform",
      year: "8 Jul 2026",
      title: "Ann Widdecombe murdered at home",
      place: "Somerset",
      key: true,
      body: "Ann Widdecombe — 78, former prisons minister, Brexit Party MEP, Reform UK spokeswoman and one of Farage's oldest political friends — is murdered at her home. Counter Terrorism Policing takes over the investigation; a 28-year-old white British man, unknown to Prevent, is in custody. The Home Secretary tells a silent Commons that politics 'should not be a dangerous one'. Farage cancels public appearances; security for Reform figures is reviewed.",
      detail:
        "The killing — the third murder of a British political figure in a decade, after Jo Cox and David Amess — landed in the middle of Farage's by-election gambit and changed its emotional weather overnight. His absence from public view in the following weeks was attributed by Reform to 'a credible threat' on the night of the count; Essex Police publicly said they had advised no candidate to stay away. Whatever the operational truth, the political effect was sealed: the most threatened man in Britain — his own long-standing framing, now bloodily uncontestable — asking the country whether a Parliament that investigates him can protect him.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/71/Ann_Widdecombe.jpg",
      links: [
        { label: "GOV.UK — Home Secretary statement on the death of Ann Widdecombe", url: "https://www.gov.uk/government/speeches/statement-about-the-death-of-ann-widdecombe" },
        { label: "Hansard — Death of Ann Widdecombe, 14 July 2026", url: "https://hansard.parliament.uk/Lords/2026-07-14/debates/C051F204-BB9D-4394-A1FA-7D7B5C4C9B03/DeathOfAnnWiddecombe" },
      ],
    },
    {
      act: "reform",
      year: "13 Aug 2026",
      title: "The Binface by-election — resigns, wins, doesn't show up",
      place: "Clacton-on-Sea, Essex",
      key: true,
      body: "On 7 July 2026 Farage resigns his seat to trigger a by-election, saying 'the people of Clacton should be the judges of my actions' over the £5m affair. Labour, the Conservatives, the Lib Dems, the Greens and Lowe's Restore Britain all refuse to stand; a record 34 candidates enter, led by Count Binface. Farage wins 63.3% to Binface's 26.9% — the highest novelty share in British history — and becomes the first winning candidate since Bobby Sands in 1981 not to attend his own count, citing a threat Essex Police declined to confirm. The standards investigation resumes the next day.",
      detail:
        "As a piece of political judo it is vintage: convert an investigation into a referendum, run it against a man in a bin costume, boycott-proof it by making participation beneath the establishment's dignity, and emerge re-elected with the probe legally obliged to start from scratch in procedure if not in substance. Badenoch called it 'Farage's fake by-election'; the Daily Mail warned that 'when they're laughing at you, it's over'. Sixty-three per cent of Clacton was not laughing. The man who has resigned from more positions than any major figure in modern British politics had found the purest application yet of Tactic 5: the resignation as weapon. The file closes with him re-elected, under investigation, favourite for the premiership — and every party he ever built either dead, purged, or waiting its turn.",
      pullQuote: {
        text: "I am the winning candidate – of the candidates who bothered to turn up.",
        attribution: "Count Binface, second place with 26.9%, Clacton count, 14 August 2026",
      },
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Count_Binface.jpg",
      links: [
        { label: "Wikipedia — 2026 Clacton by-election", url: "https://en.wikipedia.org/wiki/2026_Clacton_by-election" },
        { label: "NYT — Farage wins the election he initiated", url: "https://www.nytimes.com/2026/08/14/world/europe/farage-binface-clacton-result-byelection.html" },
        { label: "BBC — Farage returns as MP in boycotted by-election", url: "https://www.bbc.com/news" },
      ],
    },
  ],
  tactics: [
    {
      axis: "capital",
      name: "The Donor Carousel",
      use: "Fund the insurgency through a rotating cast of wealthy patrons, each arriving as saviour and exiting as question mark: Stuart Wheeler, Arron Banks (£8m to Leave.EU, ~£450k personally to Farage), Zia Yusuf, Christopher Harborne (£5m personal gift, £9m record party donation), the Musk courtship, George Cottrell's staff and security. When the money is questioned, the explanation migrates — security, privacy, reward, unconditional gift — and the question is reframed as establishment persecution of the one man who cannot be bought.",
    },
    {
      axis: "identity",
      name: "The Man in the Pub",
      use: "Convert elite biography into outsider credential: Dulwich College, twenty years in the City metals pits, two decades on the EU payroll, seven-figure media income — all laundered through the pint, the cigarette, and the plain-English shrug. The aesthetic is the argument: he drinks where you drink, therefore he thinks what you think. Every attack on the man becomes an attack on the pub.",
    },
    {
      axis: "institutional",
      name: "The Disposable Vehicle",
      use: "Treat parties as single-use machines with one driver. UKIP: built, ridden to a referendum, abandoned at its maximum opportunity ('with a heavy heart'). Brexit Party: registered in weeks, stood down by the hundred without consultation. Reform: taken back from its caretaker mid-campaign. The institution is always expendable; the brand never is. When the vehicle accumulates rivals or liability, the answer is never repair — it is replacement.",
    },
    {
      axis: "demographic",
      name: "Say the Unsayable, Own the Backlash",
      use: "Pitch the proposal at the edge of the acceptable — Breaking Point, 'we provoked this war', the burqa question, 600,000 deportations — and convert elite condemnation into the product. The provocation is the fundraiser: every 'shudder' from a Gove, every fact-check, every Standards Commissioner is Exhibit A in the case that the system fears the voters. Condemnation is not the cost of the tactic; it is the tactic.",
    },
    {
      axis: "capital",
      name: "The Resignation as Weapon",
      use: "Exit not as ending but as instrument: 2009 (Buckingham gamble), 2015 (the three-day un-resignation), 2016 ('I want my life back'), 2018 (quits his own party), 2026 (resigns to trigger a by-election he cannot lose). Each departure is a loyalty referendum that only he can win — caretakers fail, rivals are exposed, and the return is always framed as the movement's demand rather than his decision.",
    },
    {
      axis: "institutional",
      name: "Purge the Tall Poppy",
      use: "Neutralise any colleague whose profile approaches the leader's, using machinery rather than open contest. Kilroy-Silk (NEC closes ranks), Diane James ('irrational selfishness'), Carswell ('the time for him to go is now'), Suzanne Evans ('poisonous'), Bolton (allowed to fall to an EGM), Lowe (suspension plus police referral, forty-eight hours after a critical interview). The rival is always the author of their own destruction; the leader is always reluctantly informed.",
    },
  ],
  engine: [
    {
      step: "Action",
      title: "Build a vehicle around one grievance and one personality",
      body: "Anti-Federalist League, UKIP, Leave.EU, Brexit Party, Reform UK: each machine is conjured around a single promise (the EU, immigration, the betrayal of the people) and a single face. Membership constitutions are avoided; company structures are preferred. The vehicle's constitution, in effect, is the driver.",
    },
    {
      step: "Problem",
      title: "Success breeds rivals, extremists and money questions",
      body: "A vehicle that wins attracts people who want to drive it (Kilroy-Silk, James, Carswell, Lowe), people it cannot afford to carry (Robinson, Gill), and donors whose generosity requires explanation (Banks, Harborne). The bigger the machine, the more of it is not him — and the more pressingly the question is asked: whose party is it?",
    },
    {
      step: "Solution",
      title: "Purge, resign, rebrand — return when the wreck is his again",
      body: "Remove the rival through the executive, the lawyers or the police referral; if the vehicle itself is compromised, resign from it publicly and let a caretaker demonstrate its ungovernability; reappear with a new machine, a new name and a clean story. The record to date: three parties, five resignations, one referendum, one premiership destroyed, and counting.",
    },
  ],
  closing: [
    "The Farage dossier resists the two standard verdicts. He is not the clown of the early caricatures — no clown destroys two governing parties, bends a referendum to his design and ends up favourite for Downing Street. Nor is he the simple conviction politician of the sympathetic biographies — the conviction is real, but it has never once been allowed to inconvenience the man holding it. What the record actually shows is a pure instrument: a politician for whom parties, colleagues, donors and resignations are all the same kind of thing — fuel.",
    "The betrayals, read in sequence, have a rhythm the individual episodes conceal. The rival is embraced, elevated, and removed at the moment their usefulness peaks: Kilroy-Silk's celebrity, Carswell's seat, Woolfe's credibility, Lowe's polling. The party is built, banked and burned at the moment its ownership is contested: UKIP in 2018, the Brexit Party's candidates in 2019, Reform's founding officers in 2024. Even the money follows the pattern — each patron the largest yet, each explanation shorter-lived than the last, until the gift is a house and the register of interests is a by-election.",
    "And yet the file's final pages refuse the easy ending, because the machine keeps winning. The 2026 locals were real; Clacton's 63% was real; the purge of Lowe did not dent the polls, the deportation plan did not price him out, the £5 million did not stop sixty-three per cent of his own town re-electing him against a bin. Britain has spent thirty years waiting for the scandal that finishes Nigel Farage. The dossier is obliged to record that no such scandal currently exists — and to ask whether that says more about him, or about the system that keeps auditing him and losing.",
    "The toolmaker's son became Prime Minister and was consumed by his own machinery within two years. The stockbroker's son built the machinery, crashed it, sold the wreckage and bought it back at a discount — three times. The dossier's final assessment is the one his victims keep supplying: ungovernable without him, unrecognisable with him, and impossible, so far, to bury.",
  ],
};

/** Kept for symmetry with the long-march editor import shape. */
export type FarageData = TimelineData;

/* =========================================================
   DEEP MERGE — admin override over hardcoded defaults
   (identical pattern to starmer.tsx)
   ========================================================= */
function nonEmptyArray<T>(a: T[] | undefined | null): a is T[] {
  return Array.isArray(a) && a.length > 0;
}

function nonEmptyString(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function mergeData(override: Partial<TimelineData> | null | undefined): TimelineData {
  if (!override || typeof override !== "object") return FARAGE_DATA;

  const defaultEventByKey = new Map(
    FARAGE_DATA.timeline.map((e) => [`${e.year}|${e.title}`, e]),
  );
  const mergedTimeline = nonEmptyArray(override.timeline)
    ? override.timeline.map((e, i) => {
        const def =
          defaultEventByKey.get(`${e.year}|${e.title}`) ??
          FARAGE_DATA.timeline[i];
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
    : FARAGE_DATA.timeline;

  const defaultTacticByName = new Map(
    FARAGE_DATA.tactics.map((t) => [t.name, t]),
  );
  const mergedTactics = nonEmptyArray(override.tactics)
    ? override.tactics.map((t) => {
        const def = defaultTacticByName.get(t.name);
        if (!def) return t;
        return { ...def, ...t, axis: t.axis ?? def.axis };
      })
    : FARAGE_DATA.tactics;

  const defaultEngineByStep = new Map(
    FARAGE_DATA.engine.map((s) => [s.step, s]),
  );
  const mergedEngine = nonEmptyArray(override.engine)
    ? override.engine.map((s, i) => {
        const def =
          defaultEngineByStep.get(s.step) ?? FARAGE_DATA.engine[i];
        if (!def) return s;
        return {
          ...def,
          ...s,
          title: nonEmptyString(s.title) ? s.title : def.title,
          body: nonEmptyString(s.body) ? s.body : def.body,
        };
      })
    : FARAGE_DATA.engine;

  const mergedThesis = nonEmptyArray(override.thesis)
    ? override.thesis.filter(nonEmptyString)
    : FARAGE_DATA.thesis;
  const finalThesis = nonEmptyArray(mergedThesis) ? mergedThesis : FARAGE_DATA.thesis;

  const mergedClosing = nonEmptyArray(override.closing)
    ? override.closing.filter(nonEmptyString)
    : FARAGE_DATA.closing;
  const finalClosing = nonEmptyArray(mergedClosing) ? mergedClosing : FARAGE_DATA.closing;

  return {
    contentVersion: override.contentVersion ?? FARAGE_DATA.contentVersion,
    meta: { ...FARAGE_DATA.meta, ...(override.meta || {}) },
    thesis: finalThesis,
    acts: nonEmptyArray(override.acts) ? override.acts : FARAGE_DATA.acts,
    timeline: mergedTimeline,
    tactics: mergedTactics,
    engine: mergedEngine,
    closing: finalClosing,
    extraSections: override.extraSections ?? FARAGE_DATA.extraSections,
  };
}

export default function FaragePage() {
  const { data: saved } = useQuery({
    queryKey: ["/api/page-content/farage"],
    queryFn: () => getPageContent<Partial<TimelineData>>("farage"),
    staleTime: 30_000,
    retry: 1,
  });

  const useDefaults =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("defaults") === "1";

  const D = useDefaults ? FARAGE_DATA : mergeData(saved);

  return (
    <>
      <MembersOnlyBanner variant="auto" />
      <PageStatusGate slug="farage" name="Nigel Farage">
        <TimelineRenderer data={D} />
        <TimelineReactions slug="farage" />
      </PageStatusGate>
    </>
  );
}

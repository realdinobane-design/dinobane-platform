/* ================================================================
   POWER LEAGUE — DinoBane Intel scoring of every actor on the map.
   Five dimensions, each 0-10, editorial judgment from sourced record:
     [0] wealth    — money owned or controlled
     [1] office    — formal state / institutional levers currently held
     [2] network   — who takes the call; embeddedness across institutions
     [3] dynasty   — old money, hereditary depth, institutional age
     [4] influence — agenda-setting: media reach, ideas, street power
   [5] = one-line justification (shown in bios and the league table)
   Total = sum x 2, out of 100. Bands: S 80+ / A 68+ / B 56+ / C 44+ /
   D 30+ / E <30. Scandal nodes are evidence, not players — unscored.
   ================================================================ */
const POWER_DIMS=[["wealth","Wealth"],["office","Office"],["network","Network"],["dynasty","Old Money"],["influence","Influence"]];
const POWER_BANDS=[[80,"S","Apex Power"],[68,"A","Core Power"],[56,"B","Major Player"],[44,"C","Operator"],[30,"D","Satellite"],[0,"E","Periphery"]];
const POWER_SCORES={
  "murdoch":[9,3,10,8,10,"The template: five decades of PMs courting him, papers that claim to decide elections, a global family empire. Leveson barely scratched it. The only S-rated node on the map."],
  "labour":[5,10,9,8,7,"The party of government — it holds every lever of the British state right now. Union funding, Fabian intellectual plumbing, and a century of establishment roots."],
  "tories":[6,7,9,10,6,"The oldest machine in Western politics: 14 years in government, a donor-for-honours pipeline, and establishment depth that survives even electoral collapse."],
  "uae":[10,6,8,9,5,"A ruling family that owns Manchester City, chunks of UK infrastructure, and nearly owned the Telegraph. Absolute-monarchy money with a permanent London footprint."],
  "bbc":[6,6,8,9,9,"The state broadcaster: £3.8bn of licence-fee money, a government-shaped board, and a century of institutional authority. Its power is that everyone must still react to it."],
  "qatar":[10,5,8,8,6,"Harrods, the Shard, Canary Wharf, a slice of Heathrow — gas wealth converted into London itself, plus Al Jazeera as its global voice. Quiet, patient, everywhere."],
  "blair":[7,4,10,8,8,"Out of office more structurally powerful than ever: TBI — 1,000 staff, 45 countries, Ellison's £257m — advises governments worldwide while shaping UK tech policy from outside."],
  "gibb":[10,4,8,8,6,"A vehicle of Sheikh Mansour — UAE vice-president, Manchester City owner. State-scale Gulf wealth that came within weeks of owning the Telegraph until Parliament changed the law."],
  "wef":[8,4,10,7,7,"Davos: where governments, central banks and billionaires settle agendas before voters hear them. A thousand corporations fund the table; everyone powerful sits at it."],
  "israel_lobby":[6,5,10,7,7,"Friends-of groups embedded in every major party at once — CFI once claimed 80% of Tory MPs. The only lobby with a permanent seat inside whoever is governing."],
  "fink":[10,4,9,5,6,"BlackRock stewards ~$11.6tn and now co-chairs the WEF. Courted by Downing Street itself — the roundtables happen before the policies are announced."],
  "israel_state":[7,7,8,6,6,"A foreign state spending directly inside British politics — funded Reform visits, hasbara programmes, an embassy caught discussing 'taking down' a minister on camera."],
  "burnham":[3,10,9,4,8,"Prime Minister since July 2026 — the office itself, held by a man the machine twice tried to block. Maximum formal power, shallow money, a party that didn't want him."],
  "musk":[10,2,7,5,9,"The world's richest man used X as a weapon in British politics — 'civil war is inevitable', demands for a PM's removal. No office, no need for one."],
  "mandelson":[5,6,10,6,6,"The Prince of Darkness: twice disgraced, twice resurrected — EU commissioner, then ambassador to Washington. The most connected man in Labour history; connection is his only product."],
  "farage":[5,7,8,3,9,"The most consequential British politician never to hold ministerial office: drove Brexit, leads the polls, holds his party as a personal company, and broadcasts on the side."],
  "johnson":[6,4,8,6,8,"Ex-PM, ousted by his own party, now selling columns and speeches for millions. Eton-to-Bullingdon establishment muscle memory — influence without a lever."],
  "ellison":[10,3,8,5,5,"Oracle's founder, briefly the world's richest man, who has poured £257m+ into the Tony Blair Institute while Oracle wins £1.1bn in UK government contracts."],
  "unions":[6,4,8,8,5,"Labour's founders and paymasters: £20m+ since 2010 from Unite alone, and votes that decide leadership elections. Transactional, institutional, and older than the party's leader."],
  "fabian":[3,4,8,10,6,"The intellectual engine of the left since 1884 — it co-founded the Labour Party itself. No money, no votes: power as ideas, piped straight into government."],
  "telegraph":[5,3,7,10,6,"The Tory house paper for 170 years — the pipeline between donors, think tanks and front pages. Its own sale required an Act of Parliament. Old institution, new owners circling."],
  "spectator":[4,2,8,10,6,"The world's oldest weekly and the Tory party's intellectual salon — ministers and leaders pass through its pages and garden parties. Small circulation, elite readership."],
  "chandler":[9,2,8,4,6,"Legatum's founder turned a think tank into the hard-Brexit brain inside Whitehall. Billionaire money converted directly into policy — with MI6 claims trailing him."],
  "thiel":[10,3,7,4,5,"Palantir's chairman bought his way into the NHS's £330m data platform after years of lobbying — his own phrase. Surveillance-tech money inside the state's core."],
  "pakistan":[6,5,7,6,5,"The state behind Europe's largest Pakistani diaspora — its stake in Westminster runs through Kashmir friendship groups and biraderi clan voting networks."],
  "sainsbury":[8,2,6,9,3,"Old supermarket money, £40m+ across three parties, always pro-EU. Dynasty wealth deployed across the whole spectrum — but with Brexit lost, his cause is spent."],
  "sky":[7,2,6,7,6,"The pay-TV giant Murdoch built and regulators stopped him swallowing whole. Now Comcast's — big reach, diminished politics."],
  "mahmood":[2,9,8,2,7,"Power that is almost pure office: MI5, police, Prevent, proscription, borders — plus the NEC machinery that helped decide the PM. No money, no dynasty; it all ends the day she's sacked."],
  "marshall":[8,2,7,3,7,"Built a whole media stack (GB News, UnHerd, The Spectator) with hedge-fund money — influence purchased and owned outright, though his audience remains niche."],
  "ashcroft":[9,3,7,4,4,"Bankrolled the Tories for decades and ran their 2010 marginals campaign while refusing to confirm his tax status. Polling operation still shapes the narrative."],
  "mittal":[10,2,6,6,3,"Telecoms dynasty and now BT's largest shareholder at 24.95% — cleared under the National Security and Investment Act. Strategic infrastructure in family hands."],
  "mansour":[8,3,7,5,3,"A former Mubarak minister knighted months after giving the Tories £5m, now their senior treasurer. Bought a seat at the top table of two countries' establishments."],
  "khan":[3,7,7,3,6,"Three-term Mayor of London — the biggest personal mandate in British politics and a £20bn budget. Symbolic power globally; structurally boxed in by Whitehall."],
  "tabor":[8,1,6,6,4,"Billionaire bookmaker and racehorse owner; his son runs Global (LBC). Quiet, durable money with a broadcast wing — old-style power that never has to give interviews."],
  "reform":[4,7,6,0,8,"Polling first through 2025-26 while legally a private company controlled by two directors. A party with no history and no dynasty — power built entirely on momentum."],
  "islam":[4,3,7,5,6,"3.9 million people, an electorate that makes and breaks MPs: the 2024 Gaza backlash cut Labour's vote by 29 points in high-Muslim seats. Power as a voting bloc, unled but courted."],
  "lubner":[6,2,8,5,3,"Blair's fundraiser and tennis partner, arrested in cash-for-honours but never charged. His power was proximity itself — and it ended with the Blair era."],
  "singer":[9,1,6,4,4,"The vulture-fund archetype who beat Argentina in a decade-long lawsuit. His UK power is indirect, routed through US Republican and pro-Israel funding networks."],
  "lbc":[5,2,6,5,6,"Britain's biggest commercial talk station — it platformed Farage nightly for years and sells both sides of the argument. Influence as reach, nothing more."],
  "tice":[6,5,6,2,5,"Reform's deputy leader and former chairman — property money plus party machinery. Real but wholly inside Farage's shadow."],
  "yusuf":[7,5,6,1,5,"Fintech millionaire turned Reform chairman — the organisational brain of the insurgency. Self-made, young, and rising with the polls."],
  "campbell":[4,2,8,4,6,"Blair's spin chief — the Iraq dossier era's most feared operator, now a podcasting elder. Expelled from Labour, still read by everyone who runs it."],
  "brown":[3,3,7,6,5,"A decade at the Treasury and three years in No 10 — the bank bailouts were his. Now an elder statesman of global finance causes, power as memory and Rolodex."],
  "vince":[4,4,6,4,5,"A former Business Secretary and party leader whose party ran on a fraction of the big money — proof that even the 'clean' centrists needed a billionaire (Sainsbury)."],
  "mb":[4,2,7,6,4,"The Brotherhood's British milieu: mapped by a government review as 'secretive' in membership and funding. Nearly a century old — influence through patience, not visibility."],
  "jc":[3,1,6,8,5,"Founded 1841 — the world's oldest Jewish newspaper, which shaped the Labour antisemitism narrative for five years, then published a journalist who did not exist."],
  "aljazeera":[6,2,5,4,6,"Qatar's global channel with a London newsroom — its undercover films have embarrassed two embassies' lobbies. State-funded, structurally outside the British club."],
  "jenrick":[5,4,6,3,5,"Tory leadership runner-up who defected to Reform in January 2026 — carrying donor contacts and a hard-right brand into the insurgency. A bet on where power is going."],
  "epstein":[6,0,9,2,6,"Dead since 2019 — yet his black book still runs through princes, presidents and prime ministers. Network so dense it survived its owner; the map keeps him as a warning."],
  "bannon":[4,2,8,2,7,"The connective tissue of the transatlantic populist right — championed Robinson, platformed Farage. Influence as franchise: he exports the playbook, others run it."],
  "hester":[7,2,8,2,3,"One-dimensional power: £15m+ in donations buys direct access, but he holds no office, no institution, and the party distanced itself the moment his words surfaced."],
  "cottrell":[5,1,6,7,3,"A young aristocrat with a US wire-fraud conviction who ran Farage's 2016 money. Landed-family connections and a criminal record — power as proximity to one man."],
  "lowe":[7,3,5,3,4,"Former Southampton FC chairman, Reform MP, then expelled — now Restore Britain. Money and a platform, but a lesson in what crossing the leader costs."],
  "zahawi":[7,3,6,2,4,"YouGov co-founder who rose to Chancellor — and was sacked over a secret tax penalty paid while running HMRC. Wealth intact, career broken, network quietly dormant."],
  "archer":[7,1,5,5,4,"Novelist-peer, jailed for perjury, still rich and still a lord. Proof that in Britain, disgrace and membership of the club are not mutually exclusive."],
  "gbnews":[5,2,6,1,6,"A loss-making opinion channel that punches far above its ratings — Ofcom breaches without sanctions, and a payroll for serving politicians. Young, loud, owned by believers."],
  "wallace":[3,3,6,4,4,"Defence Secretary through Ukraine's invasion, longest-serving in a generation — then out, and the Afghan leak surfaced on his watch. Respect without a remaining lever."],
  "talk":[4,1,5,5,4,"Murdoch's talk brand — even the insurgent right's second broadcast home is inside the empire. Employs the politicians it interviews."],
  "harborne":[8,0,5,2,3,"A recluse in Thailand who wired Reform the largest donation by a living person in UK history. Enormous money, almost no visible network — power by bank transfer only."],
  "quadrature":[8,1,5,2,2,"A secretive Mayfair quant fund that wrote Labour a £4m cheque days before the 2024 election from tax-haven structures. Pure money, minimal profile — deliberately."],
  "chernukhin":[7,1,5,3,2,"The biggest female donor in British history — £160k for a tennis match with Johnson. Money buying photo-op access; the power ends where the cheque does."],
  "hnh":[3,1,6,2,5,"Britain's largest anti-fascist organisation — real infiltration capability and media access, but a pressure group whose power is wholly derivative of the movements it fights."],
  "robinson":[3,1,6,0,7,"Built the largest far-right street movement in British history from a Luton tanning shop. Crowd power is real — but it can be bankrupted, jailed and deplatformed, and has been."],
  "braverman":[3,3,5,1,5,"Twice Home Secretary, twice removed. Proved the office can be held without ever mastering it — her power now is as a martyr brand on the right."],
  "utk":[2,1,5,0,6,"100,000+ on London's streets — the largest far-right mobilisation in British history. Real crowd power, but no institution, no money and no ballot line of its own."],
  "restore":[3,1,3,0,3,"Rupert Lowe's vehicle after his expulsion from Reform — one MP, one grievance, and proof of how fast Farage's machine can amputate a challenger."],
  "urbanscoop":[2,0,3,0,3,"A citizen-journalism outfit born in 2024 that became UTK's semi-official livestream wing. Reach without institution — here today, deplatformed tomorrow."],
};
function powerTotal(id){const s=POWER_SCORES[id];return s?(s[0]+s[1]+s[2]+s[3]+s[4])*2:null;}
function powerBand(t){for(const b of POWER_BANDS){if(t>=b[0])return{letter:b[1],name:b[2]};}return POWER_BANDS[POWER_BANDS.length-1];}
function powerBandColor(l){return {S:"#e5c15d",A:"#c9a227",B:"#8fa3b8",C:"#7d8b7a",D:"#9a7b5a",E:"#666c74"}[l]||"#8fa3b8";}
if(typeof module!=="undefined")module.exports={POWER_DIMS,POWER_BANDS,POWER_SCORES,powerTotal,powerBand};

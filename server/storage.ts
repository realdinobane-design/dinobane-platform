import { users, messages, articles, type User, type InsertUser, type Message, type InsertMessage, type Article, type InsertArticle } from "@shared/schema";
import bcrypt from "bcryptjs";

// ─── INTERFACE ────────────────────────────────────────────────────────────────
export interface IStorage {
  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserMembership(id: number, isMember: boolean): Promise<User>;
  updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Messages
  getMessages(channel: string): Promise<(Message & { user: User })[]>;
  createMessage(data: InsertMessage): Promise<Message & { user: User }>;

  // Articles
  getArticles(): Promise<Article[]>;
  getArticleById(id: number): Promise<Article | undefined>;
  createArticle(data: InsertArticle): Promise<Article>;
}

// ─── IN-MEMORY STORAGE ────────────────────────────────────────────────────────
class MemStorage implements IStorage {
  private users: User[] = [];
  private messages: Message[] = [];
  private articles: Article[] = [];
  private nextUserId = 1;
  private nextMessageId = 1;
  private nextArticleId = 1;

  constructor() {
    this.seed();
  }

  private async seed() {
    // Seed demo users
    const hash = await bcrypt.hash("demo1234", 10);
    this.users = [
      {
        id: 1, username: "dino_admin", email: "realdinobane@gmail.com",
        password: hash, displayName: "DinoBane", avatarInitials: "DB",
        avatarColor: "#cc2a2a", isMember: true, memberSince: new Date("2025-01-01"),
        stripeCustomerId: null, createdAt: new Date("2025-01-01"),
      },
      {
        id: 2, username: "patriot_uk", email: "patriot@example.com",
        password: hash, displayName: "PatriotUK", avatarInitials: "PU",
        avatarColor: "#1d4ed8", isMember: true, memberSince: new Date("2025-02-01"),
        stripeCustomerId: null, createdAt: new Date("2025-02-01"),
      },
      {
        id: 3, username: "truth_seeker", email: "truth@example.com",
        password: hash, displayName: "TruthSeeker", avatarInitials: "TS",
        avatarColor: "#16a34a", isMember: true, memberSince: new Date("2025-03-01"),
        stripeCustomerId: null, createdAt: new Date("2025-03-01"),
      },
    ];
    this.nextUserId = 4;

    // Seed messages
    const now = new Date();
    this.messages = [
      { id: 1, userId: 2, channel: "general", content: "Just watched the latest video on Reform UK — absolutely spot on. The media silence on this is deafening.", createdAt: new Date(now.getTime() - 3600000 * 2) },
      { id: 2, userId: 3, channel: "general", content: "@PatriotUK Agreed. The BBC won't touch it. Check this out: https://order-order.com — Guido covered it this morning.", createdAt: new Date(now.getTime() - 3600000 * 1.5) },
      { id: 3, userId: 1, channel: "general", content: "Welcome to the DinoBane community. Share what you're finding, @mention each other, drop links. This is the space the platforms don't want us to have.", createdAt: new Date(now.getTime() - 3600000) },
      { id: 4, userId: 2, channel: "news-links", content: "Grooming gang data buried on Budget Day — https://www.spiked-online.com — story of the year and nobody's covering it", createdAt: new Date(now.getTime() - 7200000) },
      { id: 5, userId: 3, channel: "news-links", content: "WEF funding the censorship think tanks — follow the money: https://www.breitbart.com/london/ — this is the full paper trail", createdAt: new Date(now.getTime() - 5400000) },
      { id: 6, userId: 2, channel: "video-discussion", content: "The latest DinoBane video on Farage money trail should be mandatory viewing. Sharing everywhere.", createdAt: new Date(now.getTime() - 1800000) },
    ];
    this.nextMessageId = 7;

    // Seed articles from real DinoBane video transcripts
    this.articles = [
      {
        id: 1,
        title: `Graham Moore — [Unfiltered]`,
        summary: `DinoBane sits down with Graeme Moore, the Daddy Dragon, who traces the betrayal of the English people from the Fabian Society to Nigel Farage.`,
        content: `<p>There are very few people on the political fringe who have both the legal knowledge and the lived experience to back up what they say. Graeme Moore — known online as the Daddy Dragon — is one of them. In a rare DinoBane interview, Moore speaks openly about who he is, what he has been through, and why he believes the English constitution is the most powerful weapon the people of this country have left.</p><p>Moore explains that his online identity is rooted in the original English standard, a dragon that predates the cross of Saint George. He was sent to prison, he says, on a complete fabrication, and used his time inside to immerse himself in law — constitutional law, prison law, and the rights of the individual. He came out self-educated, began helping other prisoners understand their rights, and eventually founded the English Constitution Party and the English Constitution Society, which holds seminars around the country teaching people what they are actually entitled to under common law.</p><p>The conversation turns to how the English constitution came to be so thoroughly buried. Moore points to the slow march through the institutions, a strategy he traces back to the Fabian Society of the nineteenth century. Most people, he argues, do not realise that the Labour Party was created by the Fabians, who were in turn funded by the Rockefellers, the Rothschilds, and major pharmaceutical interests of the era. The working class were herded into a belief system that did not represent them, corralled by a party that was designed to manage, not liberate, them.</p><p>Moore is equally blunt about Nigel Farage, whom he refers to as Benedict Arnold — the American Revolutionary War figure who betrayed George Washington for money. The parallel, he says, is precise. A man who appeared to be fighting for the people, who had built real support and real momentum, and who then turned at the crucial moment. Whether by design or weakness, the result is the same.</p><p>DinoBane pushes back, questions, and draws out some genuinely striking detail — including the fact that both Benedict Arnold and his British handler are buried in unmarked graves in Battersea, London, which Moore takes as a historical verdict on what happens to traitors. For anyone trying to understand why England is in the state it is, and who is actually responsible, this conversation is a good place to start.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=Tyho3Qiq8eY",
        videoId: "Tyho3Qiq8eY",
        thumbnail: "https://img.youtube.com/vi/Tyho3Qiq8eY/maxresdefault.jpg",
        publishedAt: new Date("2026-03-13T20:19:50.000Z"),
        isPublic: true,
      },
      {
        id: 2,
        title: `Inside The Mind of a Leftist`,
        summary: `A self-described Witchy Goth accuses DinoBane of hidden Nazi symbolism and far-right extremism — and the results are as entertaining as they are revealing.`,
        content: `<p>One of the more persistent questions DinoBane gets from his audience is how you convince left-leaning people that the right is not what the media tells them it is. This video is his answer, and it is not the one you might expect. It does not matter what you say. It does not matter what you do. As long as the label exists, and as long as the media keeps applying it, a certain type of person will simply invent the evidence they need.</p><p>The video features a YouTuber called the Witchy Goth, who stumbled across DinoBane's channel and recorded a reaction video full of confident accusations about far-right extremism, hidden Nazi symbolism, and veiled threats of civil war. DinoBane plays it back and dissects it in real time, and the result is a masterclass in how propaganda works — not from governments or broadcasters, but from ordinary people who have absorbed enough of the narrative to reproduce it independently.</p><p>Her central charge is that DinoBane's channel logo resembles the sun wheel appropriated by German fascists in the 1930s, and that the colours red, black, and white are inherently far-right. She also claims he makes veiled threats against people who do not share his views, that he implies brown and black people are not British, and that he is, without ever quite saying it, some kind of fascist.</p><p>DinoBane's response is to go through each claim methodically and point out that they are simply not true. He has said repeatedly and on record that he does not support mass deportation of everyone. He has never suggested anything that could reasonably be called a threat. The logo she is describing belongs to a different channel. And as for the accusation that he makes out he is not right-wing — he points out he has never once denied being right-wing.</p><p>What the video really reveals is the mechanism itself. The left does not need evidence. It needs association. If you can link a name or a symbol to something that already triggers disgust — Nazism, fascism, racism — the argument is over before it starts. The Witchy Goth does not watch DinoBane's channel. She has seen one video, half of another, and invented the rest. That, DinoBane argues, is not a coincidence. That is how you keep people from finding out what is actually being said.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=glP5aWLwd6s",
        videoId: "glP5aWLwd6s",
        thumbnail: "https://img.youtube.com/vi/glP5aWLwd6s/maxresdefault.jpg",
        publishedAt: new Date("2026-03-12T13:54:12.000Z"),
        isPublic: true,
      },
      {
        id: 3,
        title: `They Buried This Footage For a Reason`,
        summary: `Secret footage of David Cameron promising Muslim groups positions of power across the military and government — without ever asking the British people.`,
        content: `<p>People often ask how Britain got to where it is. DinoBane's answer in this video is a simple one: they told you exactly what they were doing. They just made sure you were not watching.</p><p>The centrepiece of the video is footage of David Cameron, recorded without his knowledge, speaking at the Conservative Muslim Forum. In it, he explicitly tells the audience that he wants more Muslim men and women at the top of British businesses, more Muslim soldiers at the highest levels of command, and more Muslims across government in positions of leadership and authority. This was not a policy paper or a white paper. It was a promise made to a specific group, at a private gathering, without any mandate from the British electorate.</p><p>DinoBane makes the obvious point: he does not remember being asked about this. No one voted for it. No manifesto set it out. The British public, going about their daily lives, raising their families, getting on with things — they were never consulted. And yet here is the leader of the Conservative Party, the supposed party of tradition and sovereignty, openly committing to the Islamisation of British institutions.</p><p>But the video goes further. The Conservative Muslim Forum was co-founded by David Cameron and a man called Muhammad Iqbal Sheikh, who had alleged links to the Muslim Brotherhood — an organisation committed to establishing a global caliphate through political Islam. DinoBane is careful not to overstate this, but the implication is clear enough. When a prime minister makes explicit promises to figures with Islamist ties, the people of this country have a right to know about it.</p><p>The broader argument of the video is one DinoBane returns to often. The real architects of what has happened to Britain are not migrants in dinghies — they are politicians in suits, academics with platforms, and media organisations with agendas. Tony Blair and David Cameron, he argues, did more damage to the English identity than anyone else in living memory. Blair with his open-borders ideology and devolution of power to quangos, and Cameron with his explicit dismantling of what it meant to be English and British in favour of a vague multicultural consensus that nobody ever chose. The footage was buried for a reason. Now you have seen it.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=Xfz1TaCRblA",
        videoId: "Xfz1TaCRblA",
        thumbnail: "https://img.youtube.com/vi/Xfz1TaCRblA/maxresdefault.jpg",
        publishedAt: new Date("2026-03-12T13:02:10.000Z"),
        isPublic: true,
      },
      {
        id: 4,
        title: `We're Taking It Back`,
        summary: `A defiant address to the English people — the milkmen, the mums, the lads on TikTok — who are quietly, steadily waking up and refusing to apologise.`,
        content: `<p>This is not a video about statistics or politicians. It is a direct address to the people — and it is one of the most honest things DinoBane has put on screen.</p><p>It begins with gratitude. For the likes, the shares, the comments that keep the channel alive. For the people who did not just scroll past. For those willing to sit with the discomfort of what has been done to this country and feel it clearly rather than numb themselves to it. DinoBane acknowledges that most people would rather stay comfortable. The ones who do not, he says, are already awake.</p><p>From there, the video becomes something else — a lament, told without self-pity, for what England has lost. The milkman at dawn. Sunday roast. Kids kicking footballs in the street without a second thought. Doors left unlocked. The quiet certainty that this island was yours. DinoBane is insistent that this was not nostalgia. It was real, and it was taken — slowly, deliberately, and by people who knew exactly what they were doing.</p><p>He describes the process in sharp terms. Shakespeare replaced with decolonisation. History reframed as a guilt trip. The television flooded with imagery designed not to reflect the country but to reshape it. Halal butchers, vape shops, and mosques where parish churches used to anchor the high street. None of this was organic, he argues. It was planned, funded, and executed by a class of people — the NGOs, the politicians, the academics, the corporations — who wanted a borderless, guilt-ridden population because it is easier to manage.</p><p>But the video does not end in despair. DinoBane believes the tide is turning. He points to the comments, the WhatsApp groups, the quiet nods in pubs and on trains. A movement is growing — not funded, not organised, just the English people getting tired of pretending. The suits and the NGOs and the BBC are scared, he says, because they know what a united people looks like when it stops flinching.</p><p>The closing lines are addressed directly to the audience. To the old men in the corner of the pub. To the mums on the school run. To the lads scrolling their phones. England is yours, he says. You do not need to apologise for that. Not now. Not ever.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=gfZDulfXDQU",
        videoId: "gfZDulfXDQU",
        thumbnail: "https://img.youtube.com/vi/gfZDulfXDQU/maxresdefault.jpg",
        publishedAt: new Date("2026-03-11T12:23:38.000Z"),
        isPublic: true,
      },
      {
        id: 5,
        title: `[ WARNING! ] This Video Will Make You a Patriot`,
        summary: `From Communist Party directives on labelling your opponents, to Enoch Powell, to an Englishman from Bermondsey tracing nine generations of roots — this video asks who really belongs here.`,
        content: `<p>The video opens with a directive from the Communist Party of the United States, reportedly issued to party members, instructing them to label opponents as fascists, Nazis, or anti-Semites. The instruction was simple: repeat the association often enough and it becomes fact in the public mind. What follows is a montage of exactly that tactic being deployed in modern Britain — the words fascist, racist, xenophobic, white supremacist, Nazi, and ethnonat thrown at anyone who raises a concern about immigration, identity, or culture.</p><p>DinoBane does not need to narrate this section. The footage speaks for itself. Commentators, politicians, and online personalities calling each other Nazis, demanding red lines against anyone who questions the demographic transformation of the country, while simultaneously admitting — as one clip does, almost accidentally — that Israel is itself an ethnostate. The cognitive dissonance is laid out without commentary.</p><p>The video shifts to archive footage — Enoch Powell, arguing in the House of Commons that the real issue in post-war Britain is not immigration itself but the denial of free speech to the English in their own land. Footage of working-class communities speaking candidly about what has happened to their towns, their neighbours gone, their culture thinned out, their requests to the authorities ignored. An elderly woman saying that after two world wars, English people should at least have the dignity of living among their own kind.</p><p>The centrepiece of the video is an Englishman from Bermondsey in South London, standing up and tracing his family tree. His father was from Bermondsey. His grandfather. His great-grandfather, who had eleven brothers and sisters. Forty-three children between them. One hundred and fifty-nine children in the following generation. He has tracked over two hundred descendants, many still in the area, seven named George, five named Victoria. He stands and asks, in the name of all of them, what is happening to the country they built.</p><p>This is the video DinoBane is making to answer the question of what it means to be English. Not a theory. Not a political argument. Just a family, a place, and a question that nobody in power seems to want to answer.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=Z1Ok0954i-8",
        videoId: "Z1Ok0954i-8",
        thumbnail: "https://img.youtube.com/vi/Z1Ok0954i-8/maxresdefault.jpg",
        publishedAt: new Date("2026-03-11T07:11:48.000Z"),
        isPublic: true,
      },
      {
        id: 6,
        title: `Ben Habib Is Cooked`,
        summary: `Ben Habib plays the race card against Robert Lowe and Restore Britain on an American Zionist podcast — and DinoBane has the tweets to prove he is lying.`,
        content: `<p>Ben Habib has given an interview to an American podcaster called Don Keith, a self-described Zionist who most people in the UK will not have heard of. DinoBane finds it strange that a man claiming to fight for the British people should be flying to American Zionist podcasters to air his grievances. But strange or not, the interview has happened, and what it contains is damning — not for Restore Britain, but for Habib himself.</p><p>The centrepiece of DinoBane's analysis is a twenty-five second clip in which Habib is asked why Robert Lowe did not accept his offer to join Restore Britain. Habib offers two possible explanations: either Lowe simply wants a party entirely under his own control, or — and here he pauses — it could be his ethnicity. DinoBane's response is to reach for the screenshots. He pulls up tweets, publicly available, in which Advance UK and its members are explicitly welcomed into Restore Britain by the party itself. The invitation was real. The claim that Habib was rejected on racial grounds is, on the face of it, a fabrication.</p><p>DinoBane also dismantles Habib's claim that Advance UK is a democratic organisation. Habib points to Advance UK's electoral college as evidence of internal democracy. DinoBane points out that the electoral college was chosen by Habib himself, is accountable to Habib, and has been used to shut down internal debate. A circle of your own appointees does not constitute democracy. It constitutes control.</p><p>The deeper question in this video is not about party politics. It is about motive. Why is a man who claims to care about Britain spending his time on American Zionist podcasts, playing the race card against a grassroots English movement? Why has he reversed his previous positions on English identity, moving from something recognisably ethnic to a civic nationalist line that anyone with the right feelings can call themselves English? DinoBane does not have a definitive answer, but he is not willing to pretend the question does not exist. Something stinks, he says. And the internet is forever.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=QFFO3EyGKUo",
        videoId: "QFFO3EyGKUo",
        thumbnail: "https://img.youtube.com/vi/QFFO3EyGKUo/maxresdefault.jpg",
        publishedAt: new Date("2026-03-10T19:58:30.000Z"),
        isPublic: true,
      },
      {
        id: 7,
        title: `The 'DEBATE' Is Over`,
        summary: `Don Keith and Ben Habib try to frame Restore Britain as inherently racist using tweets from bot accounts — and DinoBane explains exactly why the tactic works.`,
        content: `<p>The debate about English identity is over in the sense that one side has stopped arguing and started labelling. DinoBane walks through the interview between Don Keith — an openly fervent Zionist podcaster — and Ben Habib, and identifies the propaganda technique being deployed with unusual precision.</p><p>Don Keith opens the interview not with questions but with preparation. He reads out a series of offensive tweets directed at Habib — deeply unpleasant messages calling him a subhuman and worse — and frames them as representative of the Restore Britain movement and its supporters. The implication is clear: support Restore Britain, and this is the company you keep.</p><p>DinoBane digs into the tweets themselves. None of them had likes. None had retweets. They were isolated, single-post entries with no spread and no engagement — the opposite of something celebrated or endorsed by a community. Looking into the accounts behind them, he finds that most are not English at all. Many appear to originate from Islamic accounts or South American profiles. Several are only a few months old and look like bots. The tweets were not representative of anything. They were curated to create an impression.</p><p>The technique has a name. Guilt by association. It has been used against anyone who identifies with the English flag for at least thirty years. First they called you a racist. Then a Nazi. Then a neo-Nazi. Now an ethnonat. The words change but the mechanism is the same — link the identity to something that triggers revulsion in the brain, and the person flinches away from it without thinking.</p><p>DinoBane also notes the pattern of who is pushing this particular version of the attack. Don Keith is a Zionist. Ben Habib is half Pakistani. Richard Inman, Paul Thorp, Tommy Robinson — DinoBane has started noticing that a disproportionate number of people suppressing English identity have affiliations or allegiances that are not rooted in England. He is not claiming conspiracy. He is claiming he can read a pattern. And when he sees enough of them lining up in the same direction, he is going to say so.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=DFaVsor8JeI",
        videoId: "DFaVsor8JeI",
        thumbnail: "https://img.youtube.com/vi/DFaVsor8JeI/maxresdefault.jpg",
        publishedAt: new Date("2026-03-10T16:53:13.000Z"),
        isPublic: true,
      },
      {
        id: 8,
        title: `The BATTLE LINES Have Been Drawn`,
        summary: `A migrant goes on a stabbing spree in Scotland, locals protest outside his hotel, and the police who were nowhere to be found suddenly appear — in force, arresting the protesters.`,
        content: `<p>The pattern is always the same. A migrant commits a serious crime. The local community, having lived with the consequences of government housing policy, objects. And then the police — who were nowhere to be found when the crime was committed — appear in numbers to arrest the people protesting. DinoBane opens this video with exactly that scenario: a man named Mustafa Con from Chad who carried out a stabbing spree in Scotland, followed by a community protest outside the hotel where he had been housed by the government, followed by the police arriving to detain the protesters.</p><p>This is not accidental, he argues. This is a choice. A choice about whose side the state is on. And the answer, increasingly, does not appear to be the side of the English people.</p><p>The video broadens to address the formation of Restore Britain under Robert Lowe, and the sharp divide it has exposed between people who claim to be patriots and those who, on closer inspection, seem to be serving a different agenda entirely. DinoBane identifies a pattern in the statements of figures like Shabbana Mahmood, Ben Habib, and others, all of whom have in various ways argued that English identity must change to accommodate those who have arrived in the country. If you say you are English and they are not, they call you racist. They call you an ethnonat. They demand that your identity dilute itself until it no longer means anything.</p><p>DinoBane is direct about the cognitive dissonance he sees in the people making these arguments. Many of them have mixed-race families or close connections to communities that would be excluded by a firm definition of English identity. He does not say this to be cruel. He says it because it explains something that would otherwise be inexplicable: how people who claim to love Britain can simultaneously work to dismantle the very foundation of what Britain is.</p><p>Every argument these people make, he says, ends in the same place: strip away your rights, dilute your country, give away your future, and pay for it yourself. Say no. Those are the battle lines, and they have been drawn.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=fxEwgChVQEs",
        videoId: "fxEwgChVQEs",
        thumbnail: "https://img.youtube.com/vi/fxEwgChVQEs/maxresdefault.jpg",
        publishedAt: new Date("2026-03-09T14:21:40.000Z"),
        isPublic: true,
      },
      {
        id: 9,
        title: `There Is No 'SPLIT' on The 'Right Wing'`,
        summary: `The so-called split on the right is not a split at all — it is civic nationalists finally being separated from the people who were never on the same side as them.`,
        content: `<p>The claim that the British right is splitting is everywhere at the moment. DinoBane does not think it is true. What is actually happening, he argues, is a clarification — a sorting of people who have been travelling in the same direction for different reasons, and who are now starting to acknowledge that they were never really aligned at all.</p><p>He draws a clear distinction between two groups. The first wants mass deportations of illegal migrants, wants the English to be represented in their own country, wants English history and culture celebrated rather than denigrated, and understands English identity as something specific and ancestral. The second group — which DinoBane calls civic nationalists, or civnats — believes that identity is a matter of culture and feeling. If you have lived here long enough and like fish and chips, you are just as English as anyone else.</p><p>DinoBane's argument is that the civic nationalists are not right-wing. Strip out their opposition to Islam, he says, and they sound like Liberal Democrats. They are, at best, centre-left. So what appears to be a split on the right is actually the right separating from people who were never on the right in the first place.</p><p>He also points out that the schism is going in an interesting direction. Civic nationalists are moving towards the ethnic nationalist position, not the other way round. More and more people who previously accepted the civnat framing are starting to think that maybe those who link English identity to ancestry have a point — as long as they are not calling for the deportation of every non-white person, which DinoBane says is a fringe position, understandable given decades of abuse and gaslighting, but not something that mainstream English nationalism either advocates or will enact.</p><p>The video includes a clip of a conversation between Paul Thorp and Richard Inman that illustrates the point. Thorp, pushed directly on whether he supports ethnic nationalism, is forced to be honest rather than evasive. That moment of candour, DinoBane argues, is exactly what the civnat side has been trying to avoid. Because once you admit that English identity is real and specific, the whole framing of a split collapses.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=8oVK_gK_aN8",
        videoId: "8oVK_gK_aN8",
        thumbnail: "https://img.youtube.com/vi/8oVK_gK_aN8/maxresdefault.jpg",
        publishedAt: new Date("2026-03-07T14:13:31.000Z"),
        isPublic: true,
      },
      {
        id: 10,
        title: `The Cat's Out Of The Bag...`,
        summary: `The Ministry of Defence confirms that the drone that struck RAF Akrotiri did not come from Iran — and DinoBane asks the question the BBC will not.`,
        content: `<p>DinoBane did not want to be right about this one. He said from the start, when Iran was blamed for attacks on Western military assets in the Middle East, that the logic did not add up. If you are Iran, the last thing you want is to hand America and its allies a casus belli. If you are Israel, that is exactly what you want Iran to hand you. He said it quietly and took considerable abuse for it in the comments.</p><p>This video is him being vindicated, and he is honest about finding it deeply uncomfortable rather than satisfying. The BBC has reported that the Ministry of Defence has confirmed the drone that struck RAF Akrotiri on the second of March did not come from Iran. The MoD will not say where it came from. DinoBane will say it for them, at least by implication: Cyprus is a short drone flight from Israel. The idea that a drone flew from Pakistan or Libya to strike a British base is the kind of reasoning that requires you to ignore basic geography.</p><p>The live stream format of this video is revealing. He is tired. Tired of being manipulated, tired of being told what he is not allowed to discuss, tired of the one percent of commenters who arrive to muddy every conversation. But the main thing driving his anger is the framing that surrounds every discussion of Israel and its military operations. If you question what Israel does, you are immediately accused of being pro-Iran or anti-Semitic. If you question the drone attribution, you are told to look elsewhere. The idea that you might simply love England and want to know the truth, regardless of which party to a foreign conflict it implicates, is treated as impossible.</p><p>DinoBane invites audience members on to the live stream for the first time in this video — an experiment he is clearly nervous about. The point, though, is the same as it always is: who benefits from keeping the West in a state of permanent war in the Middle East? And who loses? The answer, he says, is not complicated. The cat is out of the bag.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=4NecXlxplf8",
        videoId: "4NecXlxplf8",
        thumbnail: "https://img.youtube.com/vi/4NecXlxplf8/maxresdefault.jpg",
        publishedAt: new Date("2026-03-05T19:58:39.000Z"),
        isPublic: true,
      },
      {
        id: 11,
        title: `Nothing About This Makes Sense. We Need To Unite`,
        summary: `A BBC report confirms the drone that hit a British base did not come from Iran — and an Israeli rabbi from 2024 explains exactly how this kind of deception works.`,
        content: `<p>The mainstream media does not want you to think about this too carefully. That is the opening premise of this video, and DinoBane backs it up with a BBC broadcast that most people will have missed.</p><p>The report, from the Ministry of Defence, confirms that a Shahed-type drone that struck RAF Akrotiri on the second of March did not come from Iran. The BBC reporter carefully notes that the MoD is not saying where it came from — only that it was not Iran. DinoBane has a suggestion. He asks the audience to consider which country in the Middle East has the capability, the motivation, and the geographic proximity to Cyprus to strike a British base. He asks what that country would gain from drawing Britain and America more deeply into a war against Iran. He does not answer the question directly. He does not need to.</p><p>What he does provide is a clip from August 2024 of an Israeli rabbi called Joseph Mizrahi, speaking openly about how Israel should exploit conflicts with Iran. The rabbi describes how, if it were up to him, he would shoot down a missile, pretend it came from Iran, and use it to destroy the Dome of the Rock in Jerusalem — turning the Arab world against Iran in one move. He calls it straightforward thinking. DinoBane finds the candour remarkable.</p><p>The argument of the video is not that Israel definitely did this. It is that asking the question should be permitted. That you should not be shut down, labelled, or accused of anti-Semitism for pointing out that someone benefits from what has happened, that similar things have been done or proposed before, and that the official explanation raises more questions than it answers.</p><p>DinoBane frames this within his broader argument about the manipulation of public opinion in wartime. The government, the media, and the political class all benefit from a population that accepts the narrative and does not ask who is actually pulling the strings. He is not willing to be that population. He wants his audience to stop being that population too.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=4dCSN4G0G68",
        videoId: "4dCSN4G0G68",
        thumbnail: "https://img.youtube.com/vi/4dCSN4G0G68/maxresdefault.jpg",
        publishedAt: new Date("2026-03-05T14:56:36.000Z"),
        isPublic: true,
      },
      {
        id: 12,
        title: `These Channels Are DANGEROUS`,
        summary: `Two right-wing YouTube channels — one accusing DinoBane of running a hate campaign, the other suspected of being entirely AI-generated — expose a growing problem with fake voices on the patriot side.`,
        content: `<p>The problem with the information war is not just the enemy. It is the unreliable allies. DinoBane dedicates this video to two channels that have been heavily recommended to him, both of which he believes the audience should approach with serious caution — one for dishonesty, and one for possibly not being human at all.</p><p>The first is a channel called Jim's Rants. DinoBane left a single comment on one of his videos. Jim responded with a lengthy video accusing DinoBane of running a persistent campaign against him and his associates, of being the kind of creator who demands others kiss the ring, and of being responsible for factional warfare that is tearing the right apart. DinoBane's actual comment — which he eventually reads out — is mild. Jim's reaction to it is extraordinary. DinoBane uses this to make a point about character. Someone who responds to a polite disagreement with accusations of coordinated attack is not someone you should be trusting as a guide through complicated political terrain.</p><p>The second channel is May Hargreaves, recommended to DinoBane numerous times by his audience. He investigates it and comes to the conclusion that it is likely AI-generated. The voice, the pacing, the content — something does not add up. He is not accusing anyone of malice necessarily, but he makes a serious broader argument: the rise of AI-generated political commentary is one of the most dangerous developments in the information landscape right now. You cannot verify who is behind a voice. You cannot check their track record. You cannot hold them accountable. If you are getting your political education from an AI presenting as a human commentator, you are being manipulated by someone you cannot see.</p><p>DinoBane says he wants right-wing voices to grow and succeed. But they have to be real. Fake voices on the right are just as dangerous as fake voices on the left — maybe more so, because they are inside the tent. He will not promote them, will not accept them, and is not interested in pretending they are legitimate.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=8qvL5O3faWg",
        videoId: "8qvL5O3faWg",
        thumbnail: "https://img.youtube.com/vi/8qvL5O3faWg/maxresdefault.jpg",
        publishedAt: new Date("2026-03-05T12:09:24.000Z"),
        isPublic: true,
      },
      {
        id: 13,
        title: `This Is Why They DEMONISE The Working Class`,
        summary: `A bricklayer making videos in the rain puts his finger on exactly why the English working class is being attacked — and DinoBane amplifies the signal.`,
        content: `<p>There is a reason they call you a racist the moment you say you are English. There is a reason they call you a Nazi the moment you say your identity belongs to you. The working class in this country has always been the most dangerous constituency for the establishment, because it has the most to lose and the least reason to go along with the programme. DinoBane opens with that argument and then hands the floor to a bricklayer.</p><p>The channel is one he has never seen before, discovered through a recommendation. The man is a nationalist — straightforwardly, unapologetically — and he is recording a video in the rain on a Sunday, joints hurting, talking about the different labels being invented to divide and discredit people who simply want England for the English. Civnats, etnats, disnats, uncle this, auntie that. A new slur every week to make sure nobody can stand together for long enough to threaten anything.</p><p>The bricklayer makes a point that DinoBane finds worth amplifying: there are people at marches for Britain who insist on flying the flags of other countries alongside the Union Jack. People who, whenever they organise anything for the British, find a way to include the concerns of Israel or Palestine or somewhere else entirely. He calls this contamination. DinoBane calls it a tell.</p><p>The working class is demonised, DinoBane argues, because it is the group most likely to notice what is happening and least likely to pretend it is not. The academics and journalists and politicians who have spent thirty years dismantling English identity know perfectly well that the most resistance will come from ordinary people with nothing to gain from going along with it. So they are pre-emptively labelled as violent, as Nazis, as extremists — to make sure that when someone actually does stand up, the condemnation is already in place.</p><p>He draws a direct parallel with America, where the labelling of MAGA supporters as Nazis was followed by actual street violence against them. The label precedes the attack. It is not a description. It is a justification. And the English working class, he says, needs to understand that when it happens here.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=28BGa1gqlXk",
        videoId: "28BGa1gqlXk",
        thumbnail: "https://img.youtube.com/vi/28BGa1gqlXk/maxresdefault.jpg",
        publishedAt: new Date("2026-03-04T18:36:11.000Z"),
        isPublic: true,
      },
      {
        id: 14,
        title: `The GLORIOUS Noticing Continues`,
        summary: `Tommy Robinson asks whether Ian Wright could stand for Restore Britain — and two straight-talking commentators explain why the question itself is a civnat trap.`,
        content: `<p>Tommy Robinson posted a question on social media asking whether Ian Wright — the Arsenal and England footballer — could stand as a Restore Britain candidate. He framed it as confusion, a genuine request for clarity. DinoBane and two other commentators, Mr Hitch and Bo from the Lotus Eaters, are not confused at all about what is really being asked.</p><p>The video centres on a reaction from a channel DinoBane had not seen before, recommended in his comments, which turns out to be exactly the kind of voice he has been looking for. These are people who say clearly what they think, who are not interested in the civnat hedging that characterises most political commentary on the British right, and who understand that when Tommy Robinson holds up Ian Wright as a test case for Restore Britain, he is not asking a neutral question. He is trying to force the party into a position.</p><p>DinoBane and the commentators break down the mechanics. Ian Wright is a useful example for civic nationalists precisely because he played for England. Millions of football fans have been told for decades that playing for England makes you English. The kickout racism campaigns, the years of messaging — it has worked. So when Robinson asks whether Ian Wright could stand for Restore Britain, he is activating all of that conditioning at once, forcing anyone who says no to be framed as anti-football, anti-unity, and anti-common sense.</p><p>But the underlying question — whether someone whose ancestry is entirely Jamaican and African can be ethnically English — has a straightforward answer. DinoBane does not think it requires much deliberation. What he finds interesting is the way the question is always framed to make the honest answer sound unreasonable.</p><p>He also notes the pattern of Tommy Robinson's movement, Unite the Kingdom, and how it always gravitates to examples like Ian Wright rather than asking what Englishness actually means or where it actually comes from. That gravitational pull, DinoBane says, tells you everything. The noticing, he concludes, continues to be glorious.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=ngqXXLfuWwc",
        videoId: "ngqXXLfuWwc",
        thumbnail: "https://img.youtube.com/vi/ngqXXLfuWwc/maxresdefault.jpg",
        publishedAt: new Date("2026-03-04T10:53:36.000Z"),
        isPublic: true,
      },
      {
        id: 15,
        title: `Nuggets of Gold`,
        summary: `DinoBane points his audience toward an elderly YouTube commentator whose channel is full of hard-won wisdom — and reflects on why he does this at all.`,
        content: `<p>Not every video needs to be a firefight. This one is an introduction — DinoBane pointing his audience towards a channel run by an elderly man whose content he describes as nuggets of gold, and being honest, for once, about the personal cost of what he does.</p><p>He opens by acknowledging that the channel has been relentless recently. Stress, cognitive dissonance, difficult truths about people his audience trusted — he has thrown too much at the wall at once. He wants to slow down. He wants this one to be calm.</p><p>The video is largely a vehicle for introducing an older commentator whose name he does not say outright, but whose style he clearly admires. The man is in his seventies or eighties, starts his videos by shaving on camera because he forgot, talks about war and arms dealers with the weary matter-of-factness of someone who has been watching this pattern repeat for longer than DinoBane has been alive. He is, DinoBane says, exactly what his granddad would be like if his granddad had a YouTube channel — which is the highest possible compliment.</p><p>Before getting to the featured channel, DinoBane pauses to reflect on why he does this. He is 42 years old. He takes no sponsorships and no advertising. He earns relatively little from the channel. He has given up a great deal to do it, things he does not specify but clearly feels the weight of. People call him a grifter. He says they simply do not understand that the motivation is not money — it is waking people up. The comment that means more to him than any other is the one that says a video changed how someone sees the world.</p><p>The older commentator's clip that he plays is brief: a man exhaling slowly, saying arms dealers make billions from war, and it is a pity all those people have to die. DinoBane cuts it there. He wants the audience to go and find the rest of it themselves. Some things, he suggests, are better discovered than explained.</p>`,
        youtubeUrl: "https://www.youtube.com/watch?v=Gskwb1AJkyY",
        videoId: "Gskwb1AJkyY",
        thumbnail: "https://img.youtube.com/vi/Gskwb1AJkyY/maxresdefault.jpg",
        publishedAt: new Date("2026-03-02T19:39:28.000Z"),
        isPublic: true,
      }
    ];
    this.nextArticleId = 16;
  }

  async createUser(data: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      ...data,
      isMember: false,
      memberSince: null,
      stripeCustomerId: null,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async updateUserMembership(id: number, isMember: boolean): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error("User not found");
    user.isMember = isMember;
    if (isMember) user.memberSince = new Date();
    return user;
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error("User not found");
    user.stripeCustomerId = stripeCustomerId;
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getMessages(channel: string): Promise<(Message & { user: User })[]> {
    const channelMessages = this.messages
      .filter(m => m.channel === channel)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return channelMessages.map(m => {
      const user = this.users.find(u => u.id === m.userId);
      return { ...m, user: user! };
    }).filter(m => m.user);
  }

  async createMessage(data: InsertMessage): Promise<Message & { user: User }> {
    const msg: Message = {
      id: this.nextMessageId++,
      ...data,
      createdAt: new Date(),
    };
    this.messages.push(msg);
    const user = this.users.find(u => u.id === msg.userId)!;
    return { ...msg, user };
  }

  async getArticles(): Promise<Article[]> {
    return this.articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    return this.articles.find(a => a.id === id);
  }

  async createArticle(data: InsertArticle): Promise<Article> {
    const article: Article = {
      id: this.nextArticleId++,
      ...data,
      publishedAt: new Date(),
      isPublic: data.isPublic ?? true,
    };
    this.articles.push(article);
    return article;
  }
}

export const storage = new MemStorage();

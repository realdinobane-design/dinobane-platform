import { eq, desc, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db";
import {
  users, messages, articles, media,
  type User, type InsertUser,
  type Message, type InsertMessage,
  type Article, type InsertArticle,
  type Media,
} from "@shared/schema";
import { media } from "@shared/schema";

// ─── INTERFACE ────────────────────────────────────────────────────────────────
export interface IStorage {
  createUser(data: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserMembership(id: number, isMember: boolean): Promise<User>;
  deleteUser(id: number): Promise<void>;
  updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User>;
  updateUserProfile(id: number, data: { displayName?: string; avatarInitials?: string; avatarColor?: string; avatarUrl?: string | null }): Promise<User>;
  getAllUsers(): Promise<User[]>;

  getMessages(channel: string): Promise<(Message & { user: User })[]>;
  createMessage(data: InsertMessage): Promise<Message & { user: User }>;

  getArticles(): Promise<Article[]>;
  // Media vault
  getMediaByUser(userId: number): Promise<Media[]>;
  getAllMedia(): Promise<Media[]>;
  createMedia(data: { userId: number; name: string; type: string; dataUrl: string; size: number }): Promise<Media>;
  deleteMedia(id: number, userId: number): Promise<void>;
  getArticleById(id: number): Promise<Article | undefined>;
  createArticle(data: InsertArticle): Promise<Article>;
  updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article>;
}

// ─── DRIZZLE STORAGE ──────────────────────────────────────────────────────────
class DrizzleStorage implements IStorage {

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...data,
      isMember: false,
      memberSince: null,
      stripeCustomerId: null,
    }).returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(ilike(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(ilike(users.username, username));
    return user;
  }

  async updateUserMembership(id: number, isMember: boolean): Promise<User> {
    const [user] = await db.update(users)
      .set({ isMember, memberSince: isMember ? new Date() : null })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUserProfile(id: number, data: { displayName?: string; avatarInitials?: string; avatarColor?: string; avatarUrl?: string | null }): Promise<User> {
    const updates: Partial<User> = {};
    if (data.displayName  !== undefined) updates.displayName  = data.displayName;
    if (data.avatarInitials !== undefined) updates.avatarInitials = data.avatarInitials;
    if (data.avatarColor  !== undefined) updates.avatarColor  = data.avatarColor;
    if (data.avatarUrl    !== undefined) updates.avatarUrl    = data.avatarUrl;
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getMessages(channel: string): Promise<(Message & { user: User })[]> {
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.channel, channel))
      .orderBy(messages.createdAt);

    if (rows.length === 0) return [];

    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return rows
      .map(m => ({ ...m, user: userMap.get(m.userId)! }))
      .filter(m => m.user);
  }

  async createMessage(data: InsertMessage): Promise<Message & { user: User }> {
    const [msg] = await db.insert(messages).values(data).returning();
    const [user] = await db.select().from(users).where(eq(users.id, msg.userId));
    return { ...msg, user };
  }

  async getArticles(): Promise<Article[]> {
    return db.select().from(articles).orderBy(desc(articles.publishedAt));
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async createArticle(data: InsertArticle): Promise<Article> {
    const [article] = await db.insert(articles).values({
      ...data,
      isPublic: data.isPublic ?? true,
    }).returning();
    return article;
  }

  async updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article> {
    const [article] = await db.update(articles).set(data).where(eq(articles.id, id)).returning();
    if (!article) throw new Error("Article not found");
    return article;
  }
  async getMediaByUser(userId: number): Promise<Media[]> {
    return db.select().from(media).where(eq(media.userId, userId)).orderBy(media.uploadedAt);
  }

  async getAllMedia(): Promise<Media[]> {
    return db.select().from(media).orderBy(media.uploadedAt);
  }

  async createMedia(data: { userId: number; name: string; type: string; dataUrl: string; size: number }): Promise<Media> {
    const [item] = await db.insert(media).values(data).returning();
    return item;
  }

  async deleteMedia(id: number, userId: number): Promise<void> {
    await db.delete(media).where(eq(media.id, id));
  }
}

export const storage = new DrizzleStorage();

// ─── MIGRATIONS + SEED ────────────────────────────────────────────────────────
// Called once on server startup. Creates tables if missing, seeds admin + articles.
export async function runMigrationsAndSeed() {
  const { pool } = await import("./db");

  // Run DDL — idempotent (IF NOT EXISTS)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                serial PRIMARY KEY,
      username          text NOT NULL UNIQUE,
      email             text NOT NULL UNIQUE,
      password          text NOT NULL,
      display_name      text NOT NULL,
      avatar_initials   text NOT NULL,
      avatar_color      text NOT NULL DEFAULT '#cc2a2a',
      avatar_url        text,
      is_member         boolean NOT NULL DEFAULT false,
      member_since      timestamp,
      stripe_customer_id text,
      created_at        timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS messages (
      id         serial PRIMARY KEY,
      user_id    integer NOT NULL,
      channel    text NOT NULL DEFAULT 'general',
      content    text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS articles (
      id           serial PRIMARY KEY,
      title        text NOT NULL,
      content      text NOT NULL,
      summary      text NOT NULL,
      youtube_url  text,
      video_id     text,
      thumbnail    text,
      published_at timestamp NOT NULL DEFAULT now(),
      is_public    boolean NOT NULL DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS media (
      id          serial PRIMARY KEY,
      user_id     integer NOT NULL,
      name        text NOT NULL,
      type        text NOT NULL,
      data_url    text NOT NULL,
      size        integer NOT NULL,
      uploaded_at timestamp NOT NULL DEFAULT now()
    );
  `);


  // Seed admin user (only if no users exist yet)
  const existing = await pool.query("SELECT id FROM users LIMIT 1");
  if (existing.rows.length > 0) {
    // DB already has data — just ensure admin password is current
    const adminPassword = process.env.ADMIN_PASSWORD || "demo1234";
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `UPDATE users SET password = $1 WHERE email = 'realdinobane@gmail.com'`,
      [adminHash]
    );
    // Patch: if member_since is still the placeholder 2025-01-01, reset it to now
    await pool.query(
      `UPDATE users SET member_since = now(), created_at = now()
       WHERE email = 'realdinobane@gmail.com'
         AND member_since = '2025-01-01 00:00:00'`
    );
    // Ensure second admin account exists (upsert by email)
    const haedyHash = await bcrypt.hash("B@nditPeter1985@", 10);
    // Check if username is taken by a different account
    const usernameTaken = await pool.query(
      `SELECT id FROM users WHERE username = 'Based-Admin' AND email != 'yingchanzeng@gmail.com' LIMIT 1`
    );
    const safeUsername = usernameTaken.rows.length > 0 ? 'Based-Admin-2' : 'Based-Admin';
    await pool.query(
      `INSERT INTO users (username, email, password, display_name, avatar_initials, avatar_color, is_member, member_since, created_at)
       VALUES ($2, 'yingchanzeng@gmail.com', $1, 'Haedy', 'HA', '#cc2a2a', true, now(), now())
       ON CONFLICT (email) DO UPDATE SET password = $1, display_name = 'Haedy', username = $2, is_member = true`,
      [haedyHash, safeUsername]
    );
    console.log("[db] database already seeded — applied patches and ensured second admin");
    return;
  }

  console.log("[db] seeding database for first time...");

  const adminPassword = process.env.ADMIN_PASSWORD || "demo1234";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await pool.query(`
    INSERT INTO users (username, email, password, display_name, avatar_initials, avatar_color, is_member, member_since, created_at)
    VALUES ('dino_admin', 'realdinobane@gmail.com', $1, 'DinoBane', 'DB', '#cc2a2a', true, now(), now())
  `, [adminHash]);

  // Seed articles
  const articleData = [
    {
      title: `Graham Moore — [Unfiltered]`,
      summary: `DinoBane sits down with Graeme Moore, the Daddy Dragon, who traces the betrayal of the English people from the Fabian Society to Nigel Farage.`,
      content: `<p>There are very few people on the political fringe who have both the legal knowledge and the lived experience to back up what they say. Graeme Moore — known online as the Daddy Dragon — is one of them. In a rare DinoBane interview, Moore speaks openly about who he is, what he has been through, and why he believes the English constitution is the most powerful weapon the people of this country have left.</p><p>Moore explains that his online identity is rooted in the original English standard, a dragon that predates the cross of Saint George. He was sent to prison, he says, on a complete fabrication, and used his time inside to immerse himself in law — constitutional law, prison law, and the rights of the individual. He came out self-educated, began helping other prisoners understand their rights, and eventually founded the English Constitution Party and the English Constitution Society, which holds seminars around the country teaching people what they are actually entitled to under common law.</p><p>The conversation turns to how the English constitution came to be so thoroughly buried. Moore points to the slow march through the institutions, a strategy he traces back to the Fabian Society of the nineteenth century. Most people, he argues, do not realise that the Labour Party was created by the Fabians, who were in turn funded by the Rockefellers, the Rothschilds, and major pharmaceutical interests of the era. The working class were herded into a belief system that did not represent them, corralled by a party that was designed to manage, not liberate, them.</p><p>Moore is equally blunt about Nigel Farage, whom he refers to as Benedict Arnold — the American Revolutionary War figure who betrayed George Washington for money. The parallel, he says, is precise. A man who appeared to be fighting for the people, who had built real support and real momentum, and who then turned at the crucial moment. Whether by design or weakness, the result is the same.</p><p>DinoBane pushes back, questions, and draws out some genuinely striking detail — including the fact that both Benedict Arnold and his British handler are buried in unmarked graves in Battersea, London, which Moore takes as a historical verdict on what happens to traitors. For anyone trying to understand why England is in the state it is, and who is actually responsible, this conversation is a good place to start.</p>`,
      youtubeUrl: "https://www.youtube.com/watch?v=Tyho3Qiq8eY", videoId: "Tyho3Qiq8eY",
      thumbnail: "https://img.youtube.com/vi/Tyho3Qiq8eY/maxresdefault.jpg", publishedAt: "2026-03-13T20:19:50.000Z",
    },
    {
      title: `Inside The Mind of a Leftist`,
      summary: `A self-described Witchy Goth accuses DinoBane of hidden Nazi symbolism and far-right extremism — and the results are as entertaining as they are revealing.`,
      content: `<p>One of the more persistent questions DinoBane gets from his audience is how you convince left-leaning people that the right is not what the media tells them it is. This video is his answer, and it is not the one you might expect. It does not matter what you say. It does not matter what you do. As long as the label exists, and as long as the media keeps applying it, a certain type of person will simply invent the evidence they need.</p><p>The video features a YouTuber called the Witchy Goth, who stumbled across DinoBane's channel and recorded a reaction video full of confident accusations about far-right extremism, hidden Nazi symbolism, and veiled threats of civil war. DinoBane plays it back and dissects it in real time, and the result is a masterclass in how propaganda works — not from governments or broadcasters, but from ordinary people who have absorbed enough of the narrative to reproduce it independently.</p><p>Her central charge is that DinoBane's channel logo resembles the sun wheel appropriated by German fascists in the 1930s, and that the colours red, black, and white are inherently far-right. She also claims he makes veiled threats against people who do not share his views, that he implies brown and black people are not British, and that he is, without ever quite saying it, some kind of fascist.</p><p>DinoBane's response is to go through each claim methodically and point out that they are simply not true. He has said repeatedly and on record that he does not support mass deportation of everyone. He has never suggested anything that could reasonably be called a threat. The logo she is describing belongs to a different channel. And as for the accusation that he makes out he is not right-wing — he points out he has never once denied being right-wing.</p><p>What the video really reveals is the mechanism itself. The left does not need evidence. It needs association. If you can link a name or a symbol to something that already triggers disgust — Nazism, fascism, racism — the argument is over before it starts. The Witchy Goth does not watch DinoBane's channel. She has seen one video, half of another, and invented the rest. That, DinoBane argues, is not a coincidence. That is how you keep people from finding out what is actually being said.</p>`,
      youtubeUrl: "https://www.youtube.com/watch?v=glP5aWLwd6s", videoId: "glP5aWLwd6s",
      thumbnail: "https://img.youtube.com/vi/glP5aWLwd6s/maxresdefault.jpg", publishedAt: "2026-03-12T13:54:12.000Z",
    },
    {
      title: `They Buried This Footage For a Reason`,
      summary: `Secret footage of David Cameron promising Muslim groups positions of power across the military and government — without ever asking the British people.`,
      content: `<p>People often ask how Britain got to where it is. DinoBane's answer in this video is a simple one: they told you exactly what they were doing. They just made sure you were not watching.</p><p>The centrepiece of the video is footage of David Cameron, recorded without his knowledge, speaking at the Conservative Muslim Forum. In it, he explicitly tells the audience that he wants more Muslim men and women at the top of British businesses, more Muslim soldiers at the highest levels of command, and more Muslims across government in positions of leadership and authority. This was not a policy paper or a white paper. It was a promise made to a specific group, at a private gathering, without any mandate from the British electorate.</p><p>DinoBane makes the obvious point: he does not remember being asked about this. No one voted for it. No manifesto set it out. The British public, going about their daily lives, raising their families, getting on with things — they were never consulted. And yet here is the leader of the Conservative Party, the supposed party of tradition and sovereignty, openly committing to the Islamisation of British institutions.</p><p>But the video goes further. The Conservative Muslim Forum was co-founded by David Cameron and a man called Muhammad Iqbal Sheikh, who had alleged links to the Muslim Brotherhood — an organisation committed to establishing a global caliphate through political Islam. DinoBane is careful not to overstate this, but the implication is clear enough. When a prime minister makes explicit promises to figures with Islamist ties, the people of this country have a right to know about it.</p><p>The broader argument of the video is one DinoBane returns to often. The real architects of what has happened to Britain are not migrants in dinghies — they are politicians in suits, academics with platforms, and media organisations with agendas. Tony Blair and David Cameron, he argues, did more damage to the English identity than anyone else in living memory. Blair with his open-borders ideology and devolution of power to quangos, and Cameron with his explicit dismantling of what it meant to be English and British in favour of a vague multicultural consensus that nobody ever chose. The footage was buried for a reason. Now you have seen it.</p>`,
      youtubeUrl: "https://www.youtube.com/watch?v=Xfz1TaCRblA", videoId: "Xfz1TaCRblA",
      thumbnail: "https://img.youtube.com/vi/Xfz1TaCRblA/maxresdefault.jpg", publishedAt: "2026-03-12T13:02:10.000Z",
    },
    {
      title: `We're Taking It Back`,
      summary: `A defiant address to the English people — the milkmen, the mums, the lads on TikTok — who are quietly, steadily waking up and refusing to apologise.`,
      content: `<p>This is not a video about statistics or politicians. It is a direct address to the people — and it is one of the most honest things DinoBane has put on screen.</p><p>It begins with gratitude. For the likes, the shares, the comments that keep the channel alive. For the people who did not just scroll past. For those willing to sit with the discomfort of what has been done to this country and feel it clearly rather than numb themselves to it. DinoBane acknowledges that most people would rather stay comfortable. The ones who do not, he says, are already awake.</p><p>From there, the video becomes something else — a lament, told without self-pity, for what England has lost. The milkman at dawn. Sunday roast. Kids kicking footballs in the street without a second thought. Doors left unlocked. The quiet certainty that this island was yours. DinoBane is insistent that this was not nostalgia. It was real, and it was taken — slowly, deliberately, and by people who knew exactly what they were doing.</p><p>He describes the process in sharp terms. Shakespeare replaced with decolonisation. History reframed as a guilt trip. The television flooded with imagery designed not to reflect the country but to reshape it. Halal butchers, vape shops, and mosques where parish churches used to anchor the high street. None of this was organic, he argues. It was planned, funded, and executed by a class of people — the NGOs, the politicians, the academics, the corporations — who wanted a borderless, guilt-ridden population because it is easier to manage.</p><p>But the video does not end in despair. DinoBane believes the tide is turning. He points to the comments, the WhatsApp groups, the quiet nods in pubs and on trains. A movement is growing — not funded, not organised, just the English people getting tired of pretending. The suits and the NGOs and the BBC are scared, he says, because they know what a united people looks like when it stops flinching.</p><p>The closing lines are addressed directly to the audience. To the old men in the corner of the pub. To the mums on the school run. To the lads scrolling their phones. England is yours, he says. You do not need to apologise for that. Not now. Not ever.</p>`,
      youtubeUrl: "https://www.youtube.com/watch?v=gfZDulfXDQU", videoId: "gfZDulfXDQU",
      thumbnail: "https://img.youtube.com/vi/gfZDulfXDQU/maxresdefault.jpg", publishedAt: "2026-03-11T12:23:38.000Z",
    },
    {
      title: `[ WARNING! ] This Video Will Make You a Patriot`,
      summary: `From Communist Party directives on labelling your opponents, to Enoch Powell, to an Englishman from Bermondsey tracing nine generations of roots — this video asks who really belongs here.`,
      content: `<p>The video opens with a directive from the Communist Party of the United States, reportedly issued to party members, instructing them to label opponents as fascists, Nazis, or anti-Semites. The instruction was simple: repeat the association often enough and it becomes fact in the public mind. What follows is a montage of exactly that tactic being deployed in modern Britain — the words fascist, racist, xenophobic, white supremacist, Nazi, and ethnonat thrown at anyone who raises a concern about immigration, identity, or culture.</p><p>DinoBane does not need to narrate this section. The footage speaks for itself. Commentators, politicians, and online personalities calling each other Nazis, demanding red lines against anyone who questions the demographic transformation of the country, while simultaneously admitting — as one clip does, almost accidentally — that Israel is itself an ethnostate. The cognitive dissonance is laid out without commentary.</p><p>The video shifts to archive footage — Enoch Powell, arguing in the House of Commons that the real issue in post-war Britain is not immigration itself but the denial of free speech to the English in their own land. Footage of working-class communities speaking candidly about what has happened to their towns, their neighbours gone, their culture thinned out, their requests to the authorities ignored. An elderly woman saying that after two world wars, English people should at least have the dignity of living among their own kind.</p><p>The centrepiece of the video is an Englishman from Bermondsey in South London, standing up and tracing his family tree. His father was from Bermondsey. His grandfather. His great-grandfather, who had eleven brothers and sisters. Forty-three children between them. One hundred and fifty-nine children in the following generation. He has tracked over two hundred descendants, many still in the area, seven named George, five named Victoria. He stands and asks, in the name of all of them, what is happening to the country they built.</p><p>This is the video DinoBane is making to answer the question of what it means to be English. Not a theory. Not a political argument. Just a family, a place, and a question that nobody in power seems to want to answer.</p>`,
      youtubeUrl: "https://www.youtube.com/watch?v=Z1Ok0954i-8", videoId: "Z1Ok0954i-8",
      thumbnail: "https://img.youtube.com/vi/Z1Ok0954i-8/maxresdefault.jpg", publishedAt: "2026-03-11T07:11:48.000Z",
    },
    {
      title: `Ben Habib Is Cooked`,
      summary: `Ben Habib plays the race card against Robert Lowe and Restore Britain on an American Zionist podcast — and DinoBane has the tweets to prove he is lying.`,
      content: `<p>Ben Habib has given an interview to an American podcaster called Don Keith, a self-described Zionist who most people in the UK will not have heard of. DinoBane finds it strange that a man claiming to fight for the British people should be flying to American Zionist podcasters to air his grievances. But strange or not, the interview has happened, and what it contains is damning — not for Restore Britain, but for Habib himself.</p><p>The centrepiece of DinoBane's analysis is a twenty-five second clip in which Habib is asked why Robert Lowe did not accept his offer to join Restore Britain. Habib offers two possible explanations: either Lowe simply wants a party entirely under his own control, or — and here he pauses — it could be his ethnicity. DinoBane's response is to reach for the screenshots. He pulls up tweets, publicly available, in which Advance UK and its members are explicitly welcomed into Restore Britain by the party itself. The invitation was real. The claim that Habib was rejected on racial grounds is, on the face of it, a fabrication.</p><p>DinoBane also dismantles Habib's claim that Advance UK is a democratic organisation. Habib points to Advance UK's electoral college as evidence of internal democracy. DinoBane points out that the electoral college was chosen by Habib himself, is accountable to Habib, and has been used to shut down internal debate. A circle of your own appointees does not constitute democracy. It constitutes control.</p><p>The deeper question in this video is not about party politics. It is about motive. Why is a man who claims to care about Britain spending his time on American Zionist podcasts, playing the race card against a grassroots English movement? Why has he reversed his previous positions on English identity, moving from something recognisably ethnic to a civic nationalist line that anyone with the right feelings can call themselves English? DinoBane does not have a definitive answer, but he is not willing to pretend the question does not exist. Something stinks, he says. And the internet is forever.</p>`,
      youtubeUrl: "https://www.youtube.com/watch?v=QFFO3EyGKUo", videoId: "QFFO3EyGKUo",
      thumbnail: "https://img.youtube.com/vi/QFFO3EyGKUo/maxresdefault.jpg", publishedAt: "2026-03-10T19:58:30.000Z",
    },
    {
      title: `The 'DEBATE' Is Over`,
      summary: `Don Keith and Ben Habib try to frame Restore Britain as inherently racist using tweets from bot accounts — and DinoBane explains exactly why the tactic works.`,
      content: `<p>The debate about English identity is over in the sense that one side has stopped arguing and started labelling. DinoBane walks through the interview between Don Keith — an openly fervent Zionist podcaster — and Ben Habib, and identifies the propaganda technique being deployed with unusual precision.</p><p>Don Keith opens the interview not with questions but with preparation. He reads out a series of offensive tweets directed at Habib — deeply unpleasant messages calling him a subhuman and worse — and frames them as representative of the Restore Britain movement and its supporters. The implication is clear: support Restore Britain, and this is the company you keep.</p><p>DinoBane digs into the tweets themselves. None of them had likes. None had retweets. They were isolated, single-post entries with no spread and no engagement — the opposite of something celebrated or endorsed by a community. Looking into the accounts behind them, he finds that most are not English at all. Many appear to originate from Islamic accounts or South American profiles. Several are only a few months old and look like bots. The tweets were not representative of anything. They were curated to create an impression.</p><p>The technique has a name. Guilt by association. It has been used against anyone who identifies with the English flag for at least thirty years. First they called you a racist. Then a Nazi. Then a neo-Nazi. Now an ethnonat. The words change but the mechanism is the same — link the identity to something that triggers revulsion in the brain, and the person flinches away from it without thinking.</p><p>DinoBane also notes the pattern of who is pushing this particular version of the attack. Don Keith is a Zionist. Ben Habib is half Pakistani. Richard Inman, Paul Thorp, Tommy Robinson — DinoBane has started noticing that a disproportionate number of people suppressing English identity have affiliations or allegiances that are not rooted in England. He is not claiming conspiracy. He is claiming he can read a pattern. And when he sees enough of them lining up in the same direction, he is going to say so.</p>`,
      youtubeUrl: "https://www.youtube.com/watch?v=DFaVsor8JeI", videoId: "DFaVsor8JeI",
      thumbnail: "https://img.youtube.com/vi/DFaVsor8JeI/maxresdefault.jpg", publishedAt: "2026-03-10T16:53:13.000Z",
    },
    {
      title: `The BATTLE LINES Have Been Drawn`,
      summary: `A migrant goes on a stabbing spree in Scotland, locals protest outside his hotel, and the police who were nowhere to be found suddenly appear — in force, arresting the protesters.`,
      content: `<p>The pattern is always the same. A migrant commits a serious crime. The local community, having lived with the consequences of government housing policy, objects. And then the police — who were nowhere to be found when the crime was committed — appear in numbers to arrest the people protesting. DinoBane opens this video with exactly that scenario: a man named Mustafa Con from Chad who carried out a stabbing spree in Scotland, followed by a community protest outside the hotel where he had been housed by the government, followed by the police arriving to detain the protesters.</p><p>This is not accidental, he argues. This is a choice. A choice about whose side the state is on. And the answer, increasingly, does not appear to be the side of the English people.</p><p>The video broadens to address the formation of Restore Britain under Robert Lowe, and the sharp divide it has exposed between people who claim to be patriots and those who, on closer inspection, seem to be serving a different agenda entirely. DinoBane identifies a pattern in the statements of figures like Shabbana Mahmood, Ben Habib, and others, all of whom have in various ways argued that English identity must change to accommodate those who have arrived in the country. If you say you are English and they are not, they call you racist. They call you an ethnonat. They demand that your identity dilute itself until it no longer means anything.</p><p>DinoBane is direct about the cognitive dissonance he sees in the people making these arguments. Many of them have mixed-race families or close connections to communities that would be excluded by a firm definition of English identity. He does not say this to be cruel. He says it because it explains something that would otherwise be inexplicable: how people who claim to love Britain can simultaneously work to dismantle the very foundation of what Britain is.</p><p>Every argument these people make, he says, ends in the same place: strip away your rights, dilute your country, give away your future, and pay for it yourself. Say no. Those are the battle lines, and they have been drawn.</p>`,
      youtubeUrl: "https://www.youtube.com/watch?v=fxEwgChVQEs", videoId: "fxEwgChVQEs",
      thumbnail: "https://img.youtube.com/vi/fxEwgChVQEs/maxresdefault.jpg", publishedAt: "2026-03-09T14:21:40.000Z",
    },
  ];

  for (const a of articleData) {
    await pool.query(
      `INSERT INTO articles (title, content, summary, youtube_url, video_id, thumbnail, published_at, is_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
      [a.title, a.content, a.summary, a.youtubeUrl, a.videoId, a.thumbnail, a.publishedAt]
    );
  }

  console.log("[db] seed complete — admin user + 8 articles inserted");
}

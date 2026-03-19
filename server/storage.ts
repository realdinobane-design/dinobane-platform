import { eq, desc, ilike, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db";
import {
  users, messages, articles, media, mediaLikes, mediaComments, appSettings,
  type User, type InsertUser,
  type Message, type InsertMessage,
  type Article, type InsertArticle,
  type Media, type MediaLike, type MediaComment,
} from "@shared/schema";

// ─── INTERFACE ────────────────────────────────────────────────────────────────
export interface IStorage {
  createUser(data: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserMembership(id: number, isMember: boolean): Promise<User>;
  deleteUser(id: number): Promise<void>;
  updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User>;
  updateUserProfile(id: number, data: { displayName?: string; avatarInitials?: string; avatarColor?: string; avatarUrl?: string | null; password?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;

  getMessages(channel: string): Promise<(Message & { user: User })[]>;
  getReplies(parentId: number): Promise<(Message & { user: User })[]>;
  getReplyCount(parentId: number): Promise<number>;
  createMessage(data: InsertMessage): Promise<Message & { user: User }>;

  getArticles(): Promise<Article[]>;
  // Media vault
  getMediaByUser(userId: number): Promise<Media[]>;
  getAllMedia(): Promise<Media[]>;
  createMedia(data: { userId: number; name: string; type: string; dataUrl: string; size: number }): Promise<Media>;
  deleteMedia(id: number, userId: number): Promise<void>;
  // Media likes
  toggleMediaLike(mediaId: number, userId: number): Promise<{ liked: boolean; count: number }>;
  getMediaLikeCount(mediaId: number): Promise<number>;
  hasUserLikedMedia(mediaId: number, userId: number): Promise<boolean>;
  // Bulk stats — single query for all media items
  getAllMediaStats(userId: number): Promise<Record<number, { likeCount: number; commentCount: number; liked: boolean }>>;
  // Media comments
  getMediaComments(mediaId: number): Promise<(MediaComment & { user: User })[]>;
  createMediaComment(data: { mediaId: number; userId: number; content: string }): Promise<MediaComment & { user: User }>;
  deleteMediaComment(id: number, userId: number, isAdmin: boolean): Promise<void>;
  getArticleById(id: number): Promise<Article | undefined>;
  createArticle(data: InsertArticle): Promise<Article>;
  updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
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

  async updateUserProfile(id: number, data: { displayName?: string; avatarInitials?: string; avatarColor?: string; avatarUrl?: string | null; password?: string }): Promise<User> {
    const updates: Partial<User> = {};
    if (data.displayName    !== undefined) updates.displayName    = data.displayName;
    if (data.avatarInitials !== undefined) updates.avatarInitials = data.avatarInitials;
    if (data.avatarColor    !== undefined) updates.avatarColor    = data.avatarColor;
    if (data.avatarUrl      !== undefined) updates.avatarUrl      = data.avatarUrl;
    if (data.password       !== undefined) updates.password       = data.password;
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getMessages(channel: string): Promise<(Message & { user: User })[]> {
    // Only return top-level posts (no parentId)
    const rows = await db
      .select()
      .from(messages)
      .where(and(eq(messages.channel, channel), sql`${messages.parentId} IS NULL`))
      .orderBy(messages.createdAt);

    if (rows.length === 0) return [];

    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return rows
      .map(m => ({ ...m, user: userMap.get(m.userId)! }))
      .filter(m => m.user);
  }

  async getReplies(parentId: number): Promise<(Message & { user: User })[]> {
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.parentId, parentId))
      .orderBy(messages.createdAt);

    if (rows.length === 0) return [];

    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return rows
      .map(m => ({ ...m, user: userMap.get(m.userId)! }))
      .filter(m => m.user);
  }

  async getReplyCount(parentId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.parentId, parentId));
    return row?.count ?? 0;
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

  // ─── Media likes ─────────────────────────────────────────────────────────
  async toggleMediaLike(mediaId: number, userId: number): Promise<{ liked: boolean; count: number }> {
    const existing = await db.select().from(mediaLikes)
      .where(and(eq(mediaLikes.mediaId, mediaId), eq(mediaLikes.userId, userId)))
      .limit(1);
    if (existing.length > 0) {
      await db.delete(mediaLikes).where(eq(mediaLikes.id, existing[0].id));
      const count = await this.getMediaLikeCount(mediaId);
      return { liked: false, count };
    } else {
      await db.insert(mediaLikes).values({ mediaId, userId });
      const count = await this.getMediaLikeCount(mediaId);
      return { liked: true, count };
    }
  }

  async getMediaLikeCount(mediaId: number): Promise<number> {
    const rows = await db.select({ count: sql<number>`count(*)::int` })
      .from(mediaLikes).where(eq(mediaLikes.mediaId, mediaId));
    return rows[0]?.count ?? 0;
  }

  async hasUserLikedMedia(mediaId: number, userId: number): Promise<boolean> {
    const rows = await db.select().from(mediaLikes)
      .where(and(eq(mediaLikes.mediaId, mediaId), eq(mediaLikes.userId, userId)))
      .limit(1);
    return rows.length > 0;
  }

  async getAllMediaStats(userId: number): Promise<Record<number, { likeCount: number; commentCount: number; liked: boolean }>> {
    // Two aggregation queries — much faster than N individual queries
    const [likeCounts, commentCounts, userLikes] = await Promise.all([
      db.select({
        mediaId: mediaLikes.mediaId,
        count: sql<number>`count(*)::int`,
      }).from(mediaLikes).groupBy(mediaLikes.mediaId),

      db.select({
        mediaId: mediaComments.mediaId,
        count: sql<number>`count(*)::int`,
      }).from(mediaComments).groupBy(mediaComments.mediaId),

      db.select({ mediaId: mediaLikes.mediaId })
        .from(mediaLikes).where(eq(mediaLikes.userId, userId)),
    ]);

    const likedSet = new Set(userLikes.map(r => r.mediaId));
    const result: Record<number, { likeCount: number; commentCount: number; liked: boolean }> = {};

    for (const r of likeCounts) {
      if (!result[r.mediaId]) result[r.mediaId] = { likeCount: 0, commentCount: 0, liked: false };
      result[r.mediaId].likeCount = r.count;
    }
    for (const r of commentCounts) {
      if (!result[r.mediaId]) result[r.mediaId] = { likeCount: 0, commentCount: 0, liked: false };
      result[r.mediaId].commentCount = r.count;
    }
    for (const id of likedSet) {
      if (!result[id]) result[id] = { likeCount: 0, commentCount: 0, liked: false };
      result[id].liked = true;
    }
    return result;
  }

  // ─── Media comments ───────────────────────────────────────────────────────
  async getMediaComments(mediaId: number): Promise<(MediaComment & { user: User })[]> {
    const rows = await db.select().from(mediaComments)
      .where(eq(mediaComments.mediaId, mediaId))
      .orderBy(mediaComments.createdAt);
    const result = [];
    for (const row of rows) {
      const user = await this.getUserById(row.userId);
      if (user) result.push({ ...row, user });
    }
    return result;
  }

  async createMediaComment(data: { mediaId: number; userId: number; content: string }): Promise<MediaComment & { user: User }> {
    const [comment] = await db.insert(mediaComments).values(data).returning();
    const user = await this.getUserById(data.userId);
    return { ...comment, user: user! };
  }

  async deleteMediaComment(id: number, userId: number, isAdmin: boolean): Promise<void> {
    if (isAdmin) {
      await db.delete(mediaComments).where(eq(mediaComments.id, id));
    } else {
      await db.delete(mediaComments).where(and(eq(mediaComments.id, id), eq(mediaComments.userId, userId)));
    }
  }

  async getSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(appSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
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
    CREATE TABLE IF NOT EXISTS media_likes (
      id         serial PRIMARY KEY,
      media_id   integer NOT NULL,
      user_id    integer NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      UNIQUE(media_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS media_comments (
      id         serial PRIMARY KEY,
      media_id   integer NOT NULL,
      user_id    integer NOT NULL,
      content    text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);

  // Add parent_id column to messages if it doesn't exist yet (idempotent)
  await pool.query(`
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_id integer;
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

    // Patch: update placeholder articles with AI-generated content
    const articlePatches: [number, string][] = [
      [9, `<p>The bleating from the usual suspects in the commentariat about a “split” on the right is, as always, utter codswallop. There is no fundamental schism tearing apart patriotic Brits; there is merely a healthy, and necessary, debate on the best way to restore common sense and English values to a nation teetering on the brink. To suggest otherwise is either wilfully ignorant or deliberately malicious – likely both.</p>

<p>Take the issue of immigration, for example. While some might advocate for a complete and immediate halt, others focus on enforcing existing laws, deporting illegal aliens, and dismantling the disastrous pull factors that incentivise this unsustainable influx. Are these positions diametrically opposed? Of course not. They are different approaches to solving the same core problem: the demographic and cultural destruction of England at the hands of a deliberately weak and feckless government. Any sensible individual recognises the unsustainable pressure mass immigration places on our infrastructure, our schools, our hospitals – and most importantly, our very sense of national identity. To portray nuanced differences in policy as a deep, unbridgeable divide is intellectually dishonest.</p>

<p>The same applies to media bias. We are all acutely aware of the corrosive influence of the BBC, the Guardian, and the rest of the leftist media establishment. They peddle a narrative of relentless apology and self-flagellation, constantly undermining our history, our traditions, and frankly, our very right to exist as a sovereign nation. The disagreement amongst right-thinking individuals is not whether this bias exists – it’s how best to combat it. Some favour boycotts and independent media initiatives, while others advocate for reforming existing institutions. Again, hardly evidence of a catastrophic rupture.</p>

<p>And what of establishment corruption? The rot in Westminster runs deep. From MPs feathering their own nests to the seemingly endless stream of wasteful government contracts handed out to cronies, the stench is overwhelming. While strategies for tackling this corruption may vary – from advocating for stricter transparency laws to demanding criminal investigations and prosecutions – the fundamental desire for accountability and good governance unites us. The common enemy here is not a fellow patriot proposing a different solution; it’s the corrupt elite who have betrayed the trust of the English people.</p>

<p>Enough with the manufactured narratives of division. The real battle is not amongst ourselves, but against the forces actively working to dismantle our nation, silence our voices, and eradicate our culture. We must present a united front, resist the insidious narratives pushed by the mainstream media, and demand a return to common sense, English values, and a government that puts the interests of its citizens first. Stop squabbling over tactics and start fighting for our future! Subscribe to independent media, challenge woke dogma at every turn, and hold your elected officials accountable. The fate of England depends on it.</p>`],
      [10, `<p>The charade is over. Anyone still clinging to the notion that our political and media establishments are acting in Britain's best interests is either wilfully blind or actively complicit in the ongoing betrayal of our nation. The "cat," as DinoBane rightly puts it, is well and truly out of the bag: they are not for us, they are against us, and they are actively working to dismantle the very foundations of our English identity.</p>

<p>The relentless push for open borders, disguised as "economic necessity" or "humanitarianism," is nothing short of cultural suicide. We are told to celebrate the dilution of our heritage, the erosion of our social fabric, while simultaneously being branded as racist bigots for daring to question the unsustainable strain this influx places on our infrastructure, our public services, and our uniquely English character. The political class, insulated from the consequences of their policies by their gated communities and taxpayer-funded salaries, have effectively declared war on the English working class, replacing us wholesale while lecturing us on the virtues of multiculturalism. They import voters, suppress dissent, and call it progress.</p>

<p>And who greases the wheels of this national decline? Our so-called "free press," of course. The BBC, a bloated, taxpayer-funded behemoth, pushes a relentlessly woke agenda, demonising traditional values and celebrating every conceivable form of deviancy. Meanwhile, the privately-owned media, supposedly the champions of free speech, are in reality just as captive to the prevailing narrative, regurgitating government talking points and systematically silencing any voices that dare to challenge the status quo. They are not watchdogs, they are lapdogs, eagerly licking the boots of the political elite while our country burns.</p>

<p>The rot runs deeper than just policy and pronouncements; it festers in the very institutions designed to protect us. From the police force prioritizing virtue signaling over actual crime prevention, to the judiciary bending over backwards to appease foreign interests, the entire system is riddled with establishment corruption and ideological capture. They are no longer serving the people; they are serving the globalist agenda, prioritising international treaties and woke dogma over the needs and concerns of the English people. Free speech is under constant attack, dissent is criminalized as "hate speech," and the very idea of national pride is treated with suspicion and contempt.</p>

<p>Enough is enough. The time for polite debate and measured compromise is long gone. We are facing an existential threat to our nation, our culture, and our very way of life. It is time to stand up and fight for England. Speak out. Challenge the narrative. Support independent media like DinoBane. Demand accountability from our elected officials. And above all, never, ever apologize for being English. The fate of our nation rests on our shoulders. Let us not fail future generations.</p>`],
      [11, `<p>The utter chaos unfolding in Westminster is enough to make a reasonable Englishman choke on his tea. From the revolving door of uninspiring Prime Ministers to the brazen disregard for public opinion, it's glaringly obvious that the political establishment is not working for us. They’re working for themselves, for globalist agendas, and for anything but the best interests of the only people who matter: the British.</p>

<p>Let's not mince words about immigration. Successive governments, both Labour and Conservative, have flung open the gates, flooding our nation with people who, in many cases, do not share our values, do not integrate, and place an unsustainable burden on our public services. We're told this is "enrichment," but what’s truly enriched is the bank accounts of corporations who benefit from cheap labor and the virtue signalling resumes of woke politicians. Meanwhile, our towns and cities are losing their character, our culture is diluted, and our very identity as a nation is under assault. The sheer scale of unchecked immigration, often illegal immigration actively aided and abetted by NGOs, is a betrayal of the British people. We are becoming strangers in our own land.</p>

<p>The mainstream media, supposedly the bastion of truth and accountability, is complicit in this charade. They regurgitate the same tired, Left-leaning narratives, demonizing anyone who dares to question the status quo. They censor dissenting voices, amplifying politically correct dogma and silencing legitimate concerns about everything from the erosion of free speech to the absurdity of net zero policies that are impoverishing the working class. We are constantly bombarded with propaganda designed to shame us for loving our country, for celebrating our history, and for daring to suggest that Britain should put its own citizens first. The BBC, funded by our own license fees, is arguably the worst offender.</p>

<p>And then there's the endemic corruption. Politicians enriching themselves through dodgy deals, quangos staffed with cronies, and taxpayers' money squandered on vanity projects that benefit no one but the elite. How many "levelling up" schemes serve solely to level up the bank accounts of consultants and developers, while neglecting the real needs of communities struggling to survive? The entire system is rigged, designed to protect the powerful and punish those who challenge them. We need a radical overhaul of our political institutions, stripping away the layers of bureaucracy and holding those in power accountable for their actions.</p>

<p>Enough is enough. We can no longer afford to sit idly by while our country is being systematically dismantled. It's time to unite, to find common ground, and to demand real change. Support independent media outlets that dare to speak the truth. Hold your elected representatives accountable. Engage in civil discourse, challenge the prevailing narratives, and never, ever, let them silence your voice. Britain is worth fighting for. Defend it.</p>`],
      [12, `<p>The so-called "anti-hate" industry, fuelled by virtue-signalling corporations and compliant media outlets, is rapidly morphing into a Ministry of Truth, designed to silence dissenting voices and enforce a suffocating conformity. Their target? Anyone who dares to question the establishment narrative, particularly on issues of immigration, national identity, and the creeping erosion of our freedoms.</p>

<p>The recent demonisation of independent content creators who challenge mass immigration is a particularly egregious example. These brave individuals are not motivated by hate, but by a genuine concern for the cultural and social fabric of our nation. They see the pressures unchecked immigration places on our public services, the erosion of our shared values, and the fragmentation of communities, and they dare to speak out. For this, they are branded "dangerous" by the very institutions that have facilitated this societal upheaval. It's time to recognise this for what it is: a blatant attempt to shut down legitimate debate and protect a failed immigration policy.</p>

<p>The BBC, along with other mainstream media outlets, is complicit in this charade. Obsessed with pushing a progressive agenda, they routinely ignore the legitimate concerns of ordinary Britons, opting instead to amplify the voices of a vocal minority and demonise dissenting opinions. Their coverage of contentious issues like crime and immigration is often distorted, omitting crucial details that would challenge their pre-determined narrative. The establishment uses these outlets as weapons to shape public opinion and silence any opposition using the ‘hate speech’ label. This blatant bias is not just unfair; it's detrimental to our democracy.</p>

<p>This culture of censorship extends beyond the media and into the realm of free speech. The increasing prevalence of "hate speech" laws, often vaguely defined and selectively enforced, is creating a chilling effect on public discourse. People are becoming afraid to voice their opinions, fearing accusations of extremism or bigotry. This self-censorship is precisely what our enemies want; a cowed populace afraid to challenge the status quo. The establishment and the media are both complicit in enforcing this system. They rely on it to stop people from opposing things like the great replacement and the destruction of historic English culture.</p>

<p>Enough is enough. We must resist this Orwellian attempt to control thought and silence dissent. Support independent media outlets that dare to challenge the mainstream narrative. Engage in open and honest conversations with your friends and family, even on difficult topics. Demand accountability from our politicians and hold the media to account for their blatant bias. The future of our nation depends on our willingness to speak truth to power, no matter the cost. If we do not, the creeping cancer of woke ideology will consume all that is good and true about England. Speak now, or forever hold your peace.</p>`],
      [13, `<p>“I Wish it Need Not Have Happened in My Time,” Gandalf laments in Lord of the Rings, faced with the encroaching darkness. Well, I’d like to utter the same regarding the state of our beloved England. A nation once the envy of the world, now drowning in a swamp of political correctness, uncontrolled immigration, and establishment corruption so deep it makes your teeth ache. We’re not just sleepwalking into decline; we’re being actively pushed – and it’s time we woke up.</p>

<p>Let’s address the elephant in the room: immigration. The open-door policies of successive governments, fuelled by virtue signalling and a deliberate ignorance of the social and economic consequences, have diluted our national identity beyond recognition. We’re told diversity is our strength, but what happens when there's nothing left to be diverse *from*? Our towns and cities are changing at an alarming rate, with the concerns of ordinary English people brushed aside as “racist” or “bigoted.” It’s not racist to want your culture preserved; it’s a fundamental right. And it certainly isn't racist to expect legal immigration to be controlled, properly managed, and in the best interests of the United Kingdom – something that seems beyond the grasp of our ruling class.</p>

<p>Then we have the media, cheerleaders for the establishment, peddling a narrative that conveniently ignores the everyday struggles of the working man and woman. They demonize anyone who dissents from the approved woke ideology, branding them as far-right extremists. They’re more concerned with policing pronouns than holding those in power accountable. This bias isn't accidental; it's a deliberate strategy to silence dissent and control the narrative. Free speech, once a cornerstone of our democracy, is now under constant attack, stifled by online mobs and university thought police, egged on by a complicit media too scared to challenge the prevailing orthodoxy.</p>

<p>And let's not forget the rot within our own government. Corruption, cronyism, and self-enrichment have become endemic. From lucrative PPE contracts handed out to friends to blatant disregard for parliamentary procedure, our politicians are more concerned with lining their own pockets than serving the people who elected them. The expenses scandal was just the tip of the iceberg. They’ve become detached, insulated from the real-world consequences of their actions, living in a bubble of privilege while the rest of us struggle to make ends meet. They believe they are entitled to rule, not that they are servants of the people.</p>

<p>Enough is enough. We cannot stand idly by and watch our nation be eroded from within. We must demand accountability from our politicians, challenge the narratives pushed by the biased media, and fight for the right to speak freely without fear of censorship. Speak to your MP, join local political organisations, support independent media outlets that dare to speak the truth. England is worth fighting for. Let’s reclaim our country and ensure that our children inherit a nation worthy of its history.</p>`],
      [14, `<p>Graham Moore's recent interview isn't just a chat; it's a stark exposure of the rot eating away at the foundations of our nation, revealing a political class more interested in lining their own pockets and pushing globalist agendas than preserving the England we know and love. The mask is off, and the stench of corruption is overpowering.</p>

<p>The issue of immigration, constantly downplayed by the BBC and the Guardian, is reaching a boiling point. We’re told to celebrate diversity while our towns become unrecognizable, overrun with cultures that refuse to integrate and place an unsustainable strain on our public services. Schools are struggling, hospitals are overflowing, and the very fabric of our society is being torn apart by an uncontrolled influx of people who, let’s be honest, too often exploit our generosity while offering little in return. The political establishment, desperate to appear "compassionate," ignores the legitimate concerns of ordinary Britons who are witnessing their heritage and way of life vanish before their eyes. They label anyone who dares to speak out as a racist, effectively silencing dissenting voices and perpetuating this disastrous demographic shift.</p>

<p>The mainstream media, complicit in this deception, acts as little more than a propaganda arm for the establishment. They carefully curate the narrative, pushing a woke agenda that demonizes traditional English values and glorifies anything that undermines our national identity. From perpetually bemoaning our colonial past to ceaselessly promoting divisive identity politics, they actively work to shame and dismantle the very things that make England unique. The BBC, funded by the hard-earned money of the British taxpayer, has become a mouthpiece for globalist elites, pushing their own agendas while ignoring the genuine concerns of the people who pay their salaries. The bias is blatant, the manipulation is constant, and the consequences are devastating.</p>

<p>Underneath it all lies the pervasive corruption that permeates our political system. Politicians, far removed from the realities of everyday life, are feathering their nests through dubious deals, lobbying scandals, and taxpayer-funded extravagance. They preach austerity while living like royalty, jetting around the world on junkets and enriching themselves at the expense of the public purse. They’ve become a self-serving elite, disconnected from the people they are supposed to represent, and more interested in serving their own interests than serving the country. The system itself is rigged, designed to protect the powerful and silence dissent, and the consequences are plain for all to see: eroding trust, declining standards of living, and a growing sense of disenfranchisement.</p>

<p>Enough is enough! We can no longer afford to stand idly by while our country is being stolen from us. We must demand accountability from our politicians, challenge the lies of the mainstream media, and defend our culture and heritage against those who seek to destroy it. Support independent media like DinoBane that dares to speak the truth. Become involved in local politics. Speak your mind without fear. The future of England depends on it. It’s time to reclaim our country, and the time to act is now.</p>`],
      [15, `<p>The stench of desperation emanating from the political establishment is becoming overpowering. As their carefully constructed narratives crumble under the weight of reality, they are resorting to ever more blatant tactics to cling to power. From silencing dissent to gaslighting the populace about the disastrous effects of unchecked immigration, their actions reek of panic. The game is up, and they know it.</p>

<p>Take the relentless assault on free speech, for example. Anyone daring to question the prevailing orthodoxies on climate change, gender ideology, or the so-called benefits of mass immigration is swiftly branded a ‘far-right extremist’ and deplatformed. The Online Safety Bill, draped in the deceptive cloak of protecting children, is nothing more than a thinly veiled attempt to control the flow of information and silence voices that dare to challenge the status quo. The establishment fears scrutiny, and they are using the full power of the state and its media allies to stifle it. Remember when Brexit was the "will of the people"? How's that working out with the courts and the Lords?</p>

<p>The elephant in the room, of course, is immigration. The sheer scale of the influx, largely unchecked and seemingly encouraged by those in power, is fundamentally altering the fabric of our nation. Our infrastructure is crumbling, our public services are overwhelmed, and our unique English identity is being eroded at an alarming rate. We are told to celebrate this “diversity,” but what about preserving the traditions and values that made this country great? Where is the debate on integration policies that actually work? Nowhere, because the establishment is too busy pushing their globalist agenda blindlessly forward.</p>

<p>The mainstream media, complicit in this charade, parrot the government's line without question. They selectively report incidents, manipulating public opinion to fit their narrative. The BBC, supposedly impartial, is a breeding ground for woke ideologues pushing agendas straight out of the Labour manifesto. Independent voices, like DinoBane, are crucial in exposing these lies and providing a platform for genuine debate, but they are constantly under threat of censorship and demonization by the establishment's propaganda machine. We must defend these voices at all costs.</p>

<p>The time for polite discourse is over. The future of England hangs in the balance. Demand accountability from your elected officials. Support independent media outlets that dare to speak truth to power. Challenge the lies and distortions propagated by the establishment. Become active in resisting the forces that seek to dismantle our nation. The elite are desperate, because they know their time is running out. Now it's up to us to ensure they are overthrown.</p>`],
      [16, `<p>The stench of establishment corruption is no longer a faint whiff, but a gagging cloud hanging over Westminster. They fear the truth, these self-serving elites, because the truth, laid bare, reveals a systematic betrayal of the English people. What terrifies them most is not some elaborate conspiracy theory, but simple, irrefutable data points demonstrating their utter failure – or, more likely, their deliberate dismantling of our nation.</p>

<p>The proof is everywhere, starting at our borders. Open borders, a policy championed by bleeding-heart liberals and corporatist globalists alike, have demonstrably strained our public services, depressed wages, and diluted our national identity. We are constantly lectured about the benefits of diversity, yet the reality is a fragmented society where the very fabric of English community is fraying. The political class benefits, of course, importing dependable voting blocs while enriching themselves through lucrative contracts with NGOs that facilitate this demographic transformation. They tell us it’s inevitable, a tide that cannot be turned. We say it’s a deliberate act of national suicide.</p>

<p>And who holds these architects of our decline accountable? The mainstream media, that’s who. Or rather, they don't. They act as willing stenographers for the establishment narrative, amplifying progressive dogma while suppressing dissenting voices. Any challenge to the prevailing orthodoxy – be it on immigration, climate change, or the sanctity of woke ideology – is immediately branded as racist, xenophobic, or simply “far right.” This censorship, not always overt but powerfully pervasive, chills free speech and prevents genuine debate on crucial issues facing our nation. The BBC, funded by our own taxes, is perhaps the most egregious offender, relentlessly pushing a culturally Marxist agenda while demonizing traditional English values.</p>

<p>The rot extends deep into the heart of the establishment. From taxpayer-funded quangos dishing out obscene salaries to cronies to the revolving door between politics and lobbying firms, corruption has become institutionalized. Politicians enrich themselves and their friends while the English people foot the bill. The lack of accountability is staggering. Investigations are conveniently buried, scandals are quickly forgotten, and the guilty are rarely punished. This isn't mere incompetence; it's a deliberate fleecing of the nation, a systematic transfer of wealth from the hard-working taxpayer to the elites who govern them.</p>

<p>The proof they fear is the awakening of the English lion. They believe they can continue to manipulate and deceive us, but their time is running out. We must become active participants in our own salvation. Support independent media outlets that dare to speak the truth. Challenge the establishment narrative at every turn. Demand accountability from our elected officials. And, most importantly, reassert our English identity and defend our nation against those who seek to destroy it. The future of England depends on it. Stand up, speak out, and take back control.</p>`],
      [17, `<p>Finally, a politician with the backbone to say what every true Englishman knows in his heart: Enough is enough. Suella Braverman’s recent pronouncements on immigration are not "far-right rhetoric," as the perpetually offended would have you believe. They are common sense, long overdue, and frankly, it's literally everything we've ever wanted. The tide is turning, and the woke establishment pretending that a nation can survive without borders is beginning to choke on the inconvenient truth.</p>

<p>The orchestrated hysteria surrounding Braverman’s comments exposes the rank hypocrisy of our media elite. They preach tolerance and diversity, yet actively demonise anyone daring to question the unsustainable influx of migrants overwhelming our public services and eroding our national identity. They are quick to label any patriotic sentiment as "xenophobia" while simultaneously pushing a globalist agenda that benefits multinational corporations and undermines the very fabric of our society. The BBC, in particular, has become a taxpayer-funded propaganda arm for the open-borders lobby, shamelessly suppressing any dissenting viewpoints and amplifying the voices of those who seek to erase our history and dismantle our traditions. This isn’t journalism; it's cultural vandalism masquerading as progress.</p>

<p>The truth, which they desperately try to conceal, is that uncontrolled immigration places an intolerable burden on our NHS, our schools, and our housing market. It depresses wages for working-class Brits and fuels social tensions. It dilutes our culture and weakens our sense of national cohesion. We are told to celebrate our “diversity,” but in reality, this diversity is often a fragmentation, a Balkanization of our society into separate, self-segregated communities, each vying for resources and power. Where is the common ground? Where is the shared identity that binds us together as a nation? The political class, lining their pockets and climbing the greasy pole of power, has ignored these questions for too long.</p>

<p>Furthermore, the suppression of dissenting voices is truly chilling. Anyone who dares to raise legitimate concerns about immigration, or any other issue deemed “sensitive,” is immediately branded a racist, a bigot, or some other equally offensive label. This insidious form of censorship stifles debate and prevents us from having an honest conversation about the challenges facing our nation. Free speech is the cornerstone of any free society, and when it is eroded by political correctness and ideological conformity, the very foundations of our democracy are at risk. We must fiercely defend our right to speak our minds, even when it is unpopular or uncomfortable for the powers that be. We must support platforms like DinoBane that dare to challenge the mainstream narrative and expose the truth, no matter how inconvenient it may be.</p>

<p>The time for polite conversation is over. The time for appeasement is gone. The future of England, the land our forefathers built with blood, sweat, and tears, is at stake. Support those, like Braverman, who are willing to fight for our borders, our culture, and our national identity. Hold your elected officials accountable. Challenge the lies of the mainstream media. Spread the truth to your friends, your family, and your neighbors. It is time to reclaim our country from the clutches of the woke establishment. Let England be England again.</p>`],
    ];
    for (const [id, articleContent] of articlePatches) {
      await pool.query(
        `UPDATE articles SET content = $1 WHERE id = $2 AND content LIKE '%This is a written analysis%'`,
        [articleContent, id]
      );
    }
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

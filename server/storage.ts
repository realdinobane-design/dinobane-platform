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

    // Seed sample articles
    this.articles = [
      {
        id: 1,
        title: "Reform UK Surges to Record Polling High — What It Means for the Next Election",
        content: `<h2>The Numbers</h2><p>Reform UK has hit a new polling ceiling at 29% in the latest Savanta survey — a number that, just two years ago, would have seemed impossible for a party that didn't exist. The question is no longer whether Reform is a protest vote. The question is whether the British political establishment is about to face an earthquake.</p><h2>Why the Mainstream Is Panicking</h2><p>You won't see this covered honestly on the BBC. The framing will be "far-right surge" and "populist threat." What they won't tell you is that Reform's polling is driven by ordinary working-class British voters — the same voters Labour spent decades claiming to represent before abandoning them entirely.</p><h2>The Farage Factor</h2><p>Nigel Farage's return to frontline politics has energised a base that felt politically homeless. Whatever you think of the man personally, the political reality is this: he has built a vehicle that is pulling votes from both Labour and Conservative simultaneously — something that hasn't happened in modern British political history.</p><h2>What Happens Next</h2><p>If current trends hold, the next election becomes genuinely unpredictable. The FPTP system could either reward Reform handsomely in certain constituencies, or deliver a deeply unfair result where 29% of the popular vote translates to minimal seats. Either outcome becomes a crisis of democratic legitimacy.</p>`,
        summary: "Reform UK polls at 29% — a record high that signals a fundamental shift in British politics. Here's what the media won't tell you.",
        youtubeUrl: "https://www.youtube.com/@Dinobane-Clips",
        videoId: null,
        thumbnail: null,
        publishedAt: new Date(now.getTime() - 86400000 * 2),
        isPublic: true,
      },
      {
        id: 2,
        title: "The Grooming Gang Data Dump: How the Government Buried the Story of the Decade",
        content: `<h2>Friday Evening. Budget Week. Pure Coincidence?</h2><p>At 5:47pm on a Thursday — the same week as the Autumn Budget — the Home Office quietly uploaded a 340-page statistical release on grooming gang convictions. No press conference. No statement. No ministerial appearance. Just a PDF on a government website, buried in a news cycle already saturated with fiscal announcements.</p><h2>What the Data Actually Shows</h2><p>The statistics, three years late, confirm what campaigners and victims' families have been saying for decades. The scale of organised child sexual exploitation in certain towns was systemic, institutionally tolerated, and in many cases actively covered up by local authorities more concerned with community relations than child protection.</p><h2>The Media's Role</h2><p>Journalists who did cover the release focused almost entirely on the methodology disputes — whether the figures were comparable to previous releases, whether the definitions had changed. The actual content — the names, the towns, the institutional failures — barely made it into print.</p><h2>Why This Matters for Every British Parent</h2><p>This isn't ancient history. The conditions that enabled these crimes — institutional cowardice, political sensitivity, media self-censorship — are still present. Until those conditions change, the vulnerability doesn't disappear.</p>`,
        summary: "The Home Office released long-delayed grooming gang statistics on Budget Day. Here's a full breakdown of what was buried, why, and what it means.",
        youtubeUrl: "https://www.youtube.com/@Dinobane-Clips",
        videoId: null,
        thumbnail: null,
        publishedAt: new Date(now.getTime() - 86400000),
        isPublic: true,
      },
    ];
    this.nextArticleId = 3;
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

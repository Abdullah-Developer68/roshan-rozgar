/**
 * Seeds demo data. Everything inserted here is SIMULATED (flagged is_seeded = true
 * where the table has the column). Re-running is safe: previous seed rows are removed first.
 *
 *   npm run db:seed
 */
import { randomUUID } from "node:crypto";
import { inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { AREA_BY_ID } from "../src/lib/areas";
import { TRADES, type TradeId } from "../src/lib/trades";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL/DIRECT_URL not set");
const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

// Deterministic PRNG so the demo data is stable between runs.
let s = 42;
const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T>(a: readonly T[]) => a[Math.floor(rand() * a.length)];
const between = (a: number, b: number) => Math.round(a + rand() * (b - a));
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000 - between(0, 20) * 3_600_000);
const phoneEmail = (phone: string) => `${phone.replace(/\D/g, "")}@phone.roshanrozgar.app`;

export const DEMO = {
  customer: { name: "Ayesha Khan", phone: "+923001111111" },
  worker: { name: "Muhammad Aslam", phone: "+923002222222" },
};

const SKILLS: Record<TradeId, string[]> = {
  electrician: ["House wiring", "Fan installation", "UPS & inverter", "Breaker/DB repair", "Solar wiring", "Light fixtures"],
  plumber: ["Leak repair", "Geyser installation", "Water tank & motor", "Drain unblocking", "Bathroom fittings", "Pipe replacement"],
  ac_technician: ["AC gas refill", "AC service", "Split AC installation", "Inverter AC repair", "Fridge repair", "Compressor repair"],
  carpenter: ["Door repair", "Locks & hinges", "Wardrobe making", "Furniture repair", "Kitchen cabinets", "Wood polish"],
  mechanic: ["Car engine tuning", "Bike repair", "Battery change", "Brake service", "Oil change", "Puncture repair"],
  painter: ["Wall paint", "Seepage treatment", "Wood polish", "Distemper", "Weather shield", "Texture paint"],
  mason: ["Tile fixing", "Plaster repair", "Crack filling", "Marble work", "Brick work", "Bathroom renovation"],
  welder: ["Gate repair", "Window grills", "Railings", "Steel stairs", "Shed/canopy", "On-site welding"],
};

const PROBLEMS: Record<TradeId, string[]> = {
  electrician: ["Breaker keeps tripping in the kitchen", "Ceiling fan making noise and running slow", "UPS not charging the battery", "Half the house has no power"],
  plumber: ["Water leaking under the kitchen sink", "Geyser not heating water", "Bathroom drain is blocked", "Water motor not pulling water to the tank"],
  ac_technician: ["AC not cooling, only fan running", "Water dripping from indoor AC unit", "Need AC service before summer", "Split AC making loud noise"],
  carpenter: ["Main door not closing properly", "Wardrobe hinge broken", "Bed frame joint loose", "Kitchen cabinet door fell off"],
  mechanic: ["Car not starting in the morning", "Bike brakes are weak", "Car battery dead", "Engine making knocking sound"],
  painter: ["Seepage marks on bedroom wall", "Paint two rooms before Eid", "Front gate needs repainting", "Polish on wooden doors"],
  mason: ["Bathroom tiles cracked", "Crack in boundary wall", "Plaster falling from ceiling corner", "Kitchen floor tiles loose"],
  welder: ["Gate hinge broken", "Need a grill on the back window", "Stair railing loose", "Small shed for the car porch"],
};

const COMMENTS_5 = [
  "Came within 30 minutes and fixed it properly.",
  "Bohat acha kaam kiya, time pe aaye.",
  "Explained the problem clearly and charged exactly what we agreed.",
  "Very honest, didn't ask for extra money.",
  "Kaam saaf suthra kiya, dobara bulayenge.",
  "Fixed it first time. Very professional and respectful.",
  "Meri ammi akeli thin, bohat tameez se kaam kiya.",
];
const COMMENTS_4 = [
  "Good work but came 20 minutes late.",
  "Theek kaam tha, thora mehnga laga.",
  "Solved the issue, had to come back once for a part.",
  "Polite and careful inside the house.",
];
const COMMENTS_3 = [
  "Work was ok but he was late and left some mess.",
  "Kaam ho gaya lekin pehle bataya price se zyada maanga.",
  "Took longer than expected.",
];

type SeedWorker = {
  name: string;
  nameUr: string;
  trade: TradeId;
  area: string;
  exp: number;
  visit: number;
  online: boolean;
  quality: "great" | "good" | "mixed";
  reviews: number;
  engaged?: boolean;
  phone?: string;
};

const WORKERS: SeedWorker[] = [
  { name: "Muhammad Aslam", nameUr: "محمد اسلم", trade: "electrician", area: "isb-g9", exp: 15, visit: 500, online: true, quality: "great", reviews: 7, phone: DEMO.worker.phone },
  { name: "Tariq Mehmood", nameUr: "طارق محمود", trade: "electrician", area: "isb-g8", exp: 9, visit: 600, online: true, quality: "good", reviews: 5, engaged: true },
  { name: "Shahid Iqbal", nameUr: "شاہد اقبال", trade: "electrician", area: "isb-g10", exp: 12, visit: 500, online: true, quality: "good", reviews: 6 },
  { name: "Nadeem Abbas", nameUr: "ندیم عباس", trade: "electrician", area: "isb-f8", exp: 6, visit: 700, online: true, quality: "mixed", reviews: 4 },
  { name: "Riaz Ahmed", nameUr: "ریاض احمد", trade: "electrician", area: "isb-i8", exp: 20, visit: 800, online: false, quality: "great", reviews: 9 },
  { name: "Waqas Ahmed", nameUr: "وقاص احمد", trade: "electrician", area: "rwp-satellite", exp: 4, visit: 400, online: true, quality: "good", reviews: 2 },
  { name: "Ghulam Rasool", nameUr: "غلام رسول", trade: "plumber", area: "isb-g9", exp: 18, visit: 500, online: true, quality: "great", reviews: 8 },
  { name: "Sajid Ali", nameUr: "ساجد علی", trade: "plumber", area: "isb-g10", exp: 7, visit: 500, online: true, quality: "good", reviews: 4 },
  { name: "Arif Hussain", nameUr: "عارف حسین", trade: "plumber", area: "isb-f10", exp: 11, visit: 600, online: true, quality: "mixed", reviews: 5 },
  { name: "Javed Akhtar", nameUr: "جاوید اختر", trade: "plumber", area: "isb-i9", exp: 14, visit: 500, online: false, quality: "good", reviews: 6 },
  { name: "Liaqat Ali", nameUr: "لیاقت علی", trade: "plumber", area: "rwp-saddar", exp: 22, visit: 400, online: true, quality: "great", reviews: 7 },
  { name: "Abdul Rehman", nameUr: "عبدالرحمن", trade: "ac_technician", area: "isb-g9", exp: 10, visit: 1000, online: true, quality: "great", reviews: 8 },
  { name: "Khalid Mehmood", nameUr: "خالد محمود", trade: "ac_technician", area: "isb-g7", exp: 13, visit: 1200, online: true, quality: "good", reviews: 6, engaged: true },
  { name: "Asif Raza", nameUr: "آصف رضا", trade: "ac_technician", area: "isb-f8", exp: 8, visit: 1000, online: true, quality: "good", reviews: 5 },
  { name: "Bilal Ahmed", nameUr: "بلال احمد", trade: "ac_technician", area: "isb-i10", exp: 5, visit: 800, online: true, quality: "mixed", reviews: 3 },
  { name: "Naveed Anjum", nameUr: "نوید انجم", trade: "ac_technician", area: "rwp-satellite", exp: 16, visit: 1000, online: false, quality: "great", reviews: 7 },
  { name: "Fayyaz Hussain", nameUr: "فیاض حسین", trade: "carpenter", area: "isb-g9", exp: 25, visit: 600, online: true, quality: "great", reviews: 6 },
  { name: "Munir Ahmed", nameUr: "منیر احمد", trade: "carpenter", area: "isb-g11", exp: 12, visit: 500, online: true, quality: "good", reviews: 4 },
  { name: "Rashid Mehmood", nameUr: "راشد محمود", trade: "carpenter", area: "isb-f10", exp: 8, visit: 700, online: true, quality: "mixed", reviews: 3 },
  { name: "Noor Muhammad", nameUr: "نور محمد", trade: "carpenter", area: "rwp-raja-bazar", exp: 30, visit: 500, online: true, quality: "great", reviews: 5 },
  { name: "Yasir Arafat", nameUr: "یاسر عرفات", trade: "mechanic", area: "isb-g9", exp: 9, visit: 500, online: true, quality: "good", reviews: 5 },
  { name: "Qaiser Abbas", nameUr: "قیصر عباس", trade: "mechanic", area: "isb-i9", exp: 15, visit: 600, online: true, quality: "great", reviews: 6 },
  { name: "Ishfaq Ahmed", nameUr: "اشفاق احمد", trade: "mechanic", area: "rwp-saddar", exp: 11, visit: 500, online: false, quality: "good", reviews: 4 },
  { name: "Zahid Hussain", nameUr: "زاہد حسین", trade: "painter", area: "isb-g10", exp: 10, visit: 800, online: true, quality: "good", reviews: 5 },
  { name: "Mushtaq Ahmed", nameUr: "مشتاق احمد", trade: "painter", area: "isb-f11", exp: 17, visit: 1000, online: true, quality: "great", reviews: 6 },
  { name: "Pervaiz Iqbal", nameUr: "پرویز اقبال", trade: "painter", area: "rwp-6th-road", exp: 6, visit: 600, online: true, quality: "mixed", reviews: 3 },
  { name: "Habib Ullah", nameUr: "حبیب اللہ", trade: "mason", area: "isb-g13", exp: 20, visit: 1000, online: true, quality: "great", reviews: 6 },
  { name: "Gul Khan", nameUr: "گل خان", trade: "mason", area: "isb-i10", exp: 14, visit: 800, online: true, quality: "good", reviews: 4 },
  { name: "Sher Zaman", nameUr: "شیر زمان", trade: "mason", area: "isb-g9", exp: 9, visit: 700, online: true, quality: "good", reviews: 3 },
  { name: "Akbar Ali", nameUr: "اکبر علی", trade: "welder", area: "isb-i9", exp: 12, visit: 700, online: true, quality: "great", reviews: 5 },
  { name: "Zafar Iqbal", nameUr: "ظفر اقبال", trade: "welder", area: "isb-g8", exp: 8, visit: 600, online: true, quality: "good", reviews: 4 },
  { name: "Imtiaz Hussain", nameUr: "امتیاز حسین", trade: "welder", area: "rwp-peshawar-road", exp: 19, visit: 500, online: false, quality: "good", reviews: 5 },
  { name: "Kamran Shah", nameUr: "کامران شاہ", trade: "electrician", area: "isb-bahria", exp: 10, visit: 800, online: true, quality: "good", reviews: 4 },
  { name: "Adnan Saleem", nameUr: "عدنان سلیم", trade: "plumber", area: "isb-dha2", exp: 6, visit: 800, online: true, quality: "good", reviews: 3 },
];

const SEED_CUSTOMERS = ["Sana", "Usman", "Hina", "Farhan", "Rabia", "Omer", "Maria", "Hamza", "Nida", "Saad"];

function ratingFor(q: SeedWorker["quality"]) {
  const r = rand();
  if (q === "great") return r < 0.8 ? 5 : 4;
  if (q === "good") return r < 0.45 ? 5 : r < 0.9 ? 4 : 3;
  return r < 0.25 ? 5 : r < 0.6 ? 4 : r < 0.9 ? 3 : 2;
}

function reviewFor(rating: number) {
  if (rating >= 5) {
    const tags = ["On time", "Fair price", pick(["Fixed it first time", "Clean work", "Polite", "Explained the problem"])];
    return { comment: pick(COMMENTS_5), tags: [...new Set(tags)], paid: true };
  }
  if (rating === 4) {
    return { comment: pick(COMMENTS_4), tags: [pick(["Polite", "Fixed it first time", "Fair price"]), ...(rand() < 0.4 ? ["Late"] : [])], paid: true };
  }
  const over = rand() < 0.5;
  return { comment: pick(COMMENTS_3), tags: over ? ["Overcharged"] : ["Late"], paid: !over };
}

function summaryFor(w: SeedWorker, ratings: { rating: number; tags: string[] }[]) {
  const counts = new Map<string, number>();
  ratings.forEach((r) => r.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
  const avg = ratings.reduce((a, r) => a + r.rating, 0) / ratings.length;
  const warn = top.find((t) => t === "Late" || t === "Overcharged");
  const good = top.filter((t) => t !== "Late" && t !== "Overcharged");
  return {
    en: `${ratings.length} verified customers rate ${w.name.split(" ")[0]} ${avg.toFixed(1)}/5. ${good.length ? `They mention: ${good.join(", ").toLowerCase()}.` : ""}${warn ? ` Some said: ${warn.toLowerCase()}.` : ""}`.trim(),
    ur: `${ratings.length} تصدیق شدہ گاہکوں نے ${avg.toFixed(1)}/5 ریٹنگ دی۔`,
    tags: top,
  };
}

async function main() {
  console.log("Removing previous seed data…");
  const seedPhones = [DEMO.customer.phone, ...WORKERS.map((w) => w.phone).filter(Boolean)] as string[];
  await db
    .delete(schema.user)
    .where(or(like(schema.user.email, "%@seed.roshanrozgar.app"), inArray(schema.user.phoneNumber, seedPhones)));

  const now = new Date();
  // Demo customer
  const demoCustomerId = randomUUID();
  await db.insert(schema.user).values({
    id: demoCustomerId,
    name: DEMO.customer.name,
    email: phoneEmail(DEMO.customer.phone),
    phoneNumber: DEMO.customer.phone,
    phoneNumberVerified: true,
    role: "customer",
  });

  // Seeded review authors
  const customerIds: string[] = [];
  for (const [i, name] of SEED_CUSTOMERS.entries()) {
    const id = randomUUID();
    customerIds.push(id);
    await db.insert(schema.user).values({
      id,
      name,
      email: `customer${i}@seed.roshanrozgar.app`,
      phoneNumber: `+92311000${String(i).padStart(4, "0")}`,
      phoneNumberVerified: true,
      role: "customer",
    });
  }

  let workerCount = 0;
  let reviewCount = 0;
  for (const [i, w] of WORKERS.entries()) {
    const area = AREA_BY_ID[w.area];
    const userId = randomUUID();
    const phone = w.phone ?? `+92320000${String(i).padStart(4, "0")}`;
    await db.insert(schema.user).values({
      id: userId,
      name: w.name,
      email: w.phone ? phoneEmail(phone) : `worker${i}@seed.roshanrozgar.app`,
      phoneNumber: phone,
      phoneNumberVerified: true,
      role: "worker",
    });
    const skills = [...SKILLS[w.trade]].sort(() => rand() - 0.5).slice(0, between(3, 4));
    // Jitter around the sector centre so map pins don't overlap.
    const lat = area.lat + (rand() - 0.5) * 0.012;
    const lng = area.lng + (rand() - 0.5) * 0.012;
    const [worker] = await db
      .insert(schema.workers)
      .values({
        userId,
        name: w.name,
        nameUr: w.nameUr,
        trade: w.trade,
        skills,
        experienceYears: w.exp,
        areaId: area.id,
        lat,
        lng,
        visitCharge: w.visit,
        bioEn: `${TRADES[w.trade].en} with ${w.exp} years of experience in ${area.en}. ${skills.slice(0, 2).join(", ")}.`,
        bioUr: `${w.exp} سال کا تجربہ، ${area.ur} اور آس پاس کام کرتا ہوں۔`,
        languages: ["ur", ...(rand() < 0.5 ? ["pa"] : [])],
        isOnline: w.online,
        isSeeded: true,
        createdAt: daysAgo(between(120, 400)),
      })
      .returning();
    workerCount++;

    const ratings: { rating: number; tags: string[] }[] = [];
    for (let k = 0; k < w.reviews; k++) {
      const customerId = pick(customerIds);
      const [lo, hi] = TRADES[w.trade].priceBand;
      const price = Math.round(between(lo, Math.min(hi, lo * 3)) / 100) * 100;
      const done = daysAgo(between(3, 170));
      const [job] = await db
        .insert(schema.jobs)
        .values({
          groupId: randomUUID(),
          customerId,
          workerId: worker.id,
          trade: w.trade,
          problemText: pick(PROBLEMS[w.trade]),
          areaId: area.id,
          lat: area.lat,
          lng: area.lng,
          status: "completed",
          agreedPrice: price,
          bookedAt: new Date(done.getTime() - 3 * 3_600_000),
          completedAt: done,
          isSeeded: true,
          createdAt: new Date(done.getTime() - 4 * 3_600_000),
        })
        .returning({ id: schema.jobs.id });
      const rating = ratingFor(w.quality);
      const r = reviewFor(rating);
      ratings.push({ rating, tags: r.tags });
      const cname = SEED_CUSTOMERS[customerIds.indexOf(customerId)];
      await db.insert(schema.reviews).values({
        jobId: job.id,
        workerId: worker.id,
        customerId,
        customerName: cname,
        rating,
        tags: r.tags,
        paidAgreedPrice: r.paid,
        wouldHireAgain: rating >= 4,
        comment: r.comment,
        agreedPrice: price,
        isSeeded: true,
        createdAt: done,
      });
      reviewCount++;
    }

    if (w.engaged) {
      const customerId = pick(customerIds);
      await db.insert(schema.jobs).values({
        groupId: randomUUID(),
        customerId,
        workerId: worker.id,
        trade: w.trade,
        problemText: pick(PROBLEMS[w.trade]),
        areaId: area.id,
        lat: area.lat,
        lng: area.lng,
        status: "booked",
        agreedPrice: TRADES[w.trade].priceBand[0] * 2,
        bookedAt: new Date(now.getTime() - 40 * 60_000),
        isSeeded: true,
      });
    }

    const sum = summaryFor(w, ratings);
    const avg = ratings.reduce((a, r) => a + r.rating, 0) / Math.max(1, ratings.length);
    await db
      .update(schema.workers)
      .set({
        ratingAvg: Math.round(avg * 100) / 100,
        ratingCount: ratings.length,
        jobsCompleted: ratings.length,
        trustSummaryEn: sum.en,
        trustSummaryUr: sum.ur,
        trustTags: sum.tags,
        trustSummarySource: "seed",
      })
      .where(sql`${schema.workers.id} = ${worker.id}`);
  }

  console.log(`Seeded: 1 demo customer, ${SEED_CUSTOMERS.length} review authors, ${workerCount} workers, ${reviewCount} reviews.`);
  console.log(`Demo customer: ${DEMO.customer.phone}  Demo worker: ${DEMO.worker.phone}`);
  await client.end();
}

main().catch(async (e) => {
  console.error(e);
  await client.end();
  process.exit(1);
});

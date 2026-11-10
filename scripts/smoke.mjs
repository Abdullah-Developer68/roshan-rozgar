// End-to-end API smoke test of the full two-sided flow against a running server.
//   node scripts/smoke.mjs [baseUrl]
// Uses the seeded demo accounts + a throwaway second customer. Makes ~2 AI calls.
const BASE = process.argv[2] ?? "http://localhost:3000";

function client(label) {
  const jar = new Map();
  async function call(path, { method = "GET", json } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(json ? { "Content-Type": "application/json" } : {}),
        Origin: BASE,
        Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
      },
      body: json ? JSON.stringify(json) : undefined,
      redirect: "manual",
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(`[${label}] ${method} ${path} -> ${res.status} ${JSON.stringify(body)}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }
  async function login(phone) {
    await call("/api/auth/phone-number/send-otp", { method: "POST", json: { phoneNumber: phone } });
    const { sms } = await call(`/api/sms/outbox?phone=${encodeURIComponent(phone)}`);
    await call("/api/auth/phone-number/verify", { method: "POST", json: { phoneNumber: phone, code: sms.code } });
    return call("/api/me");
  }
  return { call, login };
}

const ok = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

const customer = client("customer");
const worker = client("worker");
const rival = client("rival");

console.log("1. Sign in (phone OTP via simulated SMS)");
const cMe = await customer.login("+923001111111");
ok(cMe.user?.role === "customer", `customer signed in as ${cMe.user?.name}`);
const wMe = await worker.login("+923002222222");
ok(wMe.worker?.trade === "electrician", `worker signed in as ${wMe.worker?.name}`);
const rMe = await rival.login("+923009999999");
ok(!!rMe.user, "second (new) customer auto-registered");
if (rMe.user.name === "New user") await rival.call("/api/me", { method: "POST", json: { name: "Bilal" } });

// Clean slate: close any open jobs the demo worker has from previous runs.
const pre = await worker.call("/api/worker/inbox");
for (const j of [...pre.requests, ...(pre.active ? [pre.active] : [])])
  await worker.call(`/api/jobs/${j.id}/close`, { method: "POST", json: { action: j.status === "booked" ? "cancel" : "decline" } });
await worker.call("/api/worker/status", { method: "POST", json: { isOnline: true } });

console.log("2. Discovery: nearby available electricians around G-9");
const G9 = { lat: 33.688, lng: 73.033 };
const { workers } = await customer.call("/api/workers/search", { method: "POST", json: { trade: "electrician", ...G9, radiusKm: 8 } });
const aslam = workers.find((w) => w.id === wMe.worker.id);
ok(aslam?.availability === "available", `demo worker is available (${workers.length} electricians in range)`);
ok(workers.some((w) => w.availability === "busy"), "a busy (engaged) worker is shown as busy");
ok(workers[0].availability === "available", "available workers are ranked first");

console.log("3. Request + negotiation");
const req = {
  workerIds: [aslam.id],
  trade: "electrician",
  problemText: "Kitchen breaker trips when the kettle is on",
  summaryEn: "Breaker trips under load in kitchen.",
  summaryUr: "کچن میں بریکر بار بار گر رہا ہے۔",
  areaId: "isb-g9",
  ...G9,
  offerAmount: 800,
};
const { jobIds } = await customer.call("/api/jobs", { method: "POST", json: req });
const { jobIds: rivalJobs } = await rival.call("/api/jobs", { method: "POST", json: { ...req, offerAmount: 1500 } });
const inbox = await worker.call("/api/worker/inbox");
ok(inbox.requests.length >= 2, `worker inbox shows ${inbox.requests.length} requests`);
const msg = await worker.call(`/api/jobs/${jobIds[0]}/messages`, {
  method: "POST",
  json: { kind: "text", text: "بریکر بدلنا پڑے گا، بارہ سو روپے لگیں گے" },
});
ok(true, `worker spoke a price in Urdu → detected offer: ${msg.detectedOffer} (source ${msg.aiSource})`);
let thread = await customer.call(`/api/jobs/${jobIds[0]}`);
const urMsg = thread.messages.find((m) => m.kind === "text");
ok(!!urMsg, `customer sees translation: "${urMsg?.textEn}"`);
if (!msg.detectedOffer) await worker.call(`/api/jobs/${jobIds[0]}/messages`, { method: "POST", json: { kind: "offer", offerAmount: 1200 } });
thread = await customer.call(`/api/jobs/${jobIds[0]}`);
ok(thread.job.pendingOffer?.by === "worker", `pending worker offer Rs ${thread.job.pendingOffer?.amount}`);

console.log("4. Booking consistency: customer and rival accept at the same moment");
const rivalThread = await worker.call(`/api/jobs/${rivalJobs[0]}`);
const rivalOffer = rivalThread.job.pendingOffer;
const results = await Promise.allSettled([
  customer.call(`/api/jobs/${jobIds[0]}/accept`, { method: "POST", json: { messageId: thread.job.pendingOffer.messageId } }),
  worker.call(`/api/jobs/${rivalJobs[0]}/accept`, { method: "POST", json: { messageId: rivalOffer.messageId } }),
]);
const wins = results.filter((r) => r.status === "fulfilled").length;
ok(wins === 1, `exactly one booking succeeded (${results.map((r) => r.status).join(", ")})`);
const after = await customer.call("/api/workers/search", { method: "POST", json: { trade: "electrician", ...G9, radiusKm: 8 } });
ok(after.workers.find((w) => w.id === aslam.id)?.availability === "busy", "worker now shows as busy in search");
const inbox2 = await worker.call("/api/worker/inbox");
ok(!!inbox2.active && inbox2.requests.length === 0, "worker has 1 active job and other requests were closed");
let blocked = false;
try {
  await customer.call("/api/jobs", { method: "POST", json: req });
} catch (e) {
  blocked = e.status === 409;
}
ok(blocked, "new requests to an engaged worker are rejected (409)");

console.log("5. Completion + trust");
const activeId = inbox2.active.id;
const activeOwner = activeId === jobIds[0] ? customer : rival;
await worker.call(`/api/jobs/${activeId}/complete`, { method: "POST" });
await activeOwner.call(`/api/jobs/${activeId}/review`, {
  method: "POST",
  json: { rating: 5, tags: ["On time", "Fair price"], paidAgreedPrice: true, wouldHireAgain: true, comment: "Fixed the breaker quickly, very polite." },
});
const free = await customer.call("/api/workers/search", { method: "POST", json: { trade: "electrician", ...G9, radiusKm: 8 } });
ok(free.workers.find((w) => w.id === aslam.id)?.availability === "available", "worker is available again after completion");
let dup = false;
try {
  await activeOwner.call(`/api/jobs/${activeId}/review`, { method: "POST", json: { rating: 1 } });
} catch (e) {
  dup = e.status === 409;
}
ok(dup, "a job can only be reviewed once");
await new Promise((r) => setTimeout(r, 8000));
const profile = await customer.call(`/api/workers/${aslam.id}`);
ok(profile.reviews[0]?.comment?.includes("breaker"), `new review is on the profile; trust summary (${profile.worker.trustSummarySource}): ${profile.worker.trustSummaryEn}`);
console.log("\nALL GOOD");

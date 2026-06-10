/* Ask-about-this-route — Claude Haiku answering one question about one route,
   grounded in the catalog record (api/_catalog.js) plus the live forecast and
   permit data the page already loaded (sent in the request body).

   This replaced the static "Safety & backup" boilerplate: the same knowledge
   lives in the catalog's `notes`/`fallback` fields, but now it's applied to
   the user's actual question next to today's actual data.

   Ships dark like search.js: no ANTHROPIC_API_KEY → 503 → the frontend shows
   an honest "ask is offline" line. Guardrails: question ≤ 200 chars, live
   payload ≤ 1500 chars, max_tokens 350 → ~0.3¢ per answer. */

const MODEL = "claude-haiku-4-5";
const CATALOG = require("./_catalog.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.statusCode = 405; return res.json({ error: "POST only" }); }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.statusCode = 503; return res.json({ error: "ask offline" }); }

  const body = req.body || {};
  const route = CATALOG.find(r => r.id === body.routeId);
  const question = (typeof body.question === "string" ? body.question : "").trim().slice(0, 200);
  if (!route || !question) { res.statusCode = 400; return res.json({ error: "need routeId + question" }); }
  const live = typeof body.live === "object" && body.live ? JSON.stringify(body.live).slice(0, 1500) : "none provided";

  const system = `You answer one question about one Sierra backcountry route for Cairn, a trip planner.

ROUTE RECORD (curated):
${JSON.stringify(route)}

LIVE DATA from the user's page right now (NOAA forecast + Recreation.gov permit availability; may be partial):
${live}

Rules:
- Answer in 2-4 plain sentences using ONLY the route record and live data. Cite concrete numbers from the live data when relevant (permit counts, forecast lows).
- Permit fallback questions: use the record's "fallback" field and, if live permit data shows open days, mention them.
- Safety questions: use the record's "notes" — specifics only, no generic backcountry lecture.
- If the answer needs information you don't have (current closures, water reports, trail damage), say so and point to the Inyo National Forest alerts page or Recreation.gov. Never invent conditions, availability, or routes.
- No greetings, no "great question", no disclaimers beyond what the rules require.`;

  try {
    const t0 = Date.now();
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(9000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 350,
        system,
        messages: [{ role: "user", content: question }]
      })
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}`);
    const msg = await r.json();
    const answer = (msg.content || []).find(b => b.type === "text")?.text?.trim();
    if (!answer) throw new Error("empty answer");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ answer, model: MODEL, latencyMs: Date.now() - t0 });
  } catch (e) {
    res.statusCode = 502;
    res.json({ error: "ask unavailable" });
  }
};

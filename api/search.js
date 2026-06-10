/* Natural-language trip search — Claude Haiku via the Anthropic Messages API.

   Ships dark: if ANTHROPIC_API_KEY isn't set in Vercel env vars, returns 503
   and the frontend falls back to its keyword parser. No SDK — raw fetch keeps
   the repo dependency-free (same call shape as docs.anthropic.com).

   Cost guardrails: Haiku 4.5 ($1/$5 per MTok), query capped at 300 chars,
   max_tokens 300, structured output schema → a search costs ~0.2¢. The spend
   cap on the API key (console.anthropic.com) is the hard backstop. */

const MODEL = "claude-haiku-4-5";
const CATALOG = require("./_catalog.js"); // shared with api/ask.js — keep in sync with ROUTES in index.html

const SYSTEM = `You are the search parser for Cairn, a Sierra backcountry trip planner.
Parse the user's trip query and match it against this route catalog:

${JSON.stringify(CATALOG)}

Rules:
- pills: extract only constraints the user actually stated. Keys you may use: Region, Nights, When, Difficulty, Terrain, Permits. Values are short labels (e.g. "Mammoth", "3", "Jul", "easy", "lakes", "available"). "N days" means roughly N-1 to N nights.
- routeIds: ranked best-to-worst list of catalog ids that genuinely fit. Routes within ±1 night of a stated trip length fit. If a stated region has no routes, you may include near alternates ONLY if note explains the distance honestly. Empty array if nothing fits.
- note: one short honest sentence for the user. Explain the best match, a near-miss ("Little Lakes Valley is 25 minutes from Mammoth"), or a season caveat tied to their timing. Never invent conditions, availability, or routes not in the catalog. Empty string if nothing useful to say.`;

const SCHEMA = {
  type: "object",
  properties: {
    pills: {
      type: "object",
      properties: {
        Region: { type: "string" }, Nights: { type: "string" }, When: { type: "string" },
        Difficulty: { type: "string" }, Terrain: { type: "string" }, Permits: { type: "string" }
      },
      additionalProperties: false
    },
    routeIds: { type: "array", items: { type: "string", enum: CATALOG.map(r => r.id) } },
    note: { type: "string" }
  },
  required: ["pills", "routeIds", "note"],
  additionalProperties: false
};

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.statusCode = 405; return res.json({ error: "POST only" }); }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.statusCode = 503; return res.json({ error: "search offline" }); }

  const query = (req.body && typeof req.body.query === "string" ? req.body.query : "").trim().slice(0, 300);
  if (!query) { res.statusCode = 400; return res.json({ error: "empty query" }); }

  try {
    const t0 = Date.now();
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      signal: AbortSignal.timeout(9000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM,
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
        messages: [{ role: "user", content: query }]
      })
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}`);
    const msg = await r.json();
    const text = (msg.content || []).find(b => b.type === "text")?.text;
    const parsed = JSON.parse(text); // schema-enforced by output_config

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ ...parsed, model: MODEL, latencyMs: Date.now() - t0 });
  } catch (e) {
    res.statusCode = 502;
    res.json({ error: "search unavailable" }); // frontend falls back to keyword parser
  }
};

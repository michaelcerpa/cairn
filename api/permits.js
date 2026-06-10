/* Live overnight-permit availability for Cairn trailheads — Recreation.gov.

   UNOFFICIAL API (the same one recreation.gov's own permit page calls; there is
   no official public endpoint for live quota). It can change or break without
   notice — when it does, this returns 502 and the frontend degrades to
   "check Recreation.gov" with no numbers. Never fake counts.

   Verified semantics (2026-06): per date+division, `remaining`/`total` is what's
   bookable online right now. `is_walkup` is set exactly when remaining=0. Totals
   grow within ~14 days of a date because Inyo releases its walk-up share online
   at D-14 — so a 0 on a far date often means "advance quota gone, more releases
   two weeks out", and the UI says so. A division ABSENT from a present date is
   sold out online (rec.gov omits sold-out divisions inside the booking window;
   verified June 2026: peak Saturdays drop all five of our trailheads while
   listing 30–49 others). A date absent entirely = no data.

   Cached at the edge 30 min, one month-sized call per calendar month touched. */

const UA = "cairn (github.com/michaelcerpa/cairn)";
const PERMIT_ID = "233262"; // Inyo National Forest - Wilderness Permits
const HORIZON_DAYS = 14;

// routeId -> recreation.gov division ("Entry Point") id
const DIVISIONS = {
  "bishop-dusy":      { division: "459", name: "Bishop Pass -South Lake" },
  "little-lakes":     { division: "451", name: "Little Lakes Valley" },
  "big-pine":         { division: "495", name: "Big Pine Creek North Fork" },
  "cottonwood":       { division: "520", name: "Cottonwood Lakes" },
  "sabrina":          { division: "482", name: "Sabrina Lake" },
  "duck-pass":        { division: "444", name: "Duck Pass" },
  "thousand-island":  { division: "435", name: "River Trail" },
  "mammoth-tuolumne": { division: "486", name: "John Muir Trail North of Devils Postpile" }
};

// today's date parts in trailhead time (Pacific), not server UTC
function pacificToday() {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
const iso = ms => new Date(ms).toISOString().slice(0, 10);

async function monthAvailability(year, month /* 1-based */) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const pad = String(month).padStart(2, "0");
  const url = `https://www.recreation.gov/api/permitinyo/${PERMIT_ID}/availabilityv2` +
              `?start_date=${year}-${pad}-01&end_date=${year}-${pad}-${last}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()).payload || {};
}

module.exports = async (req, res) => {
  const start = pacificToday();
  const dates = Array.from({ length: HORIZON_DAYS }, (_, i) => iso(start + i * 86400000));

  // one fetch per calendar month the horizon touches (1 or 2)
  const months = [...new Set(dates.map(d => d.slice(0, 7)))];
  let byDate = {};
  try {
    for (const m of months) {
      const [y, mo] = m.split("-").map(Number);
      Object.assign(byDate, await monthAvailability(y, mo));
    }
  } catch (e) {
    res.statusCode = 502;
    return res.json({ error: "Recreation.gov unreachable" });
  }

  const trailheads = {};
  for (const [routeId, { division, name }] of Object.entries(DIVISIONS)) {
    trailheads[routeId] = {
      division, name,
      days: dates.map(date => {
        const row = byDate[date];
        if (!row) return { date, remaining: null, total: null };           // no data for the date
        const e = row[division];
        if (!e?.quota_usage_by_member_daily) return { date, remaining: 0, total: null }; // omitted = sold out online
        const q = e.quota_usage_by_member_daily;
        return { date, remaining: q.remaining, total: q.total, walkup: !!e.is_walkup };
      })
    };
  }

  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    fetchedAt: new Date().toISOString(),
    source: "Recreation.gov (unofficial availability API)",
    permitId: PERMIT_ID,
    permitUrl: `https://www.recreation.gov/permits/${PERMIT_ID}`,
    trailheads
  });
};

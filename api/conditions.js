/* Live conditions for Cairn trailheads — NOAA / National Weather Service.
   api.weather.gov is free, keyless public data; it asks only for a User-Agent.

   Gridpoint paths were resolved once from each trailhead's lat/lng via
   GET /points/{lat},{lon} (stable for fixed coordinates, so we skip that
   lookup at runtime). All five trailheads fall in forecast zone CAZ519
   (Eastern Sierra), so one alerts call covers every route.

   Cached at Vercel's edge for 30 minutes (s-maxage) — NOAA sees a handful
   of requests per half hour no matter how many people load the site. */

const UA = "cairn (github.com/michaelcerpa/cairn)";

const TRAILHEADS = {
  "bishop-dusy":      { forecast: "https://api.weather.gov/gridpoints/VEF/8,162/forecast",   zone: "CAZ519" }, // South Lake 37.1689,-118.5644
  "little-lakes":     { forecast: "https://api.weather.gov/gridpoints/VEF/4,175/forecast",   zone: "CAZ519" }, // Mosquito Flat 37.4356,-118.7486
  "big-pine":         { forecast: "https://api.weather.gov/gridpoints/VEF/12,159/forecast",  zone: "CAZ519" }, // Big Pine Creek 37.1247,-118.4419
  "cottonwood":       { forecast: "https://api.weather.gov/gridpoints/VEF/17,128/forecast",  zone: "CAZ519" }, // Cottonwood Lakes 36.4528,-118.1697
  "sabrina":          { forecast: "https://api.weather.gov/gridpoints/VEF/7,164/forecast",   zone: "CAZ519" }, // Lake Sabrina 37.2125,-118.6125
  "duck-pass":        { forecast: "https://api.weather.gov/gridpoints/REV/58,15/forecast",   zone: "CAZ073" }, // Coldwater/Duck Pass TH 37.5905,-118.9890
  "thousand-island":  { forecast: "https://api.weather.gov/gridpoints/HNX/84,137/forecast",  zone: "CAZ326" }, // Agnew Meadows 37.6817,-119.0856
  "mammoth-tuolumne": { forecast: "https://api.weather.gov/gridpoints/HNX/84,134/forecast",  zone: "CAZ326" }  // Devils Postpile/Reds Meadow 37.6297,-119.0846
};
const alertsURL = zone => `https://api.weather.gov/alerts/active?zone=${zone}`;

async function getJSON(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/geo+json" },
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function summarize(forecast) {
  const periods = (forecast.properties.periods || []).slice(0, 6).map(p => ({
    name: p.name,
    tempF: p.temperature,
    isDaytime: p.isDaytime,
    wind: p.windSpeed,
    short: p.shortForecast
  }));
  if (!periods.length) throw new Error("empty forecast");
  // next ~48h window
  const next4 = periods.slice(0, 4);
  const lows = next4.filter(p => !p.isDaytime).map(p => p.tempF);
  const highs = next4.filter(p => p.isDaytime).map(p => p.tempF);
  const gridElevM = forecast.properties.elevation?.value;
  return {
    gridElevFt: gridElevM ? Math.round(gridElevM * 3.28084) : null,
    low: lows.length ? Math.min(...lows) : null,
    high: highs.length ? Math.max(...highs) : null,
    periods
  };
}

module.exports = async (req, res) => {
  const trailheads = {};
  const results = await Promise.allSettled(
    Object.entries(TRAILHEADS).map(async ([id, t]) => {
      trailheads[id] = summarize(await getJSON(t.forecast));
    })
  );
  // partial data is fine — the frontend falls back per-route
  const failed = results.filter(r => r.status === "rejected").length;

  // one alerts call per unique NWS zone, attached per-trailhead
  const zones = [...new Set(Object.values(TRAILHEADS).map(t => t.zone))];
  const zoneAlerts = {};
  await Promise.allSettled(zones.map(async z => {
    const a = await getJSON(alertsURL(z));
    zoneAlerts[z] = (a.features || []).map(f => ({
      event: f.properties.event,
      severity: f.properties.severity,
      headline: f.properties.headline
    }));
  })); /* alerts are additive; a missing zone ≠ fatal */

  for (const [id, t] of Object.entries(TRAILHEADS))
    if (trailheads[id]) trailheads[id].alerts = zoneAlerts[t.zone] ?? null;

  if (Object.keys(trailheads).length === 0) {
    res.statusCode = 502;
    return res.json({ error: "NOAA unreachable" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    fetchedAt: new Date().toISOString(),
    source: "NOAA / National Weather Service",
    degraded: failed > 0,
    trailheads
  });
};

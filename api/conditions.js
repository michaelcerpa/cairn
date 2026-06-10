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
  "bishop-dusy":  "https://api.weather.gov/gridpoints/VEF/8,162/forecast",   // South Lake 37.1689,-118.5644
  "little-lakes": "https://api.weather.gov/gridpoints/VEF/4,175/forecast",   // Mosquito Flat 37.4356,-118.7486
  "big-pine":     "https://api.weather.gov/gridpoints/VEF/12,159/forecast",  // Big Pine Creek 37.1247,-118.4419
  "cottonwood":   "https://api.weather.gov/gridpoints/VEF/17,128/forecast",  // Cottonwood Lakes 36.4528,-118.1697
  "sabrina":      "https://api.weather.gov/gridpoints/VEF/7,164/forecast"    // Lake Sabrina 37.2125,-118.6125
};
const ALERTS_URL = "https://api.weather.gov/alerts/active?zone=CAZ519";

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
    Object.entries(TRAILHEADS).map(async ([id, url]) => {
      trailheads[id] = summarize(await getJSON(url));
    })
  );
  // partial data is fine — the frontend falls back per-route
  const failed = results.filter(r => r.status === "rejected").length;

  let alerts = [];
  try {
    const a = await getJSON(ALERTS_URL);
    alerts = (a.features || []).map(f => ({
      event: f.properties.event,
      severity: f.properties.severity,
      headline: f.properties.headline
    }));
  } catch { /* alerts are additive; missing ≠ fatal */ }

  if (Object.keys(trailheads).length === 0) {
    res.statusCode = 502;
    return res.json({ error: "NOAA unreachable" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    fetchedAt: new Date().toISOString(),
    source: "NOAA / National Weather Service",
    zone: "CAZ519 (Eastern Sierra)",
    degraded: failed > 0,
    alerts,
    trailheads
  });
};

/* Shared route catalog for the LLM endpoints (api/search.js, api/ask.js).
   Underscore prefix = Vercel does NOT expose this file as an endpoint.

   KEEP IN SYNC with ROUTES in index.html when adding routes. `notes` and
   `fallback` used to be the displayed "Safety & backup" copy — now they're
   grounding knowledge for ask answers instead of boilerplate on the page. */

module.exports = [
  { id: "bishop-dusy", name: "Bishop Pass → Dusy Basin", region: "bishop", trailhead: "South Lake",
    miles: 14, gain: 3000, nights: 3, difficulty: "hard", maxEl: 11972,
    traits: "alpine pass, granite basin, lakes, photographer favorite",
    permit: "Reservation — Inyo NF quota trailhead (Recreation.gov)",
    notes: "Bishop Pass is exposed above treeline — clear it before noon if afternoon thunderheads build. In dry years the upper South Lake switchbacks run dry; top off at the last reliable creek and carry ~3L. Stage I fire restrictions: gas stove only, no campfires. Bear canister required.",
    fallback: "Sabrina Basin — same region; 10 of its 25 daily permits release online two weeks out." },

  { id: "little-lakes", name: "Little Lakes Valley", region: "bishop", trailhead: "Mosquito Flat (Rock Creek)",
    miles: 10, gain: 1100, nights: 2, difficulty: "easy", maxEl: 11000,
    traits: "gentle, lake-hopping, highest trailhead in the Sierra, family-friendly, acclimatization",
    permit: "Reservation — high-demand Inyo NF trailhead (Recreation.gov)",
    notes: "Gentle grade from the highest trailhead in the Sierra — a strong day-one acclimatization base, and the friendliest first-trip pick in the catalog. Lot fills very early on weekends. Afternoon thunderheads can build over the Mono Divide. Stoves only under Stage I; bear canister required.",
    fallback: "Hilton Lakes — adjacent drainage, quieter, better last-minute permit odds." },

  { id: "big-pine", name: "Big Pine Lakes (North Fork)", region: "bishop", trailhead: "Big Pine Creek",
    miles: 15, gain: 3500, nights: 2, difficulty: "moderate", maxEl: 10600,
    traits: "turquoise glacier lakes, hot exposed climb, instagram-famous",
    permit: "Reservation — Inyo NF quota trailhead, among the most competitive (Recreation.gov)",
    notes: "The early grind up the North Fork is hot and fully exposed — start at dawn and carry water from the first crossing; in dry years the lower creeks run thin. Stage I fire restrictions: gas stove only. Bear canister required.",
    fallback: "South Fork Big Pine — same trailhead permit, quieter lakes." },

  { id: "cottonwood", name: "Cottonwood Lakes", region: "lonepine", trailhead: "Cottonwood Lakes (Horseshoe Meadows Rd)",
    miles: 12, gain: 1500, nights: 2, difficulty: "easy", maxEl: 11200,
    traits: "high and gentle, golden trout, Whitney/Langley acclimatization base",
    permit: "Reservation — Inyo NF quota trailhead; the Whitney Zone needs its OWN separate permit if continuing",
    notes: "High, dry, and gentle — an excellent first-night acclimatization base before Whitney or Langley. Continuing to Mt. Whitney requires a separate Whitney Zone permit. Exposed approach in heat. Stove-only cooking under Stage I; bear canister required.",
    fallback: "Horseshoe Meadow / Trail Pass — same road, lower quota pressure, easier last-minute permits." },

  { id: "sabrina", name: "Sabrina Basin", region: "bishop", trailhead: "Lake Sabrina",
    miles: 13, gain: 2400, nights: 2, difficulty: "moderate", maxEl: 11100,
    traits: "lake basin, dependable last-minute permits (two-week release)",
    permit: "Two-week release — 25/day quota, 10 spots release online exactly two weeks out (Recreation.gov)",
    notes: "The dependable fallback when reservation trailheads are booked — a third of its daily permits release online exactly two weeks out. Storms build fast over the crest; plan to be off exposed ground before noon. Stove-only under Stage I; bear canister required.",
    fallback: "Tyee Lakes — adjacent drainage, same two-weeks-out release, even quieter." },

  { id: "duck-pass", name: "Duck Pass → Duck Lake", region: "mammoth", trailhead: "Coldwater (Lake Mary Rd)",
    miles: 11, gain: 1900, nights: 2, difficulty: "moderate", maxEl: 10797,
    traits: "Mammoth Lakes Basin classic, pass walk, Duck and Pika lakes",
    permit: "Reservation — Inyo NF quota trailhead, Mammoth Lakes Basin (Recreation.gov)",
    notes: "Friendly by Sierra-pass standards, but still 10,800' — clear the pass before the afternoon build-up. Hard wind across Duck Lake's open shoreline most afternoons; the benches toward Pika Lake sleep quieter. Stove-only under Stage I; bear canister required.",
    fallback: "McGee Creek — quieter drainage 20 min south, same permit system, easier last-minute odds." },

  { id: "thousand-island", name: "Thousand Island Lake", region: "mammoth", trailhead: "Agnew Meadows (Reds Meadow Rd shuttle)",
    miles: 17, gain: 2300, nights: 2, difficulty: "moderate", maxEl: 9834,
    traits: "Banner Peak postcard, Ansel Adams Wilderness, JMT/PCT corridor, competitive permit",
    permit: "Reservation — River Trail entry, among Inyo's most competitive (Recreation.gov)",
    notes: "Afternoon buildups park on the Ritter Range — be off open shoreline when they do. The outlet takes the most camping pressure; better sites on the benches north and east. Early season a steep snowfield can linger on the High Trail traverse — the River Trail is the cleaner early line. The Reds Meadow shuttle controls mid-day trailhead access — time your exit to it. Stove-only under Stage I; bear canister required.",
    fallback: "Rush Creek (Silver Lake) — reaches the same lakes from the June Lake side; different permit pool, often better odds." },

  { id: "mammoth-tuolumne", name: "Reds Meadow → Tuolumne (JMT)", region: "mammoth", trailhead: "Devils Postpile / Reds Meadow (shuttle)",
    miles: 36, gain: 6300, nights: 3, difficulty: "hard", maxEl: 11056,
    traits: "point-to-point JMT leg, Donohue Pass, Lyell Canyon, ends in Yosemite, YARTS bus return",
    permit: "Reservation — 'JMT North of Devils Postpile' entry; the one Inyo permit carries you through into Yosemite (Recreation.gov)",
    notes: "A committing point-to-point: past Thousand Island the easy exits are behind you, and Donohue Pass (11,056') is the weather decision — cross before the afternoon build. Camps near 11,000' freeze even in June. Rangers check permits and bear canisters in Lyell Canyon. The walk ends ~60 road-miles from the start — the summer YARTS bus closes the loop back to Mammoth. Stove-only under Stage I.",
    fallback: "Reverse it from Tuolumne — Yosemite's Lyell Canyon permit (Donohue exit quota) is a second pool of dates when Inyo's is gone." }
];

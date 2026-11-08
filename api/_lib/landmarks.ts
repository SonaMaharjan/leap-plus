// Well-known Dublin places that OpenStreetMap search misses or mislabels (e.g. "UCD"), with the labels people expect.
import type { Place } from "./journey.js";

type Landmark = Place & { aliases?: string[] };

const LANDMARKS: Landmark[] = [
  { name: "University College Dublin", area: "Belfield, Dublin 4", lat: 53.3068, lon: -6.2246, aliases: ["UCD", "UCD Belfield", "Belfield"] },
  { name: "Trinity College Dublin", area: "College Green, Dublin 2", lat: 53.3437, lon: -6.2544, aliases: ["TCD", "Trinity"] },
  { name: "Dublin City University", area: "Glasnevin, Dublin 9", lat: 53.385, lon: -6.2574, aliases: ["DCU"] },
  { name: "TU Dublin Grangegorman", area: "Grangegorman, Dublin 7", lat: 53.3562, lon: -6.2822, aliases: ["TUD", "Technological University Dublin", "DIT"] },
  { name: "RCSI (Royal College of Surgeons)", area: "St Stephen's Green, Dublin 2", lat: 53.3392, lon: -6.2627, aliases: ["Royal College of Surgeons in Ireland"] },
  { name: "National College of Art and Design", area: "Thomas Street, Dublin 8", lat: 53.3435, lon: -6.2786, aliases: ["NCAD"] },
  { name: "Dublin Airport", area: "Co. Dublin", lat: 53.4283, lon: -6.2473, aliases: ["Airport"] },
  { name: "Heuston Station", area: "Dublin 8", lat: 53.3462, lon: -6.2927 },
  { name: "Connolly Station", area: "Amiens Street, Dublin 1", lat: 53.3528, lon: -6.2479 },
  { name: "Busáras", area: "Store Street, Dublin 1", lat: 53.3498, lon: -6.2518, aliases: ["Central Bus Station"] },
  { name: "St James's Hospital", area: "James's Street, Dublin 8", lat: 53.3401, lon: -6.2956 },
  { name: "Mater Hospital", area: "Eccles Street, Dublin 7", lat: 53.359, lon: -6.2668, aliases: ["Mater Misericordiae University Hospital"] },
  { name: "Beaumont Hospital", area: "Beaumont, Dublin 9", lat: 53.3895, lon: -6.2247 },
  { name: "St Vincent's University Hospital", area: "Elm Park, Dublin 4", lat: 53.3168, lon: -6.2128, aliases: ["SVUH"] },
  { name: "Tallaght University Hospital", area: "Tallaght, Dublin 24", lat: 53.2912, lon: -6.3789 },
  { name: "Dundrum Town Centre", area: "Dundrum, Dublin 16", lat: 53.287, lon: -6.2422 },
  { name: "IFSC", area: "North Dock, Dublin 1", lat: 53.3494, lon: -6.2459, aliases: ["International Financial Services Centre"] },
  { name: "GPO (General Post Office)", area: "O'Connell Street Lower, Dublin 1", lat: 53.3493, lon: -6.2605 },
  { name: "Aviva Stadium", area: "Ballsbridge, Dublin 4", lat: 53.3352, lon: -6.2282 },
  { name: "Croke Park", area: "Jones's Road, Dublin 3", lat: 53.3604, lon: -6.251 },
  { name: "Phoenix Park", area: "Dublin 8", lat: 53.3589, lon: -6.3307 },
  { name: "St Stephen's Green", area: "Dublin 2", lat: 53.3381, lon: -6.259 },
];

/** "St. James's" → "st jamess"; "Busáras" → "busaras"; "Saint" → "st". */
export function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bsaint\b/g, "st")
    .trim();
}

/** Landmarks whose name or alias starts with the query, or has a word starting with it (3+ characters). */
export function matchLandmarks(text: string, limit = 2): Place[] {
  const q = normalise(text);
  if (q.length < 2) return [];
  const hit = (key: string) => {
    const k = normalise(key);
    return k.startsWith(q) || (q.length >= 3 && k.includes(` ${q}`));
  };
  return LANDMARKS.filter((l) => [l.name, ...(l.aliases ?? [])].some(hit))
    .slice(0, limit)
    .map(({ name, area, lat, lon }) => ({ name, area, lat, lon }));
}

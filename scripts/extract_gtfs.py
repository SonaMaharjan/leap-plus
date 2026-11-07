#!/usr/bin/env python3
"""Extract demo-route data from the Dublin Bus GTFS feed.

Output: public/gtfs/{route}.json (shape, ordered stops, demo-date timetable per direction)
        public/gtfs/routes.json  (GTFS route_id -> short name lookup for the realtime proxy)

Usage: python3 scripts/extract_gtfs.py --gtfs GTFS_Dublin_Bus.zip|dir [--date YYYYMMDD] [--routes E1,39A,16]
"""
import argparse
import csv
import datetime as dt
import io
import json
import os
import zipfile
from collections import Counter, defaultdict

MAX_SHAPE_POINTS = 200


class Feed:
    def __init__(self, path):
        self.path = path
        self.zip = zipfile.ZipFile(path) if path.endswith(".zip") else None

    def rows(self, name):
        if self.zip:
            fh = io.TextIOWrapper(self.zip.open(name), encoding="utf-8-sig")
        else:
            fh = open(os.path.join(self.path, name), encoding="utf-8-sig", newline="")
        with fh:
            yield from csv.DictReader(fh)


def to_secs(hms):
    h, m, s = (int(x) for x in hms.split(":"))
    return h * 3600 + m * 60 + s


def active_services(feed, date):
    weekday = dt.datetime.strptime(date, "%Y%m%d").strftime("%A").lower()
    active = {
        r["service_id"]
        for r in feed.rows("calendar.txt")
        if r["start_date"] <= date <= r["end_date"] and r[weekday] == "1"
    }
    for r in feed.rows("calendar_dates.txt"):
        if r["date"] == date:
            (active.add if r["exception_type"] == "1" else active.discard)(r["service_id"])
    return active


def simplify(points, limit=MAX_SHAPE_POINTS):
    if len(points) <= limit:
        return points
    step = (len(points) - 1) / (limit - 1)
    return [points[round(i * step)] for i in range(limit)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gtfs", required=True)
    ap.add_argument("--date", default=dt.date.today().strftime("%Y%m%d"))
    ap.add_argument("--routes", default="E1,39A,16")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "public", "gtfs"))
    args = ap.parse_args()
    wanted = args.routes.split(",")
    feed = Feed(args.gtfs)
    os.makedirs(args.out, exist_ok=True)

    routes = {r["route_id"]: r for r in feed.rows("routes.txt")}
    lookup = {rid: r["route_short_name"] for rid, r in routes.items()}
    by_short = {r["route_short_name"]: rid for rid, r in routes.items() if r["route_short_name"] in wanted}
    missing = set(wanted) - set(by_short)
    if missing:
        raise SystemExit(f"Routes not in feed: {sorted(missing)}")

    services = active_services(feed, args.date)
    trips = {}
    for t in feed.rows("trips.txt"):
        if t["route_id"] in by_short.values() and t["service_id"] in services:
            trips[t["trip_id"]] = t
    if not trips:
        raise SystemExit(f"No trips for {wanted} on {args.date}")

    stop_times = defaultdict(list)
    for st in feed.rows("stop_times.txt"):
        if st["trip_id"] in trips:
            stop_times[st["trip_id"]].append((int(st["stop_sequence"]), st["stop_id"], to_secs(st["arrival_time"])))

    # Representative pattern per (route, direction): most common stop sequence.
    groups = defaultdict(list)
    for tid, sts in stop_times.items():
        sts.sort()
        t = trips[tid]
        groups[(lookup[t["route_id"]], t["direction_id"])].append(tid)

    needed_shapes, needed_stops, plan = set(), set(), {}
    for key, tids in groups.items():
        pattern = Counter(tuple(s[1] for s in stop_times[tid]) for tid in tids).most_common(1)[0][0]
        members = [tid for tid in tids if tuple(s[1] for s in stop_times[tid]) == pattern]
        shape_id = Counter(trips[tid]["shape_id"] for tid in members).most_common(1)[0][0]
        headsign = Counter(trips[tid]["trip_headsign"] for tid in members).most_common(1)[0][0]
        plan[key] = (pattern, members, shape_id, headsign)
        needed_shapes.add(shape_id)
        needed_stops.update(pattern)

    shapes = defaultdict(list)
    for p in feed.rows("shapes.txt"):
        if p["shape_id"] in needed_shapes:
            shapes[p["shape_id"]].append((int(p["shape_pt_sequence"]), float(p["shape_pt_lat"]), float(p["shape_pt_lon"])))
    stops = {
        s["stop_id"]: {
            "stopId": s["stop_id"],
            "code": s["stop_code"],
            "name": s["stop_name"],
            "lat": round(float(s["stop_lat"]), 6),
            "lon": round(float(s["stop_lon"]), 6),
        }
        for s in feed.rows("stops.txt")
        if s["stop_id"] in needed_stops
    }

    for short in wanted:
        directions = []
        for (route, direction), (pattern, members, shape_id, headsign) in sorted(plan.items()):
            if route != short:
                continue
            pts = [(round(lat, 6), round(lon, 6)) for _, lat, lon in sorted(shapes[shape_id])]
            timetable = []
            for tid in members:
                sts = stop_times[tid]
                start = sts[0][2]
                timetable.append({"tripId": tid, "startSecs": start, "stopOffsetsSecs": [s[2] - start for s in sts]})
            timetable.sort(key=lambda x: x["startSecs"])
            directions.append({
                "directionId": int(direction),
                "headsign": headsign,
                "shape": [list(p) for p in simplify(pts)],
                "stops": [stops[sid] for sid in pattern],
                "timetable": timetable,
            })
        out = {
            "route": short,
            "routeId": by_short[short],
            "longName": routes[by_short[short]]["route_long_name"],
            "serviceDate": args.date,
            "directions": directions,
        }
        path = os.path.join(args.out, f"{short}.json")
        with open(path, "w") as fh:
            json.dump(out, fh, separators=(",", ":"))
        trips_n = sum(len(d["timetable"]) for d in directions)
        print(f"{short}: {len(directions)} directions, {trips_n} trips, {os.path.getsize(path) // 1024} KB")

    lookup_path = os.path.join(args.out, "routes.json")
    merged = {}
    if os.path.exists(lookup_path):
        with open(lookup_path) as fh:
            merged = {rid: name for rid, name in json.load(fh).items() if name not in wanted}
    merged.update({rid: lookup[rid] for rid in by_short.values()})
    with open(lookup_path, "w") as fh:
        json.dump(dict(sorted(merged.items())), fh, indent=1)


if __name__ == "__main__":
    main()

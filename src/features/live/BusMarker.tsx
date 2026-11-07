import { divIcon, type LatLngTuple, type Marker as LeafletMarker } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { Marker, Tooltip } from "react-leaflet";
import { CONFIG } from "../../lib/config";
import { lerpLatLng } from "./interpolate";
import type { RealtimeVehicle } from "./types";

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function busIcon(route: string, bearing?: number) {
  const arrow =
    typeof bearing === "number"
      ? `<span class="bus-arrow" style="transform:rotate(${Math.round(bearing)}deg)"></span>`
      : "";
  return divIcon({
    className: "",
    html: `<div class="bus-marker">${arrow}<span>${route}</span></div>`,
    iconSize: [40, 24],
    iconAnchor: [20, 12],
  });
}

/** F13/D2-6: glides between the last two positions over one poll interval (rAF). */
export function BusMarker({ vehicle, delayLabel }: { vehicle: RealtimeVehicle; delayLabel?: string }) {
  const ref = useRef<LeafletMarker | null>(null);
  const [initial] = useState<LatLngTuple>(() => [vehicle.lat, vehicle.lon]);
  const icon = useMemo(() => busIcon(vehicle.route, vehicle.bearing), [vehicle.route, vehicle.bearing]);

  useEffect(() => {
    const marker = ref.current;
    if (!marker) return;
    const from = marker.getLatLng();
    const to: [number, number] = [vehicle.lat, vehicle.lon];
    if (reducedMotion() || (from.lat === to[0] && from.lng === to[1])) {
      marker.setLatLng(to);
      return;
    }
    const duration = CONFIG.realtimePollMs * 0.95;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      marker.setLatLng(lerpLatLng([from.lat, from.lng], to, k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [vehicle.lat, vehicle.lon]);

  return (
    <Marker ref={ref} position={initial} icon={icon} keyboard={false}>
      <Tooltip direction="top" offset={[0, -12]}>
        Route {vehicle.route} · bus {vehicle.vehicleId}
        {delayLabel ? ` · ${delayLabel}` : ""}
      </Tooltip>
    </Marker>
  );
}

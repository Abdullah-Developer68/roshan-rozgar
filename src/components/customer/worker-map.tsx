"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useRequestStore } from "@/stores/request-store";
import { renderToStaticMarkup } from "react-dom/server";
import type { TradeId } from "@/lib/trades";
import { TradeIcon } from "@/components/ui/icons";
import { Star } from "lucide-react";
import { useT, type MsgKey } from "@/lib/i18n";

const iconSvg = (trade: TradeId) => renderToStaticMarkup(<TradeIcon trade={trade} className="size-4" strokeWidth={2} />);

function pin(trade: TradeId, color: string, ring: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:999px;background:${color};display:flex;align-items:center;justify-content:center;color:#0a0a0a;box-shadow:0 2px 6px rgba(0,0,0,.25);border:2px solid ${ring ? "#0a0a0a" : "white"}">${iconSvg(trade)}</div>`,
  });
}

const homeIcon = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div style="width:22px;height:22px;border-radius:999px;background:#2563eb;border:4px solid white;box-shadow:0 0 0 6px rgba(37,99,235,.25)"></div>`,
});

function Recenter() {
  const lat = useRequestStore((s) => s.lat);
  const lng = useRequestStore((s) => s.lng);
  const radiusKm = useRequestStore((s) => s.radiusKm);
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], radiusKm <= 4 ? 14 : radiusKm <= 8 ? 13 : 12);
  }, [lat, lng, radiusKm, map]);
  return null;
}

/** Map of nearby workers: green = available, orange = on a job, grey = offline. */
export function WorkerMap() {
  const lat = useRequestStore((s) => s.lat);
  const lng = useRequestStore((s) => s.lng);
  const radiusKm = useRequestStore((s) => s.radiusKm);
  const results = useRequestStore((s) => s.results);
  const selected = useRequestStore((s) => s.selected);
  const toggle = useRequestStore((s) => s.toggleSelected);
  const setFocused = useRequestStore((s) => s.setFocused);
  const { t, pick } = useT();
  const avail: Record<string, MsgKey> = { available: "statusAvailable", busy: "statusBusy", offline: "statusOffline" };

  return (
    <div className="h-64 overflow-hidden rounded-lg border border-border lg:h-[28rem]" dir="ltr">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter />
        <Circle center={[lat, lng]} radius={radiusKm * 1000} pathOptions={{ color: "#0b5d3b", weight: 1, fillOpacity: 0.04 }} />
        <Marker position={[lat, lng]} icon={homeIcon}>
          <Tooltip>{pick("You", "آپ")}</Tooltip>
        </Marker>
        {results?.map((w) => {
          const color = w.availability === "available" ? "#dcfce7" : w.availability === "busy" ? "#ffedd5" : "#e5e7eb";
          return (
            <Marker
              key={w.id}
              position={[w.lat, w.lng]}
              icon={pin(w.trade, color, selected.includes(w.id))}
              opacity={w.availability === "available" ? 1 : 0.55}
              eventHandlers={{
                click: () => w.availability === "available" && toggle(w.id),
                mouseover: () => setFocused(w.id),
              }}
            >
              <Tooltip>
                <span className="inline-flex items-center gap-1">
                  {pick(w.name, w.nameUr)} · <Star className="size-3 fill-current" /> {w.ratingAvg.toFixed(1)} · {w.distanceKm} km · {t(avail[w.availability])}
                </span>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

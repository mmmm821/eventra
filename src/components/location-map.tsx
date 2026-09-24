import { MapPin, Navigation } from "lucide-react";

export function EventLocationMap({
  venueName,
  city,
  address,
  lat,
  lng,
}: {
  venueName: string;
  city: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const query = encodeURIComponent(`${venueName}, ${address}, ${city}`);
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  // OpenStreetMap's embed endpoint needs no API key, unlike Google Maps
  // Embed — a practical default for a demo. Swap the src for the Google
  // Maps Embed API if you have a billing-enabled key.
  const osmSrc =
    lat && lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&marker=${lat}%2C${lng}&layer=mapnik`
      : null;

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      {osmSrc ? (
        <iframe src={osmSrc} className="w-full h-64 grayscale-[30%]" loading="lazy" title="Event location map" />
      ) : (
        <div className="h-40 flex items-center justify-center bg-white/[0.03] text-white/30">
          <MapPin className="h-6 w-6" />
        </div>
      )}
      <div className="flex items-center justify-between p-4 bg-white/[0.02]">
        <div>
          <p className="text-sm text-white">{venueName}</p>
          <p className="text-xs text-white/45">{address ? `${address}, ` : ""}{city}</p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200 shrink-0"
        >
          <Navigation className="h-3.5 w-3.5" /> Get Directions
        </a>
      </div>
    </div>
  );
}

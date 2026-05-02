export type GeoLocationInput = {
  latitude?: number | null;
  longitude?: number | null;
};

export function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const cLat1 = toRadians(aLat);
  const cLat2 = toRadians(bLat);

  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(cLat1) * Math.cos(cLat2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return earthRadiusKm * c;
}

export function hasCoordinates(value: GeoLocationInput): value is { latitude: number; longitude: number } {
  return (
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude)
  );
}

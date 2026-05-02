function parseIntEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) {
    return defaultValue;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return defaultValue;
  }

  return parsed;
}

export const locationConfig = {
  heroLocationStaleSeconds: parseIntEnv("HERO_LOCATION_STALE_SECONDS", 60),
  heroLocationMinUpdateSeconds: parseIntEnv("HERO_LOCATION_MIN_UPDATE_SECONDS", 10),
};

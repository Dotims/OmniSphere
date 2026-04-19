import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import {
    CACHE_FILE_PATH,
    DOMAIN_CACHE_TTL_MS,
    GEO_CACHE_TTL_MS,
    WEB_STORAGE_KEY,
} from "./config";
import { isRecord } from "./record-utils";
import type { GeoCoordinates, LocationCacheStore } from "./types";

let inMemoryCache: LocationCacheStore | null = null;

function createEmptyCache(): LocationCacheStore {
  return {
    domainToIp: {},
    ipToGeo: {},
  };
}

function normalizeCache(raw: unknown): LocationCacheStore {
  const cache = createEmptyCache();
  if (!isRecord(raw)) {
    return cache;
  }

  if (isRecord(raw.domainToIp)) {
    for (const [domain, entry] of Object.entries(raw.domainToIp)) {
      if (!isRecord(entry)) {
        continue;
      }

      const ip = typeof entry.ip === "string" ? entry.ip : "";
      const expiresAt =
        typeof entry.expiresAt === "number" && Number.isFinite(entry.expiresAt)
          ? entry.expiresAt
          : 0;

      if (ip && expiresAt > 0) {
        cache.domainToIp[domain] = { ip, expiresAt };
      }
    }
  }

  if (isRecord(raw.ipToGeo)) {
    for (const [ip, entry] of Object.entries(raw.ipToGeo)) {
      if (!isRecord(entry)) {
        continue;
      }

      const lat = typeof entry.lat === "number" ? entry.lat : Number(entry.lat);
      const lon = typeof entry.lon === "number" ? entry.lon : Number(entry.lon);
      const expiresAt =
        typeof entry.expiresAt === "number" && Number.isFinite(entry.expiresAt)
          ? entry.expiresAt
          : 0;

      if (Number.isFinite(lat) && Number.isFinite(lon) && expiresAt > 0) {
        cache.ipToGeo[ip] = { lat, lon, expiresAt };
      }
    }
  }

  return cache;
}

// helper to access web storage APIs in a safe way, returning null if not available
function getWebStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
} | null {
  const localStorageLike =
    (
      globalThis as {
        localStorage?: {
          getItem: (key: string) => string | null;
          setItem: (key: string, value: string) => void;
        };
      }
    ).localStorage ?? null;

  return localStorageLike;
}

// load the location cache from persistent storage (file system on native, web storage on web)
export async function loadLocationCache(): Promise<LocationCacheStore> {
  if (inMemoryCache) {
    return inMemoryCache;
  }

  try {
    if (Platform.OS === "web") {
      const storage = getWebStorage();
      if (!storage) {
        inMemoryCache = createEmptyCache();
        return inMemoryCache;
      }

      const raw = storage.getItem(WEB_STORAGE_KEY);
      inMemoryCache = normalizeCache(raw ? JSON.parse(raw) : null);
      return inMemoryCache;
    }

    if (!CACHE_FILE_PATH) {
      inMemoryCache = createEmptyCache();
      return inMemoryCache;
    }

    const info = await FileSystem.getInfoAsync(CACHE_FILE_PATH);
    if (!info.exists) {
      inMemoryCache = createEmptyCache();
      return inMemoryCache;
    }

    const raw = await FileSystem.readAsStringAsync(CACHE_FILE_PATH);
    inMemoryCache = normalizeCache(raw ? JSON.parse(raw) : null);
    return inMemoryCache;
  } catch {
    inMemoryCache = createEmptyCache();
    return inMemoryCache;
  }
}

// persist the location cache to persistent storage (file system on native, web storage on web)
export async function persistLocationCache(
  cache: LocationCacheStore,
): Promise<void> {
  inMemoryCache = cache;

  try {
    const serialized = JSON.stringify(cache);

    if (Platform.OS === "web") {
      const storage = getWebStorage();
      storage?.setItem(WEB_STORAGE_KEY, serialized);
      return;
    }

    if (!CACHE_FILE_PATH) {
      return;
    }

    await FileSystem.writeAsStringAsync(CACHE_FILE_PATH, serialized);
  } catch {
    // best-effort cache persistence
  }
}

export function readDomainCache(
  cache: LocationCacheStore,
  domain: string,
): string | null {
  const entry = cache.domainToIp[domain];
  if (!entry || entry.expiresAt <= Date.now()) {
    return null;
  }

  return entry.ip;
}

// write a resolved domain->IP mapping to the cache with an expiration time
export function writeDomainCache(
  cache: LocationCacheStore,
  domain: string,
  ip: string,
): void {
  cache.domainToIp[domain] = {
    ip,
    expiresAt: Date.now() + DOMAIN_CACHE_TTL_MS,
  };
}

export function readGeoCache(
  cache: LocationCacheStore,
  ip: string,
): GeoCoordinates | null {
  const entry = cache.ipToGeo[ip];
  if (!entry || entry.expiresAt <= Date.now()) {
    return null;
  }

  return {
    lat: entry.lat,
    lon: entry.lon,
  };
}

export function writeGeoCache(
  cache: LocationCacheStore,
  ip: string,
  coords: GeoCoordinates,
): void {
  cache.ipToGeo[ip] = {
    ...coords,
    expiresAt: Date.now() + GEO_CACHE_TTL_MS,
  };
}

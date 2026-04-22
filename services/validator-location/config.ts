import * as FileSystem from "expo-file-system";

export const DOMAIN_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const GEO_CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

export const DNS_CONCURRENCY = 4;
export const GEO_CONCURRENCY = 4;
export const REQUEST_SPACING_MS = 80;

export const WEB_STORAGE_KEY = "omnisphere:validator-location-cache:v1";

const cacheRoot = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "";

export const CACHE_FILE_PATH = cacheRoot
  ? `${cacheRoot}validator-location-cache-v1.json`
  : "";

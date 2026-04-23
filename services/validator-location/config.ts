import * as FileSystem from "expo-file-system/legacy";

export const DOMAIN_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const GEO_CACHE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

export const DNS_CONCURRENCY = 12;
export const GEO_CONCURRENCY = 10;
export const REQUEST_SPACING_MS = 20;

export const WEB_STORAGE_KEY = "omnisphere:validator-location-cache:v1";

const cacheRoot = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "";

export const CACHE_FILE_PATH = cacheRoot
  ? `${cacheRoot}validator-location-cache-v1.json`
  : "";

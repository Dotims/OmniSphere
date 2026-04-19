export interface GeoCoordinates {
  lat: number;
  lon: number;
}

export type ValidatorCoordinatesMap = Record<string, GeoCoordinates>;

export interface DomainCacheEntry {
  ip: string;
  expiresAt: number;
}

export interface GeoCacheEntry extends GeoCoordinates {
  expiresAt: number;
}

export interface LocationCacheStore {
  domainToIp: Record<string, DomainCacheEntry>;
  ipToGeo: Record<string, GeoCacheEntry>;
}

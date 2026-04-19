import { isIPv4 } from "./host-parser";
import { fetchJsonThrottled } from "./network";
import { isRecord } from "./record-utils";
import type { GeoCoordinates } from "./types";

// resolve a domain name to an IPv4 address using Google's DNS-over-HTTPS API
export async function resolveDomainToIPv4(
  domain: string,
): Promise<string | null> {
  const payload = await fetchJsonThrottled(
    `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
  );

  if (!isRecord(payload) || !Array.isArray(payload.Answer)) {
    return null;
  }

  for (const answer of payload.Answer) {
    if (!isRecord(answer)) {
      continue;
    }

    const type =
      typeof answer.type === "number" ? answer.type : Number(answer.type);
    const data = typeof answer.data === "string" ? answer.data : "";

    if (type === 1 && isIPv4(data)) {
      return data;
    }
  }

  return null;
}

// resolve an IPv4 address to geolocation coordinates using API
export async function resolveGeoForIp(
  ip: string,
): Promise<GeoCoordinates | null> {
  const payload = await fetchJsonThrottled(
    `https://ipwho.is/${encodeURIComponent(ip)}`,
  );

  if (!isRecord(payload) || payload.success === false) {
    return null;
  }

  const lat =
    typeof payload.latitude === "number"
      ? payload.latitude
      : Number(payload.latitude);
  const lon =
    typeof payload.longitude === "number"
      ? payload.longitude
      : Number(payload.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return { lat, lon };
}

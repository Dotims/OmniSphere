import type { ValidatorSummary } from "../validators";
import {
    loadLocationCache,
    persistLocationCache,
    readDomainCache,
    readGeoCache,
    writeDomainCache,
    writeGeoCache,
} from "./cache-store";
import { DNS_CONCURRENCY, GEO_CONCURRENCY } from "./config";
import { isIPv4, pickBestHost } from "./host-parser";
import { runWithConcurrency } from "./network";
import { resolveDomainToIPv4, resolveGeoForIp } from "./providers";
import type { GeoCoordinates, ValidatorCoordinatesMap } from "./types";

export async function resolveValidatorCoordinates(
  validators: ValidatorSummary[],
): Promise<ValidatorCoordinatesMap> {
  if (validators.length === 0) {
    return {};
  }

  const cache = await loadLocationCache();
  let cacheUpdated = false;

  const validatorHost = new Map<string, string>();
  const uniqueHosts = new Set<string>();

  for (const validator of validators) {
    const host = pickBestHost(validator);
    if (!host) {
      continue;
    }

    validatorHost.set(validator.iotaAddress, host);
    uniqueHosts.add(host);
  }

  const hostToIp = new Map<string, string>();
  const domainsToResolve: string[] = [];

  for (const host of uniqueHosts) {
    if (isIPv4(host)) {
      hostToIp.set(host, host);
      continue;
    }

    const cachedIp = readDomainCache(cache, host);
    if (cachedIp) {
      hostToIp.set(host, cachedIp);
      continue;
    }

    domainsToResolve.push(host);
  }

  await runWithConcurrency(
    domainsToResolve,
    DNS_CONCURRENCY,
    async (domain) => {
      const ip = await resolveDomainToIPv4(domain);
      if (!ip) {
        return;
      }

      hostToIp.set(domain, ip);
      writeDomainCache(cache, domain, ip);
      cacheUpdated = true;
    },
  );

  const uniqueIps = new Set<string>();
  for (const host of uniqueHosts) {
    const ip = isIPv4(host) ? host : hostToIp.get(host);
    if (ip) {
      uniqueIps.add(ip);
    }
  }

  const ipToGeo = new Map<string, GeoCoordinates>();
  const ipsToResolve: string[] = [];

  for (const ip of uniqueIps) {
    const cachedGeo = readGeoCache(cache, ip);
    if (cachedGeo) {
      ipToGeo.set(ip, cachedGeo);
      continue;
    }

    ipsToResolve.push(ip);
  }

  await runWithConcurrency(ipsToResolve, GEO_CONCURRENCY, async (ip) => {
    const coords = await resolveGeoForIp(ip);
    if (!coords) {
      return;
    }

    ipToGeo.set(ip, coords);
    writeGeoCache(cache, ip, coords);
    cacheUpdated = true;
  });

  if (cacheUpdated) {
    await persistLocationCache(cache);
  }

  const coordinatesById: ValidatorCoordinatesMap = {};

  for (const validator of validators) {
    const host = validatorHost.get(validator.iotaAddress);
    if (!host) {
      continue;
    }

    const ip = isIPv4(host) ? host : hostToIp.get(host);
    if (!ip) {
      continue;
    }

    const coords = ipToGeo.get(ip);
    if (!coords) {
      continue;
    }

    coordinatesById[validator.iotaAddress] = coords;
  }

  return coordinatesById;
}

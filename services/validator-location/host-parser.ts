import type { ValidatorSummary } from "../validators";

type ValidatorAddressFields = Pick<
  ValidatorSummary,
  "netAddress" | "p2pAddress" | "primaryAddress"
>;

export function isIPv4(value: string): boolean {
  const match = value.match(/^(\d{1,3})(?:\.(\d{1,3})){3}$/);
  if (!match) {
    return false;
  }

  const parts = value.split(".");
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    const num = Number(part);
    return Number.isInteger(num) && num >= 0 && num <= 255;
  });
}

function extractIpFromText(value: string): string | null {
  const candidates = value.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
  if (!candidates) {
    return null;
  }

  for (const candidate of candidates) {
    if (isIPv4(candidate)) {
      return candidate;
    }
  }

  return null;
}

function sanitizeHost(value: string): string | null {
  let host = value.trim();
  if (!host) {
    return null;
  }

  host = host.replace(/^[a-z]+:\/\//i, "");
  host = host.split("/")[0] ?? host;
  host = host.split("?")[0] ?? host;
  host = host.split("#")[0] ?? host;

  if (host.startsWith("[") && host.includes("]")) {
    host = host.slice(1, host.indexOf("]"));
  }

  const lastColon = host.lastIndexOf(":");
  if (lastColon > 0 && host.indexOf(":") === lastColon) {
    const port = host.slice(lastColon + 1);
    if (/^\d+$/.test(port)) {
      host = host.slice(0, lastColon);
    }
  }

  host = host.trim().toLowerCase();
  if (!host) {
    return null;
  }

  // Ignore IPv6 literals for the IPv4-only DNS A + GeoIP pipeline.
  if (host.includes(":") && !isIPv4(host)) {
    return null;
  }

  return host;
}

export function extractHostFromAddress(
  address: string | null | undefined,
): string | null {
  if (!address) {
    return null;
  }

  const trimmed = address.trim();
  if (!trimmed) {
    return null;
  }

  const inlineIp = extractIpFromText(trimmed);
  if (inlineIp) {
    return inlineIp;
  }

  if (trimmed.startsWith("/")) {
    const parts = trimmed.split("/").filter(Boolean);

    for (let i = 0; i < parts.length - 1; i++) {
      const proto = parts[i].toLowerCase();
      const value = parts[i + 1];

      if (proto === "dns" || proto === "dns4" || proto === "dns6") {
        const host = sanitizeHost(value);
        if (host) {
          return host;
        }
      }

      if (proto === "ip4") {
        const ip = sanitizeHost(value);
        if (ip && isIPv4(ip)) {
          return ip;
        }
      }
    }
  }

  return sanitizeHost(trimmed);
}

export function pickBestHost(validator: ValidatorAddressFields): string | null {
  const candidates = [
    validator.netAddress,
    validator.p2pAddress,
    validator.primaryAddress,
  ];

  for (const candidate of candidates) {
    const host = extractHostFromAddress(candidate);
    if (host) {
      return host;
    }
  }

  return null;
}

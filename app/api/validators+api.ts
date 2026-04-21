/* secure RPC Proxy - /api/validators
   Proxies validator data from the IOTA mainnet RPC.
   Unwraps the V2 envelope so clients get clean data.
   Endpoint: GET /api/validators

   RPC_URL is read from app.json `extra.iotaRpcUrl` (via expo-constants),
   which can be overridden by setting EXPO_PUBLIC_IOTA_RPC_URL in a local
   .env.local file (excluded from version control by .gitignore).
*/

import Constants from 'expo-constants';

// Resolve RPC URL: env var → app.json extra → hardcoded fallback (never reaches prod)
const IOTA_RPC_URL: string =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.iotaRpcUrl ??
  'https://api.mainnet.iota.cafe';

// RPC helpers
interface RpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: unknown[];
}

async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const body: RpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  };

  // Enforce HTTPS — throw immediately if the resolved URL isn't secure
  if (!IOTA_RPC_URL.startsWith('https://') && !IOTA_RPC_URL.startsWith('wss://')) {
    throw new Error(
      `[Security] RPC URL must use HTTPS/WSS. Got: ${IOTA_RPC_URL.slice(0, 30)}`
    );
  }

  const response = await fetch(IOTA_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // X-App header identifies requests from OmniSphere — useful for server-side rate limiting
      'X-App': 'OmniSphere/1.0',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(`RPC error: ${json.error.message ?? JSON.stringify(json.error)}`);
  }

  return json.result as T;
}

// Unwrap the V2 envelope that iotax_getLatestIotaSystemStateV2 returns.
// The RPC returns { V2: { epoch, activeValidators, ... } }; we flatten it
// so clients always see { epoch, activeValidators, ... } directly.
function unwrapSystemState(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw && typeof raw === 'object' && 'V2' in raw && raw.V2) {
    return raw.V2 as Record<string, unknown>;
  }
  // Fallback: future API versions may drop the wrapper
  return raw;
}

// Route handler
export async function GET() {
  try {
    // Fetch system state (validator list) and APYs in parallel
    const [rawSystemState, apys] = await Promise.all([
      rpcCall<Record<string, unknown>>('iotax_getLatestIotaSystemStateV2'),
      rpcCall<Record<string, unknown>>('iotax_getValidatorsApy'),
    ]);

    const systemState = unwrapSystemState(rawSystemState);

    return Response.json({ systemState, apys });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error fetching validators';

    console.error('[API /validators] Error:', message);

    return Response.json({ error: { message, status: 502 } }, { status: 502 });
  }
}

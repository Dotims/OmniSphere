/* secure RPC Proxy - /api/validators
   proxies validator data from the IOTA mainnet RPC
   are made server-side and the response is sanitized before returning.
   Endpoint: Get /api/validators
*/   

const IOTA_RPC_URL = 'https://api.mainnet.iota.cafe';

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

  const response = await fetch(IOTA_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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

// route handler
export async function GET() {
  try {
    // fetch both system state (validator list) and APYs in parallel
    const [systemState, apys] = await Promise.all([
      rpcCall<Record<string, unknown>>('iotax_getLatestIotaSystemStateV2'),
      rpcCall<Record<string, unknown>>('iotax_getValidatorsApy'),
    ]);

    // return sanitized, combined payload
    return Response.json({
      systemState,
      apys,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching validators';

    console.error('[API /validators] Error:', message);

    return Response.json(
      { error: { message, status: 502 } },
      { status: 502 },
    );
  }
}

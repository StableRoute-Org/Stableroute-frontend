/**
 * A typed registry of API endpoints consumed by the frontend. This is the
 * source of truth for the /docs page.
 */

export interface EndpointParam {
  name: string;
  type: string;
  description: string;
}

export interface Endpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  params?: EndpointParam[];
}

export const endpoints: readonly Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/pairs",
    description: "Lists all registered currency pairs.",
  },
  {
    method: "POST",
    path: "/api/v1/pairs",
    description: "Registers a new currency pair.",
    params: [
      { name: "source_asset", type: "string", description: "Source asset code (e.g., 'USDC')." },
      { name: "dest_asset", type: "string", description: "Destination asset code (e.g., 'EURC')." },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/quote",
    description: "Requests a path payment quote.",
    params: [
      { name: "source_asset", type: "string", description: "Source asset code." },
      { name: "dest_asset", type: "string", description: "Destination asset code." },
      { name: "amount", type: "string", description: "Amount in stroops (integer)." },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/stats",
    description: "Retrieves system performance and routing metrics.",
  },
  {
    method: "GET",
    path: "/api/v1/admin/status",
    description: "Retrieves the current router status (paused or active).",
  },
  {
    method: "POST",
    path: "/api/v1/admin/pause",
    description: "Pauses all routing activity.",
  },
  {
    method: "POST",
    path: "/api/v1/admin/unpause",
    description: "Resumes routing activity.",
  },
  {
    method: "GET",
    path: "/api/v1/api-keys",
    description: "Lists all active API keys.",
  },
  {
    method: "POST",
    path: "/api/v1/api-keys",
    description: "Creates a new API key.",
    params: [
      { name: "label", type: "string", description: "A human-readable label for the key." },
    ],
  },
  {
    method: "DELETE",
    path: "/api/v1/api-keys/:prefix",
    description: "Revokes an API key by its prefix.",
  },
  {
    method: "GET",
    path: "/api/v1/events",
    description: "Retrieves a list of system audit log events.",
  },
  {
    method: "GET",
    path: "/api/v1/webhooks",
    description: "Lists all registered webhook subscriptions.",
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    description: "Creates a new webhook subscription.",
    params: [
      { name: "url", type: "string", description: "The URL to send event payloads to." },
    ],
  },
  {
    method: "DELETE",
    path: "/api/v1/webhooks/:id",
    description: "Deletes a webhook subscription by its ID.",
  },
];
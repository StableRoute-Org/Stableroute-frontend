export interface EndpointParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  params?: EndpointParameter[];
}

export const endpointRegistry: readonly Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/pairs',
    description: 'Lists registered currency pairs on the router.',
  },
  {
    method: 'POST',
    path: '/api/v1/pairs',
    description: 'Registers a new currency pair.',
    params: [
      { name: 'source_asset', type: 'string', description: 'The source asset code.', required: true },
      { name: 'destination_asset', type: 'string', description: 'The destination asset code.', required: true },
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/quote',
    description: 'Requests path routing quotes for (source, destination, amount) triples.',
    params: [
      { name: 'source_asset', type: 'string', description: 'The source asset for the quote.', required: true },
      { name: 'destination_asset', type: 'string', description: 'The destination asset for the quote.', required: true },
      { name: 'amount', type: 'string', description: 'The amount to be routed.', required: true },
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    description: 'Retrieves system performance and routing metrics.',
  },
  {
    method: 'GET',
    path: '/api/v1/admin/status',
    description: 'Retrieves router paused status.',
  },
  {
    method: 'POST',
    path: '/api/v1/admin/pause',
    description: 'Pauses routing activity.',
  },
  {
    method: 'POST',
    path: '/api/v1/admin/unpause',
    description: 'Unpauses routing activity.',
  },
  {
    method: 'GET',
    path: '/api/v1/api-keys',
    description: 'Lists API keys for the authenticated user.',
  },
  {
    method: 'POST',
    path: '/api/v1/api-keys',
    description: 'Creates a new API key.',
    params: [
      { name: 'label', type: 'string', description: 'A human-readable label for the key.', required: true },
    ],
  },
  {
    method: 'DELETE',
    path: '/api/v1/api-keys/:prefix',
    description: 'Revokes an API key by its prefix.',
  },
  {
    method: 'GET',
    path: '/api/v1/events',
    description: 'Retrieves system event audit logs.',
  },
  {
    method: 'GET',
    path: '/api/v1/webhooks',
    description: 'Lists webhook subscriptions.',
  },
  {
    method: 'POST',
    path: '/api/v1/webhooks',
    description: 'Creates a new webhook subscription.',
    params: [
      { name: 'url', type: 'string', description: 'The URL to send webhook events to.', required: true },
    ],
  },
  {
    method: 'DELETE',
    path: '/api/v1/webhooks/:id',
    description: 'Revokes a webhook subscription by its ID.',
  },
];
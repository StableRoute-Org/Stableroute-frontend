# API connection troubleshooting

When the frontend cannot reach the StableRoute API, the failure usually comes from one of four places: the configured backend origin, browser access restrictions, a slow or paused backend, or invalid credentials.

## Quick checks

1. Confirm the backend is running and reachable from the machine where the frontend is served.
2. Verify that NEXT_PUBLIC_STABLEROUTE_API_BASE points at the backend origin, not the frontend origin.
3. If the browser reports a blocked request, check the backend CORS configuration for the exact frontend host.
4. If the API responds with 401 or 403, confirm the API key is active and authorized for the route being used.

## Common symptoms and remedies

| Symptom | Where it originates | What to try |
| --- | --- | --- |
| Wrong or missing API base URL | src/lib/config.ts | Update NEXT_PUBLIC_STABLEROUTE_API_BASE to the backend origin such as https://api.example.com and restart the dev server. |
| Browser blocks the request with CORS errors | src/lib/apiClient.ts | Verify the backend allows the current frontend origin and that the configured base URL matches the backend host. |
| The request times out or feels slow | src/lib/apiClient.ts | Check the backend health, network path, and router status. If the backend is under load, retry with a higher timeout. |
| The API returns 401 or 403 | src/lib/apiClient.ts | Confirm the API key is valid, active, and permitted for the route or operation being called. |

## Useful commands

```bash
# Check the configured backend base
printf '%s\n' "$NEXT_PUBLIC_STABLEROUTE_API_BASE"

# Start the frontend after changing environment variables
npm run dev
```

For the full local setup and environment variable examples, see the main [README.md](../README.md) guide.

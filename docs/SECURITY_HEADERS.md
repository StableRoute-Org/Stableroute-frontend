# Security Headers

StableRoute applies baseline hardening headers from `next.config.ts` to every route.

| Header | Value | Purpose |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-sniffing API and asset responses. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Keeps full URLs local while sending only origins cross-site. |
| `X-Frame-Options` | `DENY` | Blocks the dashboard from being embedded in frames. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser capabilities. |

# Security Policy

## Reporting a vulnerability

If you discover a security issue in this repository, please report it responsibly and confidentially.

Preferred reporting methods:

- Open a GitHub issue in this repository with the title prefixed by `SECURITY:` and include enough detail to reproduce the problem.
- If you prefer not to use a public issue, email the maintainers at `security@stableroute.org`.

Please include:

- a clear description of the issue
- affected versions or branches
- reproduction steps or a proof-of-concept
- impact and risk assessment
- any relevant screenshots, logs, or request/response details

## Coordinated disclosure

We appreciate coordinated disclosure. Please:

- avoid public disclosure until a fix is available
- give maintainers time to investigate and remediate the issue
- work with the project team to confirm when the vulnerability has been resolved

## Response

We aim to acknowledge valid reports within 3 business days and to coordinate a fix or mitigation as quickly as possible.

## Scope

This policy covers security issues in the `stableroute-frontend` repository, including:

- frontend application bugs that expose sensitive data
- API integration or configuration issues that weaken security controls
- authentication, authorization, and session handling problems
- UI-level issues that may allow data leakage or unauthorized access

Issues outside this repository should be reported to the appropriate upstream project or service provider.

## What not to do

- do not exploit or publicize vulnerabilities before disclosure
- do not use this repository for unsolicited penetration testing without permission
- do not include personal data or sensitive production credentials in your report

## HTTP security headers

Security-relevant response headers are set for every route in `next.config.ts`.

### Cross-origin isolation

The following headers collectively enforce cross-origin isolation, preventing the
dashboard from being embedded or window-opened by untrusted origins:

| Header                                | Value                    | Purpose                                                                                                                                                                    |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cross-Origin-Opener-Policy`          | `same-origin`            | Prevents cross-origin pages from retaining a reference to the dashboard's browsing-context group, closing opener-based side-channel attacks.                               |
| `Cross-Origin-Resource-Policy`        | `same-origin`            | Prevents other origins from loading dashboard resources via no-cors fetch/XHR requests.                                                                                    |
| `Content-Security-Policy` (directive) | `frame-ancestors 'none'` | Blocks the page from being embedded in any `<iframe>`, `<frame>`, `<embed>`, or `<object>`, defending against clickjacking even in browsers that ignore `X-Frame-Options`. |

`X-Frame-Options: DENY` is also set as a defence-in-depth fallback for older
browsers that do not support the CSP `frame-ancestors` directive.

### Other hardening headers

| Header                   | Value                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| `X-Content-Type-Options` | `nosniff`                                                         |
| `Referrer-Policy`        | `strict-origin-when-cross-origin`                                 |
| `Permissions-Policy`     | camera, microphone, geolocation, and interest-cohort all disabled |

All header assertions are covered by `src/__tests__/nextConfigHeaders.test.ts`.

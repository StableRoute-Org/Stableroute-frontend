# Quote Input Validation

The quote form validates source and destination asset codes before building the
`GET /api/v1/quote` URL.

Asset codes are trimmed and must match the Stellar asset-code shape
`^[A-Za-z0-9]{1,12}$`. Invalid codes, whitespace-only values, identical source
and destination codes, and invalid amounts stop submission before any network
request is issued.

Validated values are still URL-encoded when the request URL is constructed.

Quote submissions are also throttled to prevent duplicate requests from rapid
re-submits, held Enter presses, or double clicks. While a quote request is in
flight, additional submissions are ignored, and a later submission after the
cooldown replaces any earlier in-flight request by aborting it first. The submit
button exposes busy state through the existing disabled styling and `aria-busy`
attribute so the UI reflects the throttled request lifecycle.

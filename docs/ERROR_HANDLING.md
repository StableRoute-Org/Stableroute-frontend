# Error Handling

The app error boundary renders a generic user-facing message for unexpected failures. It keeps the retry action available but does not render raw backend error messages, request IDs, or other assigned API error fields.

In non-production environments the boundary logs a minimal summary with the error message and optional Next.js digest. Production builds skip boundary logging so raw error objects are not written to the browser console.

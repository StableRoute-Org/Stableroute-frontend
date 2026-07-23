import WebhooksClient from "./Client";

/** Server wrapper for `WebhooksClient`. */
export const metadata = {
  title: "Webhooks",
  description: "Register and manage webhook endpoints to receive router events.",
};

export default function WebhooksPage() {
  return <WebhooksClient />;
}

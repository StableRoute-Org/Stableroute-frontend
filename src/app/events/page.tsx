import EventsClient from "./Client";

/** Server wrapper for `EventsClient`. */
export const metadata = {
  title: "Events",
  description: "Chronological event log emitted by the StableRoute backend.",
};

export default function EventsPage() {
  return <EventsClient />;
}

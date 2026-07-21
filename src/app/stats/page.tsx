import StatsClient from './Client';

/** Server wrapper for `StatsClient`. */
export const metadata = {
  title: 'Stats',
  description: 'View router statistics and health for StableRoute.',
};

export default function StatsPage() {
  return <StatsClient />;
}

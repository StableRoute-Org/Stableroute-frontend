import StatusClient from './Client';

export const metadata = {
  title: 'Status',
  description: 'API health and latency dashboard for StableRoute.',
};

export default function StatusPage() {
  return <StatusClient />;
}

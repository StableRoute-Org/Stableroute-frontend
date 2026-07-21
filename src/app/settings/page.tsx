import SettingsClient from './Client';

/** Server wrapper for the Settings client page. */
export const metadata = {
  title: 'Settings | StableRoute',
  description:
    'Configure appearance and API base for the StableRoute dashboard.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}

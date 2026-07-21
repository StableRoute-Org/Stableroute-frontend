import ApiKeysClient from './Client';

/** Server wrapper for `ApiKeysClient`. */
export const metadata = {
  title: 'API keys | StableRoute',
  description:
    'Create, view and revoke API keys for programmatic access to StableRoute.',
};

export default function ApiKeysPage() {
  return <ApiKeysClient />;
}

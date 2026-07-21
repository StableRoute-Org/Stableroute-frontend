import AdminClient from './Client';

/** Server wrapper for `AdminClient`. */
export const metadata = {
  title: 'Admin | StableRoute',
  description:
    'Operator controls: pause and unpause the StableRoute router and view status.',
};

export default function AdminPage() {
  return <AdminClient />;
}

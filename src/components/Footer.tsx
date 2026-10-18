import Link from 'next/link';
import { CONTRACT_EXPLORER_URL, REPOS, getApiLinks } from '@/lib/site';

const linkClass =
  'rounded text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)] dark:text-neutral-400 dark:hover:text-white';

/**
 * Site-wide footer: product, developer and project links.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const api = getApiLinks();

  return (
    <footer className="mt-20 border-t border-neutral-200 bg-white/60 dark:border-neutral-800 dark:bg-neutral-950/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-semibold">StableRoute</p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Stablecoin liquidity routing on Stellar.
          </p>
        </div>
        <nav aria-label="Product links">
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/quote" className={linkClass}>Get a quote</Link></li>
            <li><Link href="/pairs" className={linkClass}>Routing pairs</Link></li>
            <li><Link href="/stats" className={linkClass}>Stats</Link></li>
            <li><Link href="/status" className={linkClass}>API status</Link></li>
          </ul>
        </nav>
        <nav aria-label="Developer links">
          <p className="text-sm font-semibold">Developers</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/docs" className={linkClass}>Documentation</Link></li>
            <li><a href={api.docs} className={linkClass} target="_blank" rel="noopener noreferrer">API reference</a></li>
            <li><a href={CONTRACT_EXPLORER_URL} className={linkClass} target="_blank" rel="noopener noreferrer">Contract on stellar.expert</a></li>
          </ul>
        </nav>
        <nav aria-label="Footer navigation">
          <p className="text-sm font-semibold">Project</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about" className={linkClass}>About</Link></li>
            <li><a href={REPOS.frontend} className={linkClass} target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li>
              <a
                href="https://discord.gg/37aCpusvx"
                rel="noopener noreferrer"
                target="_blank"
                aria-label="StableRoute Discord (opens externally)"
                className={linkClass}
              >
                Discord
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500 dark:border-neutral-800">
        &copy; {year} StableRoute. Open source under the MIT license.
      </div>
    </footer>
  );
}

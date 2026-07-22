import { render } from '@testing-library/react';
import RootLayout from './layout';

jest.mock('next/navigation');

import { metadata as homeMetadata } from './page';
import { metadata as aboutMetadata } from './about/page';
import { metadata as docsMetadata } from './docs/page';
import { metadata as apiKeysMetadata } from './api-keys/page';
import { metadata as adminMetadata } from './admin/page';
import { metadata as eventsMetadata } from './events/page';
import { metadata as pairsMetadata } from './pairs/page';
import { metadata as settingsMetadata } from './settings/page';
import { metadata as statsMetadata } from './stats/page';
import { metadata as webhooksMetadata } from './webhooks/page';
import { metadata as notFoundMetadata } from './not-found';

describe('Metadata and Document Semantics', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
  });

  it('sets lang="en" and dir="ltr" on the html element', () => {
    const { container } = render(
      <RootLayout>
        <main id="main-content">Child page</main>
      </RootLayout>
    );
    const htmlElement = container.querySelector('html');
    expect(htmlElement).toHaveAttribute('lang', 'en');
    expect(htmlElement).toHaveAttribute('dir', 'ltr');
  });

  it('exports a description for the home page', () => {
    // The home page uses the default title from the layout.
    expect(homeMetadata.title).toBeUndefined();
    expect(homeMetadata.description).toContain(
      'StableRoute dashboard for managing liquidity'
    );
  });

  it('exports a title and description for the about page', () => {
    expect(aboutMetadata.title).toBe('About');
    expect(aboutMetadata.description).toContain(
      'About StableRoute: a liquidity router'
    );
  });

  it('exports a title and description for the docs page', () => {
    expect(docsMetadata.title).toBe('Docs');
    expect(docsMetadata.description).toContain(
      'Short reference for the StableRoute'
    );
  });

  it('exports a title and description for the api-keys page', () => {
    expect(apiKeysMetadata.title).toBe('API keys');
    expect(apiKeysMetadata.description).toContain(
      'Create, view and revoke API keys'
    );
  });

  it('exports a title and description for the admin page', () => {
    expect(adminMetadata.title).toBe('Admin');
    expect(adminMetadata.description).toContain('Operator controls');
  });

  it('exports a title and description for the events page', () => {
    expect(eventsMetadata.title).toBe('Events');
    expect(eventsMetadata.description).toContain('Chronological event log');
  });

  it('exports a title and description for the pairs page', () => {
    expect(pairsMetadata.title).toBe('Pairs');
    expect(pairsMetadata.description).toContain('Manage registered routing');
  });

  it('exports a title and description for the settings page', () => {
    expect(settingsMetadata.title).toBe('Settings');
    expect(settingsMetadata.description).toContain('Configure appearance');
  });

  it('exports a title and description for the stats page', () => {
    expect(statsMetadata.title).toBe('Stats');
    expect(statsMetadata.description).toContain('View router statistics');
  });

  it('exports a title and description for the webhooks page', () => {
    expect(webhooksMetadata.title).toBe('Webhooks');
    expect(webhooksMetadata.description).toContain('Register and manage');
  });

  it('exports a title and description for the not-found page', () => {
    expect(notFoundMetadata.title).toBe('Page Not Found');
    expect(notFoundMetadata.description).toBe(
      'The requested page could not be found.'
    );
  });
});

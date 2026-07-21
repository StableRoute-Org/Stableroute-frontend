import { metadata as aboutMetadata } from './about/page';
import { metadata as docsMetadata } from './docs/page';
import { metadata as apiKeysMetadata } from './api-keys/page';
import { metadata as notFoundMetadata } from './not-found';

describe('Metadata and Document Semantics', () => {

  it('exports a title and description for the about page', () => {
    expect(aboutMetadata.title).toBe('About | StableRoute');
    expect(aboutMetadata.description).toContain(
      'About StableRoute: a liquidity router'
    );
  });

  it('exports a title and description for the docs page', () => {
    expect(docsMetadata.title).toBe('Docs | StableRoute');
    expect(docsMetadata.description).toContain(
      'Short reference for the StableRoute'
    );
  });

  it('exports a title and description for the api-keys page', () => {
    expect(apiKeysMetadata.title).toBe('API keys | StableRoute');
    expect(apiKeysMetadata.description).toContain(
      'Create, view and revoke API keys'
    );
  });

  it('exports a title and description for the not-found page', () => {
    expect(notFoundMetadata.title).toBe('Page Not Found | StableRoute');
    expect(notFoundMetadata.description).toBe(
      'The requested page could not be found.'
    );
  });
});
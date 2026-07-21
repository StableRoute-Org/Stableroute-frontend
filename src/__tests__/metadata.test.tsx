import fs from 'fs';
import path from 'path';

import { metadata as layoutMeta } from '@/app/layout';
import { metadata as aboutMeta } from '@/app/about/page';
import { metadata as docsMeta } from '@/app/docs/page';
import { metadata as pairsMeta } from '@/app/pairs/page';
import { metadata as quoteMeta } from '@/app/quote/page';
import { metadata as settingsMeta } from '@/app/settings/page';

describe('Metadata exports', () => {
  it('layout defines a template title', () => {
    expect(layoutMeta).toBeTruthy();
    // @ts-ignore - title may be object or string
    expect(layoutMeta.title.default).toBe('StableRoute');
    // @ts-ignore
    expect(layoutMeta.title.template).toBe('%s — StableRoute');
  });

  it('about and docs include descriptions', () => {
    expect(typeof aboutMeta.title).toBe('string');
    // @ts-ignore
    expect(typeof aboutMeta.description).toBe('string');

    expect(typeof docsMeta.title).toBe('string');
    // @ts-ignore
    expect(typeof docsMeta.description).toBe('string');
  });

  it('client routes expose per-page metadata (title + description)', () => {
    expect(typeof pairsMeta.title).toBe('string');
    // @ts-ignore
    expect(typeof pairsMeta.description).toBe('string');

    expect(typeof quoteMeta.title).toBe('string');
    // @ts-ignore
    expect(typeof quoteMeta.description).toBe('string');

    expect(typeof settingsMeta.title).toBe('string');
    // @ts-ignore
    expect(typeof settingsMeta.description).toBe('string');
  });

  it('layout.tsx contains explicit dir attribute on <html>', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    const src = fs.readFileSync(layoutPath, 'utf8');
    expect(src.includes('dir="ltr"')).toBe(true);
  });
});

import fs from 'fs';
import path from 'path';

describe('Accessibility Conformance Statement & Documentation Tests', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const accessibilityDocPath = path.join(rootDir, 'docs', 'ACCESSIBILITY.md');
  const readmePath = path.join(rootDir, 'README.md');
  const prTemplatePath = fs.existsSync(path.join(rootDir, '.github', 'PULL_REQUEST_TEMPLATE.md'))
    ? path.join(rootDir, '.github', 'PULL_REQUEST_TEMPLATE.md')
    : path.join(rootDir, '.github', 'pull_request_template.md');

  let accessibilityDoc: string;
  let readmeDoc: string;
  let prTemplateDoc: string;

  beforeAll(() => {
    accessibilityDoc = fs.readFileSync(accessibilityDocPath, 'utf8');
    readmeDoc = fs.readFileSync(readmePath, 'utf8');
    prTemplateDoc = fs.readFileSync(prTemplatePath, 'utf8');
  });

  describe('docs/ACCESSIBILITY.md existence and structure', () => {
    it('exists and is non-empty', () => {
      expect(fs.existsSync(accessibilityDocPath)).toBe(true);
      expect(accessibilityDoc.trim().length).toBeGreaterThan(500);
    });

    it('states the target conformance level (WCAG 2.1 Level AA)', () => {
      expect(accessibilityDoc).toMatch(/WCAG 2\.1 Level AA/i);
      expect(accessibilityDoc).toMatch(/Conformance Target/i);
    });

    it('defines the tested assistive technology matrix', () => {
      expect(accessibilityDoc).toMatch(/Assistive Technologies/i);
      expect(accessibilityDoc).toMatch(/NVDA/i);
      expect(accessibilityDoc).toMatch(/JAWS/i);
      expect(accessibilityDoc).toMatch(/VoiceOver/i);
      expect(accessibilityDoc).toMatch(/TalkBack/i);
      expect(accessibilityDoc).toMatch(/Keyboard-only/i);
    });

    it('defines the tested browser and OS matrix', () => {
      expect(accessibilityDoc).toMatch(/Desktop Browsers/i);
      expect(accessibilityDoc).toMatch(/Chrome/i);
      expect(accessibilityDoc).toMatch(/Firefox/i);
      expect(accessibilityDoc).toMatch(/Safari/i);
      expect(accessibilityDoc).toMatch(/Edge/i);
    });

    it('provides clear feedback and contact channels', () => {
      expect(accessibilityDoc).toMatch(/Feedback & Contact Channel/i);
      expect(accessibilityDoc).toMatch(/accessibility@stableroute\.org/i);
      expect(accessibilityDoc).toMatch(/GitHub Issues/i);
      expect(accessibilityDoc).toMatch(/Discord/i);
    });

    it('documents key accessibility architecture and components', () => {
      expect(accessibilityDoc).toMatch(/RouteAnnouncer\.tsx/);
      expect(accessibilityDoc).toMatch(/main-content/);
      expect(accessibilityDoc).toMatch(/prefers-reduced-motion/);
      expect(accessibilityDoc).toMatch(/ReducedMotionA11y\.test\.tsx/);
      expect(accessibilityDoc).toMatch(/loading-regions\.md/);
      expect(accessibilityDoc).toMatch(/aria-live/);
      expect(accessibilityDoc).toMatch(/TextField/);
      expect(accessibilityDoc).toMatch(/IconButton/);
      expect(accessibilityDoc).toMatch(/ConfirmDialog/);
    });

    it('includes a table of known accessibility gaps with tracking issues', () => {
      expect(accessibilityDoc).toMatch(/Register of Known Accessibility Gaps/i);
      expect(accessibilityDoc).toMatch(/Affected Route \/ Component/i);
      expect(accessibilityDoc).toMatch(/Tracking Issue/i);

      // Verify tracking issue references exist in table
      expect(accessibilityDoc).toMatch(/#401/);
      expect(accessibilityDoc).toMatch(/#312/);
      expect(accessibilityDoc).toMatch(/#288/);
      expect(accessibilityDoc).toMatch(/#350/);
      expect(accessibilityDoc).toMatch(/#808/);
    });
  });

  describe('README.md integration', () => {
    it('links to docs/ACCESSIBILITY.md under Accessibility section', () => {
      expect(readmeDoc).toMatch(/## Accessibility/);
      expect(readmeDoc).toMatch(/\[Accessibility Conformance Statement\]\(docs\/ACCESSIBILITY\.md\)/);
      expect(readmeDoc).toMatch(/WCAG 2\.1 Level AA/);
    });
  });

  describe('.github/PULL_REQUEST_TEMPLATE.md integration', () => {
    it('links to docs/ACCESSIBILITY.md in Contributor Checklist', () => {
      expect(prTemplateDoc).toMatch(/## Contributor Checklist/);
      expect(prTemplateDoc).toMatch(/\[Accessibility Conformance Statement\]\(docs\/ACCESSIBILITY\.md\)/);
    });
  });
});

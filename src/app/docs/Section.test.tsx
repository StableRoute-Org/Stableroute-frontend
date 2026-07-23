import { render } from "@testing-library/react";
import { DocsSection } from "./Section";

function getHeadingOutline(container: HTMLElement) {
  const headings = Array.from(
    container.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  );
  return headings.map((h) => parseInt(h.tagName[1], 10));
}

function assertValidOutline(levels: number[]) {
  if (levels.length === 0) return;
  for (let i = 1; i < levels.length; i++) {
    const prev = levels[i - 1];
    const curr = levels[i];
    expect(curr).toBeLessThanOrEqual(prev + 1);
  }
}

describe("DocsSection heading outline", () => {
  it("forms a valid outline without skipping levels (single section page)", () => {
    const { container } = render(
      <main>
        <h1>Title</h1>
        <DocsSection heading="A">
          <p>content</p>
        </DocsSection>
      </main>,
    );
    const outline = getHeadingOutline(container);
    assertValidOutline(outline);
    expect(outline).toEqual([1, 2]);
  });

  it("forms a valid outline without skipping levels (deeply nested section)", () => {
    const { container } = render(
      <main>
        <h1>Title</h1>
        <DocsSection heading="A">
          <DocsSection heading="A.1">
            <DocsSection heading="A.1.1">
              <DocsSection heading="A.1.1.1">
                <DocsSection heading="A.1.1.1.1">
                  <DocsSection heading="A.1.1.1.1.1">
                    <p>content</p>
                  </DocsSection>
                </DocsSection>
              </DocsSection>
            </DocsSection>
          </DocsSection>
        </DocsSection>
      </main>,
    );
    const outline = getHeadingOutline(container);
    assertValidOutline(outline);
    expect(outline).toEqual([1, 2, 3, 4, 5, 6, 6]);
  });
});

'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Structured error for swap interface boundary failures.
 * Uses stable error codes so consumers can pattern-match without
 * relying on fragile message strings.
 */
export type SwapBoundaryError = {
  code: 'SWAP_SUBTREE_CRASH';
  section: string;
  message: string;
  digest?: string;
};

type Props = {
  /** Human-readable section label (e.g. "quote form", "quote history"). */
  section: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
  /** Incrementing key forces a fresh mount of the child subtree on retry. */
  retryKey: number;
};

/**
 * Scoped error boundary for swap interface subtrees.
 *
 * A crash in one section (form, history, slippage) shows a localised
 * retry UI instead of tearing down the entire page. The boundary logs
 * the error for observability and announces the failure to assistive
 * technology via `role="alert"`.
 *
 * ## Design decisions
 *
 * - **Class component**: React error boundaries require
 *   `getDerivedStateFromError` and `componentDidCatch`, which are class-only.
 * - **retryKey**: Incrementing the key on the child wrapper forces React to
 *   unmount/remount the subtree, giving it a clean slate without a full
 *   page reload.
 * - **No error state forwarded to children**: The boundary simply swaps
 *   in a fallback UI; children are always mounted fresh after a retry.
 */
export class SwapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryKey: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log for observability. In production this would feed an error
    // tracking service; for now console.error is the agreed convention
    // (see SegmentError.tsx and app/error.tsx).
    console.error(
      `SwapErrorBoundary [${this.props.section}] caught:`,
      error,
      info.componentStack
    );
  }

  private handleRetry = (): void => {
    this.setState((prev) => ({
      hasError: false,
      retryKey: prev.retryKey + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950"
        >
          <p className="text-sm text-rose-700 dark:text-rose-400">
            The {this.props.section} section hit an error.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Try again
          </button>
        </div>
      );
    }

    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}

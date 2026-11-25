import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level React Error Boundary to prevent blank white screens on unexpected runtime errors.
 * Never modifies or clears saved player progress in localStorage.
 */
export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[AppErrorBoundary] Unhandled UI error:', error, info?.componentStack);
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      this.setState({ hasError: false });
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full bg-[#060914] text-slate-100 flex items-center justify-center p-6 select-none">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900/95 border border-slate-700/80 p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-2xl">
              🐍
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-black text-white">Something went wrong</h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                An unexpected error occurred. Your saved progress, Hearts, and Coins are safe.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

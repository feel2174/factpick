'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[FactPick] client error:', error, info.componentStack);
  }

  handleReset = () => {
    try {
      // 의심되는 LocalStorage 키 정리 + 강제 새로고침
      window.localStorage.removeItem('factpick.profile.v1');
    } catch {
      /* noop */
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-12 max-w-xl rounded-2xl border border-rose-300 bg-rose-50 p-6 text-center">
          <div className="mb-2 text-base font-semibold text-rose-700">
            ⚠ 페이지를 불러오는 중 문제가 발생했어요
          </div>
          <p className="mb-4 text-sm text-slate-700">
            {this.props.fallbackTitle ??
              '저장된 데이터와 새 버전이 충돌할 수 있어요. 입력값을 초기화하고 새로고침하면 해결됩니다.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            초기화 후 다시 시도
          </button>
          {this.state.errorMessage && (
            <details className="mt-3 text-left text-[10px] text-slate-500">
              <summary className="cursor-pointer">기술 상세</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all">{this.state.errorMessage}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

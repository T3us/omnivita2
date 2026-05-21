import { Component, type ErrorInfo, type ReactNode } from 'react';

interface VttRuntimeBoundaryProps {
  label: string;
  children: ReactNode;
}

interface VttRuntimeBoundaryState {
  error: Error | null;
}

export class VttRuntimeBoundary extends Component<VttRuntimeBoundaryProps, VttRuntimeBoundaryState> {
  state: VttRuntimeBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): VttRuntimeBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[OmniVita VTT] ${this.props.label} falhou`, error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fixed inset-0 z-30 grid place-items-center bg-[#07040d] px-6 text-center text-textMain">
        <div className="max-w-lg rounded-xl border border-red-400/30 bg-[#15101d]/95 p-5 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">Tabletop</p>
          <h2 className="mt-2 text-xl font-black">O {this.props.label} falhou ao carregar.</h2>
          <p className="mt-2 text-sm text-textMuted">
            A interface principal continua ativa. Recarregue a pagina depois da atualizacao do Vite; se persistir, veja o console do navegador.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-left text-xs text-red-100">
            {this.state.error.message}
          </pre>
        </div>
      </div>
    );
  }
}

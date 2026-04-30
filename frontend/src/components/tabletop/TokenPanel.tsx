import { Button } from '../Ui';
import { useTabletopStore } from './mapStore';
import type { AvailableTabletopToken } from './types';

export function TokenPanel({ tokens }: { tokens: AvailableTabletopToken[] }) {
  const map = useTabletopStore((state) => state.map);
  const addToken = useTabletopStore((state) => state.addToken);
  const setTool = useTabletopStore((state) => state.setTool);

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Tokens</p>
      <div className="mt-3 grid gap-2">
        {tokens.map((token) => (
          <div key={token.id} className="rounded-lg border border-line bg-white/5 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <strong className="block truncate text-sm text-textMain">{token.name}</strong>
                <span className="text-xs text-textMuted">{token.subtitle || token.kind}</span>
              </div>
              <Button
                type="button"
                disabled={map.mode !== 'session'}
                onClick={() => {
                  addToken(token, Math.floor(map.width / 2), Math.floor(map.height / 2));
                  setTool('token');
                }}
              >
                +
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { TabletopAvailableToken, TabletopToken } from './types';
import { useTabletopStore } from './mapStore';

const DND_AVAILABLE_TOKEN = 'tabletop.available-token';
const DND_MAP_TOKEN = 'tabletop.map-token';

type TabletopDragItem =
  | { type: typeof DND_AVAILABLE_TOKEN; source: TabletopAvailableToken }
  | { type: typeof DND_MAP_TOKEN; tokenId: string };

export function TokenLayer({ interactive }: { interactive: boolean }) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const tokens = useTabletopStore((state) => state.tokens);
  const gridWidth = useTabletopStore((state) => state.gridWidth);
  const gridHeight = useTabletopStore((state) => state.gridHeight);
  const addToken = useTabletopStore((state) => state.addToken);
  const moveToken = useTabletopStore((state) => state.moveToken);

  const [{ isOver }, drop] = useDrop<TabletopDragItem, void, { isOver: boolean }>(() => ({
    accept: [DND_AVAILABLE_TOKEN, DND_MAP_TOKEN],
    canDrop: () => interactive,
    drop: (item, monitor) => {
      if (!interactive) return;
      const offset = monitor.getClientOffset();
      const rect = layerRef.current?.getBoundingClientRect();
      if (!offset || !rect) return;
      const x = Math.floor((offset.x - rect.left) / (rect.width / gridWidth));
      const y = Math.floor((offset.y - rect.top) / (rect.height / gridHeight));
      const safeX = Math.max(0, Math.min(gridWidth - 1, x));
      const safeY = Math.max(0, Math.min(gridHeight - 1, y));
      if (item.type === DND_AVAILABLE_TOKEN) addToken(item.source, safeX, safeY);
      if (item.type === DND_MAP_TOKEN) moveToken(item.tokenId, safeX, safeY);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() })
  }), [addToken, gridHeight, gridWidth, interactive, moveToken]);

  useEffect(() => {
    drop(layerRef);
  }, [drop]);

  return (
    <div
      ref={layerRef}
      className={clsx('absolute inset-0 z-20', interactive ? 'pointer-events-auto' : 'pointer-events-none', isOver && 'ring-2 ring-vita/60')}
    >
      {tokens.map((token) => <MapToken interactive={interactive} key={token.id} token={token} />)}
    </div>
  );
}

export function AvailableTokenCard({ source }: { source: TabletopAvailableToken }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DND_AVAILABLE_TOKEN,
    item: { type: DND_AVAILABLE_TOKEN, source },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [source]);

  useEffect(() => {
    drag(ref);
  }, [drag]);

  return (
    <button
      ref={ref}
      className={clsx(
        'flex min-h-14 items-center gap-3 rounded-lg border border-line bg-white/5 p-2 text-left transition hover:border-vita/35 hover:bg-white/10',
        isDragging && 'opacity-40'
      )}
      type="button"
    >
      <TokenAvatar image={source.image} kind={source.kind} name={source.name} />
      <span className="min-w-0">
        <strong className="block truncate text-sm">{source.name}</strong>
        <span className="block text-xs text-textMuted">{source.kind} | PV {source.hp}/{source.maxHp}</span>
      </span>
    </button>
  );
}

function MapToken({ token, interactive }: { token: TabletopToken; interactive: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const tileSize = useTabletopStore((state) => state.tileSize);
  const removeToken = useTabletopStore((state) => state.removeToken);
  const updateTokenHp = useTabletopStore((state) => state.updateTokenHp);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DND_MAP_TOKEN,
    item: { type: DND_MAP_TOKEN, tokenId: token.id },
    canDrag: () => interactive,
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [interactive, token.id]);

  useEffect(() => {
    drag(ref);
  }, [drag]);

  const hpPercent = Math.max(0, Math.min(100, Math.round((token.hp / Math.max(1, token.maxHp)) * 100)));

  return (
    <div
      ref={ref}
      className={clsx('absolute grid place-items-center transition', interactive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default', isDragging && 'opacity-30')}
      style={{
        left: token.x * tileSize,
        top: token.y * tileSize,
        width: tileSize,
        height: tileSize
      }}
      title={`${token.name} - PV ${token.hp}/${token.maxHp}`}
    >
      <div className="relative h-[92%] w-[92%]">
        <TokenAvatar image={token.image} kind={token.kind} name={token.name} compact />
        <span className="absolute -bottom-2 left-1/2 max-w-[92px] -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-black leading-none text-textMain shadow-soft">
          {token.name}
        </span>
        <span className="absolute -top-1 left-0 h-1 w-full overflow-hidden rounded bg-black/70">
          <span className="block h-full bg-gradient-to-r from-coral to-amber" style={{ width: `${hpPercent}%` }} />
        </span>
        {interactive ? (
          <button
            className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-coral/40 bg-coral/80 text-[10px] font-black text-white"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              removeToken(token.id);
            }}
            title="Remover token"
          >
            x
          </button>
        ) : null}
        {interactive ? (
          <input
            className="absolute -bottom-8 left-1/2 h-6 w-14 -translate-x-1/2 rounded border border-line bg-black/80 px-1 text-center text-[11px] font-bold text-textMain outline-none focus:border-vita"
            type="number"
            min={0}
            max={token.maxHp}
            value={token.hp}
            onChange={(event) => updateTokenHp(token.id, Number(event.target.value))}
            onMouseDown={(event) => event.stopPropagation()}
            title="PV do token"
          />
        ) : null}
      </div>
    </div>
  );
}

function TokenAvatar({ image, kind, name, compact = false }: { image: string; kind: TabletopAvailableToken['kind']; name: string; compact?: boolean }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
  const toneClass = {
    player: 'border-aqua bg-aqua/20 text-aqua',
    npc: 'border-amber bg-amber/20 text-amber',
    enemy: 'border-coral bg-coral/20 text-coral'
  }[kind];

  return (
    <span className={clsx('grid shrink-0 place-items-center overflow-hidden rounded-lg border-2 shadow-[0_8px_18px_rgba(0,0,0,.35)] [image-rendering:pixelated]', compact ? 'h-full w-full' : 'h-10 w-10', toneClass)}>
      {image ? <img className="h-full w-full object-cover [image-rendering:pixelated]" src={image} alt="" /> : <span className="text-xs font-black">{initials}</span>}
    </span>
  );
}

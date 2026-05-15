import { useRef, useState } from 'react';
import { Button } from '../Ui';
import { useTabletopStore } from './mapStore';
import type { AvailableTabletopToken, TabletopTokenKind } from './types';

export function TokenPanel({ tokens }: { tokens: AvailableTabletopToken[] }) {
  const map = useTabletopStore((state) => state.map);
  const addToken = useTabletopStore((state) => state.addToken);
  const setTool = useTabletopStore((state) => state.setTool);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState({
    name: 'Guarda do Instituto',
    kind: 'npc' as TabletopTokenKind,
    image: '',
    size: 1,
    auraColor: '#8b5cf6',
    visibleToPlayers: true,
    hidden: false,
    locked: false,
    visionRadius: 6,
    lightRadius: 0,
    status: ''
  });

  function spawnToken(source: AvailableTabletopToken) {
    addToken(source, Math.floor(map.width / 2), Math.floor(map.height / 2));
    setTool('select');
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setDraft((current) => ({ ...current, image: dataUrl }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function spawnDraft() {
    const name = draft.name.trim() || 'NPC';
    const id = `custom-${Date.now()}`;
    spawnToken({
      id,
      sourceId: id,
      kind: draft.kind,
      name,
      image: draft.image.trim() || undefined,
      subtitle: draft.kind,
      size: draft.size,
      auraColor: draft.auraColor,
      visibleToPlayers: draft.visibleToPlayers,
      hidden: draft.hidden || !draft.visibleToPlayers,
      locked: draft.locked,
      visionEnabled: true,
      visionRadius: draft.visionRadius,
      lightRadius: draft.lightRadius,
      status: draft.status,
      statusMarkers: draft.status ? [draft.status] : []
    });
  }

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Tokens / Spawn</p>
      {map.mode === 'session' ? (
        <div className="mt-3 grid gap-2 rounded-lg border border-line bg-white/5 p-2">
          <strong className="text-sm text-textMain">Criar novo token</strong>
          <input
            className="w-full rounded-lg border border-line bg-black/20 px-2 py-2 text-sm text-textMain"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nome do NPC"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="rounded-lg border border-line bg-black/20 px-2 py-2 text-sm text-textMain"
              value={draft.kind}
              onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as TabletopTokenKind }))}
            >
              <option value="character">player</option>
              <option value="npc">npc</option>
              <option value="enemy">enemy</option>
              <option value="object">object</option>
              <option value="companion">summon</option>
            </select>
            <select
              className="rounded-lg border border-line bg-black/20 px-2 py-2 text-sm text-textMain"
              value={draft.size}
              onChange={(event) => setDraft((current) => ({ ...current, size: Number(event.target.value) }))}
            >
              <option value={1}>1x1</option>
              <option value={2}>2x2</option>
              <option value={3}>3x3</option>
            </select>
          </div>
          <input
            className="w-full rounded-lg border border-line bg-black/20 px-2 py-2 text-sm text-textMain"
            value={draft.image}
            onChange={(event) => setDraft((current) => ({ ...current, image: event.target.value }))}
            placeholder="URL ou dataURL da imagem"
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(event) => void handleUpload(event.target.files?.[0])}
            />
            <Button type="button" onClick={() => fileInputRef.current?.click()}>Upload imagem</Button>
            <input
              className="h-9 w-12 rounded-lg border border-line bg-black/20 p-1"
              type="color"
              value={draft.auraColor}
              onChange={(event) => setDraft((current) => ({ ...current, auraColor: event.target.value }))}
              title="Cor da borda"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-textMuted">
            <label className="flex items-center gap-2 rounded-lg border border-line bg-black/20 px-2 py-2">
              <input type="checkbox" checked={draft.visibleToPlayers} onChange={(event) => setDraft((current) => ({ ...current, visibleToPlayers: event.target.checked, hidden: !event.target.checked }))} />
              Visivel
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-line bg-black/20 px-2 py-2">
              <input type="checkbox" checked={draft.locked} onChange={(event) => setDraft((current) => ({ ...current, locked: event.target.checked }))} />
              Travado
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-textMuted">
              Visao
              <input className="mt-1 w-full rounded-lg border border-line bg-black/20 px-2 py-2 text-textMain" type="number" min={0} max={40} value={draft.visionRadius} onChange={(event) => setDraft((current) => ({ ...current, visionRadius: Number(event.target.value) }))} />
            </label>
            <label className="text-xs text-textMuted">
              Luz
              <input className="mt-1 w-full rounded-lg border border-line bg-black/20 px-2 py-2 text-textMain" type="number" min={0} max={40} value={draft.lightRadius} onChange={(event) => setDraft((current) => ({ ...current, lightRadius: Number(event.target.value) }))} />
            </label>
          </div>
          <Button type="button" tone="primary" onClick={spawnDraft}>Spawn token</Button>
        </div>
      ) : null}
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
                onClick={() => spawnToken(token)}
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler imagem.'));
    reader.readAsDataURL(file);
  });
}

import { useState, type ChangeEvent } from 'react';
import type { AvailableTabletopToken, TabletopTokenKind } from '../types';

export function VttTokenModal({
  open,
  onClose,
  onCreate
}: {
  open: boolean;
  onClose(): void;
  onCreate(token: AvailableTabletopToken): void;
}) {
  const [name, setName] = useState('Guarda do Instituto');
  const [kind, setKind] = useState<TabletopTokenKind>('npc');
  const [image, setImage] = useState('');
  const [size, setSize] = useState(1);
  const [subtitle, setSubtitle] = useState('NPC');

  if (!open) return null;

  function submit() {
    const id = `custom-${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    onCreate({
      id,
      sourceId: id,
      kind,
      name: name.trim() || 'NPC',
      image: image.trim() || undefined,
      size,
      subtitle,
      visibleToPlayers: kind !== 'enemy',
      hidden: kind === 'enemy',
      visionEnabled: true,
      visionRadius: 6,
      statusMarkers: []
    });
    onClose();
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-[min(420px,calc(100vw-32px))] rounded-xl border border-white/10 bg-[#12101a]/98 p-4 text-textMain shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onMouseDown={(event) => event.stopPropagation()}>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-violet">Token Library</p>
        <h2 className="mt-2 text-xl font-black">Criar NPC / token</h2>
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-semibold text-textMuted">
            Nome
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-textMain outline-none focus:border-vita/50" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-textMuted">
              Tipo
              <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-textMain outline-none focus:border-vita/50" value={kind} onChange={(event) => setKind(event.target.value as TabletopTokenKind)}>
                <option value="npc">NPC</option>
                <option value="enemy">Inimigo</option>
                <option value="object">Objeto/Summon</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-textMuted">
              Tamanho
              <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-textMain outline-none focus:border-vita/50" value={size} onChange={(event) => setSize(Number(event.target.value))}>
                <option value={1}>1x1</option>
                <option value={2}>2x2</option>
                <option value={3}>3x3</option>
              </select>
            </label>
          </div>
          <label className="text-sm font-semibold text-textMuted">
            Subtitulo / tags
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-textMain outline-none focus:border-vita/50" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-textMuted">
            URL da imagem
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-textMain outline-none focus:border-vita/50" value={image.startsWith('data:') ? '' : image} onChange={(event) => setImage(event.target.value)} placeholder="https://..." />
          </label>
          <label className="text-sm font-semibold text-textMuted">
            Upload local
            <input className="mt-1 block w-full text-sm text-textMuted file:mr-3 file:rounded-lg file:border-0 file:bg-vita/25 file:px-3 file:py-2 file:font-bold file:text-textMain" type="file" accept="image/*" onChange={handleUpload} />
          </label>
          {image ? <img src={image} alt="" className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/10" /> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={onClose}>Cancelar</button>
          <button type="button" className="rounded-lg border border-vita/50 bg-vita/25 px-4 py-2 text-sm font-black text-white hover:bg-vita/35" onClick={submit}>Salvar na biblioteca</button>
        </div>
      </div>
    </div>
  );
}

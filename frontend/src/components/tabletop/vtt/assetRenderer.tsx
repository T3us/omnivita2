import { memo, useState } from 'react';
import { Circle, Group, Line, Rect } from 'react-konva';
import type { Asset } from '../types';

type ThumbnailProps = {
  asset: Asset;
  className?: string;
};

type ProceduralNodeProps = {
  asset: Asset | null;
  x?: number;
  y?: number;
  width: number;
  height: number;
  rotation?: number;
  selected?: boolean;
  opacity?: number;
  strokeWidth?: number;
  quality?: ProceduralRenderQuality;
};

export type ProceduralRenderQuality = 'fast' | 'quality';

export function AssetThumbnail({ asset, className }: ThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const imageUrl = asset.thumbnailUrl || asset.imageUrl;
  if (imageUrl && !failed) {
    return <img src={imageUrl} alt="" className={className} onError={() => setFailed(true)} />;
  }

  return (
    <div className={className} style={{ overflow: 'hidden' }}>
      <svg viewBox="0 0 64 64" role="img" aria-label={asset.name} className="h-full w-full">
        <ProceduralSvg asset={asset} />
      </svg>
    </div>
  );
}

export const ProceduralTile = memo(function ProceduralTile({ asset, x = 0, y = 0, width, height, rotation = 0, opacity = 1, strokeWidth = 1, quality = 'quality' }: ProceduralNodeProps) {
  return (
    <Group x={x} y={y} rotation={rotation} opacity={opacity} listening={false}>
      <ProceduralKonvaBody asset={asset} width={width} height={height} selected={false} strokeWidth={strokeWidth} quality={quality} />
    </Group>
  );
});

export const ProceduralObject = memo(function ProceduralObject({ asset, width, height, selected, opacity = 1, strokeWidth = 1, quality = 'quality' }: ProceduralNodeProps) {
  return (
    <Group opacity={opacity} listening={false}>
      <ProceduralKonvaBody asset={asset} width={width} height={height} selected={selected} strokeWidth={strokeWidth} quality={quality} />
    </Group>
  );
});

export function getProceduralKind(asset: Asset | null | undefined) {
  if (!asset) return 'prop';
  if (asset.proceduralKind) return asset.proceduralKind;
  const text = normalizeText(`${asset.id} ${asset.name} ${asset.typeCategory || ''} ${asset.tags.join(' ')}`);
  if (text.includes('train track straight h') || text.includes('trilho reto horizontal')) return 'train_track_h';
  if (text.includes('train track straight v') || text.includes('trilho reto vertical')) return 'train_track_v';
  if (text.includes('train track curve') || text.includes('trilho curva')) return 'train_track_curve';
  if (text.includes('train track crossing') || text.includes('cruzamento')) return 'train_track_cross';
  if (text.includes('train track broken') || text.includes('trilho quebrado')) return 'train_track_broken';
  if (text.includes('tram track') || text.includes('tram')) return 'tram_track';
  if (text.includes('dormentes') || text.includes('sleepers')) return 'rail_sleepers';
  if (text.includes('trilho') || text.includes(' rail ')) return 'train_track_h';
  if (text.includes('paralelepipedo') || text.includes('cobblestone')) return text.includes('molhado') || text.includes('wet') ? 'wet_cobblestone' : 'cobblestone';
  if (text.includes('lama') || text.includes('mud') || text.includes('lodo')) return 'mud';
  if (text.includes('calcada') || text.includes('sidewalk')) return 'sidewalk';
  if (text.includes('meio fio') || text.includes('curb')) return 'curb';
  if (text.includes('sarjeta') || text.includes('gutter')) return 'gutter';
  if (text.includes('bueiro') || text.includes('drenagem') || text.includes('drain')) return 'drain';
  if (text.includes('poca') || text.includes('agua') || text.includes('water') || text.includes('canal')) return 'puddle';
  if (text.includes('sangue') || text.includes('blood')) return 'blood';
  if (text.includes('madeira') || text.includes('tabua') || text.includes('wood') || text.includes('plank')) return 'wood_floor';
  if (text.includes('carpete') || text.includes('tapete') || text.includes('rug')) return 'carpet';
  if (text.includes('marmore') || text.includes('marble')) return 'marble';
  if (text.includes('ladrilho') || text.includes('linoleo') || text.includes('tile')) return 'tile_floor';
  if (asset.typeCategory === 'wall' && (text.includes('tijolo') || text.includes('brick'))) return 'brick_wall';
  if (asset.typeCategory === 'wall' && (text.includes('madeira') || text.includes('wood'))) return 'wood_wall';
  if (text.includes('grade') || text.includes('ferro') || text.includes('iron') || text.includes('fence')) return 'iron_bars';
  if (asset.typeCategory === 'wall') return 'stone_wall';
  if (asset.typeCategory === 'door') return text.includes('dupla') || text.includes('double') ? 'double_door' : text.includes('alcapao') || text.includes('trapdoor') ? 'trapdoor' : 'door';
  if (asset.typeCategory === 'window') return text.includes('quebrada') || text.includes('broken') ? 'broken_window' : 'window';
  if (text.includes('poste de gas') || text.includes('gas lamp')) return 'gas_lamp';
  if (asset.typeCategory === 'light' || text.includes('luz') || text.includes('lamp') || text.includes('lanterna')) return 'light';
  if (text.includes('barril') || text.includes('barrel')) return 'barrel';
  if (text.includes('caixote') || text.includes('crate') || text.includes('caixa')) return 'crate';
  if (text.includes('terminal') || text.includes('telegrafo') || text.includes('typewriter') || text.includes('maquina de escrever')) return 'terminal';
  if (text.includes('estante') || text.includes('armario') || text.includes('shelf') || text.includes('cabinet')) return 'shelf';
  if (text.includes('balcao') || text.includes('counter')) return 'counter';
  if (text.includes('mesa redonda') || text.includes('round table')) return 'round_table';
  if (text.includes('mesa') || text.includes('bancada') || text.includes('table') || text.includes('desk')) return 'table';
  if (text.includes('cadeira') || text.includes('banqueta') || text.includes('chair') || text.includes('stool')) return 'chair';
  if (text.includes('cama') || text.includes('colchao') || text.includes('bed') || text.includes('mattress')) return 'bed';
  if (text.includes('livro') || text.includes('book')) return 'book';
  if (text.includes('carta') || text.includes('jornal') || text.includes('papel') || text.includes('diario') || text.includes('paper') || text.includes('letter') || text.includes('newspaper')) return 'paper';
  if (text.includes('pegada') || text.includes('footprint')) return 'footprint';
  if (text.includes('faca') || text.includes('navalha') || text.includes('knife') || text.includes('razor')) return 'blade';
  if (text.includes('chave') || text.includes('key')) return 'key';
  if (asset.typeCategory === 'fog' || text.includes('nevoa') || text.includes('fog') || text.includes('fumaca')) return 'fog';
  if (text.includes('carruagem') || text.includes('charrete') || text.includes('hansom') || text.includes('omnibus')) return 'vehicle';
  if (text.includes('placa') || text.includes('cartaz') || text.includes('sign') || text.includes('poster')) return 'sign';
  return asset.typeCategory === 'floor' ? 'tile_floor' : 'prop';
}

function isTileRenderAsset(asset: Asset | null | undefined, kind: string) {
  if (!asset) return false;
  if (asset.defaultLayer === 'floor' || asset.defaultLayer === 'walls' || asset.defaultLayer === 'doors' || asset.defaultLayer === 'fog') return true;
  if (asset.typeCategory === 'floor' || asset.typeCategory === 'wall' || asset.typeCategory === 'door' || asset.typeCategory === 'window' || asset.typeCategory === 'door-window' || asset.typeCategory === 'fog') return true;
  return kind === 'cobblestone'
    || kind === 'wet_cobblestone'
    || kind === 'sidewalk'
    || kind === 'tile_floor'
    || kind === 'marble'
    || kind === 'wood_floor'
    || kind === 'wood_wall'
    || kind === 'brick_wall'
    || kind === 'stone_wall'
    || kind === 'gutter'
    || kind === 'curb'
    || kind === 'drain'
    || kind.includes('train_track')
    || kind === 'tram_track'
    || kind === 'rail_sleepers';
}

function ProceduralSvg({ asset }: { asset: Asset }) {
  const kind = getProceduralKind(asset);
  const fill = asset.color || '#241936';
  const stroke = asset.stroke || '#a78bfa';
  const base = isTileRenderAsset(asset, kind) ? <rect x="0" y="0" width="64" height="64" rx="8" fill={fill} stroke={stroke} strokeOpacity="0.65" /> : null;

  if (kind.includes('train_track') || kind === 'tram_track' || kind === 'rail_sleepers') {
    return <>{base}<SvgRail kind={kind} stroke={stroke} /></>;
  }
  if (kind === 'cobblestone' || kind === 'wet_cobblestone') {
    return <>{base}<SvgCobble wet={kind === 'wet_cobblestone'} stroke={stroke} /></>;
  }
  if (kind === 'gutter' || kind === 'curb' || kind === 'drain') return <>{base}<SvgStreetEdge kind={kind} stroke={stroke} /></>;
  if (kind === 'brick_wall') return <>{base}<SvgBrick stroke={stroke} /></>;
  if (kind === 'stone_wall') return <>{base}<SvgStone stroke={stroke} /></>;
  if (kind === 'wood_floor' || kind === 'wood_wall') return <>{base}<SvgWood stroke={stroke} /></>;
  if (kind === 'carpet') return <>{base}<SvgCarpet stroke={stroke} /></>;
  if (kind === 'sidewalk' || kind === 'tile_floor' || kind === 'marble') return <>{base}<SvgTile stroke={stroke} marble={kind === 'marble'} /></>;
  if (kind === 'mud') return <>{base}<SvgMud stroke={stroke} /></>;
  if (kind === 'puddle') return <>{base}<SvgPuddle stroke={stroke} /></>;
  if (kind === 'blood') return <>{base}<SvgBlood stroke={stroke} /></>;
  if (kind === 'door' || kind === 'double_door' || kind === 'trapdoor') return <>{base}<SvgDoor stroke={stroke} doubleDoor={kind === 'double_door'} trapdoor={kind === 'trapdoor'} /></>;
  if (kind === 'window' || kind === 'broken_window') return <>{base}<SvgWindow stroke={stroke} broken={kind === 'broken_window'} /></>;
  if (kind === 'gas_lamp' || kind === 'light') return <>{base}<SvgLight stroke={stroke} color={asset.color || '#facc15'} /></>;
  if (kind === 'barrel') return <>{base}<SvgBarrel stroke={stroke} /></>;
  if (kind === 'crate') return <>{base}<SvgCrate stroke={stroke} /></>;
  if (kind === 'table' || kind === 'round_table') return <>{base}<SvgTable stroke={stroke} round={kind === 'round_table'} /></>;
  if (kind === 'counter') return <>{base}<SvgCounter stroke={stroke} /></>;
  if (kind === 'chair') return <>{base}<SvgChair stroke={stroke} /></>;
  if (kind === 'bed') return <>{base}<SvgBed stroke={stroke} /></>;
  if (kind === 'book') return <>{base}<SvgBook stroke={stroke} /></>;
  if (kind === 'terminal') return <>{base}<SvgTerminal stroke={stroke} /></>;
  if (kind === 'shelf') return <>{base}<SvgShelf stroke={stroke} /></>;
  if (kind === 'paper') return <>{base}<SvgPaper stroke={stroke} /></>;
  if (kind === 'footprint') return <>{base}<SvgFootprint stroke={stroke} /></>;
  if (kind === 'blade') return <>{base}<SvgBlade stroke={stroke} /></>;
  if (kind === 'fog') return <>{base}<SvgFog stroke={stroke} /></>;
  if (kind === 'iron_bars') return <>{base}<SvgBars stroke={stroke} /></>;
  if (kind === 'vehicle') return <>{base}<SvgVehicle stroke={stroke} /></>;
  return <>{base}<SvgProp stroke={stroke} /></>;
}

function ProceduralKonvaBody({ asset, width, height, selected, strokeWidth = 1, quality = 'quality' }: { asset: Asset | null; width: number; height: number; selected?: boolean; strokeWidth?: number; quality?: ProceduralRenderQuality }) {
  const kind = getProceduralKind(asset);
  const fill = asset?.color || '#241936';
  const stroke = selected ? '#ffffff' : asset?.stroke || '#a78bfa';
  const tileRender = isTileRenderAsset(asset, kind);
  const base = tileRender
    ? <Rect width={width} height={height} fill={fill} stroke={stroke} strokeWidth={selected ? strokeWidth + 1 : strokeWidth} cornerRadius={Math.min(8, width * 0.08, height * 0.08)} perfectDrawEnabled={false} listening={false} />
    : selected
      ? <Rect x={1} y={1} width={Math.max(1, width - 2)} height={Math.max(1, height - 2)} fill="rgba(255,255,255,0.02)" stroke={stroke} strokeWidth={Math.max(1, strokeWidth)} dash={[6, 4]} cornerRadius={Math.min(8, width * 0.08, height * 0.08)} perfectDrawEnabled={false} listening={false} />
      : null;

  if (quality === 'fast' && !selected && tileRender) return <>{base}<KonvaFastPattern kind={kind} width={width} height={height} stroke={stroke} color={asset?.color || '#facc15'} /></>;

  if (kind.includes('train_track') || kind === 'tram_track' || kind === 'rail_sleepers') return <>{base}<KonvaRail kind={kind} width={width} height={height} stroke={stroke} /></>;
  if (kind === 'cobblestone' || kind === 'wet_cobblestone') return <>{base}<KonvaCobble width={width} height={height} stroke={stroke} wet={kind === 'wet_cobblestone'} /></>;
  if (kind === 'gutter' || kind === 'curb' || kind === 'drain') return <>{base}<KonvaStreetEdge kind={kind} width={width} height={height} stroke={stroke} /></>;
  if (kind === 'brick_wall') return <>{base}<KonvaBrick width={width} height={height} stroke={stroke} /></>;
  if (kind === 'stone_wall') return <>{base}<KonvaStone width={width} height={height} stroke={stroke} /></>;
  if (kind === 'wood_floor' || kind === 'wood_wall') return <>{base}<KonvaWood width={width} height={height} stroke={stroke} /></>;
  if (kind === 'carpet') return <>{base}<KonvaCarpet width={width} height={height} stroke={stroke} /></>;
  if (kind === 'sidewalk' || kind === 'tile_floor' || kind === 'marble') return <>{base}<KonvaTile width={width} height={height} stroke={stroke} marble={kind === 'marble'} /></>;
  if (kind === 'mud') return <>{base}<KonvaMud width={width} height={height} stroke={stroke} /></>;
  if (kind === 'puddle') return <>{base}<KonvaPuddle width={width} height={height} stroke={stroke} /></>;
  if (kind === 'blood') return <>{base}<KonvaBlood width={width} height={height} stroke={stroke} /></>;
  if (kind === 'door' || kind === 'double_door' || kind === 'trapdoor') return <>{base}<KonvaDoor width={width} height={height} stroke={stroke} doubleDoor={kind === 'double_door'} trapdoor={kind === 'trapdoor'} /></>;
  if (kind === 'window' || kind === 'broken_window') return <>{base}<KonvaWindow width={width} height={height} stroke={stroke} broken={kind === 'broken_window'} /></>;
  if (kind === 'gas_lamp' || kind === 'light') return <>{base}<KonvaLight width={width} height={height} stroke={stroke} color={asset?.color || '#facc15'} /></>;
  if (kind === 'barrel') return <>{base}<KonvaBarrel width={width} height={height} stroke={stroke} /></>;
  if (kind === 'crate') return <>{base}<KonvaCrate width={width} height={height} stroke={stroke} /></>;
  if (kind === 'table' || kind === 'round_table') return <>{base}<KonvaTable width={width} height={height} stroke={stroke} round={kind === 'round_table'} /></>;
  if (kind === 'counter') return <>{base}<KonvaCounter width={width} height={height} stroke={stroke} /></>;
  if (kind === 'chair') return <>{base}<KonvaChair width={width} height={height} stroke={stroke} /></>;
  if (kind === 'bed') return <>{base}<KonvaBed width={width} height={height} stroke={stroke} /></>;
  if (kind === 'book') return <>{base}<KonvaBook width={width} height={height} stroke={stroke} /></>;
  if (kind === 'terminal') return <>{base}<KonvaTerminal width={width} height={height} stroke={stroke} /></>;
  if (kind === 'shelf') return <>{base}<KonvaShelf width={width} height={height} stroke={stroke} /></>;
  if (kind === 'paper') return <>{base}<KonvaPaper width={width} height={height} stroke={stroke} /></>;
  if (kind === 'footprint') return <>{base}<KonvaFootprint width={width} height={height} stroke={stroke} /></>;
  if (kind === 'blade') return <>{base}<KonvaBlade width={width} height={height} stroke={stroke} /></>;
  if (kind === 'fog') return <>{base}<KonvaFog width={width} height={height} stroke={stroke} /></>;
  if (kind === 'iron_bars') return <>{base}<KonvaBars width={width} height={height} stroke={stroke} /></>;
  if (kind === 'vehicle') return <>{base}<KonvaVehicle width={width} height={height} stroke={stroke} /></>;
  return <>{base}<KonvaProp width={width} height={height} stroke={stroke} /></>;
}

function KonvaFastPattern({ kind, width, height, stroke, color }: { kind: string; width: number; height: number; stroke: string; color: string }) {
  if (kind.includes('train_track') || kind === 'tram_track' || kind === 'rail_sleepers') {
    return <KonvaRail kind={kind} width={width} height={height} stroke={stroke} />;
  }
  if (kind === 'brick_wall') {
    return <><Line points={[0, height * 0.35, width, height * 0.35]} stroke={stroke} opacity={0.5} listening={false} /><Line points={[0, height * 0.68, width, height * 0.68]} stroke={stroke} opacity={0.5} listening={false} /><Line points={[width * 0.33, 0, width * 0.33, height]} stroke={stroke} opacity={0.38} listening={false} /><Line points={[width * 0.66, 0, width * 0.66, height]} stroke={stroke} opacity={0.38} listening={false} /></>;
  }
  if (kind === 'wood_floor' || kind === 'wood_wall') {
    return <>{[0.25, 0.5, 0.75].map((v) => <Line key={v} points={[width * v, 0, width * v, height]} stroke={stroke} opacity={0.45} listening={false} />)}</>;
  }
  if (kind === 'cobblestone' || kind === 'wet_cobblestone' || kind === 'sidewalk' || kind === 'tile_floor' || kind === 'marble') {
    return <><Line points={[width * 0.5, 0, width * 0.5, height]} stroke={stroke} opacity={0.35} listening={false} /><Line points={[0, height * 0.5, width, height * 0.5]} stroke={stroke} opacity={0.35} listening={false} />{kind === 'wet_cobblestone' ? <Line points={[width * 0.18, height * 0.22, width * 0.48, height * 0.12]} stroke="#dbeafe" opacity={0.38} listening={false} /> : null}</>;
  }
  if (kind === 'mud' || kind === 'blood') {
    return <Circle x={width * 0.5} y={height * 0.52} radius={Math.min(width, height) * 0.25} fill={stroke} opacity={kind === 'blood' ? 0.6 : 0.22} listening={false} />;
  }
  if (kind === 'puddle' || kind === 'fog') {
    return <Circle x={width * 0.5} y={height * 0.5} radius={Math.min(width, height) * 0.3} fill={kind === 'fog' ? stroke : color} opacity={0.28} listening={false} />;
  }
  if (kind === 'door' || kind === 'double_door' || kind === 'trapdoor') {
    return <KonvaDoor width={width} height={height} stroke={stroke} doubleDoor={kind === 'double_door'} trapdoor={kind === 'trapdoor'} />;
  }
  if (kind === 'window' || kind === 'broken_window') {
    return <KonvaWindow width={width} height={height} stroke={stroke} broken={kind === 'broken_window'} />;
  }
  if (kind === 'gas_lamp' || kind === 'light') {
    return <KonvaLight width={width} height={height} stroke={stroke} color={color} />;
  }
  if (kind === 'barrel') return <KonvaBarrel width={width} height={height} stroke={stroke} />;
  if (kind === 'crate') return <KonvaCrate width={width} height={height} stroke={stroke} />;
  return <Rect x={width * 0.26} y={height * 0.26} width={width * 0.48} height={height * 0.48} stroke={stroke} opacity={0.42} cornerRadius={Math.min(width, height) * 0.08} listening={false} />;
}

function SvgRail({ kind, stroke }: { kind: string; stroke: string }) {
  const metal = stroke || '#c0c0c0';
  const sleepers = '#8a5a35';
  if (kind === 'train_track_v') {
    return <><g stroke={sleepers} strokeWidth="5">{[8, 20, 32, 44, 56].map((y) => <line key={y} x1="16" y1={y} x2="48" y2={y} />)}</g><g stroke={metal} strokeWidth="4"><line x1="22" y1="5" x2="22" y2="59" /><line x1="42" y1="5" x2="42" y2="59" /></g></>;
  }
  if (kind === 'train_track_curve') {
    return <><path d="M18 56 C18 30 32 18 56 18" fill="none" stroke={metal} strokeWidth="4" /><path d="M34 58 C34 42 44 34 58 34" fill="none" stroke={metal} strokeWidth="4" /><g stroke={sleepers} strokeWidth="4"><line x1="14" y1="48" x2="38" y2="58" /><line x1="24" y1="26" x2="40" y2="44" /><line x1="42" y1="14" x2="54" y2="38" /></g></>;
  }
  if (kind === 'train_track_cross') {
    return <><SvgRail kind="train_track_h" stroke={stroke} /><SvgRail kind="train_track_v" stroke={stroke} /></>;
  }
  if (kind === 'rail_sleepers') {
    return <g stroke={sleepers} strokeWidth="6">{[14, 26, 38, 50].map((y) => <line key={y} x1="12" y1={y} x2="52" y2={y} />)}</g>;
  }
  return <><g stroke={sleepers} strokeWidth="5">{[8, 20, 32, 44, 56].map((x) => <line key={x} x1={x} y1="16" x2={x} y2="48" />)}</g><g stroke={metal} strokeWidth={kind === 'train_track_broken' ? 3 : 4} strokeLinecap="round"><line x1="5" y1="22" x2={kind === 'train_track_broken' ? '28' : '59'} y2="22" /><line x1={kind === 'train_track_broken' ? '38' : '5'} y1="42" x2="59" y2="42" /></g>{kind === 'tram_track' ? <g stroke="#d7d7d7" strokeWidth="1.5"><line x1="5" y1="30" x2="59" y2="30" /><line x1="5" y1="34" x2="59" y2="34" /></g> : null}</>;
}

function SvgCobble({ wet, stroke }: { wet?: boolean; stroke: string }) {
  const tones = ['#000000', '#ffffff', '#000000', '#ffffff'];
  return (
    <>
      <g stroke={stroke} strokeOpacity="0.45" strokeWidth="1.3">
        {[4, 18, 32, 46].map((y, row) => [4, 18, 32, 46].map((x, col) => (
          <rect
            key={`${x}-${y}`}
            x={x + (row % 2 ? 4 : 0)}
            y={y + ((row + col) % 2 ? 1 : 0)}
            width={14 + ((row + col) % 3)}
            height={10 + ((row * col) % 3)}
            rx="3"
            fill={tones[(row + col) % tones.length]}
            fillOpacity={(row + col) % 2 ? 0.05 : 0.08}
          />
        )))}
      </g>
      {wet ? <g stroke="#dbeafe" strokeOpacity="0.55" strokeWidth="2"><line x1="11" y1="14" x2="24" y2="10" /><line x1="36" y1="39" x2="54" y2="35" /><line x1="22" y1="52" x2="36" y2="49" /></g> : null}
    </>
  );
}

function SvgStreetEdge({ kind, stroke }: { kind: string; stroke: string }) {
  if (kind === 'drain') {
    return (
      <>
        <rect x="14" y="14" width="36" height="36" rx="4" fill="#020617" fillOpacity="0.35" stroke={stroke} strokeWidth="2" />
        <g stroke={stroke} strokeOpacity="0.65" strokeWidth="2">
          {[22, 30, 38, 46].map((x) => <line key={x} x1={x} y1="18" x2={x} y2="46" />)}
          <line x1="18" y1="28" x2="46" y2="28" />
          <line x1="18" y1="38" x2="46" y2="38" />
        </g>
      </>
    );
  }
  if (kind === 'gutter') {
    return (
      <>
        <rect x="7" y="7" width="50" height="50" fill="none" stroke={stroke} strokeOpacity="0.25" />
        <rect x="7" y="39" width="50" height="13" fill="#020617" fillOpacity="0.35" />
        <line x1="8" y1="39" x2="56" y2="39" stroke={stroke} strokeWidth="3" />
        <path d="M11 46 C22 42 31 51 42 46 C49 43 53 44 57 46" fill="none" stroke="#bfdbfe" strokeOpacity="0.45" strokeWidth="2" />
      </>
    );
  }
  return (
    <>
      <rect x="7" y="7" width="50" height="50" fill="none" stroke={stroke} strokeOpacity="0.25" />
      <rect x="7" y="7" width="50" height="16" fill="#ffffff" fillOpacity="0.08" />
      <line x1="8" y1="24" x2="56" y2="24" stroke={stroke} strokeWidth="3" />
      {[17, 29, 41, 53].map((x) => <line key={x} x1={x} y1="8" x2={x} y2="23" stroke={stroke} strokeOpacity="0.5" />)}
    </>
  );
}

function SvgBrick({ stroke }: { stroke: string }) {
  return <g stroke={stroke} strokeOpacity="0.55" strokeWidth="1.5">{[10, 22, 34, 46].map((y, row) => <g key={y}><line x1="4" y1={y} x2="60" y2={y} />{[row % 2 ? 7 : 17, row % 2 ? 25 : 35, row % 2 ? 43 : 53].map((x) => <line key={x} x1={x} y1={y - 10} x2={x} y2={y} />)}</g>)}</g>;
}

function SvgStone({ stroke }: { stroke: string }) {
  return (
    <g fill="none" stroke={stroke} strokeOpacity="0.5" strokeWidth="1.5">
      <path d="M5 14 H23 L30 7 H50 L59 16" />
      <path d="M4 31 H18 L25 22 H43 L60 30" />
      <path d="M6 49 H25 L33 39 H48 L59 48" />
      <path d="M16 14 V31 M36 8 V30 M47 30 V49 M27 39 V58" />
    </g>
  );
}

function SvgWood({ stroke }: { stroke: string }) {
  return <g stroke={stroke} strokeOpacity="0.55">{[13, 26, 39, 52].map((x) => <line key={x} x1={x} y1="5" x2={x} y2="59" />)}<path d="M8 18 C18 12 27 25 39 17 C47 12 53 17 59 14" fill="none" /><path d="M6 43 C18 37 27 51 39 42 C49 35 54 42 59 38" fill="none" /></g>;
}

function SvgCarpet({ stroke }: { stroke: string }) {
  return (
    <>
      <rect x="10" y="10" width="44" height="44" rx="4" fill="rgba(0,0,0,0.1)" stroke={stroke} strokeWidth="2" />
      <rect x="16" y="16" width="32" height="32" rx="3" fill="none" stroke={stroke} strokeOpacity="0.55" />
      <circle cx="32" cy="32" r="10" fill="none" stroke={stroke} strokeOpacity="0.45" />
      <g stroke={stroke} strokeOpacity="0.45">
        <line x1="16" y1="24" x2="48" y2="24" />
        <line x1="16" y1="40" x2="48" y2="40" />
      </g>
    </>
  );
}

function SvgTile({ stroke, marble }: { stroke: string; marble?: boolean }) {
  return <g stroke={stroke} strokeOpacity="0.52" strokeWidth="1.2">{[16, 32, 48].map((x) => <line key={`x${x}`} x1={x} y1="4" x2={x} y2="60" />)}{[16, 32, 48].map((y) => <line key={`y${y}`} x1="4" y1={y} x2="60" y2={y} />)}{marble ? <path d="M9 56 C22 33 37 36 55 8" fill="none" stroke="#fff" strokeOpacity="0.4" /> : null}</g>;
}

function SvgMud({ stroke }: { stroke: string }) {
  return <g fill={stroke} fillOpacity="0.28"><ellipse cx="22" cy="22" rx="14" ry="8" /><ellipse cx="43" cy="42" rx="16" ry="10" /><ellipse cx="24" cy="49" rx="7" ry="4" /></g>;
}

function SvgPuddle({ stroke }: { stroke: string }) {
  return <path d="M10 36 C14 20 29 24 37 18 C51 10 58 27 51 38 C43 52 19 51 10 36 Z" fill={stroke} fillOpacity="0.42" stroke="#dbeafe" strokeOpacity="0.35" />;
}

function SvgBlood({ stroke }: { stroke: string }) {
  return <g fill={stroke || '#991b1b'} fillOpacity="0.72"><circle cx="27" cy="32" r="13" /><circle cx="42" cy="37" r="8" /><circle cx="20" cy="48" r="5" /><circle cx="48" cy="22" r="4" /></g>;
}

function SvgDoor({ stroke, doubleDoor, trapdoor }: { stroke: string; doubleDoor?: boolean; trapdoor?: boolean }) {
  if (trapdoor) return <><rect x="15" y="15" width="34" height="34" fill="none" stroke={stroke} strokeWidth="3" /><line x1="15" y1="32" x2="49" y2="32" stroke={stroke} /><circle cx="42" cy="25" r="2" fill={stroke} /></>;
  return <><rect x="14" y="10" width="36" height="44" rx="2" fill="rgba(0,0,0,0.2)" stroke={stroke} strokeWidth="3" />{doubleDoor ? <line x1="32" y1="10" x2="32" y2="54" stroke={stroke} strokeWidth="2" /> : null}<rect x="20" y="17" width={doubleDoor ? 9 : 24} height="12" fill="none" stroke={stroke} strokeOpacity="0.65" /><rect x={doubleDoor ? 35 : 20} y="34" width={doubleDoor ? 9 : 24} height="12" fill="none" stroke={stroke} strokeOpacity="0.65" /><circle cx="43" cy="32" r="2" fill={stroke} /></>;
}

function SvgWindow({ stroke, broken }: { stroke: string; broken?: boolean }) {
  return <><rect x="10" y="16" width="44" height="32" rx="2" fill="#0f172a" fillOpacity="0.35" stroke={stroke} strokeWidth="3" /><line x1="32" y1="16" x2="32" y2="48" stroke={stroke} /><line x1="10" y1="32" x2="54" y2="32" stroke={stroke} />{broken ? <path d="M18 20 L30 31 L24 44 M36 18 L31 31 L46 44" fill="none" stroke="#e0f2fe" strokeWidth="1.5" /> : null}</>;
}

function SvgLight({ stroke, color }: { stroke: string; color: string }) {
  return <><circle cx="32" cy="32" r="23" fill={color} fillOpacity="0.22" /><line x1="32" y1="14" x2="32" y2="48" stroke={stroke} strokeWidth="4" /><circle cx="32" cy="19" r="8" fill={color} stroke="#fff7bd" strokeWidth="2" /><rect x="25" y="47" width="14" height="5" rx="2" fill={stroke} /></>;
}

function SvgBarrel({ stroke }: { stroke: string }) {
  return <><ellipse cx="32" cy="20" rx="17" ry="7" fill="rgba(0,0,0,0.18)" stroke={stroke} /><rect x="15" y="20" width="34" height="25" fill="rgba(0,0,0,0.12)" stroke={stroke} /><ellipse cx="32" cy="45" rx="17" ry="7" fill="rgba(0,0,0,0.18)" stroke={stroke} /><line x1="18" y1="27" x2="46" y2="27" stroke={stroke} /><line x1="18" y1="39" x2="46" y2="39" stroke={stroke} /></>;
}

function SvgCrate({ stroke }: { stroke: string }) {
  return <><rect x="13" y="13" width="38" height="38" fill="rgba(0,0,0,0.12)" stroke={stroke} strokeWidth="3" /><line x1="13" y1="13" x2="51" y2="51" stroke={stroke} strokeWidth="2" /><line x1="51" y1="13" x2="13" y2="51" stroke={stroke} strokeWidth="2" /></>;
}

function SvgPaper({ stroke }: { stroke: string }) {
  return <><rect x="17" y="11" width="30" height="42" rx="2" fill="#d9c9a1" stroke={stroke} /><g stroke="#6b5b43" strokeWidth="1"><line x1="23" y1="22" x2="41" y2="22" /><line x1="23" y1="29" x2="41" y2="29" /><line x1="23" y1="36" x2="38" y2="36" /></g></>;
}

function SvgFootprint({ stroke }: { stroke: string }) {
  return <g fill={stroke} fillOpacity="0.7"><ellipse cx="25" cy="24" rx="5" ry="10" transform="rotate(-25 25 24)" /><ellipse cx="40" cy="42" rx="5" ry="10" transform="rotate(-25 40 42)" />{[17, 22, 29, 34].map((x, i) => <circle key={x} cx={x} cy={13 + i * 3} r="2" />)}</g>;
}

function SvgBlade({ stroke }: { stroke: string }) {
  return <><path d="M17 45 L39 16 L50 14 L29 42 Z" fill="#d1d5db" stroke={stroke} /><rect x="13" y="43" width="18" height="7" rx="2" fill="#5b3823" stroke={stroke} transform="rotate(-35 22 46)" /></>;
}

function SvgFog({ stroke }: { stroke: string }) {
  return <g stroke={stroke} strokeWidth="5" strokeLinecap="round" opacity="0.65"><path d="M8 22 C20 14 28 30 40 22 C48 17 53 20 58 24" fill="none" /><path d="M6 38 C19 31 30 47 42 37 C50 31 55 35 60 39" fill="none" /></g>;
}

function SvgBars({ stroke }: { stroke: string }) {
  return <g stroke={stroke} strokeWidth="4">{[14, 26, 38, 50].map((x) => <line key={x} x1={x} y1="8" x2={x} y2="56" />)}<line x1="8" y1="18" x2="56" y2="18" /><line x1="8" y1="46" x2="56" y2="46" /></g>;
}

function SvgVehicle({ stroke }: { stroke: string }) {
  return <><rect x="13" y="16" width="38" height="32" rx="8" fill="rgba(0,0,0,0.18)" stroke={stroke} strokeWidth="3" /><circle cx="20" cy="51" r="5" fill="#111" stroke={stroke} /><circle cx="44" cy="51" r="5" fill="#111" stroke={stroke} /><rect x="22" y="21" width="20" height="13" fill="rgba(255,255,255,0.12)" stroke={stroke} /></>;
}

function SvgProp({ stroke }: { stroke: string }) {
  return <><rect x="17" y="17" width="30" height="30" rx="6" fill="rgba(0,0,0,0.14)" stroke={stroke} strokeWidth="3" /><circle cx="32" cy="32" r="8" fill={stroke} fillOpacity="0.35" /></>;
}

function SvgTable({ stroke, round }: { stroke: string; round?: boolean }) {
  if (round) return <><circle cx="32" cy="32" r="20" fill="rgba(0,0,0,0.16)" stroke={stroke} strokeWidth="3" /><circle cx="32" cy="32" r="6" fill={stroke} fillOpacity="0.18" /></>;
  return <><rect x="10" y="18" width="44" height="28" rx="5" fill="rgba(0,0,0,0.16)" stroke={stroke} strokeWidth="3" /><g fill={stroke} fillOpacity="0.55"><circle cx="17" cy="25" r="2.5" /><circle cx="47" cy="25" r="2.5" /><circle cx="17" cy="39" r="2.5" /><circle cx="47" cy="39" r="2.5" /></g></>;
}

function SvgCounter({ stroke }: { stroke: string }) {
  return <><rect x="8" y="20" width="48" height="24" rx="4" fill="rgba(0,0,0,0.18)" stroke={stroke} strokeWidth="3" /><line x1="13" y1="28" x2="51" y2="28" stroke={stroke} strokeOpacity="0.55" /><line x1="20" y1="20" x2="20" y2="44" stroke={stroke} strokeOpacity="0.35" /><line x1="42" y1="20" x2="42" y2="44" stroke={stroke} strokeOpacity="0.35" /></>;
}

function SvgChair({ stroke }: { stroke: string }) {
  return <><rect x="20" y="24" width="24" height="22" rx="4" fill="rgba(0,0,0,0.14)" stroke={stroke} strokeWidth="3" /><rect x="17" y="14" width="30" height="11" rx="3" fill="rgba(0,0,0,0.2)" stroke={stroke} strokeWidth="2" /><g stroke={stroke} strokeWidth="2"><line x1="22" y1="47" x2="19" y2="54" /><line x1="42" y1="47" x2="45" y2="54" /></g></>;
}

function SvgBed({ stroke }: { stroke: string }) {
  return <><rect x="12" y="11" width="40" height="44" rx="5" fill="rgba(0,0,0,0.12)" stroke={stroke} strokeWidth="3" /><rect x="17" y="16" width="30" height="10" rx="3" fill="#d9c9a1" stroke={stroke} strokeOpacity="0.7" /><rect x="17" y="29" width="30" height="21" rx="3" fill={stroke} fillOpacity="0.18" /></>;
}

function SvgBook({ stroke }: { stroke: string }) {
  return <><rect x="14" y="18" width="36" height="30" rx="3" fill="#d9c9a1" stroke={stroke} strokeWidth="2" /><line x1="32" y1="18" x2="32" y2="48" stroke={stroke} strokeWidth="2" /><g stroke="#6b5b43" strokeWidth="1"><line x1="19" y1="27" x2="29" y2="27" /><line x1="35" y1="27" x2="45" y2="27" /><line x1="19" y1="35" x2="28" y2="35" /><line x1="36" y1="35" x2="44" y2="35" /></g></>;
}

function SvgTerminal({ stroke }: { stroke: string }) {
  return <><rect x="13" y="16" width="38" height="30" rx="4" fill="rgba(0,0,0,0.2)" stroke={stroke} strokeWidth="3" /><rect x="19" y="22" width="26" height="13" rx="2" fill="#0f172a" stroke={stroke} strokeOpacity="0.7" /><circle cx="23" cy="41" r="2" fill="#86efac" /><circle cx="31" cy="41" r="2" fill="#facc15" /><line x1="39" y1="40" x2="46" y2="40" stroke={stroke} strokeWidth="2" /></>;
}

function SvgShelf({ stroke }: { stroke: string }) {
  return <><rect x="13" y="10" width="38" height="44" rx="3" fill="rgba(0,0,0,0.16)" stroke={stroke} strokeWidth="3" /><g stroke={stroke} strokeOpacity="0.65"><line x1="15" y1="24" x2="49" y2="24" /><line x1="15" y1="38" x2="49" y2="38" /></g><g fill={stroke} fillOpacity="0.35"><rect x="18" y="14" width="5" height="9" /><rect x="26" y="14" width="4" height="9" /><rect x="35" y="28" width="5" height="9" /><rect x="42" y="41" width="4" height="10" /></g></>;
}

function KonvaRail({ kind, width, height, stroke }: { kind: string; width: number; height: number; stroke: string }) {
  const sleeper = '#8a5a35';
  if (kind === 'train_track_v') {
    const ys = [0.12, 0.28, 0.44, 0.6, 0.76, 0.92].map((v) => v * height);
    return <>{ys.map((y) => <Line key={y} points={[width * 0.24, y, width * 0.76, y]} stroke={sleeper} strokeWidth={Math.max(3, width * 0.07)} />)}<Line points={[width * 0.34, height * 0.04, width * 0.34, height * 0.96]} stroke={stroke} strokeWidth={Math.max(3, width * 0.08)} lineCap="round" /><Line points={[width * 0.66, height * 0.04, width * 0.66, height * 0.96]} stroke={stroke} strokeWidth={Math.max(3, width * 0.08)} lineCap="round" /></>;
  }
  if (kind === 'train_track_curve') {
    return <><Line points={[width * 0.18, height * 0.88, width * 0.2, height * 0.45, width * 0.52, height * 0.18, width * 0.88, height * 0.18]} tension={0.45} stroke={stroke} strokeWidth={4} lineCap="round" /><Line points={[width * 0.42, height * 0.92, width * 0.46, height * 0.62, width * 0.66, height * 0.42, width * 0.92, height * 0.42]} tension={0.45} stroke={stroke} strokeWidth={4} lineCap="round" /><Line points={[width * 0.18, height * 0.7, width * 0.43, height * 0.88]} stroke={sleeper} strokeWidth={4} /><Line points={[width * 0.32, height * 0.32, width * 0.54, height * 0.56]} stroke={sleeper} strokeWidth={4} /><Line points={[width * 0.64, height * 0.16, width * 0.84, height * 0.43]} stroke={sleeper} strokeWidth={4} /></>;
  }
  if (kind === 'train_track_cross') {
    return <><KonvaRail kind="train_track_h" width={width} height={height} stroke={stroke} /><KonvaRail kind="train_track_v" width={width} height={height} stroke={stroke} /></>;
  }
  if (kind === 'rail_sleepers') {
    return <>{[0.2, 0.38, 0.56, 0.74].map((v) => <Line key={v} points={[width * 0.16, height * v, width * 0.84, height * v]} stroke={sleeper} strokeWidth={Math.max(4, height * 0.09)} />)}</>;
  }
  const xs = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92].map((v) => v * width);
  return <>{xs.map((x) => <Line key={x} points={[x, height * 0.25, x, height * 0.75]} stroke={sleeper} strokeWidth={Math.max(3, height * 0.08)} />)}<Line points={[width * 0.04, height * 0.34, kind === 'train_track_broken' ? width * 0.46 : width * 0.96, height * 0.34]} stroke={stroke} strokeWidth={Math.max(3, height * 0.08)} lineCap="round" /><Line points={[kind === 'train_track_broken' ? width * 0.56 : width * 0.04, height * 0.66, width * 0.96, height * 0.66]} stroke={stroke} strokeWidth={Math.max(3, height * 0.08)} lineCap="round" />{kind === 'tram_track' ? <><Line points={[width * 0.04, height * 0.47, width * 0.96, height * 0.47]} stroke="#e5e7eb" strokeWidth={1.5} /><Line points={[width * 0.04, height * 0.53, width * 0.96, height * 0.53]} stroke="#e5e7eb" strokeWidth={1.5} /></> : null}</>;
}

function KonvaCobble({ width, height, stroke, wet }: { width: number; height: number; stroke: string; wet?: boolean }) {
  const stones = Array.from({ length: 20 }, (_, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const w = width / 5.5;
    const h = height / 6;
    return (
      <Rect
        key={index}
        x={col * (width / 5) + (row % 2 ? w * 0.35 : w * 0.05)}
        y={row * (height / 4) + height * (0.05 + (col % 2 ? 0.01 : 0))}
        width={w * (1 + ((row + col) % 3) * 0.04)}
        height={h * (1 + ((row * col) % 3) * 0.04)}
        cornerRadius={Math.min(w, h) * 0.25}
        stroke={stroke}
        strokeWidth={1}
        fill={(row + col) % 2 ? '#ffffff' : '#000000'}
        opacity={(row + col) % 2 ? 0.12 : 0.18}
      />
    );
  });
  return <>{stones}{wet ? <><Line points={[width * 0.15, height * 0.22, width * 0.38, height * 0.12]} stroke="#dbeafe" strokeWidth={2} opacity={0.45} /><Line points={[width * 0.58, height * 0.7, width * 0.88, height * 0.62]} stroke="#dbeafe" strokeWidth={2} opacity={0.45} /></> : null}</>;
}

function KonvaStreetEdge({ kind, width, height, stroke }: { kind: string; width: number; height: number; stroke: string }) {
  if (kind === 'drain') {
    return (
      <>
        <Rect x={width * 0.22} y={height * 0.22} width={width * 0.56} height={height * 0.56} fill="#020617" opacity={0.35} stroke={stroke} strokeWidth={2} cornerRadius={Math.min(width, height) * 0.06} />
        {[0.34, 0.46, 0.58, 0.7].map((v) => <Line key={v} points={[width * v, height * 0.28, width * v, height * 0.72]} stroke={stroke} strokeWidth={1.8} opacity={0.65} />)}
        <Line points={[width * 0.28, height * 0.44, width * 0.72, height * 0.44]} stroke={stroke} strokeWidth={1.6} opacity={0.65} />
        <Line points={[width * 0.28, height * 0.6, width * 0.72, height * 0.6]} stroke={stroke} strokeWidth={1.6} opacity={0.65} />
      </>
    );
  }
  if (kind === 'gutter') {
    return (
      <>
        <Rect x={width * 0.08} y={height * 0.62} width={width * 0.84} height={height * 0.2} fill="#020617" opacity={0.35} />
        <Line points={[width * 0.08, height * 0.62, width * 0.92, height * 0.62]} stroke={stroke} strokeWidth={Math.max(2, height * 0.05)} />
        <Line points={[width * 0.1, height * 0.72, width * 0.34, height * 0.66, width * 0.58, height * 0.78, width * 0.9, height * 0.7]} tension={0.45} stroke="#bfdbfe" strokeWidth={Math.max(1, height * 0.03)} opacity={0.45} />
      </>
    );
  }
  return (
    <>
      <Rect x={width * 0.08} y={height * 0.08} width={width * 0.84} height={height * 0.24} fill="#ffffff" opacity={0.08} />
      <Line points={[width * 0.08, height * 0.36, width * 0.92, height * 0.36]} stroke={stroke} strokeWidth={Math.max(2, height * 0.05)} />
      {[0.24, 0.44, 0.64, 0.84].map((v) => <Line key={v} points={[width * v, height * 0.09, width * v, height * 0.34]} stroke={stroke} opacity={0.5} />)}
    </>
  );
}

function KonvaBrick({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <>{[0.18, 0.36, 0.54, 0.72, 0.9].map((v, row) => <Group key={v}><Line points={[0, height * v, width, height * v]} stroke={stroke} strokeWidth={1.3} opacity={0.55} />{[0.25, 0.5, 0.75].map((x) => <Line key={x} points={[width * (x + (row % 2 ? 0.12 : -0.02)), height * (v - 0.18), width * (x + (row % 2 ? 0.12 : -0.02)), height * v]} stroke={stroke} strokeWidth={1.1} opacity={0.45} />)}</Group>)}</>;
}

function KonvaStone({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return (
    <>
      <Line points={[width * 0.08, height * 0.22, width * 0.36, height * 0.22, width * 0.48, height * 0.1, width * 0.78, height * 0.1, width * 0.94, height * 0.24]} stroke={stroke} strokeWidth={1.4} opacity={0.5} />
      <Line points={[width * 0.06, height * 0.5, width * 0.28, height * 0.5, width * 0.4, height * 0.36, width * 0.68, height * 0.36, width * 0.94, height * 0.5]} stroke={stroke} strokeWidth={1.4} opacity={0.5} />
      <Line points={[width * 0.08, height * 0.78, width * 0.38, height * 0.78, width * 0.52, height * 0.62, width * 0.76, height * 0.62, width * 0.94, height * 0.76]} stroke={stroke} strokeWidth={1.4} opacity={0.5} />
      <Line points={[width * 0.24, height * 0.22, width * 0.24, height * 0.5]} stroke={stroke} opacity={0.42} />
      <Line points={[width * 0.58, height * 0.1, width * 0.58, height * 0.36]} stroke={stroke} opacity={0.42} />
      <Line points={[width * 0.72, height * 0.5, width * 0.72, height * 0.78]} stroke={stroke} opacity={0.42} />
    </>
  );
}

function KonvaWood({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <>{[0.22, 0.43, 0.64, 0.83].map((v) => <Line key={v} points={[width * v, height * 0.06, width * v, height * 0.94]} stroke={stroke} strokeWidth={1.2} opacity={0.6} />)}<Line points={[width * 0.08, height * 0.25, width * 0.25, height * 0.18, width * 0.43, height * 0.3, width * 0.63, height * 0.2, width * 0.92, height * 0.24]} tension={0.35} stroke={stroke} opacity={0.45} /><Line points={[width * 0.1, height * 0.72, width * 0.32, height * 0.62, width * 0.54, height * 0.78, width * 0.84, height * 0.66]} tension={0.35} stroke={stroke} opacity={0.45} /></>;
}

function KonvaCarpet({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return (
    <>
      <Rect x={width * 0.15} y={height * 0.15} width={width * 0.7} height={height * 0.7} fill="rgba(0,0,0,0.1)" stroke={stroke} strokeWidth={2} cornerRadius={Math.min(width, height) * 0.06} />
      <Rect x={width * 0.25} y={height * 0.25} width={width * 0.5} height={height * 0.5} stroke={stroke} opacity={0.55} cornerRadius={Math.min(width, height) * 0.04} />
      <Circle x={width * 0.5} y={height * 0.5} radius={Math.min(width, height) * 0.16} stroke={stroke} opacity={0.45} />
      <Line points={[width * 0.25, height * 0.38, width * 0.75, height * 0.38]} stroke={stroke} opacity={0.4} />
      <Line points={[width * 0.25, height * 0.62, width * 0.75, height * 0.62]} stroke={stroke} opacity={0.4} />
    </>
  );
}

function KonvaTile({ width, height, stroke, marble }: { width: number; height: number; stroke: string; marble?: boolean }) {
  return <>{[0.25, 0.5, 0.75].map((v) => <Line key={`x${v}`} points={[width * v, 0, width * v, height]} stroke={stroke} strokeWidth={1} opacity={0.45} />)}{[0.25, 0.5, 0.75].map((v) => <Line key={`y${v}`} points={[0, height * v, width, height * v]} stroke={stroke} strokeWidth={1} opacity={0.45} />)}{marble ? <Line points={[width * 0.08, height * 0.88, width * 0.36, height * 0.52, width * 0.62, height * 0.58, width * 0.9, height * 0.12]} tension={0.35} stroke="#ffffff" opacity={0.4} /> : null}</>;
}

function KonvaMud({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <>{[[0.32, 0.34, 0.24], [0.68, 0.62, 0.22], [0.42, 0.76, 0.12]].map(([x, y, r], index) => <Circle key={index} x={width * x} y={height * y} radius={Math.min(width, height) * r} fill={stroke} opacity={0.25} />)}</>;
}

function KonvaPuddle({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Line points={[width * 0.16, height * 0.58, width * 0.24, height * 0.25, width * 0.54, height * 0.34, width * 0.78, height * 0.2, width * 0.9, height * 0.56, width * 0.68, height * 0.82, width * 0.28, height * 0.78]} closed tension={0.45} fill={stroke} opacity={0.36} stroke="#dbeafe" strokeWidth={1} /></>;
}

function KonvaBlood({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <>{[[0.42, 0.48, 0.2], [0.6, 0.6, 0.12], [0.32, 0.75, 0.08], [0.74, 0.33, 0.06]].map(([x, y, r], index) => <Circle key={index} x={width * x} y={height * y} radius={Math.min(width, height) * r} fill={stroke || '#991b1b'} opacity={0.72} />)}</>;
}

function KonvaDoor({ width, height, stroke, doubleDoor, trapdoor }: { width: number; height: number; stroke: string; doubleDoor?: boolean; trapdoor?: boolean }) {
  if (trapdoor) return <><Rect x={width * 0.18} y={height * 0.18} width={width * 0.64} height={height * 0.64} stroke={stroke} strokeWidth={3} /><Line points={[width * 0.18, height * 0.5, width * 0.82, height * 0.5]} stroke={stroke} /><Circle x={width * 0.72} y={height * 0.36} radius={2.2} fill={stroke} /></>;
  return <><Rect x={width * 0.18} y={height * 0.1} width={width * 0.64} height={height * 0.8} stroke={stroke} strokeWidth={3} fill="rgba(0,0,0,0.16)" cornerRadius={2} />{doubleDoor ? <Line points={[width * 0.5, height * 0.1, width * 0.5, height * 0.9]} stroke={stroke} strokeWidth={2} /> : null}<Rect x={width * 0.26} y={height * 0.22} width={width * (doubleDoor ? 0.18 : 0.44)} height={height * 0.2} stroke={stroke} opacity={0.65} /><Rect x={width * (doubleDoor ? 0.56 : 0.26)} y={height * 0.58} width={width * (doubleDoor ? 0.18 : 0.44)} height={height * 0.2} stroke={stroke} opacity={0.65} /><Circle x={width * 0.72} y={height * 0.5} radius={2.4} fill={stroke} /></>;
}

function KonvaWindow({ width, height, stroke, broken }: { width: number; height: number; stroke: string; broken?: boolean }) {
  return <><Rect x={width * 0.13} y={height * 0.23} width={width * 0.74} height={height * 0.54} fill="#0f172a" opacity={0.35} stroke={stroke} strokeWidth={3} cornerRadius={2} /><Line points={[width * 0.5, height * 0.23, width * 0.5, height * 0.77]} stroke={stroke} /><Line points={[width * 0.13, height * 0.5, width * 0.87, height * 0.5]} stroke={stroke} />{broken ? <><Line points={[width * 0.26, height * 0.28, width * 0.48, height * 0.5, width * 0.36, height * 0.72]} stroke="#e0f2fe" strokeWidth={1.4} /><Line points={[width * 0.62, height * 0.28, width * 0.5, height * 0.5, width * 0.75, height * 0.72]} stroke="#e0f2fe" strokeWidth={1.4} /></> : null}</>;
}

function KonvaLight({ width, height, stroke, color }: { width: number; height: number; stroke: string; color: string }) {
  const size = Math.min(width, height);
  return <><Circle x={width / 2} y={height / 2} radius={size * 0.42} fill={color} opacity={0.22} /><Line points={[width * 0.5, height * 0.2, width * 0.5, height * 0.78]} stroke={stroke} strokeWidth={Math.max(2, size * 0.06)} /><Circle x={width * 0.5} y={height * 0.28} radius={size * 0.13} fill={color} stroke="#fff7bd" strokeWidth={2} /></>;
}

function KonvaBarrel({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.22} y={height * 0.2} width={width * 0.56} height={height * 0.6} fill="rgba(0,0,0,0.14)" stroke={stroke} strokeWidth={2} cornerRadius={Math.min(width, height) * 0.18} /><Line points={[width * 0.26, height * 0.32, width * 0.74, height * 0.32]} stroke={stroke} /><Line points={[width * 0.26, height * 0.68, width * 0.74, height * 0.68]} stroke={stroke} /></>;
}

function KonvaCrate({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.16} y={height * 0.16} width={width * 0.68} height={height * 0.68} fill="rgba(0,0,0,0.12)" stroke={stroke} strokeWidth={2.4} /><Line points={[width * 0.16, height * 0.16, width * 0.84, height * 0.84]} stroke={stroke} strokeWidth={1.8} /><Line points={[width * 0.84, height * 0.16, width * 0.16, height * 0.84]} stroke={stroke} strokeWidth={1.8} /></>;
}

function KonvaTable({ width, height, stroke, round }: { width: number; height: number; stroke: string; round?: boolean }) {
  const size = Math.min(width, height);
  if (round) return <><Circle x={width / 2} y={height / 2} radius={size * 0.38} fill="rgba(0,0,0,0.16)" stroke={stroke} strokeWidth={2.6} /><Circle x={width / 2} y={height / 2} radius={size * 0.1} fill={stroke} opacity={0.2} /></>;
  const x = width * 0.1;
  const y = height * 0.18;
  const w = width * 0.8;
  const h = height * 0.64;
  return <><Rect x={x} y={y} width={w} height={h} fill="rgba(0,0,0,0.16)" stroke={stroke} strokeWidth={2.6} cornerRadius={Math.min(width, height) * 0.06} /><Circle x={x + w * 0.12} y={y + h * 0.18} radius={size * 0.04} fill={stroke} opacity={0.55} /><Circle x={x + w * 0.88} y={y + h * 0.18} radius={size * 0.04} fill={stroke} opacity={0.55} /><Circle x={x + w * 0.12} y={y + h * 0.82} radius={size * 0.04} fill={stroke} opacity={0.55} /><Circle x={x + w * 0.88} y={y + h * 0.82} radius={size * 0.04} fill={stroke} opacity={0.55} /></>;
}

function KonvaCounter({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.07} y={height * 0.22} width={width * 0.86} height={height * 0.56} fill="rgba(0,0,0,0.18)" stroke={stroke} strokeWidth={2.6} cornerRadius={Math.min(width, height) * 0.06} /><Line points={[width * 0.12, height * 0.4, width * 0.88, height * 0.4]} stroke={stroke} opacity={0.55} /><Line points={[width * 0.3, height * 0.24, width * 0.3, height * 0.76]} stroke={stroke} opacity={0.34} /><Line points={[width * 0.68, height * 0.24, width * 0.68, height * 0.76]} stroke={stroke} opacity={0.34} /></>;
}

function KonvaChair({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  const size = Math.min(width, height);
  return <><Rect x={width * 0.28} y={height * 0.38} width={width * 0.44} height={height * 0.36} fill="rgba(0,0,0,0.14)" stroke={stroke} strokeWidth={2.2} cornerRadius={size * 0.08} /><Rect x={width * 0.22} y={height * 0.18} width={width * 0.56} height={height * 0.2} fill="rgba(0,0,0,0.2)" stroke={stroke} strokeWidth={1.8} cornerRadius={size * 0.06} /><Line points={[width * 0.33, height * 0.76, width * 0.27, height * 0.92]} stroke={stroke} strokeWidth={1.6} /><Line points={[width * 0.67, height * 0.76, width * 0.73, height * 0.92]} stroke={stroke} strokeWidth={1.6} /></>;
}

function KonvaBed({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.16} y={height * 0.08} width={width * 0.68} height={height * 0.84} fill="rgba(0,0,0,0.12)" stroke={stroke} strokeWidth={2.4} cornerRadius={Math.min(width, height) * 0.08} /><Rect x={width * 0.24} y={height * 0.16} width={width * 0.52} height={height * 0.18} fill="#d9c9a1" stroke={stroke} opacity={0.9} cornerRadius={3} /><Rect x={width * 0.24} y={height * 0.42} width={width * 0.52} height={height * 0.42} fill={stroke} opacity={0.18} cornerRadius={3} /></>;
}

function KonvaBook({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.18} y={height * 0.25} width={width * 0.64} height={height * 0.5} fill="#d9c9a1" stroke={stroke} strokeWidth={1.8} cornerRadius={2} /><Line points={[width * 0.5, height * 0.25, width * 0.5, height * 0.75]} stroke={stroke} strokeWidth={1.6} /><Line points={[width * 0.28, height * 0.4, width * 0.44, height * 0.4]} stroke="#6b5b43" /><Line points={[width * 0.56, height * 0.4, width * 0.72, height * 0.4]} stroke="#6b5b43" /><Line points={[width * 0.28, height * 0.55, width * 0.42, height * 0.55]} stroke="#6b5b43" /><Line points={[width * 0.58, height * 0.55, width * 0.7, height * 0.55]} stroke="#6b5b43" /></>;
}

function KonvaTerminal({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.18} y={height * 0.2} width={width * 0.64} height={height * 0.56} fill="rgba(0,0,0,0.2)" stroke={stroke} strokeWidth={2.4} cornerRadius={Math.min(width, height) * 0.06} /><Rect x={width * 0.28} y={height * 0.3} width={width * 0.44} height={height * 0.22} fill="#0f172a" stroke={stroke} opacity={0.75} cornerRadius={2} /><Circle x={width * 0.34} y={height * 0.64} radius={Math.min(width, height) * 0.035} fill="#86efac" /><Circle x={width * 0.46} y={height * 0.64} radius={Math.min(width, height) * 0.035} fill="#facc15" /><Line points={[width * 0.58, height * 0.64, width * 0.72, height * 0.64]} stroke={stroke} strokeWidth={1.8} /></>;
}

function KonvaShelf({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.2} y={height * 0.08} width={width * 0.6} height={height * 0.84} fill="rgba(0,0,0,0.16)" stroke={stroke} strokeWidth={2.4} cornerRadius={Math.min(width, height) * 0.05} /><Line points={[width * 0.22, height * 0.33, width * 0.78, height * 0.33]} stroke={stroke} opacity={0.62} /><Line points={[width * 0.22, height * 0.58, width * 0.78, height * 0.58]} stroke={stroke} opacity={0.62} />{[0.3, 0.42, 0.62, 0.72].map((x, index) => <Rect key={index} x={width * x} y={height * (index < 2 ? 0.14 : 0.63)} width={width * 0.055} height={height * 0.16} fill={stroke} opacity={0.34} />)}</>;
}

function KonvaPaper({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.25} y={height * 0.15} width={width * 0.5} height={height * 0.7} fill="#d9c9a1" stroke={stroke} cornerRadius={2} /><Line points={[width * 0.35, height * 0.34, width * 0.66, height * 0.34]} stroke="#6b5b43" /><Line points={[width * 0.35, height * 0.48, width * 0.66, height * 0.48]} stroke="#6b5b43" /><Line points={[width * 0.35, height * 0.62, width * 0.58, height * 0.62]} stroke="#6b5b43" /></>;
}

function KonvaFootprint({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  const r = Math.min(width, height);
  return <><Circle x={width * 0.38} y={height * 0.36} radius={r * 0.08} fill={stroke} opacity={0.75} scaleY={1.7} rotation={-25} /><Circle x={width * 0.62} y={height * 0.66} radius={r * 0.08} fill={stroke} opacity={0.75} scaleY={1.7} rotation={-25} /></>;
}

function KonvaBlade({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Line points={[width * 0.25, height * 0.72, width * 0.62, height * 0.22, width * 0.78, height * 0.18, width * 0.45, height * 0.68]} closed fill="#d1d5db" stroke={stroke} /><Rect x={width * 0.2} y={height * 0.68} width={width * 0.28} height={height * 0.1} fill="#5b3823" stroke={stroke} cornerRadius={2} rotation={-35} /></>;
}

function KonvaFog({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Line points={[width * 0.08, height * 0.32, width * 0.3, height * 0.18, width * 0.5, height * 0.36, width * 0.7, height * 0.24, width * 0.94, height * 0.36]} tension={0.5} stroke={stroke} strokeWidth={Math.max(4, height * 0.08)} opacity={0.55} lineCap="round" /><Line points={[width * 0.06, height * 0.62, width * 0.28, height * 0.5, width * 0.52, height * 0.72, width * 0.78, height * 0.56, width * 0.96, height * 0.66]} tension={0.5} stroke={stroke} strokeWidth={Math.max(4, height * 0.08)} opacity={0.55} lineCap="round" /></>;
}

function KonvaBars({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <>{[0.22, 0.4, 0.58, 0.76].map((v) => <Line key={v} points={[width * v, height * 0.1, width * v, height * 0.9]} stroke={stroke} strokeWidth={Math.max(2, width * 0.045)} />)}<Line points={[width * 0.1, height * 0.28, width * 0.9, height * 0.28]} stroke={stroke} /><Line points={[width * 0.1, height * 0.72, width * 0.9, height * 0.72]} stroke={stroke} /></>;
}

function KonvaVehicle({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.16} y={height * 0.18} width={width * 0.68} height={height * 0.62} fill="rgba(0,0,0,0.16)" stroke={stroke} strokeWidth={2.4} cornerRadius={Math.min(width, height) * 0.14} /><Circle x={width * 0.28} y={height * 0.84} radius={Math.min(width, height) * 0.08} fill="#111" stroke={stroke} /><Circle x={width * 0.72} y={height * 0.84} radius={Math.min(width, height) * 0.08} fill="#111" stroke={stroke} /><Rect x={width * 0.32} y={height * 0.28} width={width * 0.36} height={height * 0.2} fill="rgba(255,255,255,0.12)" stroke={stroke} /></>;
}

function KonvaProp({ width, height, stroke }: { width: number; height: number; stroke: string }) {
  return <><Rect x={width * 0.24} y={height * 0.24} width={width * 0.52} height={height * 0.52} fill="rgba(0,0,0,0.14)" stroke={stroke} strokeWidth={2.2} cornerRadius={Math.min(width, height) * 0.1} /><Circle x={width * 0.5} y={height * 0.5} radius={Math.min(width, height) * 0.13} fill={stroke} opacity={0.32} /></>;
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_-]+/g, ' ');
}

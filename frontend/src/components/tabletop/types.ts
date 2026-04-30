import type {
  Asset,
  FogLayer,
  LightSource,
  MapLayerKey,
  MapObject,
  MapObjectKind,
  MapSummary,
  MapTool,
  ObjectLayer,
  OmniMap,
  TabletopMode,
  TabletopToken,
  TabletopTokenKind,
  TileCell,
  TileLayer,
  Tileset
} from '../../api/types';

export type {
  Asset,
  FogLayer,
  LightSource,
  MapLayerKey,
  MapObject,
  MapObjectKind,
  MapSummary,
  MapTool,
  ObjectLayer,
  OmniMap,
  TabletopMode,
  TabletopToken,
  TabletopTokenKind,
  TileCell,
  TileLayer,
  Tileset
};

export type TileLayerKey = 'floor' | 'walls' | 'collision';
export type ObjectLayerKey = 'objects' | 'decoration' | 'lighting' | 'notes';

export interface AvailableTabletopToken {
  id: string;
  sourceId: string;
  kind: TabletopTokenKind;
  name: string;
  image?: string;
  hpCurrent?: number;
  hpMax?: number;
  subtitle?: string;
}

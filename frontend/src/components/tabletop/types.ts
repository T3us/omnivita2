import type {
  Asset,
  AssetDefinition,
  AssetTheme,
  AssetTypeCategory,
  EraseMode,
  FogLayer,
  LightSource,
  MapLayerKey,
  MapObject,
  MapObjectKind,
  MapPrefab,
  MapPrefabObject,
  MapSummary,
  MapTool,
  ObjectLayer,
  OmniMap,
  SnapMode,
  TabletopMode,
  TabletopToken,
  TabletopTokenKind,
  TileCell,
  TileLayer,
  Tileset
} from '../../api/types';

export type {
  Asset,
  AssetDefinition,
  AssetTheme,
  AssetTypeCategory,
  EraseMode,
  FogLayer,
  LightSource,
  MapLayerKey,
  MapObject,
  MapObjectKind,
  MapPrefab,
  MapPrefabObject,
  MapSummary,
  MapTool,
  ObjectLayer,
  OmniMap,
  SnapMode,
  TabletopMode,
  TabletopToken,
  TabletopTokenKind,
  TileCell,
  TileLayer,
  Tileset
};

export type TileLayerKey = 'floor' | 'walls' | 'collision';
export type ObjectLayerKey = 'objects' | 'decoration' | 'details' | 'lighting' | 'mechanics' | 'notes';

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

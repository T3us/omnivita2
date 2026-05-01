import type {
  Asset,
  AssetDefinition,
  AssetTheme,
  AssetTypeCategory,
  DoorState,
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
  SelectedTileCell,
  SnapMode,
  TabletopMode,
  TabletopToken,
  TabletopTokenKind,
  TileCell,
  TileLayer,
  TileLayerKey,
  Tileset
} from '../../api/types';

export type {
  Asset,
  AssetDefinition,
  AssetTheme,
  AssetTypeCategory,
  DoorState,
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
  SelectedTileCell,
  SnapMode,
  TabletopMode,
  TabletopToken,
  TabletopTokenKind,
  TileCell,
  TileLayer,
  TileLayerKey,
  Tileset
};

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

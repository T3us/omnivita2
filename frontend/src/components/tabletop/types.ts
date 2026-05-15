import type {
  Asset,
  AssetDefinition,
  AssetPack,
  AssetTheme,
  AssetTypeCategory,
  AreaTemplate,
  BackupImportResult,
  BackupSummary,
  DoorState,
  EraseMode,
  FogLayer,
  FogState,
  LightingRegion,
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
  PrefabDefinition,
  SavedMap,
  SelectedTileCell,
  SessionBoard,
  SessionBoardSummary,
  SessionCameraState,
  SessionDoorState,
  SessionFogState,
  SessionLightingState,
  SessionMapInstance,
  SessionToken,
  SessionViewMode,
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
  AssetPack,
  AssetTheme,
  AssetTypeCategory,
  AreaTemplate,
  BackupImportResult,
  BackupSummary,
  DoorState,
  EraseMode,
  FogLayer,
  FogState,
  LightingRegion,
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
  PrefabDefinition,
  SavedMap,
  SelectedTileCell,
  SessionBoard,
  SessionBoardSummary,
  SessionCameraState,
  SessionDoorState,
  SessionFogState,
  SessionLightingState,
  SessionMapInstance,
  SessionToken,
  SessionViewMode,
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
  visibleToPlayers?: boolean;
  hidden?: boolean;
  locked?: boolean;
  status?: string;
  statusMarkers?: string[];
  size?: number;
  auraColor?: string;
  visionEnabled?: boolean;
  visionRadius?: number;
  dimVisionRadius?: number;
  brightVisionRadius?: number;
  lightRadius?: number;
}

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
  MapBounds,
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
  TokenDefinition,
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
  MapBounds,
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
  TokenDefinition,
  TileCell,
  TileLayer,
  TileLayerKey,
  Tileset
};

export type ObjectLayerKey = 'objects' | 'decoration' | 'details' | 'lighting' | 'mechanics' | 'notes';

export type SessionSelectedEntity =
  | { type: 'token'; id: string }
  | { type: 'map'; id: string }
  | { type: 'object'; id: string }
  | { type: 'region'; id: string }
  | { type: 'template'; id: string }
  | { type: 'light'; id: string }
  | { type: 'door'; id: string; x: number; y: number };

export interface AvailableTabletopToken {
  id: string;
  sourceId: string;
  definitionId?: string;
  ownerUserId?: string;
  ownerCharacterId?: string;
  controlledByUserIds?: string[];
  formOwnerCharacterId?: string;
  sourceSheetId?: string;
  sourceFormId?: string;
  isPlayerToken?: boolean;
  isFormToken?: boolean;
  isMiniSheetToken?: boolean;
  isSummonToken?: boolean;
  blocksMovement?: boolean;
  kind: TabletopTokenKind;
  name: string;
  image?: string;
  color?: string;
  notes?: string;
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

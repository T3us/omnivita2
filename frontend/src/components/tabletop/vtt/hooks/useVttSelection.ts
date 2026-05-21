import { useMemo } from 'react';
import { useTabletopStore } from '../../mapStore';
import type { SessionSelectedEntity } from '../../types';

export function entityKey(entity: SessionSelectedEntity) {
  return entity.type === 'door' ? `${entity.type}:${entity.x}:${entity.y}` : `${entity.type}:${entity.id}`;
}

export function useVttSelection() {
  const entities = useTabletopStore((state) => state.selectedEntities);
  const setSelection = useTabletopStore((state) => state.setSelection);
  const addToSelection = useTabletopStore((state) => state.addToSelection);
  const toggleSelection = useTabletopStore((state) => state.toggleSelection);
  const clearSelection = useTabletopStore((state) => state.clearSelection);
  const selectEntity = useTabletopStore((state) => state.selectEntity);
  const selectedKeys = useMemo(() => new Set(entities.map(entityKey)), [entities]);

  return {
    entities,
    selectedKeys,
    setSelection,
    addToSelection,
    toggleSelection,
    clearSelection,
    selectEntity,
    has(entity: SessionSelectedEntity) {
      return selectedKeys.has(entityKey(entity));
    }
  };
}

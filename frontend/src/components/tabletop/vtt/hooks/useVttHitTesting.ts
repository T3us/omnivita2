import { useMemo } from 'react';
import type { AreaTemplate, MapObject, OmniMap, SessionMapInstance, SessionSelectedEntity, TabletopToken } from '../../types';

export type VttRect = { x: number; y: number; width: number; height: number };
export type VttHitPoint = { x: number; y: number };

export function useVttHitTesting(map: OmniMap, viewMode: 'gm' | 'player-preview') {
  return useMemo(() => createVttHitTesting(map, viewMode), [map, viewMode]);
}

export function createVttHitTesting(map: OmniMap, viewMode: 'gm' | 'player-preview') {
  function hitTest(point: VttHitPoint): SessionSelectedEntity | null {
    const token = [...map.tokens]
      .filter((entry) => isTokenVisible(entry, viewMode))
      .reverse()
      .find((entry) => pointInRect(point, tokenBounds(map, entry)));
    if (token) return { type: 'token', id: token.id };

    const template = [...(map.areaTemplates || [])]
      .filter((entry) => viewMode === 'gm' || entry.visibleToPlayers !== false)
      .reverse()
      .find((entry) => pointInRect(point, templateBounds(entry)));
    if (template) return { type: 'template', id: template.id };

    const object = getObjects(map)
      .filter((entry) => viewMode === 'gm' || entry.visibleToPlayers !== false)
      .sort((left, right) => right.zIndex - left.zIndex)
      .find((entry) => pointInRect(point, objectBounds(entry)));
    if (object) return object.kind === 'light' ? { type: 'light', id: object.id } : { type: 'object', id: object.id };

    const instance = [...(map.sessionMapInstances || [])]
      .filter((entry) => viewMode === 'gm' || entry.visibleToPlayers !== false)
      .sort((left, right) => Number(right.zIndex || 0) - Number(left.zIndex || 0))
      .find((entry) => pointInRect(point, mapInstanceBounds(entry)));
    if (instance) return { type: 'map', id: instance.id };

    if (pointInRect(point, baseMapBounds(map))) {
      return { type: 'map', id: 'base-map' };
    }
    return null;
  }

  function boxSelect(rect: VttRect): SessionSelectedEntity[] {
    const area = normalizeRect(rect);
    const entities: SessionSelectedEntity[] = [];
    map.tokens.filter((entry) => isTokenVisible(entry, viewMode)).forEach((entry) => {
      if (rectsIntersect(tokenBounds(map, entry), area)) entities.push({ type: 'token', id: entry.id });
    });
    (map.areaTemplates || []).forEach((entry) => {
      if (viewMode !== 'gm' && entry.visibleToPlayers === false) return;
      if (rectsIntersect(templateBounds(entry), area)) entities.push({ type: 'template', id: entry.id });
    });
    getObjects(map).forEach((entry) => {
      if (viewMode !== 'gm' && entry.visibleToPlayers === false) return;
      if (rectsIntersect(objectBounds(entry), area)) entities.push(entry.kind === 'light' ? { type: 'light', id: entry.id } : { type: 'object', id: entry.id });
    });
    (map.sessionMapInstances || []).forEach((entry) => {
      if (viewMode !== 'gm' && entry.visibleToPlayers === false) return;
      if (rectsIntersect(mapInstanceBounds(entry), area)) entities.push({ type: 'map', id: entry.id });
    });
    return entities;
  }

  function getEntityBounds(entity: SessionSelectedEntity): VttRect | null {
    if (entity.type === 'token') {
      const token = map.tokens.find((entry) => entry.id === entity.id);
      return token ? tokenBounds(map, token) : null;
    }
    if (entity.type === 'map') {
      if (entity.id === 'base-map') return baseMapBounds(map);
      const instance = (map.sessionMapInstances || []).find((entry) => entry.id === entity.id);
      return instance ? mapInstanceBounds(instance) : null;
    }
    if (entity.type === 'object' || entity.type === 'light') {
      const object = getObjects(map).find((entry) => entry.id === entity.id);
      return object ? objectBounds(object) : null;
    }
    if (entity.type === 'template') {
      const template = (map.areaTemplates || []).find((entry) => entry.id === entity.id);
      return template ? templateBounds(template) : null;
    }
    return null;
  }

  return { hitTest, getTopmostEntityAt: hitTest, boxSelect, getEntityBounds };
}

function getObjects(map: OmniMap): MapObject[] {
  return [
    ...map.decorationLayer.objects,
    ...map.objectLayer.objects,
    ...map.detailLayer.objects,
    ...map.lightingLayer.objects,
    ...map.mechanicalLayer.objects,
    ...map.notesLayer.objects
  ];
}

function isTokenVisible(token: TabletopToken, viewMode: 'gm' | 'player-preview') {
  return viewMode === 'gm' || (token.visibleToPlayers && !token.hidden);
}

function tokenBounds(map: OmniMap, token: TabletopToken): VttRect {
  const size = map.gridSize * Math.max(0.5, token.size || 1);
  return { x: token.x * map.gridSize, y: token.y * map.gridSize, width: size, height: size };
}

function baseMapBounds(map: OmniMap): VttRect {
  const bounds = map.bounds || { x: 0, y: 0, width: map.width, height: map.height };
  return {
    x: bounds.x * map.gridSize,
    y: bounds.y * map.gridSize,
    width: bounds.width * map.gridSize,
    height: bounds.height * map.gridSize
  };
}

function mapInstanceBounds(instance: SessionMapInstance): VttRect {
  return { x: instance.x, y: instance.y, width: instance.width * instance.gridSize, height: instance.height * instance.gridSize };
}

function objectBounds(object: MapObject): VttRect {
  return { x: object.x, y: object.y, width: object.width * (object.scale || 1), height: object.height * (object.scale || 1) };
}

function templateBounds(template: AreaTemplate): VttRect {
  if (template.radius) return { x: template.x - template.radius, y: template.y - template.radius, width: template.radius * 2, height: template.radius * 2 };
  if (template.shape === 'line') {
    const x = Math.min(template.x, template.x + template.width);
    const y = Math.min(template.y, template.y + template.height);
    return { x, y, width: Math.max(8, Math.abs(template.width)), height: Math.max(8, Math.abs(template.height)) };
  }
  return { x: template.x - Math.abs(template.width) / 2, y: template.y - Math.abs(template.height) / 2, width: Math.max(8, Math.abs(template.width)), height: Math.max(8, Math.abs(template.height)) };
}

function pointInRect(point: VttHitPoint, rect: VttRect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function rectsIntersect(a: VttRect, b: VttRect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function normalizeRect(rect: VttRect): VttRect {
  const x = Math.min(rect.x, rect.x + rect.width);
  const y = Math.min(rect.y, rect.y + rect.height);
  return { x, y, width: Math.abs(rect.width), height: Math.abs(rect.height) };
}

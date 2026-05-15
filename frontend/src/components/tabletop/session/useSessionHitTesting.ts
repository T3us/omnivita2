import { useMemo } from 'react';
import type { LightingRegion, MapObject, OmniMap, SessionMapInstance, SessionSelectedEntity, TabletopToken } from '../types';

export type RectLike = { x: number; y: number; width: number; height: number };
export type HitPoint = { x: number; y: number };

export function useSessionHitTesting(map: OmniMap, viewMode: 'gm' | 'player-preview') {
  return useMemo(() => createSessionHitTesting(map, viewMode), [map, viewMode]);
}

export function createSessionHitTesting(map: OmniMap, viewMode: 'gm' | 'player-preview') {
  function hitTest(point: HitPoint): SessionSelectedEntity | null {
    const token = [...map.tokens]
      .filter((entry) => isTokenVisible(entry, viewMode))
      .reverse()
      .find((entry) => pointInRect(point, getTokenBounds(map, entry)));
    if (token) return { type: 'token', id: token.id };

    const object = getSessionObjects(map)
      .filter((entry) => isObjectVisible(entry, viewMode))
      .sort((left, right) => right.zIndex - left.zIndex)
      .find((entry) => pointInRect(point, getObjectBounds(entry)));
    if (object) return { type: 'object', id: object.id };

    const region = [...(map.sessionLighting?.regions || map.lightingRegions || [])]
      .filter((entry) => viewMode === 'gm' ? entry.visibleToGM !== false : entry.visibleToPlayers !== false)
      .reverse()
      .find((entry) => pointInRect(point, getLightingRegionBounds(entry)));
    if (region) return { type: 'region', id: region.id };

    const template = [...(map.areaTemplates || [])]
      .filter((entry) => viewMode === 'gm' || entry.visibleToPlayers !== false)
      .reverse()
      .find((entry) => pointInRect(point, getTemplateBounds(entry)));
    if (template) return { type: 'template', id: template.id };

    const instance = [...(map.sessionMapInstances || [])]
      .filter((entry) => isMapInstanceVisible(entry, viewMode))
      .sort((left, right) => Number(right.zIndex || 0) - Number(left.zIndex || 0))
      .find((entry) => pointInRect(point, getMapInstanceBounds(entry)));
    if (instance) return { type: 'map', id: instance.id };

    return null;
  }

  function boxSelect(rect: RectLike): SessionSelectedEntity[] {
    const normalized = normalizeRect(rect);
    const entities: SessionSelectedEntity[] = [];
    map.tokens
      .filter((entry) => isTokenVisible(entry, viewMode))
      .forEach((entry) => {
        if (rectsIntersect(getTokenBounds(map, entry), normalized)) entities.push({ type: 'token', id: entry.id });
      });
    getSessionObjects(map)
      .filter((entry) => isObjectVisible(entry, viewMode))
      .forEach((entry) => {
        if (rectsIntersect(getObjectBounds(entry), normalized)) entities.push({ type: 'object', id: entry.id });
      });
    (map.sessionLighting?.regions || map.lightingRegions || []).forEach((entry) => {
      if (viewMode !== 'gm' && entry.visibleToPlayers === false) return;
      if (viewMode === 'gm' && entry.visibleToGM === false) return;
      if (rectsIntersect(getLightingRegionBounds(entry), normalized)) entities.push({ type: 'region', id: entry.id });
    });
    (map.areaTemplates || []).forEach((entry) => {
      if (viewMode !== 'gm' && entry.visibleToPlayers === false) return;
      if (rectsIntersect(getTemplateBounds(entry), normalized)) entities.push({ type: 'template', id: entry.id });
    });
    (map.sessionMapInstances || []).forEach((entry) => {
      if (!isMapInstanceVisible(entry, viewMode)) return;
      if (rectsIntersect(getMapInstanceBounds(entry), normalized)) entities.push({ type: 'map', id: entry.id });
    });
    return entities;
  }

  return {
    hitTest,
    boxSelect,
    getEntityBounds: (entity: SessionSelectedEntity) => getEntityBounds(map, entity)
  };
}

export function getEntityBounds(map: OmniMap, entity: SessionSelectedEntity): RectLike | null {
  if (entity.type === 'token') {
    const token = map.tokens.find((entry) => entry.id === entity.id);
    return token ? getTokenBounds(map, token) : null;
  }
  if (entity.type === 'object') {
    const object = getSessionObjects(map).find((entry) => entry.id === entity.id);
    return object ? getObjectBounds(object) : null;
  }
  if (entity.type === 'map') {
    const instance = (map.sessionMapInstances || []).find((entry) => entry.id === entity.id);
    return instance ? getMapInstanceBounds(instance) : null;
  }
  if (entity.type === 'region') {
    const region = (map.sessionLighting?.regions || map.lightingRegions || []).find((entry) => entry.id === entity.id);
    return region ? getLightingRegionBounds(region) : null;
  }
  if (entity.type === 'template') {
    const template = (map.areaTemplates || []).find((entry) => entry.id === entity.id);
    return template ? getTemplateBounds(template) : null;
  }
  if (entity.type === 'door') {
    return { x: entity.x * map.gridSize, y: entity.y * map.gridSize, width: map.gridSize, height: map.gridSize };
  }
  return null;
}

function getSessionObjects(map: OmniMap): MapObject[] {
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

function isObjectVisible(object: MapObject, viewMode: 'gm' | 'player-preview') {
  return viewMode === 'gm' || object.visibleToPlayers !== false;
}

function isMapInstanceVisible(instance: SessionMapInstance, viewMode: 'gm' | 'player-preview') {
  return viewMode === 'gm' || instance.visibleToPlayers !== false;
}

function getTokenBounds(map: OmniMap, token: TabletopToken): RectLike {
  const size = map.gridSize * Math.max(0.5, token.size || 1);
  return { x: token.x * map.gridSize, y: token.y * map.gridSize, width: size, height: size };
}

function getObjectBounds(object: MapObject): RectLike {
  return {
    x: object.x,
    y: object.y,
    width: object.width * (object.scale || 1),
    height: object.height * (object.scale || 1)
  };
}

function getMapInstanceBounds(instance: SessionMapInstance): RectLike {
  return {
    x: instance.x,
    y: instance.y,
    width: instance.width * instance.gridSize,
    height: instance.height * instance.gridSize
  };
}

function getLightingRegionBounds(region: LightingRegion): RectLike {
  if (!region.points.length) return { x: 0, y: 0, width: 1, height: 1 };
  const xs = region.points.map((point) => point.x);
  const ys = region.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function getTemplateBounds(template: { x: number; y: number; width: number; height: number; radius?: number }): RectLike {
  if (template.radius) {
    return { x: template.x - template.radius, y: template.y - template.radius, width: template.radius * 2, height: template.radius * 2 };
  }
  return {
    x: template.x - Math.abs(template.width) / 2,
    y: template.y - Math.abs(template.height) / 2,
    width: Math.max(1, Math.abs(template.width)),
    height: Math.max(1, Math.abs(template.height))
  };
}

function pointInRect(point: HitPoint, rect: RectLike) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function rectsIntersect(a: RectLike, b: RectLike) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function normalizeRect(rect: RectLike): RectLike {
  const x = Math.min(rect.x, rect.x + rect.width);
  const y = Math.min(rect.y, rect.y + rect.height);
  return { x, y, width: Math.abs(rect.width), height: Math.abs(rect.height) };
}

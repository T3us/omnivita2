import { Rect } from 'react-konva';

export function SelectionOverlay({ box }: { box: { x: number; y: number; width: number; height: number } }) {
  const x = Math.min(box.x, box.x + box.width);
  const y = Math.min(box.y, box.y + box.height);
  return (
    <Rect
      x={x}
      y={y}
      width={Math.abs(box.width)}
      height={Math.abs(box.height)}
      fill="#60a5fa"
      opacity={0.14}
      stroke="#93c5fd"
      strokeWidth={1}
      dash={[6, 4]}
      listening={false}
    />
  );
}

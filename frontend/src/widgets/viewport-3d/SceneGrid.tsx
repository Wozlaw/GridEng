interface SceneGridProps {
  size?: number;
  divisions?: number;
}

export function SceneGrid({ size = 12000, divisions = 24 }: SceneGridProps) {
  return (
    <gridHelper
      args={[size, divisions, '#27485a', '#14212c']}
      position={[0, 0, 0]}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
}

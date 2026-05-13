import { useTheme } from '@mui/material/styles';

interface SceneGridProps {
  size?: number;
  divisions?: number;
}

export function SceneGrid({ size = 12000, divisions = 24 }: SceneGridProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const sectionColor = isDark ? '#27485a' : '#9aa7b1';
  const cellColor = isDark ? '#14212c' : '#d4dbe0';

  return (
    <gridHelper
      args={[size, divisions, sectionColor, cellColor]}
      position={[0, 0, 0]}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
}

import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    selected: Palette['primary'];
    profile: Palette['primary'];
    restraint: Palette['primary'];
    loadForce: Palette['primary'];
    loadMoment: Palette['primary'];
  }

  interface PaletteOptions {
    selected?: PaletteOptions['primary'];
    profile?: PaletteOptions['primary'];
    restraint?: PaletteOptions['primary'];
    loadForce?: PaletteOptions['primary'];
    loadMoment?: PaletteOptions['primary'];
  }
}

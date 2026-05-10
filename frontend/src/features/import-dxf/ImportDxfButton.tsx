import { useState } from 'react';

import { Button } from '@mui/material';

import { DxfImportDialog } from './DxfImportDialog';

export function ImportDxfButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Import DXF
      </Button>

      <DxfImportDialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}

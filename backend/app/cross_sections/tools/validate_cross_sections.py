from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Allows running the script directly from repository root before package installation.
CURRENT_DIR = Path(__file__).resolve().parent
PACKAGE_ROOT = CURRENT_DIR.parents[1]
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from cross_sections.validators import validate_data_dir


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate local cross-section sortament JSON files.")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=PACKAGE_ROOT / "cross_sections" / "data",
        help="Directory with profiles.gost_*.json files.",
    )
    parser.add_argument("--no-build", action="store_true", help="Skip Crossection build smoke-check.")
    parser.add_argument("--res", type=float, default=None, help="Optional Crossection raster resolution in mm.")
    args = parser.parse_args()

    result = validate_data_dir(args.data_dir, build_all=not args.no_build, res=args.res)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

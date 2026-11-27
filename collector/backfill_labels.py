"""Tunnisteyhteenvedot vanhoille keruutiedostoille (kertakäsittely, ajetaan Actionsissa).

  python collector/backfill_labels.py            # tekee puuttuvat .labels.json-tiedostot ja lataa ne
  python collector/backfill_labels.py --dry-run  # vain listaa puuttuvat

Lataa Hugging Facesta yksi kerrallaan ne tar-tiedostot, joilta yhteenveto puuttuu, laskee yhteenvedon,
poistaa tar-tiedoston levyltä ja lataa yhteenvedot takaisin 50 tiedoston commiteissa. Turvallinen ajaa
uudelleen: valmiit ohitetaan.
"""
from __future__ import annotations

import argparse
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from digitraffic import station_coords  # noqa: E402
from storage import hf_repo  # noqa: E402
from summary import write_summary  # noqa: E402

BATCH = 50


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    from huggingface_hub import CommitOperationAdd, HfApi, hf_hub_download

    repo, token = hf_repo(), os.environ.get("HF_TOKEN")
    api = HfApi(token=token)
    files = set(api.list_repo_files(repo, repo_type="dataset"))
    tars = sorted(f for f in files if f.startswith("data/") and f.endswith(".tar"))
    missing = [f for f in tars if f[:-4] + ".labels.json" not in files]
    print(f"Keruutiedostoja {len(tars)}, yhteenveto puuttuu {len(missing)}")
    if args.dry_run or not missing:
        return

    coords = station_coords()
    ops: list = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, f in enumerate(missing, 1):
            local: Path | None = None
            try:
                local = Path(hf_hub_download(repo, f, repo_type="dataset", token=token, local_dir=tmp))
                out = write_summary(local, coords)
                ops.append(CommitOperationAdd(path_in_repo=f[:-4] + ".labels.json", path_or_fileobj=out.read_bytes()))
            except Exception as e:
                print(f"  ! {f}: {e}", file=sys.stderr)
            finally:
                if local is not None:
                    local.unlink(missing_ok=True)
            if ops and (len(ops) >= BATCH or i == len(missing)):
                api.create_commit(repo_id=repo, repo_type="dataset", operations=ops,
                                  commit_message=f"Tunnisteyhteenvedot ({len(ops)})")
                print(f"  ladattu {i}/{len(missing)}")
                ops = []


if __name__ == "__main__":
    main()

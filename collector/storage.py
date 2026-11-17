"""Keruutiedostojen tallennus: paikallisesti out/YYYY/MM/DD/ ja Hugging Face -datasettiin (yksityinen)."""
from __future__ import annotations

import os
from datetime import datetime, timedelta
from pathlib import Path

from slots import parse_stamp

OUT = Path(__file__).resolve().parent.parent / "out"


def hf_config() -> tuple[str, str] | None:
    token, repo = os.environ.get("HF_TOKEN"), os.environ.get("HF_REPO")
    return (token, repo) if token and repo else None


def existing_stamps(now: datetime, days: int = 3) -> list[datetime]:
    """Tallennettujen keruuhetkien ajat viime päiviltä (Hugging Face, tai ilman tunnuksia out/)."""
    dates = [now - timedelta(days=d) for d in range(days)]
    if cfg := hf_config():
        from huggingface_hub import HfApi
        api, names = HfApi(token=cfg[0]), []
        for day in dates:
            try:
                names += [f.path.rsplit("/", 1)[-1] for f in
                          api.list_repo_tree(cfg[1], path_in_repo=day.strftime("data/%Y/%m/%d"), repo_type="dataset")]
            except Exception:  # päivän kansiota ei vielä ole
                pass
    else:
        names = [f.name for day in dates for f in (OUT / day.strftime("%Y/%m/%d")).glob("*.tar")]
    return [t for n in names if (t := parse_stamp(n))]


def path_for(t: datetime, suffix: str = ".tar") -> Path:
    d = OUT / t.strftime("%Y/%m/%d")
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{t:%Y%m%dT%H%MZ}{suffix}"


def upload(paths: list[Path]) -> None:
    """Kaikki tiedostot yhtenä committina. Pilvessä puuttuva tunnus on virhe, ettei data katoa hiljaa."""
    if not paths:
        return
    cfg = hf_config()
    if not cfg:
        if os.environ.get("GITHUB_ACTIONS"):
            raise SystemExit("HF_TOKEN-salaisuus tai HF_REPO-muuttuja puuttuu repon asetuksista")
        print("  (HF_TOKEN/HF_REPO puuttuu – ei ladata Hugging Faceen)")
        return
    from huggingface_hub import CommitOperationAdd, HfApi
    api = HfApi(token=cfg[0])
    api.create_repo(cfg[1], repo_type="dataset", private=True, exist_ok=True)
    ops = [CommitOperationAdd(path_in_repo=f"data/{p.relative_to(OUT)}", path_or_fileobj=str(p)) for p in paths]
    api.create_commit(repo_id=cfg[1], repo_type="dataset", operations=ops,
                      commit_message="Keruu " + ", ".join(p.stem for p in paths))
    print(f"  ladattu: {cfg[1]} ({len(paths)} tiedostoa)")

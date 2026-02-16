#!/usr/bin/env python3
from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


REPO_ROOT = Path(__file__).resolve().parent
FRONTEND_INDEX = REPO_ROOT / "frontend" / "index.html"


class FrontendSPAHandler(SimpleHTTPRequestHandler):
    def _requested_path(self) -> str:
        return unquote(urlparse(self.path).path)

    def _map_asset_path(self, request_path: str) -> str | None:
        if request_path in {"/config.js", "/frontend/config.js"}:
            return "/frontend/config.js"

        parts = [part for part in Path(request_path).parts if part not in {"/", ""}]
        if "src" in parts:
            src_index = parts.index("src")
            tail = "/".join(parts[src_index + 1 :])
            return f"/frontend/src/{tail}" if tail else "/frontend/src/"

        if "styles" in parts:
            styles_index = parts.index("styles")
            tail = "/".join(parts[styles_index + 1 :])
            return f"/frontend/styles/{tail}" if tail else "/frontend/styles/"

        return None

    def _should_spa_fallback(self, request_path: str) -> bool:
        normalized = request_path.rstrip("/")

        if normalized in {"", "/frontend"}:
            return True

        if normalized.startswith("/frontend"):
            candidate = REPO_ROOT / request_path.lstrip("/")
            if candidate.is_file():
                return False
            return Path(request_path).suffix == ""

        if request_path.startswith("/backend/") or request_path.startswith("/tests/"):
            return False

        return Path(request_path).suffix == ""

    def _rewrite_if_needed(self) -> None:
        request_path = self._requested_path()

        asset_path = self._map_asset_path(request_path)
        if asset_path:
            self.path = asset_path
            return

        if request_path in {"/", "/index.html", "/frontend", "/frontend/"}:
            self.path = "/frontend/index.html"
            return

        if self._should_spa_fallback(request_path):
            self.path = "/frontend/index.html"

    def do_GET(self) -> None:
        self._rewrite_if_needed()
        super().do_GET()

    def do_HEAD(self) -> None:
        self._rewrite_if_needed()
        super().do_HEAD()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve frontend with SPA fallback at / and /frontend.",
    )
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind.")
    parser.add_argument("--port", type=int, default=43721, help="Port to listen on.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not FRONTEND_INDEX.is_file():
        raise SystemExit(f"Missing frontend entrypoint: {FRONTEND_INDEX}")

    server = ThreadingHTTPServer((args.host, args.port), FrontendSPAHandler)
    print(f"Serving {REPO_ROOT} at http://{args.host}:{args.port}/")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

"""
TestClient Compatibility Helpers.

FastAPI's TestClient on older versions does not support passing JSON bodies
with the delete() helper. The tests expect this convenience argument, so we
patch the client to serialize the payload before executing the actual request.
"""
from __future__ import annotations

import inspect
from typing import Any

try:
    from fastapi.testclient import TestClient
except Exception:  # pragma: no cover - FastAPI might not be installed in prod
    TestClient = None  # type: ignore[assignment]
else:
    _delete_signature = inspect.signature(TestClient.delete)
    if "json" not in _delete_signature.parameters:
        def delete_with_json(
            self,
            url,
            *,
            json: Any = None,
            **kwargs: Any,
        ):
            """Fallback delete that pipes JSON bodies through the generic request()."""
            return self.request("DELETE", url, json=json, **kwargs)

        TestClient.delete = delete_with_json  # type: ignore[assignment]

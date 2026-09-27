"""Modal backend for the PolicyEngine profiler.

Deploy with:
  unset MODAL_TOKEN_ID MODAL_TOKEN_SECRET
  modal deploy modal_app.py

Then set NEXT_PUBLIC_API_URL in Vercel to the deployed endpoint for `profile`.
"""

from __future__ import annotations

import modal


image = (
    modal.Image.debian_slim(python_version="3.13")
    .pip_install(
        "fastapi>=0.115.0,<1",
        "policyengine-us==1.633.2",
        "policyengine-uk==2.78.0",
    )
    .env({"NUMEXPR_MAX_THREADS": "4", "PYTHONPATH": "/root"})
    .workdir("/root")
    .add_local_dir("backend", "/root/backend")
)

app = modal.App("policyengine-profiler")


@app.function(
    image=image,
    timeout=300,
    memory=4096,
    cpu=2.0,
)
@modal.fastapi_endpoint(method="POST")
def profile(payload: dict):
    from backend.profile_core import run_profile

    return run_profile(payload)

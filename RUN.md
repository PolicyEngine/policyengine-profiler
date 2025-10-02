# Quick Start

## Setup

```bash
cd policyengine-profiler
uv venv
source .venv/bin/activate  # or `.venv/Scripts/activate` on Windows
uv pip install -e ".[dev]"
```

## Run Streamlit App

```bash
uv run streamlit run app.py
```

Then open http://localhost:8501

## Run CLI Example

```bash
uv run python example_profile.py
```

This will output detailed profiling data showing the 700x slowdown for reform simulations.

## What You'll See

The profiler will show:
- **Baseline simulation**: ~0.01s
- **Reform simulation**: ~7s (700x slower!)
- **Top bottleneck**: `uprate_parameters()` taking 11+ seconds

This demonstrates the issue reported in [policyengine-core#397](https://github.com/PolicyEngine/policyengine-core/issues/397).

# PolicyEngine Profiler

Performance profiling tools for PolicyEngine simulations.

## Purpose

Diagnose and visualize performance bottlenecks in PolicyEngine simulations, especially:
- Reform simulation overhead
- Parameter uprating costs
- Variable calculation performance
- Memory usage patterns

## Issues Discovered

- **[policyengine-core#397](https://github.com/PolicyEngine/policyengine-core/issues/397)**: Parameter uprating takes 11+ seconds per reform simulation (700-1500x slowdown)

## Example Output

See [DEMO.md](DEMO.md) for full example output showing:
- **Baseline simulation**: 0.011s ✅
- **Reform simulation**: 16.445s ❌ (1511x slower!)
- **Main bottleneck**: `uprate_parameters()` at 11.2 seconds

## Tools

### 1. Streamlit App (`app.py`)
Interactive profiler with visual charts and real-time metrics.

```bash
uv run streamlit run app.py
```

Features:
- Compare baseline vs reform simulation creation time
- Profile variable calculations
- View detailed cProfile output
- Visualize function call trees
- Export profiling data

### 2. Jupyter Notebook (`profile_simulation.ipynb`)
Detailed profiling analysis with code samples and explanations.

```bash
uv run jupyter notebook profile_simulation.ipynb
```

### 3. CLI Tool (`profile_cli.py`)
Quick command-line profiling for CI/CD integration.

```bash
uv run python profile_cli.py --country us --reform aca_extension
```

## Installation

```bash
uv venv
uv pip install -e ".[dev]"
```

## Quick Example

```python
from policyengine_profiler import profile_simulation

# Profile a simple reform
results = profile_simulation(
    country="us",
    reform={"gov.aca.ptc_phase_out_rate[0].amount": {"2026-01-01.2100-12-31": 0}},
    situation={
        "people": {"you": {"age": {2026: 35}}},
        "households": {"your household": {"members": ["you"]}}
    }
)

print(f"Baseline: {results['baseline_time']:.3f}s")
print(f"Reform: {results['reform_time']:.3f}s")
print(f"Overhead: {results['overhead_pct']:.0f}%")
```

## Common Profiling Scenarios

### 1. Reform Overhead
```python
profile_simulation(country="us", reform=my_reform)
```

### 2. Variable Calculation
```python
profile_variable(country="us", variable="aca_ptc", period=2026)
```

### 3. Memory Usage
```python
profile_memory(country="us", n_simulations=100)
```

## Contributing

Found a performance issue?
1. Use this profiler to document it
2. File an issue at the relevant PolicyEngine repo
3. Include profiler output and reproduction steps

## License

AGPL-3.0

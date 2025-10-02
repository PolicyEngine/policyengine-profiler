# Demo Output

## Example CLI Profiler Output

```
================================================================================
PROFILING REFORM SIMULATION OVERHEAD
================================================================================

1. Creating baseline simulation...
   Time: 0.011s

2. Creating reform simulation...
   Time: 16.445s

================================================================================
SUMMARY
================================================================================
Baseline time:   0.011s
Reform time:     16.445s
Overhead:        16.435s (151,040% slower)
Slowdown factor: 1511.4x

================================================================================
TOP 20 FUNCTIONS BY CUMULATIVE TIME
================================================================================
         85598409 function calls (82117281 primitive calls) in 16.435 seconds

   Ordered by: cumulative time
   List reduced from 7006 to 20 due to restriction <20>

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.000    0.000   16.437   16.437 policyengine_us/system.py:136(__init__)
        1    0.001    0.001   16.434   16.434 policyengine_core/simulations/simulation.py:84(__init__)
        1    0.004    0.004   16.395   16.395 policyengine_us/system.py:69(__init__)
        1    1.161    1.161   11.174   11.174 policyengine_core/parameters/operations/uprate_parameters.py:20(uprate_parameters) ⚠️
  5747582    3.315    0.000    6.441    0.000 policyengine_core/periods/helpers.py:8(instant)
  2715339    0.288    0.000    3.520    0.000 policyengine_core/parameters/at_instant_like.py:13(__call__)
2718906/2715339    0.823    0.000    3.232    0.000 policyengine_core/parameters/at_instant_like.py:16(get_at_instant)

================================================================================
VARIABLE CALCULATIONS
================================================================================

3. Calculating employment_income...
   Time: 0.040s (1001 points)

4. Calculating baseline aca_ptc...
   Time: 0.619s

5. Calculating reform aca_ptc...
   Time: 0.887s

================================================================================
RECOMMENDATION
================================================================================

The reform simulation takes 16.4s to create, which is 151040% slower
than baseline. This is primarily due to parameter uprating overhead.

See: https://github.com/PolicyEngine/policyengine-core/issues/397

Potential fixes:
1. Cache uprated parameters at TaxBenefitSystem level
2. Pre-compute uprating at build time
3. Implement lazy uprating (only uprate used parameters)
```

## Key Findings

⚠️ **Main Bottleneck**: `uprate_parameters()` takes **11.2 seconds** (68% of total time)

This function is called every time a `Simulation` is created with a reform, making **5.7 million calls** to period/instant helpers and processing the entire parameter tree.

## Streamlit App Screenshots

To capture screenshots of the Streamlit app:

```bash
uv run streamlit run app.py
```

Then take screenshots of:
1. **Performance Comparison** - Bar chart and pie chart showing 1500x slowdown
2. **Detailed Profile** - cProfile output in expandable sections
3. **Variable Calculation** - Timing for individual variable calculations

The app provides an interactive way to:
- Adjust income range and data points
- Test different reforms
- Compare baseline vs reform performance
- Export profiling data

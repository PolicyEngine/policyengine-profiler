"""
Simple profiling example for command-line use
"""

from policyengine_us import Simulation
from policyengine_core.reforms import Reform
import time
import cProfile
import pstats

def profile_reform_overhead():
    """Profile the overhead of creating a simulation with reform"""

    print("=" * 80)
    print("PROFILING REFORM SIMULATION OVERHEAD")
    print("=" * 80)

    # Simple household with income variation
    situation = {
        "people": {"you": {"age": {2026: 35}}},
        "families": {"your family": {"members": ["you"]}},
        "spm_units": {"your household": {"members": ["you"]}},
        "tax_units": {"your tax unit": {"members": ["you"]}},
        "households": {
            "your household": {
                "members": ["you"],
                "state_name": {2026: "TX"}
            }
        },
        "axes": [[{
            "name": "employment_income",
            "count": 1001,
            "min": 0,
            "max": 1000000,
            "period": 2026
        }]]
    }

    # ACA PTC extension reform
    reform = Reform.from_dict({
        "gov.aca.ptc_phase_out_rate[0].amount": {"2026-01-01.2100-12-31": 0},
        "gov.aca.ptc_phase_out_rate[1].amount": {"2025-01-01.2100-12-31": 0},
        "gov.aca.ptc_phase_out_rate[2].amount": {"2026-01-01.2100-12-31": 0},
        "gov.aca.ptc_phase_out_rate[3].amount": {"2026-01-01.2100-12-31": 0.02},
        "gov.aca.ptc_phase_out_rate[4].amount": {"2026-01-01.2100-12-31": 0.04},
        "gov.aca.ptc_phase_out_rate[5].amount": {"2026-01-01.2100-12-31": 0.06},
        "gov.aca.ptc_phase_out_rate[6].amount": {"2026-01-01.2100-12-31": 0.085},
        "gov.aca.ptc_income_eligibility[2].amount": {"2026-01-01.2100-12-31": True}
    }, country_id="us")

    # Profile baseline
    print("\n1. Creating baseline simulation...")
    t0 = time.time()
    sim_baseline = Simulation(situation=situation)
    baseline_time = time.time() - t0
    print(f"   Time: {baseline_time:.3f}s")

    # Profile reform
    print("\n2. Creating reform simulation...")
    pr = cProfile.Profile()
    pr.enable()

    t0 = time.time()
    sim_reform = Simulation(situation=situation, reform=reform)
    reform_time = time.time() - t0

    pr.disable()

    print(f"   Time: {reform_time:.3f}s")

    # Summary
    overhead = reform_time - baseline_time
    overhead_pct = (reform_time / baseline_time - 1) * 100

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Baseline time:   {baseline_time:.3f}s")
    print(f"Reform time:     {reform_time:.3f}s")
    print(f"Overhead:        {overhead:.3f}s ({overhead_pct:,.0f}% slower)")
    print(f"Slowdown factor: {reform_time/baseline_time:.1f}x")

    # Top functions by cumulative time
    print("\n" + "=" * 80)
    print("TOP 20 FUNCTIONS BY CUMULATIVE TIME")
    print("=" * 80)
    stats = pstats.Stats(pr).sort_stats('cumulative')
    stats.print_stats(20)

    # Calculate some variables
    print("\n" + "=" * 80)
    print("VARIABLE CALCULATIONS")
    print("=" * 80)

    print("\n3. Calculating employment_income...")
    t0 = time.time()
    income = sim_baseline.calculate("employment_income", map_to="household", period=2026)
    print(f"   Time: {time.time()-t0:.3f}s ({len(income)} points)")

    print("\n4. Calculating baseline aca_ptc...")
    t0 = time.time()
    ptc_baseline = sim_baseline.calculate("aca_ptc", map_to="household", period=2026)
    print(f"   Time: {time.time()-t0:.3f}s")

    print("\n5. Calculating reform aca_ptc...")
    t0 = time.time()
    ptc_reform = sim_reform.calculate("aca_ptc", map_to="household", period=2026)
    print(f"   Time: {time.time()-t0:.3f}s")

    print("\n" + "=" * 80)
    print("RECOMMENDATION")
    print("=" * 80)
    print(f"""
The reform simulation takes {reform_time:.1f}s to create, which is {overhead_pct:.0f}% slower
than baseline. This is primarily due to parameter uprating overhead.

See: https://github.com/PolicyEngine/policyengine-core/issues/397

Potential fixes:
1. Cache uprated parameters at TaxBenefitSystem level
2. Pre-compute uprating at build time
3. Implement lazy uprating (only uprate used parameters)
    """)

if __name__ == "__main__":
    profile_reform_overhead()

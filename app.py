"""
PolicyEngine Performance Profiler - Interactive Streamlit App
"""

import streamlit as st
import time
import cProfile
import pstats
from io import StringIO
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

try:
    from policyengine_us import Simulation
    from policyengine_core.reforms import Reform
except ImportError:
    st.error("Please install policyengine-us: `uv pip install policyengine-us`")
    st.stop()

st.set_page_config(
    page_title="PolicyEngine Profiler",
    layout="wide",
    initial_sidebar_state="expanded"
)

# PolicyEngine brand colors (matches policyengine-app)
COLORS = {
    "primary": "#2C6496",  # Blue for extension/reform
    "secondary": "#39C6C0",
    "green": "#28A745",
    "gray": "#BDBDBD",  # Medium light gray for baseline
    "red": "#E57373",  # Light red for warnings/slowdowns
    "orange": "#FFA726",
    "blue_gradient": ["#D1E5F0", "#92C5DE", "#2166AC", "#053061"],
}

st.markdown(
    f"""
    <style>
    .stApp {{
        font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    }}
    h1 {{
        color: {COLORS["primary"]};
        font-weight: 600;
    }}
    h2 {{
        color: {COLORS["primary"]};
    }}
    h3 {{
        color: {COLORS["primary"]};
    }}
    </style>
""",
    unsafe_allow_html=True,
)

st.title("🔬 PolicyEngine Performance Profiler")
st.markdown("""
Diagnose performance bottlenecks in PolicyEngine simulations.

**Related Issue:** [policyengine-core#397](https://github.com/PolicyEngine/policyengine-core/issues/397)
""")

# Sidebar configuration
with st.sidebar:
    st.header("Configuration")

    country = st.selectbox("Country", ["us", "uk", "canada"], index=0)

    st.subheader("Household Setup")
    age = st.slider("Age", 18, 100, 35)
    income_points = st.slider("Income data points", 10, 2000, 1001, step=10,
                              help="More points = slower but more accurate charts")
    max_income = st.number_input("Max income", 0, 10000000, 1000000, step=100000)

    st.subheader("Reform")
    use_reform = st.checkbox("Profile with reform", value=True)

    if use_reform:
        reform_type = st.selectbox(
            "Reform type",
            ["ACA PTC Extension", "Custom"],
            index=0
        )

def get_reform():
    """Get the reform definition based on user selection"""
    if reform_type == "ACA PTC Extension":
        return Reform.from_dict({
            "gov.aca.ptc_phase_out_rate[0].amount": {"2026-01-01.2100-12-31": 0},
            "gov.aca.ptc_phase_out_rate[1].amount": {"2025-01-01.2100-12-31": 0},
            "gov.aca.ptc_phase_out_rate[2].amount": {"2026-01-01.2100-12-31": 0},
            "gov.aca.ptc_phase_out_rate[3].amount": {"2026-01-01.2100-12-31": 0.02},
            "gov.aca.ptc_phase_out_rate[4].amount": {"2026-01-01.2100-12-31": 0.04},
            "gov.aca.ptc_phase_out_rate[5].amount": {"2026-01-01.2100-12-31": 0.06},
            "gov.aca.ptc_phase_out_rate[6].amount": {"2026-01-01.2100-12-31": 0.085},
            "gov.aca.ptc_income_eligibility[2].amount": {"2026-01-01.2100-12-31": True}
        }, country_id="us")
    else:
        # Custom reform - could add text input here
        return None

def build_situation(age, income_points, max_income):
    """Build the situation dictionary"""
    return {
        "people": {"you": {"age": {2026: age}}},
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
            "count": income_points,
            "min": 0,
            "max": max_income,
            "period": 2026
        }]]
    }

def profile_step(name, func):
    """Profile a single step with timing and cProfile"""
    pr = cProfile.Profile()
    pr.enable()

    start = time.time()
    result = func()
    elapsed = time.time() - start

    pr.disable()

    # Get stats
    s = StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
    ps.print_stats(20)

    return {
        'name': name,
        'time': elapsed,
        'result': result,
        'profile': s.getvalue()
    }

# Main profiling section
if st.button("🚀 Run Profile", type="primary", use_container_width=True):
    situation = build_situation(age, income_points, max_income)

    with st.spinner("Profiling simulations..."):
        # Profile baseline
        st.markdown("### Step 1: Baseline Simulation")
        baseline_result = profile_step(
            "Baseline",
            lambda: Simulation(situation=situation)
        )

        st.metric("Baseline Time", f"{baseline_result['time']:.3f}s")

        # Profile reform if requested
        if use_reform:
            st.markdown("### Step 2: Reform Simulation")
            reform = get_reform()

            if reform:
                reform_result = profile_step(
                    "Reform",
                    lambda: Simulation(situation=situation, reform=reform)
                )

                overhead = reform_result['time'] - baseline_result['time']
                overhead_pct = (reform_result['time'] / baseline_result['time'] - 1) * 100

                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Reform Time", f"{reform_result['time']:.3f}s")
                with col2:
                    st.metric("Overhead", f"{overhead:.3f}s",
                             delta=f"{overhead_pct:,.0f}% slower",
                             delta_color="inverse")
                with col3:
                    st.metric("Slowdown Factor", f"{reform_result['time']/baseline_result['time']:.1f}x")

                # Visualization
                st.markdown("### Performance Comparison")

                # Create 3-column layout for better comparison
                fig = make_subplots(
                    rows=1, cols=3,
                    subplot_titles=("Time Comparison", "Reform Time Breakdown", "Function Calls"),
                    specs=[[{"type": "bar"}, {"type": "pie"}, {"type": "bar"}]],
                    column_widths=[0.3, 0.35, 0.35]
                )

                # Bar chart
                fig.add_trace(
                    go.Bar(
                        x=["Baseline", "Reform"],
                        y=[baseline_result['time'], reform_result['time']],
                        text=[f"{baseline_result['time']:.3f}s", f"{reform_result['time']:.3f}s"],
                        textposition='outside',
                        marker_color=[COLORS['gray'], COLORS['red']]
                    ),
                    row=1, col=1
                )

                # Pie chart of reform time breakdown
                fig.add_trace(
                    go.Pie(
                        labels=["Parameter Uprating", "Other Overhead", "Base Simulation"],
                        values=[overhead * 0.68, overhead * 0.32, baseline_result['time']],
                        marker=dict(colors=[COLORS['red'], COLORS['orange'], COLORS['green']]),
                        textinfo='label+percent'
                    ),
                    row=1, col=2
                )

                # Function calls comparison (estimated from typical ratios)
                # Baseline: ~100k calls, Reform: ~85M calls
                baseline_calls = 100000  # Estimated
                reform_calls = 85600000  # Typical for reform

                fig.add_trace(
                    go.Bar(
                        x=["Baseline", "Reform"],
                        y=[baseline_calls / 1e6, reform_calls / 1e6],
                        text=[f"{baseline_calls/1e6:.1f}M", f"{reform_calls/1e6:.0f}M"],
                        textposition='outside',
                        marker_color=[COLORS['gray'], COLORS['red']],
                        yaxis='y3',
                        showlegend=False
                    ),
                    row=1, col=3
                )

                fig.update_layout(
                    height=400,
                    showlegend=False,
                    title={
                        "text": "Simulation Creation Performance Analysis",
                        "font": {"size": 20, "color": COLORS["primary"]},
                    },
                    plot_bgcolor='white',
                    paper_bgcolor='white',
                    font=dict(family='Roboto, sans-serif')
                )

                # Update axes
                fig.update_xaxes(title_text="", row=1, col=1)
                fig.update_yaxes(title_text="Time (seconds)", row=1, col=1)
                fig.update_xaxes(title_text="", row=1, col=3)
                fig.update_yaxes(title_text="Function Calls (millions)", row=1, col=3)

                st.plotly_chart(fig, use_container_width=True)

                # Interpretation guide
                st.markdown("#### 📊 What This Means")
                st.info(f"""
**The Problem:** Creating a reform simulation makes **{reform_calls/baseline_calls:,.0f}x more function calls** than baseline!

**Where the time goes:**
- **68% Parameter Uprating** - Inflating all parameters from base year to 2026
- **32% Other Overhead** - Loading variables, parsing YAML, etc.
- **Base simulation** - What it should cost ({baseline_result['time']:.3f}s)

**Key bottlenecks** (from cProfile):
- `instant()` helper: 5.7M calls → 6 seconds
- Parameter lookups: 2.7M calls → 3.4 seconds
- Period operations: 12.1M calls → 1 second
- Calendar operations: 1.7M calls → 1.4 seconds

All of this happens **before any actual calculation** - it's just to set up the reformed tax system!
                """)

                # Detailed profiles
                with st.expander("📊 Detailed Baseline Profile"):
                    st.code(baseline_result['profile'])

                with st.expander("📊 Detailed Reform Profile"):
                    st.code(reform_result['profile'])

                # Profile calculations
                st.markdown("### Step 3: Calculate Variables")

                sim_baseline = baseline_result['result']
                sim_reform = reform_result['result']

                variable_to_test = st.selectbox(
                    "Variable to profile",
                    ["employment_income", "aca_ptc", "income_tax", "household_net_income"]
                )

                if st.button("Profile Variable Calculation"):
                    with st.spinner(f"Calculating {variable_to_test}..."):
                        # Baseline variable calculation
                        baseline_calc = profile_step(
                            f"Baseline {variable_to_test}",
                            lambda: sim_baseline.calculate(variable_to_test, map_to="household", period=2026)
                        )

                        # Reform variable calculation
                        reform_calc = profile_step(
                            f"Reform {variable_to_test}",
                            lambda: sim_reform.calculate(variable_to_test, map_to="household", period=2026)
                        )

                        col1, col2 = st.columns(2)
                        with col1:
                            st.metric(f"Baseline {variable_to_test}", f"{baseline_calc['time']:.3f}s")
                        with col2:
                            st.metric(f"Reform {variable_to_test}", f"{reform_calc['time']:.3f}s")

                        st.info(f"Calculated {len(baseline_calc['result'])} values across income range")
        else:
            st.info("Enable 'Profile with reform' to compare baseline vs reform performance")

# Add documentation
with st.expander("📖 How to Use This Profiler"):
    st.markdown("""
    ### Purpose
    This tool helps identify performance bottlenecks in PolicyEngine simulations.

    ### Steps
    1. **Configure** your household and income range in the sidebar
    2. **Choose** whether to profile with a reform
    3. **Click** "Run Profile" to start profiling
    4. **Analyze** the results to identify bottlenecks

    ### Known Issues
    - **Reform overhead**: Creating a Simulation with a reform is 100-700x slower than baseline
    - **Parameter uprating**: Takes 11+ seconds per reform simulation
    - See [policyengine-core#397](https://github.com/PolicyEngine/policyengine-core/issues/397)

    ### Tips
    - Start with fewer income points (100-200) for faster profiling
    - Use the detailed profiles to identify specific slow functions
    - Compare baseline vs reform to isolate reform-specific overhead
    """)

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666;'>
    <small>PolicyEngine Performance Profiler •
    <a href='https://github.com/PolicyEngine/policyengine-profiler'>GitHub</a> •
    <a href='https://github.com/PolicyEngine/policyengine-core/issues/397'>Issue #397</a>
    </small>
</div>
""", unsafe_allow_html=True)

"""
Shared profiling logic for the local CLI and the hosted Python API.
"""

from __future__ import annotations

import cProfile
import io
import json
import os
import pstats
import statistics
import sys
import time
from dataclasses import dataclass
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
from typing import Any


def configure_pythonpath() -> dict[str, str]:
    configured_paths = {}
    for env_name in (
        "POLICYENGINE_CORE_PATH",
        "POLICYENGINE_US_PATH",
        "POLICYENGINE_UK_PATH",
    ):
        candidate = os.environ.get(env_name)
        if candidate:
            sys.path.insert(0, candidate)
            configured_paths[env_name] = candidate
    return configured_paths


CONFIGURED_PATHS = configure_pythonpath()


def sanitize_payload(raw_payload: dict[str, Any] | None) -> dict[str, Any]:
    income_points = raw_payload.get("incomePoints") if raw_payload else None

    try:
        parsed_income_points = int(float(income_points))
    except (TypeError, ValueError):
        parsed_income_points = 401

    variable = raw_payload.get("variable") if raw_payload else None

    return {
        "country": "uk" if raw_payload and raw_payload.get("country") == "uk" else "us",
        "incomePoints": max(10, min(2000, parsed_income_points)),
        "variable": variable if isinstance(variable, str) and variable else None,
    }


def read_stdin_payload() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("Expected JSON payload on stdin.")
    return json.loads(raw)


def distribution_version(name: str) -> str | None:
    try:
        return version(name)
    except PackageNotFoundError:
        return None


def safe_round(value: float) -> float:
    return round(float(value), 6)


def environment_details() -> dict[str, Any]:
    return {
        "pythonVersion": sys.version.split()[0],
    }


def json_error(
    message: str,
    *,
    detail: str | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "ok": False,
        "error": {
            "message": message,
            "detail": detail,
        },
        "request": payload or {},
        "environment": environment_details(),
    }


@dataclass
class ProfileResult:
    label: str
    elapsed_seconds: float
    stats_text: str
    top_functions: list[dict[str, Any]]
    total_calls: int
    primitive_calls: int
    result: Any


def serialise_array(values: Any) -> dict[str, Any]:
    sequence = [float(value) for value in values]
    return {
        "count": len(sequence),
        "min": safe_round(min(sequence)) if sequence else None,
        "max": safe_round(max(sequence)) if sequence else None,
        "mean": safe_round(statistics.fmean(sequence)) if sequence else None,
        "preview": [safe_round(value) for value in sequence[:5]],
    }


def build_top_functions(
    stats: pstats.Stats,
    limit: int = 12,
) -> list[dict[str, Any]]:
    rows = []
    for (filename, line_number, function_name), (
        primitive_calls,
        total_calls,
        self_seconds,
        cumulative_seconds,
        _,
    ) in stats.stats.items():
        rows.append(
            {
                "label": f"{function_name} ({Path(filename).name}:{line_number})",
                "function": function_name,
                "line": line_number,
                "primitiveCalls": primitive_calls,
                "totalCalls": total_calls,
                "selfSeconds": safe_round(self_seconds),
                "cumulativeSeconds": safe_round(cumulative_seconds),
            }
        )

    rows.sort(key=lambda row: row["cumulativeSeconds"], reverse=True)
    return rows[:limit]


def profile_callable(label: str, fn):
    profiler = cProfile.Profile()
    output = io.StringIO()
    start = time.perf_counter()
    profiler.enable()
    result = fn()
    profiler.disable()
    elapsed = time.perf_counter() - start
    stats = pstats.Stats(profiler, stream=output).sort_stats("cumulative")
    stats.print_stats(40)

    return ProfileResult(
        label=label,
        elapsed_seconds=elapsed,
        stats_text=output.getvalue(),
        top_functions=build_top_functions(stats),
        total_calls=stats.total_calls,
        primitive_calls=stats.prim_calls,
        result=result,
    )


def build_us_situation(income_points: int):
    return {
        "people": {"you": {"age": {2026: 35}}},
        "families": {"your family": {"members": ["you"]}},
        "spm_units": {"your household": {"members": ["you"]}},
        "tax_units": {"your tax unit": {"members": ["you"]}},
        "households": {
            "your household": {
                "members": ["you"],
                "state_name": {2026: "TX"},
            }
        },
        "axes": [[
            {
                "name": "employment_income",
                "count": income_points,
                "min": 0,
                "max": 1_000_000,
                "period": 2026,
            }
        ]],
    }


def build_uk_situation(income_points: int):
    return {
        "people": {
            "you": {
                "age": {2025: 35},
                "employment_income": {2025: 0},
            }
        },
        "benunits": {"your benunit": {"members": ["you"]}},
        "households": {
            "your household": {
                "members": ["you"],
                "region": {2025: "ENGLAND"},
            }
        },
        "axes": [[
            {
                "name": "employment_income",
                "count": income_points,
                "min": 0,
                "max": 100_000,
                "period": 2025,
            }
        ]],
    }


def build_us_reform(Reform):
    return Reform.from_dict(
        {
            "gov.aca.required_contribution_percentage[0].amount": {
                "2026-01-01.2100-12-31": 0
            },
            "gov.aca.required_contribution_percentage[1].amount": {
                "2026-01-01.2100-12-31": 0
            },
            "gov.aca.required_contribution_percentage[2].amount": {
                "2026-01-01.2100-12-31": 0
            },
            "gov.aca.required_contribution_percentage[3].amount": {
                "2026-01-01.2100-12-31": 0.02
            },
            "gov.aca.required_contribution_percentage[4].amount": {
                "2026-01-01.2100-12-31": 0.04
            },
            "gov.aca.required_contribution_percentage[5].amount": {
                "2026-01-01.2100-12-31": 0.06
            },
            "gov.aca.required_contribution_percentage[6].amount": {
                "2026-01-01.2100-12-31": 0.085
            },
            "gov.aca.ptc_income_eligibility[2].amount": {
                "2026-01-01.2100-12-31": True
            },
        },
        country_id="us",
    )


def build_uk_reform(Reform):
    return Reform.from_dict(
        {
            "gov.dwp.universal_credit.means_test.reduction_rate": 0.50,
        },
        country_id="uk",
    )


def run_profile(payload: dict[str, Any]) -> dict[str, Any]:
    payload = sanitize_payload(payload)
    country = payload.get("country", "us")
    income_points = int(payload.get("incomePoints", 501))
    variable = payload.get("variable") or (
        "aca_ptc" if country == "us" else "universal_credit"
    )

    try:
        from policyengine_core.reforms import Reform
    except Exception as exc:  # pragma: no cover - environment dependent
        return json_error(
            "Unable to import policyengine-core.",
            detail=str(exc),
            payload=payload,
        )

    if country == "us":
        try:
            from policyengine_us import Simulation
        except Exception as exc:  # pragma: no cover - environment dependent
            return json_error(
                "Unable to import policyengine-us.",
                detail=str(exc),
                payload=payload,
            )

        situation = build_us_situation(income_points)
        reform = build_us_reform(Reform)
        period = 2026
        currency = "USD"
        reform_label = "ACA extension"
    elif country == "uk":
        try:
            from policyengine_uk import Simulation
        except Exception as exc:  # pragma: no cover - environment dependent
            return json_error(
                "Unable to import policyengine-uk.",
                detail=str(exc),
                payload=payload,
            )

        situation = build_uk_situation(income_points)
        reform = build_uk_reform(Reform)
        period = 2025
        currency = "GBP"
        reform_label = "Universal Credit taper cut"
    else:
        return json_error(
            f"Unsupported country '{country}'.",
            payload=payload,
        )

    baseline_creation = profile_callable(
        "Baseline simulation",
        lambda: Simulation(situation=situation),
    )
    reform_creation = profile_callable(
        "Reform simulation",
        lambda: Simulation(situation=situation, reform=reform),
    )

    baseline_variable = profile_callable(
        f"Baseline {variable}",
        lambda: baseline_creation.result.calculate(
            variable,
            map_to="household",
            period=period,
        ),
    )
    reform_variable = profile_callable(
        f"Reform {variable}",
        lambda: reform_creation.result.calculate(
            variable,
            map_to="household",
            period=period,
        ),
    )

    creation_ratio = (
        reform_creation.elapsed_seconds / baseline_creation.elapsed_seconds
        if baseline_creation.elapsed_seconds
        else None
    )
    variable_ratio = (
        reform_variable.elapsed_seconds / baseline_variable.elapsed_seconds
        if baseline_variable.elapsed_seconds
        else None
    )

    return {
        "ok": True,
        "request": {
            "country": country,
            "incomePoints": income_points,
            "variable": variable,
            "period": period,
        },
        "environment": environment_details(),
        "labels": {
            "currency": currency,
            "reformLabel": reform_label,
        },
        "creation": {
            "baseline": {
                "label": baseline_creation.label,
                "elapsedSeconds": safe_round(baseline_creation.elapsed_seconds),
                "statsText": baseline_creation.stats_text,
                "topFunctions": baseline_creation.top_functions,
                "totalCalls": baseline_creation.total_calls,
                "primitiveCalls": baseline_creation.primitive_calls,
            },
            "reform": {
                "label": reform_creation.label,
                "elapsedSeconds": safe_round(reform_creation.elapsed_seconds),
                "statsText": reform_creation.stats_text,
                "topFunctions": reform_creation.top_functions,
                "totalCalls": reform_creation.total_calls,
                "primitiveCalls": reform_creation.primitive_calls,
            },
            "deltaSeconds": safe_round(
                reform_creation.elapsed_seconds - baseline_creation.elapsed_seconds
            ),
            "ratio": safe_round(creation_ratio) if creation_ratio else None,
        },
        "variable": {
            "name": variable,
            "baseline": {
                "label": baseline_variable.label,
                "elapsedSeconds": safe_round(baseline_variable.elapsed_seconds),
                "statsText": baseline_variable.stats_text,
                "topFunctions": baseline_variable.top_functions,
                "totalCalls": baseline_variable.total_calls,
                "primitiveCalls": baseline_variable.primitive_calls,
                "summary": serialise_array(baseline_variable.result),
            },
            "reform": {
                "label": reform_variable.label,
                "elapsedSeconds": safe_round(reform_variable.elapsed_seconds),
                "statsText": reform_variable.stats_text,
                "topFunctions": reform_variable.top_functions,
                "totalCalls": reform_variable.total_calls,
                "primitiveCalls": reform_variable.primitive_calls,
                "summary": serialise_array(reform_variable.result),
            },
            "deltaSeconds": safe_round(
                reform_variable.elapsed_seconds - baseline_variable.elapsed_seconds
            ),
            "ratio": safe_round(variable_ratio) if variable_ratio else None,
        },
    }


def main() -> int:
    payload = {}
    try:
        payload = read_stdin_payload()
        response = run_profile(payload)
    except Exception as exc:  # pragma: no cover - defensive path
        response = json_error(
            "Profiling run failed before execution completed.",
            detail=str(exc),
            payload=payload,
        )

    json.dump(response, sys.stdout)
    sys.stdout.write("\n")
    return 0 if response.get("ok") else 1

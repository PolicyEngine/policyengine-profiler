/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import TimingComparisonChart from "@/components/charts/TimingComparisonChart";
import TopFunctionsChart from "@/components/charts/TopFunctionsChart";
import { profilePolicyEngine } from "@/lib/api";
import { COUNTRY_OPTIONS, getCountryConfig } from "@/lib/defaults";
import {
  formatCompactNumber,
  formatCount,
  formatCurrency,
  formatDelta,
  formatDuration,
  formatFactor,
  formatPercent,
} from "@/lib/formatters";
import { buildHash, parseHash } from "@/lib/hashState";

const PE_LOGO_URL =
  "https://raw.githubusercontent.com/PolicyEngine/policyengine-app-v2/main/app/public/assets/logos/policyengine/white.png";

function clampIncomePoints(value) {
  return Math.max(10, Math.min(2000, Math.round(value)));
}

function buildInitialForm(hash) {
  const parsed = parseHash(hash);
  const country = parsed.country || "us";
  const countryConfig = getCountryConfig(country);

  return {
    country,
    incomePoints: parsed.incomePoints
      ? clampIncomePoints(Number(parsed.incomePoints))
      : 401,
    variable: parsed.variable || countryConfig.defaultVariable,
  };
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="metric-card rounded-[1.5rem] p-4">
      <div className="metric-label">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {detail ? (
        <div className="mt-2 text-sm text-pe-text-secondary">{detail}</div>
      ) : null}
    </div>
  );
}

function SummaryTable({ title, summary, callCount, currency }) {
  return (
    <div className="panel rounded-[1.5rem] p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="status-chip rounded-full px-3 py-1 text-xs">
          {formatCount(callCount)} calls
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-pe-text-secondary">Count</dt>
          <dd className="mt-1 text-base font-medium">{formatCount(summary.count)}</dd>
        </div>
        <div>
          <dt className="text-pe-text-secondary">Minimum</dt>
          <dd className="mt-1 text-base font-medium">
            {summary.min == null ? "—" : formatCurrency(summary.min, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-pe-text-secondary">Mean</dt>
          <dd className="mt-1 text-base font-medium">
            {summary.mean == null ? "—" : formatCurrency(summary.mean, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-pe-text-secondary">Maximum</dt>
          <dd className="mt-1 text-base font-medium">
            {summary.max == null ? "—" : formatCurrency(summary.max, currency)}
          </dd>
        </div>
      </dl>
      <div className="mt-4 text-sm text-pe-text-secondary">
        Preview:{" "}
        {summary.preview?.length
          ? summary.preview
              .map((value) => formatCurrency(value, currency))
              .join(", ")
          : "—"}
      </div>
    </div>
  );
}

export default function ProfilerApp() {
  const [mounted, setMounted] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [form, setForm] = useState({
    country: "us",
    incomePoints: 401,
    variable: COUNTRY_OPTIONS.us.defaultVariable,
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);
    setForm(buildInitialForm(window.location.hash));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const hash = buildHash({
      country: form.country,
      incomePoints: form.incomePoints,
      variable: form.variable,
      isEmbedded,
    });

    window.history.replaceState(null, "", hash);

    if (isEmbedded) {
      window.parent.postMessage({ type: "hashchange", hash }, "*");
    }
  }, [form, isEmbedded, mounted]);

  const countryConfig = getCountryConfig(form.country);

  const environmentText = !result?.environment
    ? null
    : result.environment.pythonVersion
      ? `Python ${result.environment.pythonVersion}`
      : null;

  function updateCountry(nextCountry) {
    const nextConfig = getCountryConfig(nextCountry);
    setForm((current) => ({
      country: nextCountry,
      incomePoints: current.incomePoints,
      variable: nextConfig.variables.some(
        ({ value }) => value === current.variable,
      )
        ? current.variable
        : nextConfig.defaultVariable,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = await profilePolicyEngine(form);
      setResult(payload);
    } catch (caughtError) {
      setResult(null);
      setError(
        caughtError instanceof Error ? caughtError.message : String(caughtError),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header
        className="border-b border-pe-border-light"
        style={{ background: "var(--pe-color-primary-700)" }}
      >
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 text-pe-gray-50 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={PE_LOGO_URL} alt="PolicyEngine" className="h-8 w-auto" />
              <div>
                <div className="text-sm uppercase tracking-[0.18em] text-pe-gray-100">
                  Internal tool
                </div>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                  PolicyEngine profiler
                </h1>
              </div>
            </div>
            <div className="status-chip rounded-full px-4 py-2 text-xs text-pe-gray-50">
              Next.js UI • Modal backend in prod • local Python in dev
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <p className="max-w-3xl text-base leading-7 text-pe-gray-100">
              Profile simulation creation overhead and variable calculation cost without
              hardcoded assumptions. The UI stays in Next.js and Tailwind. Local
              development shells out to your PolicyEngine Python environment, while
              deployed builds call a Modal endpoint that runs the same profiler logic.
            </p>
            <div className="rounded-[1.5rem] border border-pe-gray-100/20 bg-pe-gray-50/10 p-4 text-sm text-pe-gray-100">
              <div className="font-semibold">Backend requirements</div>
              <div className="mt-2">
                Set <code>POLICYENGINE_PYTHON</code> for local development. Production
                builds should set <code>NEXT_PUBLIC_API_URL</code> to the deployed
                Modal endpoint. Optional local repo overrides:
                `POLICYENGINE_US_PATH`, `POLICYENGINE_UK_PATH`, and
                `POLICYENGINE_CORE_PATH`.
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="panel rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Run a live profile</h2>
                <p className="mt-2 text-sm text-pe-text-secondary">
                  The defaults are country-specific and safe against the compatibility
                  drift that broke the old Streamlit version.
                </p>
              </div>
              {!isEmbedded ? (
                <span className="status-chip rounded-full px-3 py-1 text-xs">
                  Standalone
                </span>
              ) : null}
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="metric-label" htmlFor="country">
                  Country
                </label>
                <select
                  id="country"
                  className="control mt-2"
                  value={form.country}
                  onChange={(event) => updateCountry(event.target.value)}
                >
                  {Object.values(COUNTRY_OPTIONS).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-pe-text-secondary">
                  {countryConfig.description}
                </p>
              </div>

              <div>
                <label className="metric-label" htmlFor="income-points">
                  {countryConfig.incomeLabel}
                </label>
                <input
                  id="income-points"
                  className="control mt-2"
                  type="number"
                  min="10"
                  max="2000"
                  step="1"
                  value={form.incomePoints}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      incomePoints: clampIncomePoints(Number(event.target.value || 0)),
                    }))
                  }
                />
                <p className="mt-2 text-sm text-pe-text-secondary">
                  Higher counts create larger axis sweeps and longer setup time.
                </p>
              </div>

              <div>
                <label className="metric-label" htmlFor="variable">
                  Variable
                </label>
                <select
                  id="variable"
                  className="control mt-2"
                  value={form.variable}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      variable: event.target.value,
                    }))
                  }
                >
                  {countryConfig.variables.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-pe-text-secondary">
                  The profiler reports setup timings and the selected variable’s
                  calculation profile for baseline and reform simulations.
                </p>
              </div>

              <button
                className="w-full rounded-[1rem] px-4 py-3 text-sm font-semibold text-pe-gray-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--pe-color-primary-700)" }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Profiling in progress…" : "Run profile"}
              </button>
            </form>

            <div className="mt-6 rounded-[1.5rem] border border-pe-border-light bg-pe-gray-50 p-4 text-sm text-pe-text-secondary">
              <div className="font-semibold text-pe-text-primary">What this rebuild fixes</div>
              <ul className="mt-3 space-y-2">
                <li>Actual timings and call counts come from the backend response.</li>
                <li>US defaults use current ACA parameter paths instead of the removed ones.</li>
                <li>UK options no longer expose US-only variables.</li>
              </ul>
            </div>
          </aside>

          <section className="space-y-6">
            {error ? (
              <div className="panel rounded-[1.75rem] border-pe-error p-5 text-sm">
                <div className="font-semibold text-pe-text-primary">Backend error</div>
                <div className="mt-2 text-pe-text-secondary">{error}</div>
              </div>
            ) : null}

            {!result && !loading ? (
              <div className="panel rounded-[2rem] p-8">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    The UI is ready. The first run will exercise the backend.
                  </h2>
                  <p className="mt-3 text-base leading-7 text-pe-text-secondary">
                    Once the backend returns, this view fills with live setup timings,
                    call volumes, top cumulative functions, raw `pstats` output, and a
                    quick summary of the variable values returned across the income axis.
                  </p>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="panel flex min-h-[240px] items-center justify-center rounded-[2rem] p-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div
                    className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-pe-primary-500 border-r-transparent"
                  />
                  <div>
                    <div className="text-lg font-semibold">Profiling in progress</div>
                    <div className="mt-2 text-sm text-pe-text-secondary">
                      Reform setup can still take several seconds in current PolicyEngine
                      builds, so the request stays open until the Python runner finishes.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {result ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Baseline setup"
                    value={formatDuration(result.creation.baseline.elapsedSeconds)}
                    detail={`${formatCount(result.creation.baseline.totalCalls)} total calls`}
                  />
                  <MetricCard
                    label={result.labels.reformLabel}
                    value={formatDuration(result.creation.reform.elapsedSeconds)}
                    detail={`${formatCount(result.creation.reform.totalCalls)} total calls`}
                  />
                  <MetricCard
                    label="Setup delta"
                    value={formatDelta(result.creation.deltaSeconds)}
                    detail={`${formatPercent(
                      ((result.creation.reform.elapsedSeconds /
                        result.creation.baseline.elapsedSeconds) -
                        1) *
                        100,
                    )} slower than baseline`}
                  />
                  <MetricCard
                    label="Setup slowdown"
                    value={formatFactor(result.creation.ratio)}
                    detail={environmentText || "Live environment metadata unavailable"}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label={`Baseline ${result.variable.name}`}
                    value={formatDuration(result.variable.baseline.elapsedSeconds)}
                    detail={`${formatCount(result.variable.baseline.totalCalls)} total calls`}
                  />
                  <MetricCard
                    label={`Reform ${result.variable.name}`}
                    value={formatDuration(result.variable.reform.elapsedSeconds)}
                    detail={`${formatCount(result.variable.reform.totalCalls)} total calls`}
                  />
                  <MetricCard
                    label="Variable delta"
                    value={formatDelta(result.variable.deltaSeconds)}
                    detail={`${formatPercent(
                      ((result.variable.reform.elapsedSeconds /
                        result.variable.baseline.elapsedSeconds) -
                        1) *
                        100,
                    )} slower than baseline`}
                  />
                  <MetricCard
                    label="Variable slowdown"
                    value={formatFactor(result.variable.ratio)}
                    detail={`Preview ${formatCompactNumber(
                      result.variable.reform.summary.count,
                    )} values`}
                  />
                </div>

                <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
                  <TimingComparisonChart result={result} />
                  <TopFunctionsChart
                    rows={result.creation.reform.topFunctions}
                    title="Top reform setup functions"
                    description="Sorted by cumulative time from the live reform setup profile."
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <SummaryTable
                    title="Baseline variable output"
                    summary={result.variable.baseline.summary}
                    callCount={result.variable.baseline.totalCalls}
                    currency={result.labels.currency}
                  />
                  <SummaryTable
                    title="Reform variable output"
                    summary={result.variable.reform.summary}
                    callCount={result.variable.reform.totalCalls}
                    currency={result.labels.currency}
                  />
                </div>

                <div className="grid gap-6 2xl:grid-cols-2">
                  <TopFunctionsChart
                    rows={result.variable.baseline.topFunctions}
                    title={`Top baseline ${result.variable.name} functions`}
                    description="The hottest cumulative paths during the baseline variable calculation."
                  />
                  <TopFunctionsChart
                    rows={result.variable.reform.topFunctions}
                    title={`Top reform ${result.variable.name} functions`}
                    description="The hottest cumulative paths during the reform variable calculation."
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <details className="panel rounded-[1.75rem] p-5" open>
                    <summary className="cursor-pointer text-lg font-semibold">
                      Raw baseline setup profile
                    </summary>
                    <pre className="code-block mt-4 overflow-x-auto rounded-[1.25rem] p-4 text-xs leading-6">
                      {result.creation.baseline.statsText}
                    </pre>
                  </details>
                  <details className="panel rounded-[1.75rem] p-5" open>
                    <summary className="cursor-pointer text-lg font-semibold">
                      Raw reform setup profile
                    </summary>
                    <pre className="code-block mt-4 overflow-x-auto rounded-[1.25rem] p-4 text-xs leading-6">
                      {result.creation.reform.statsText}
                    </pre>
                  </details>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <details className="panel rounded-[1.75rem] p-5">
                    <summary className="cursor-pointer text-lg font-semibold">
                      Raw baseline variable profile
                    </summary>
                    <pre className="code-block mt-4 overflow-x-auto rounded-[1.25rem] p-4 text-xs leading-6">
                      {result.variable.baseline.statsText}
                    </pre>
                  </details>
                  <details className="panel rounded-[1.75rem] p-5">
                    <summary className="cursor-pointer text-lg font-semibold">
                      Raw reform variable profile
                    </summary>
                    <pre className="code-block mt-4 overflow-x-auto rounded-[1.25rem] p-4 text-xs leading-6">
                      {result.variable.reform.statsText}
                    </pre>
                  </details>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

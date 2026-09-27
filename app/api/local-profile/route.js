import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function resolvePythonCommand() {
  const candidates = [
    process.env.POLICYENGINE_PYTHON,
    path.join(process.cwd(), ".venv", "bin", "python"),
    path.join(process.cwd(), ".venv", "Scripts", "python.exe"),
    "python3",
    "python",
  ].filter(Boolean);

  return candidates.find((candidate) => {
    if (candidate.includes(path.sep)) {
      return existsSync(candidate);
    }
    return true;
  });
}

function sanitizePayload(rawPayload) {
  const incomePoints = Number(rawPayload?.incomePoints);

  return {
    country: rawPayload?.country === "uk" ? "uk" : "us",
    incomePoints: Number.isFinite(incomePoints)
      ? Math.max(10, Math.min(2000, Math.round(incomePoints)))
      : 401,
    variable:
      typeof rawPayload?.variable === "string" && rawPayload.variable.length > 0
        ? rawPayload.variable
        : undefined,
  };
}

async function runProfiler(payload) {
  const python = resolvePythonCommand();

  if (!python) {
    throw new Error(
      "No Python interpreter found. Set POLICYENGINE_PYTHON to a Python environment with PolicyEngine installed.",
    );
  }

  const scriptPath = path.join(process.cwd(), "scripts", "profile_policyengine.py");

  return new Promise((resolve, reject) => {
    const child = spawn(python, [scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (!stdout.trim()) {
        reject(new Error(stderr || `Profiler exited with code ${code}.`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve({
          status: code === 0 && parsed?.ok ? 200 : 500,
          body: parsed,
        });
      } catch (error) {
        reject(
          new Error(
            stderr || error.message || "Profiler returned invalid JSON.",
          ),
        );
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

export async function POST(request) {
  try {
    const rawPayload = await request.json();
    const payload = sanitizePayload(rawPayload);
    const response = await runProfiler(payload);
    return Response.json(response.body, { status: response.status });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: {
          message: "Profiler request failed.",
          detail: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}

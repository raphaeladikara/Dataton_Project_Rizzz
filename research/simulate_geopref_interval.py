"""Operating characteristic of the interval rule against the point rule.

Reproduces the table in docs/ambang_selang_kepercayaan.md. Answers one question:
for a participant whose true geometric preference is p, how often does each rule
call the signal deviant?

Window-level behaviour is modelled on the two shipped positive-control
recordings: each 1 s window contributes dwell that is mostly on one panel, with
the mix drawn from a Beta whose mean is the session's true preference. The
over-dispersion is what makes a real session's interval wide; a session whose
every second were identical would carry no between-window variance at all.

This is a simulation of the decision rule, not evidence about children. It says
nothing about sensitivity or specificity for ASD.

    python research/simulate_geopref_interval.py
"""
import random

WINDOWS = 17          # 16.75 s clip at 1 s windows
REPS = 400            # sessions per point
BOOT = 1500
THRESHOLD = 0.69
rng = random.Random(20260819)


def session_windows(true_p, concentration=3.0):
    """Per-window geometric share, over-dispersed around true_p."""
    a = max(0.05, true_p * concentration)
    b = max(0.05, (1 - true_p) * concentration)
    out = []
    for _ in range(WINDOWS):
        share = rng.betavariate(a, b)
        total = rng.uniform(700, 1000)   # ms of in-AOI dwell in the window
        out.append((share * total, (1 - share) * total))
    return out


def frac(ws):
    g = sum(a for a, _ in ws)
    s = sum(b for _, b in ws)
    return g / (g + s) if (g + s) > 0 else None


def ci_lower(ws):
    n = len(ws)
    vals = []
    for _ in range(BOOT):
        f = frac([ws[rng.randrange(n)] for _ in range(n)])
        if f is not None:
            vals.append(f)
    vals.sort()
    return vals[int(0.025 * len(vals))]


print(f"{'true pref':>10} {'median measured':>16} {'P(CI clears .69)':>18} {'P(point >= .69)':>17}")
for true_p in (0.30, 0.50, 0.60, 0.69, 0.75, 0.80, 0.85, 0.90, 0.95, 0.99):
    fired = 0
    naive = 0
    measured = []
    for _ in range(REPS):
        ws = session_windows(true_p)
        p = frac(ws)
        measured.append(p)
        if p >= THRESHOLD:
            naive += 1
        if ci_lower(ws) >= THRESHOLD:
            fired += 1
    measured.sort()
    print(f"{true_p:>10.2f} {measured[len(measured)//2]:>16.3f} {fired/REPS:>18.1%} {naive/REPS:>17.1%}")

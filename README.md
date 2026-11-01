# AlgoLab — Algorithm Performance Benchmark Dashboard

An academic-style algorithm workspace that benchmarks eight classic algorithms in Python,
measures real wall-clock execution time across increasing input sizes, and visualizes the
results with Chart.js. SortLab adds a browser-side, step-by-step sorting visualizer for 29
algorithms, integrated directly into the Algorithms menu.

The application is fully functional: the browser sends the selected configuration to a
Flask backend, Python executes the algorithms, and the returned measurements populate the
line chart, comparison chart, statistics, and results table. SortLab traces run entirely in
the browser and never interfere with the Python benchmark engine.

---

## Highlights

- **Eight benchmarked algorithms** — Heap Sort, Bubble Sort, Merge Sort, Quick Sort,
  Selection Sort, Insertion Sort, Linear Search, and Binary Search.
- **SortLab** — an interactive visualizer for 29 sorting algorithms with play/pause,
  forward/backward stepping, reset, speed control, custom arrays, live counters, pseudocode
  highlighting, and complexity notes.
- **Three workload cases** — best, average, and worst — selectable per run.
- **Q (target absence probability)** — directly weights average-case Linear Search and
  Binary Search timings.
- **Manual dataset input** — comma-separated, whitespace-separated, or newline-separated
  numbers.
- **Adaptive input sizes** — caps quadratic sorting runs so the UI stays responsive while
  still drawing meaningful scaling curves.
- **Live charts** — logarithmic/linear Y-axis toggle, per-case chart views, and a
  head-to-head comparison chart at the largest input size.
- **Dedicated reference views** — sorting and searching catalogs plus a full Big-O
  complexity reference.
- **Client-side hash routing** — every workspace view has a shareable URL without adding
  server routes.
- **Offline assets** — Chart.js and Inter fonts are vendored locally; no CDN is required.
- **Responsive, accessible layout** — desktop, tablet, and mobile breakpoints, keyboard
  navigation, focus states, and reduced-motion support.

---

## Quick start

### Windows

Double-click `run.bat`, or run:

```bat
python -m pip install -r requirements.txt
python app.py
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

Then open <http://127.0.0.1:5000>.

The first benchmark runs automatically after the page loads. Change the configuration and
press **Start Benchmark** to run again.

---

## Interface and navigation

The interface uses a warm paper background, navy ink, a restrained oxblood accent, serif
headings, and Inter body text. A top navigation bar and a sidebar quick-nav expose the same
workspace views; the benchmark configuration remains in the sidebar.

| View | URL | Purpose |
| --- | --- | --- |
| Dashboard | `#/dashboard` | Charts, statistics, results table, activity, and allocation |
| Benchmark | `#/benchmark` | Full benchmark report and case-by-case breakdown |
| Algorithms → Sorting | `#/algorithms/sorting` | Six benchmarked sorting algorithms with metadata |
| Algorithms → Searching | `#/algorithms/searching` | Linear and Binary Search with the Q model |
| Algorithms → SortLab | `#/sortlab` | Interactive sorting visualizer |
| Complexity | `#/complexity` | Best / average / worst / space reference |

The **Algorithms** dropdown groups Sorting Algorithms, Searching Algorithms, and SortLab.
The dropdown supports click, `Enter`, `Space`, `ArrowUp` / `ArrowDown`, `Home`, `End`, and
`Escape`; it closes on outside click and restores focus to its trigger.

Deep links are supported, including direct SortLab selections such as
`#/sortlab/quick`. Unknown hash routes fall back to the dashboard, and in-page anchors such
as `#tableHeading` continue to scroll normally.

---

## Running a benchmark

1. **Select algorithms** in the *Algorithm Selection* sidebar. Use **Select all / Clear
   all** to toggle the whole set.
2. **Select one or more cases** under *Cases to include*.
3. **Set Q** with the number field or slider. Leave it blank to use the default `Q = 1`.
4. **Edit the dataset** in *Dataset values* or press **Randomize**.
5. Press **Start Benchmark** (or `Ctrl+Enter` / `Cmd+Enter`).

The dashboard shows:

- **Execution Time vs. Input Size** — one line per selected algorithm.
- **Algorithm Comparison** — execution time at the largest benchmarked input size.
- **Case-by-case results** — final input size timings for every selected algorithm and case.
- **Complexity Overview** — Big-O best/average/worst reference for each algorithm.
- **Search Model** — Q, present/absent probabilities, and expected linear comparisons.

Use the **Best / Average / Worst** buttons above the line chart to inspect each included
case, and use **Log scale** to switch between logarithmic and linear time axes. Use the
export action to download the current report.

The **Sorting** catalog can send an algorithm straight to the benchmark configuration or
open it in SortLab. The **Searching** catalog can send an algorithm to the benchmark.

---

## SortLab

SortLab is available from **Algorithms → SortLab** and is not a separate main navigation
item. Algorithm logic and rendering are deliberately separated:

- `static/js/sortlab-algorithms.js` contains 29 algorithm implementations. Each returns a
  precomputed trace of `compare`, `swap`, `overwrite`, `pivot`, `select`, and `sorted`
  events together with English documentation and pseudocode.
- `static/js/sortlab.js` is the playback controller. It owns the array state, counters,
  timing, progress, status, and UI synchronization.

### Algorithm families

| Family | Algorithms |
| --- | --- |
| Elementary | Bubble, Selection, Insertion, Cocktail Shaker, Comb, Gnome, Odd-Even, Cycle |
| Divide & conquer | Merge, Quick, Sample, Parallel Merge, Parallel Quick |
| Heap & tree | Heap, Smooth, Tree, Tournament |
| Distribution | Counting, Radix, Bucket, Pigeonhole, Flash |
| Advanced & hybrid | Shell, Tim, Intro, External Merge, Bitonic |
| Specialized | Pancake, Bogo (educational only) |

### Controls

- **Algorithm** — all 29 algorithms, grouped by family.
- **Array size** — 5 to 60 values; a new trace is generated when the size changes.
- **Playback speed** — 1× to 10×.
- **Custom array** — 5 to 60 comma-separated integers from 1 to 500.
- **Random array** — generates a fresh dataset within the same range.
- **Reset** — restores the current trace to its initial state.
- **Play / pause**, **previous**, **next**, and **reset trace** — full transport controls.
- **Keyboard** — `Space` toggles playback; `←` and `→` step through the trace.

The stage renders color-coded bars for unsorted, comparing, swapping, pivot/key, and sorted
states. The statistics strip reports comparisons, swaps/writes, trace execution time, and
the current step out of the total. The pseudocode panel highlights the active line, while
the notes panel explains the algorithm's intuition and its best, average, worst, and space
complexity.

Bogo Sort is capped at 8 elements for responsiveness. Its generator also enforces an
internal 400-shuffle safety limit so a trace always terminates.

The selected SortLab algorithm persists across navigation; a fresh direct load defaults to
Bubble Sort.

---

## Q and the search model

`Q` is the probability that a search target is **absent** from the dataset. It must be a
number from `0` to `1`; blank means `Q = 1`.

The expected number of comparisons for a linear search is:

```text
E[C(n)] = (1 - q) * (n + 1) / 2 + q * n
```

Q affects **average-case search timing** as follows:

| Q | Average-case search behavior |
| --- | --- |
| `0` | Only present-target searches are measured. |
| Between `0` and `1` | Present and absent measurements are blended: `(1 - q) * present + q * absent`. |
| `1` | Only absent-target searches are measured (full scan for Linear Search). |

Best and worst search cases are deterministic and are not Q-weighted:

- **Best** — target planted at the first element (Linear) or midpoint (Binary).
- **Worst** — absent target, forcing a full unsuccessful search.

Sorting workloads are shared across algorithms so comparisons remain fair:

- **Best** — already sorted input.
- **Average** — deterministically shuffled input.
- **Worst** — reverse-sorted input.

Search benchmarks always operate on sorted copies because Binary Search requires an
ordered array. Selected dataset values above the supplied length are extended with
deterministic offsets; this avoids duplicate-heavy data that would distort search timings.

---

## Benchmark methodology

- Timing uses Python's monotonic `time.perf_counter_ns()` clock.
- Sorting timings are the **median of repeated runs**, with a timing budget to keep each
  algorithm reasonably measured without making the page slow.
- Search timings are the **median of batched calls**, with a probe batch used to pick the
  batch size.
- Input sizes are generated from a profile plus the dataset length:

| Profile | Used when | Benchmark sizes | Maximum n |
| --- | --- | --- | --- |
| `quadratic` | Any quadratic sort is selected | 10, 25, 50, 100, 200, 350, 500 | 500 |
| `sorting` | Only non-quadratic sorts are selected | 10, 40, 100, 300, 700, 1,500, 3,000 | 3,000 |
| `searching` | Only search algorithms are selected | 10, 100, 500, 2,000, 6,000, 12,000, 20,000 | 20,000 |

- The supplied dataset length is added to the profile when it fits under the cap.
- Datasets larger than the cap are evenly sampled, and the UI reports this in the notes.
- Input sizes above the supplied dataset length are extended with deterministic offsets.
- Timings are machine-dependent; compare algorithms within one run rather than across
  machines or sessions.

The **Complexity Overview** is theoretical Big-O, while the charts show measured behavior.
A shared workload can produce a different shape than the theoretical worst case for a
particular implementation (for example, Quick Sort with median-of-three pivots on
reverse-sorted input).

---

## Design system

The visual language is intentionally classic and restrained:

- **Palette** — warm paper background, white and neutral surfaces, dark navy/charcoal ink,
  and a single oxblood accent.
- **Typography** — serif display headings over an Inter body with tabular numerals for
  data.
- **Structure** — thin 1px borders, 2–3px corner radii, generous spacing, and a consistent
  type scale.
- **Motion** — short, functional transitions only; animation is disabled under
  `prefers-reduced-motion`.
- **Charts** — light academic styling with muted series colors, subtle grid lines, and no
  glow or gradient effects.
- **Isolation** — SortLab styles live in `static/css/sortlab.css` and are scoped under
  `.sortlab-view`, preventing conflicts with the dashboard design system.

---

## Project structure

```text
algo project/
├── app.py                        # Flask routes, page config, server startup
├── benchmark.py                  # Validation, workloads, timing, Q model, response assembly
├── algorithms.py                 # Pure-Python implementations and catalog metadata
├── requirements.txt              # Flask
├── run.bat                       # Windows launcher with dependency check
├── templates/
│   └── index.html                # All workspace views and shared shell
├── static/
│   ├── css/
│   │   ├── style.css             # Academic design system and dashboard views
│   │   └── sortlab.css           # Scoped SortLab styles
│   ├── js/
│   │   ├── app.js                # Benchmark requests, charts, tables, export
│   │   ├── navigation.js         # Hash router, dropdown, mobile nav, catalog actions
│   │   ├── sortlab.js            # SortLab playback controller
│   │   └── sortlab-algorithms.js # 29 trace generators, pseudocode, and notes
│   ├── vendor/                   # Vendored Chart.js
│   ├── fonts/                    # Vendored Inter font files
│   └── favicon.svg
└── tests/
    ├── test_algorithms.py        # Algorithm correctness, Q formula, metadata
    └── test_benchmark.py         # Engine validation, response shape, Flask API
```

---

## API

### `GET /api/health`

```json
{ "status": "ok", "engine": "python" }
```

### `POST /api/benchmark`

```json
{
  "values": [38, 27, 43, 3, 9, 82, 10, 55],
  "algorithms": ["heap_sort", "merge_sort", "linear_search", "binary_search"],
  "cases": ["best", "average", "worst"],
  "q": 0.5
}
```

`q` may be `null` or omitted to use the default `Q = 1`.

The response contains run metadata, per-algorithm/per-case series, a Q search model, and
informational or warning notes. Invalid payloads return HTTP `400` with an `error` message.

---

## Tests

Run the Python suite from the project folder:

```bash
python -m unittest discover -s tests -v
```

The suite covers:

- Sorting correctness across all six sorters.
- Search correctness and the Q expected-comparison formula.
- Validation of datasets, algorithms, cases, and Q.
- Response shape, size profiles, sampling, and Q weighting.
- Flask page and API endpoints, including malformed requests.

Check the browser scripts for syntax errors with Node.js:

```bash
node --check static/js/app.js
node --check static/js/navigation.js
node --check static/js/sortlab.js
node --check static/js/sortlab-algorithms.js
```

The SortLab generators can also be exercised directly. For example:

```bash
node -e "const fs=require('fs'),vm=require('vm');const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('static/js/sortlab-algorithms.js','utf8'),c);const a=c.window.SortLabAlgorithms;for(const [k,v] of Object.entries(a)){const input=[5,1,4,2,8,3,7,6];const r=v.generate(input.slice());const steps=Array.isArray(r)?r:r.steps;console.log(k, steps.length)}"
```

Manual browser verification should cover every navigation item and dropdown option,
benchmark runs in all three cases, chart tooltips and axis toggles, sorting/searching
catalog actions, all 29 SortLab algorithms, playback and stepping, custom and random
arrays, responsive breakpoints, and the browser console.

---

## Limits and notes

- Maximum input dataset: **20,000 values** per run.
- SortLab accepts arrays from **5 to 60 values**; Bogo Sort is capped at **8**.
- Runs are stateless; benchmark results are not persisted between page reloads.
- The app binds to `127.0.0.1:5000` by default. Set the `PORT` environment variable to use
  another port.
- The server runs with the Flask development server; it is intended for local use.
- Chart.js and Inter are served locally, so the dashboard works without internet access.

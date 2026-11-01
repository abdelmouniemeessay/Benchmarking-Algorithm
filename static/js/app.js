(() => {
  "use strict";

  const CONFIG = window.APP_CONFIG || {};
  const ALGORITHMS = Array.isArray(CONFIG.algorithms) ? CONFIG.algorithms : [];
  const ALGORITHM_ORDER = new Map(ALGORITHMS.map((algorithm, index) => [algorithm.id, index]));
  const CASE_ORDER = ["best", "average", "worst"];
  const CASE_LABELS = {
    best: "Best case",
    average: "Average case",
    worst: "Worst case",
  };
  const DEFAULT_VALUES = CONFIG.defaults?.values || "";
  const MAX_VALUES = Number(CONFIG.limits?.maxValues) || 20000;

  const integerFormatter = new Intl.NumberFormat("en-US");
  const decimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  const NUMBER_TOKEN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
  const REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const elements = {
    form: document.getElementById("benchmarkForm"),
    runButton: document.getElementById("runBtn"),
    runButtonLabel: document.getElementById("runButtonLabel"),
    runMeta: document.getElementById("runMeta"),
    runFootnote: document.getElementById("runFootnote"),
    dirtyHint: document.getElementById("dirtyHint"),
    exportButton: document.getElementById("exportBtn"),
    resetButton: document.getElementById("resetBtn"),
    selectAllButton: document.getElementById("selectAllBtn"),
    algorithmCount: document.getElementById("algoCount"),
    algorithmBreakdown: document.getElementById("algorithmBreakdown"),
    caseCountBadge: document.getElementById("caseCountBadge"),
    qInput: document.getElementById("qInput"),
    qRange: document.getElementById("qRange"),
    qValueLabel: document.getElementById("qValueLabel"),
    qSplitLabel: document.getElementById("qSplitLabel"),
    qNumber: document.querySelector(".q-number"),
    valuesInput: document.getElementById("valuesInput"),
    valueCount: document.getElementById("valueCount"),
    randomizeButton: document.getElementById("randomizeBtn"),
    formError: document.getElementById("formError"),
    resultsSubtitle: document.getElementById("resultsSubtitle"),
    runStatus: document.getElementById("runStatus"),
    runStateText: document.getElementById("runStateText"),
    viewChip: document.getElementById("viewChip"),
    caseButtons: Array.from(document.querySelectorAll("[data-chart-case]")),
    logScaleToggle: document.getElementById("logScaleToggle"),
    engineStatus: document.getElementById("engineStatus"),
    engineLabel: document.getElementById("engineLabel"),
    engineDetail: document.getElementById("engineDetail"),
    fastestSortValue: document.getElementById("fastestSortValue"),
    fastestSortMeta: document.getElementById("fastestSortMeta"),
    fastestSearchValue: document.getElementById("fastestSearchValue"),
    fastestSearchMeta: document.getElementById("fastestSearchMeta"),
    inputSizeValue: document.getElementById("inputSizeValue"),
    inputSizeMeta: document.getElementById("inputSizeMeta"),
    qStatValue: document.getElementById("qStatValue"),
    qStatMeta: document.getElementById("qStatMeta"),
    qStatMeter: document.getElementById("qStatMeter"),
    perfValue: document.getElementById("perfValue"),
    perfDelta: document.getElementById("perfDelta"),
    sortSparkLine: document.getElementById("sortSparkLine"),
    sortSparkArea: document.getElementById("sortSparkArea"),
    searchSparkLine: document.getElementById("searchSparkLine"),
    searchSparkArea: document.getElementById("searchSparkArea"),
    activityFeed: document.getElementById("activityFeed"),
    activityFoot: document.getElementById("activityFoot"),
    allocationList: document.getElementById("allocationList"),
    allocationTotal: document.getElementById("allocationTotal"),
    allocationMeta: document.getElementById("allocationMeta"),
    lineSubtitle: document.getElementById("lineSubtitle"),
    barSubtitle: document.getElementById("barSubtitle"),
    barCaption: document.getElementById("barCaption"),
    barWinner: document.getElementById("barWinner"),
    barWinnerText: document.getElementById("barWinnerText"),
    tableSubtitle: document.getElementById("tableSubtitle"),
    tableNote: document.getElementById("tableNote"),
    resultsBody: document.getElementById("resultsBody"),
    benchmarkNotes: document.getElementById("benchmarkNotes"),
    lineLoading: document.getElementById("lineLoading"),
    barLoading: document.getElementById("barLoading"),
    lineEmpty: document.getElementById("lineEmpty"),
    barEmpty: document.getElementById("barEmpty"),
    lineCanvas: document.getElementById("lineChart"),
    barCanvas: document.getElementById("barChart"),
    lineChartHeading: document.getElementById("lineChartHeading"),
    barChartHeading: document.getElementById("barChartHeading"),
    modelQBadge: document.getElementById("modelQBadge"),
    modelPresent: document.getElementById("modelPresent"),
    modelAbsent: document.getElementById("modelAbsent"),
    modelPresentTrack: document.getElementById("modelPresentTrack"),
    modelAbsentTrack: document.getElementById("modelAbsentTrack"),
    modelN: document.getElementById("modelN"),
    modelExpected: document.getElementById("modelExpected"),
    modelNote: document.getElementById("modelNote"),
    toastRegion: document.getElementById("toastRegion"),
    mainContent: document.querySelector(".main-content"),
  };

  const state = {
    results: null,
    viewCase: "average",
    logScale: true,
    running: false,
    hasData: false,
    appliedSignature: null,
    requestSerial: 0,
  };

  let lineChart = null;
  let barChart = null;

  // -------------------------------------------------------------------------
  // Formatting helpers
  // -------------------------------------------------------------------------

  function formatInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? integerFormatter.format(Math.round(number)) : "—";
  }

  function formatTime(milliseconds) {
    const value = Number(milliseconds);
    if (!Number.isFinite(value) || value < 0) return "—";
    if (value === 0) return "0 ms";

    if (value < 0.001) {
      const microseconds = value * 1000;
      return `${microseconds < 10 ? microseconds.toFixed(2) : microseconds.toFixed(1)} µs`;
    }
    if (value < 1) return `${value.toFixed(3)} ms`;
    if (value < 100) return `${value.toFixed(2)} ms`;
    if (value < 1000) return `${value.toFixed(1)} ms`;
    return `${(value / 1000).toFixed(value < 10000 ? 2 : 1)} s`;
  }

  function formatDuration(milliseconds) {
    const value = Number(milliseconds);
    if (!Number.isFinite(value)) return "—";
    if (value < 1000) return `${Math.max(1, Math.round(value))} ms`;
    return `${(value / 1000).toFixed(value < 10000 ? 2 : 1)} s`;
  }

  function formatPercent(fraction) {
    const percent = Number(fraction) * 100;
    if (!Number.isFinite(percent)) return "—";
    const rounded = Math.round(percent * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
  }

  function formatComparisons(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return decimalFormatter.format(number);
  }

  function withAlpha(hex, alpha) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!match) return `rgba(28, 49, 68, ${alpha})`;
    const [, red, green, blue] = match;
    return `rgba(${parseInt(red, 16)}, ${parseInt(green, 16)}, ${parseInt(blue, 16)}, ${alpha})`;
  }

  function escapeSelector(value) {
    return window.CSS?.escape ? window.CSS.escape(value) : value;
  }

  // -------------------------------------------------------------------------
  // Current-run helpers
  // -------------------------------------------------------------------------

  function currentCaseEntries() {
    return getOrderedAlgorithms()
      .map((algorithm) => {
        const caseData = algorithm.cases[state.viewCase];
        if (!caseData) return null;
        const lastPoint = caseData.at || caseData.series[caseData.series.length - 1];
        return {
          algorithm,
          milliseconds: lastPoint.ms,
          series: caseData.series,
        };
      })
      .filter(Boolean)
      .sort((first, second) => first.milliseconds - second.milliseconds);
  }

  function buildSparklinePath(series, width = 160, height = 48) {
    if (!Array.isArray(series) || series.length < 2) return { line: "", area: "" };

    const values = series.map((point) => Math.log10(Math.max(Number(point.ms), 0.000001)));
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const range = maximum - minimum || 1;
    const inset = 5;
    const points = values.map((value, index) => ({
      x: (index / (values.length - 1)) * width,
      y: height - inset - ((value - minimum) / range) * (height - inset * 2),
    }));

    let line = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const controlX = ((previous.x + current.x) / 2).toFixed(2);
      line += ` C ${controlX} ${previous.y.toFixed(2)}, ${controlX} ${current.y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
    }

    return {
      line,
      area: `${line} L ${width} ${height} L 0 ${height} Z`,
    };
  }

  function updateSparkline(series, lineElement, areaElement) {
    if (!lineElement || !areaElement) return;
    const paths = buildSparklinePath(series);
    lineElement.setAttribute("d", paths.line);
    areaElement.setAttribute("d", paths.area);
  }

  // -------------------------------------------------------------------------
  // Form helpers
  // -------------------------------------------------------------------------

  function getSelectedAlgorithms() {
    return Array.from(
      elements.form.querySelectorAll('input[name="algorithms"]:checked'),
      (input) => input.value
    );
  }

  function getSelectedCases() {
    return CASE_ORDER.filter((caseId) =>
      elements.form.querySelector(`input[name="cases"][value="${escapeSelector(caseId)}"]`)?.checked
    );
  }

  function getQValue() {
    const raw = elements.qInput.value.trim();
    if (raw === "") {
      return { value: 1, valid: true, defaulted: true };
    }

    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      return { value: 1, valid: false, defaulted: false };
    }

    return { value, valid: true, defaulted: false };
  }

  function splitValues(raw) {
    return raw.trim() ? raw.trim().split(/[\s,;]+/).filter(Boolean) : [];
  }

  function isNumericToken(token) {
    return NUMBER_TOKEN.test(token) && Number.isFinite(Number(token));
  }

  function parseDatasetValues() {
    const raw = elements.valuesInput.value;
    const tokens = splitValues(raw);

    if (!tokens.length) {
      throw new Error("Enter at least one numeric dataset value.");
    }

    const invalid = tokens.filter((token) => !isNumericToken(token));
    if (invalid.length) {
      const preview = invalid.slice(0, 3).join(", ");
      throw new Error(
        `These entries are not valid numbers: ${preview}${invalid.length > 3 ? "…" : ""}.`
      );
    }

    if (tokens.length > MAX_VALUES) {
      throw new Error(`Use ${integerFormatter.format(MAX_VALUES)} values or fewer per run.`);
    }

    return tokens.map(Number);
  }

  function getFormSignature() {
    const q = getQValue();
    return JSON.stringify({
      algorithms: getSelectedAlgorithms(),
      cases: getSelectedCases(),
      q: q.valid ? q.value : elements.qInput.value.trim(),
      values: splitValues(elements.valuesInput.value).join(" "),
    });
  }

  function updateAlgorithmUI() {
    const total = ALGORITHMS.length;
    const selected = getSelectedAlgorithms();
    const selectedSet = new Set(selected);

    elements.algorithmCount.textContent = selected.length
      ? `${selected.length} of ${total} selected`
      : "No algorithms selected";

    elements.selectAllButton.textContent = selected.length === total ? "Clear all" : "Select all";

    const sortingCount = ALGORITHMS.filter(
      (algorithm) => algorithm.category === "sorting" && selectedSet.has(algorithm.id)
    ).length;
    const searchingCount = ALGORITHMS.filter(
      (algorithm) => algorithm.category === "searching" && selectedSet.has(algorithm.id)
    ).length;
    elements.algorithmBreakdown.textContent = `${sortingCount} sorting · ${searchingCount} searching`;

    updateRunMeta();
  }

  function updateCaseUI() {
    const count = getSelectedCases().length;
    elements.caseCountBadge.textContent = `${count} selected`;
    elements.caseCountBadge.classList.toggle("is-empty", count === 0);
    updateRunMeta();
  }

  function updateRunMeta() {
    const algorithmCount = getSelectedAlgorithms().length;
    const caseCount = getSelectedCases().length;
    elements.runMeta.textContent = `${algorithmCount} algorithm${algorithmCount === 1 ? "" : "s"} · ${caseCount} case${caseCount === 1 ? "" : "s"}`;
  }

  function updateValueCount() {
    const tokens = splitValues(elements.valuesInput.value);
    const validCount = tokens.filter(isNumericToken).length;
    const invalidCount = tokens.length - validCount;

    if (!tokens.length) {
      elements.valueCount.textContent = "0 values";
      elements.valueCount.classList.remove("is-invalid");
      return;
    }

    if (invalidCount > 0) {
      elements.valueCount.textContent = `${validCount} valid · ${invalidCount} invalid`;
      elements.valueCount.classList.add("is-invalid");
      elements.valueCount.title = "Some entries are not valid numbers.";
      return;
    }

    elements.valueCount.textContent = `${validCount} value${validCount === 1 ? "" : "s"}`;
    elements.valueCount.classList.remove("is-invalid");
    elements.valueCount.title = `${validCount.toLocaleString("en-US")} numeric values detected.`;
  }

  function updateQVisual() {
    const raw = elements.qInput.value.trim();
    const q = getQValue();
    const numericRaw = Number(raw);
    const sliderValue = raw === ""
      ? 1
      : Number.isFinite(numericRaw)
        ? Math.min(1, Math.max(0, numericRaw))
        : 1;

    elements.qRange.value = String(sliderValue);
    elements.qRange.style.setProperty("--q-progress", `${sliderValue * 100}%`);
    elements.qInput.setAttribute("aria-invalid", String(raw !== "" && !q.valid));

    if (raw !== "" && !q.valid) {
      elements.qNumber.classList.add("is-invalid");
      elements.qValueLabel.textContent = "Enter a value from 0 to 1";
      elements.qSplitLabel.textContent = "Q must be between 0 and 1";
      return;
    }

    elements.qNumber.classList.remove("is-invalid");
    const defaultMarkup = q.defaulted ? " <em>default</em>" : "";
    elements.qValueLabel.innerHTML = `Q = ${q.value.toFixed(2)}${defaultMarkup}`;
    elements.qSplitLabel.textContent = `${formatPercent(q.value)} absent · ${formatPercent(1 - q.value)} present`;
  }

  function clearFormError() {
    elements.formError.hidden = true;
    elements.formError.textContent = "";
  }

  function showFormError(message) {
    elements.formError.textContent = message;
    elements.formError.hidden = false;
  }

  function validationFailure(message, field) {
    // Remove stale success/reset notices so they cannot contradict the error.
    dismissToasts(".toast.success, .toast.info");
    showFormError(message);
    showToast("error", "Check benchmark setup", message);

    const target = field === "algorithms"
      ? document.getElementById("algorithmsHeading")
      : field === "cases"
        ? document.getElementById("casesHeading")
        : field === "q"
          ? elements.qInput
          : field === "values"
            ? elements.valuesInput
            : null;

    if (target) {
      if (target === elements.qInput) {
        elements.qNumber.classList.add("is-invalid");
      }
      target.scrollIntoView({
        behavior: REDUCED_MOTION ? "auto" : "smooth",
        block: "center",
      });
      if (target.matches?.("input, textarea, button")) {
        window.setTimeout(() => target.focus({ preventScroll: true }), 280);
      }
    }
  }

  function updateDirtyHint() {
    if (!state.appliedSignature || state.running) {
      elements.dirtyHint.hidden = true;
      return;
    }
    elements.dirtyHint.hidden = getFormSignature() === state.appliedSignature;
  }

  function markDirty() {
    clearFormError();
    updateDirtyHint();
  }

  // -------------------------------------------------------------------------
  // Status helpers
  // -------------------------------------------------------------------------

  function setRunStatus(status, text) {
    elements.runStatus.dataset.state = status;
    elements.runStateText.textContent = text;
  }

  function setEngineState(status, label, detail) {
    elements.engineStatus.dataset.state = status;
    elements.engineLabel.textContent = label;
    elements.engineDetail.textContent = detail;
  }

  function setChartsLoading(isLoading) {
    elements.lineLoading.hidden = !isLoading;
    elements.barLoading.hidden = !isLoading;
    if (isLoading) {
      elements.lineEmpty.hidden = true;
      elements.barEmpty.hidden = true;
    }
  }

  function setRunBusy(isBusy) {
    state.running = isBusy;
    elements.runButton.disabled = isBusy;
    elements.runButton.setAttribute("aria-busy", String(isBusy));
    elements.runButton.classList.toggle("is-running", isBusy);
    elements.runButtonLabel.textContent = isBusy ? "Running…" : "Run benchmark";
    elements.mainContent.setAttribute("aria-busy", String(isBusy));

    if (isBusy) {
      elements.runMeta.textContent = "Measuring in Python…";
      elements.runFootnote.textContent = "Python is executing the algorithms";
      elements.dirtyHint.hidden = true;
      elements.lineLoading.hidden = false;
      elements.barLoading.hidden = false;
      elements.lineEmpty.hidden = true;
      elements.barEmpty.hidden = true;
      setRunStatus("loading", "Benchmarking");
      setEngineState("running", "Python engine", "Benchmarking in Python…");
    } else {
      updateRunMeta();
      elements.runFootnote.textContent = "Runs locally · usually 1–4 seconds";
      updateDirtyHint();
    }
  }

  function showEmptyState(message) {
    elements.lineLoading.hidden = true;
    elements.barLoading.hidden = true;
    [elements.lineEmpty, elements.barEmpty].forEach((emptyState) => {
      emptyState.hidden = false;
      emptyState.querySelector("strong").textContent = "Benchmark not available";
      emptyState.querySelector("span:last-child").textContent = message;
    });
  }

  // -------------------------------------------------------------------------
  // Toasts
  // -------------------------------------------------------------------------

  function dismissToasts(selector = ".toast") {
    elements.toastRegion.querySelectorAll(selector).forEach((toast) => {
      toast.remove();
    });
  }

  function showToast(type, title, message) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    const copy = document.createElement("div");
    copy.className = "toast-copy";

    const heading = document.createElement("strong");
    heading.className = "toast-title";
    heading.textContent = title;

    const detail = document.createElement("span");
    detail.className = "toast-message";
    detail.textContent = message;

    copy.append(heading, detail);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "toast-close";
    closeButton.setAttribute("aria-label", "Dismiss notification");
    closeButton.textContent = "×";

    toast.append(copy, closeButton);
    elements.toastRegion.append(toast);

    while (elements.toastRegion.children.length > 3) {
      elements.toastRegion.firstElementChild?.remove();
    }

    let timeout = window.setTimeout(() => toast.remove(), 4600);
    closeButton.addEventListener("click", () => {
      window.clearTimeout(timeout);
      toast.remove();
    });
    toast.addEventListener("mouseenter", () => window.clearTimeout(timeout));
    toast.addEventListener("mouseleave", () => {
      timeout = window.setTimeout(() => toast.remove(), 2600);
    });
  }

  // -------------------------------------------------------------------------
  // Charts
  // -------------------------------------------------------------------------

  const barValueLabelsPlugin = {
    id: "barValueLabels",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, data } = chart;
      if (!chartArea || !data.datasets.length) return;

      const values = data.datasets[0].data;
      if (!values.length) return;

      const meta = chart.getDatasetMeta(0);
      ctx.save();
      ctx.font = '500 9.5px "Inter", "Segoe UI", sans-serif';
      ctx.fillStyle = "#4E5862";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      meta.data.forEach((bar, index) => {
        const value = Number(values[index]);
        if (!Number.isFinite(value)) return;

        const label = formatTime(value);
        const labelWidth = ctx.measureText(label).width;
        const proposedX = bar.x + 7;
        const x = Math.min(proposedX, chart.width - labelWidth - 6);
        ctx.fillText(label, x, bar.y);
      });

      ctx.restore();
    },
  };

  function chartAnimation(duration) {
    return REDUCED_MOTION ? false : { duration, easing: "easeOutCubic" };
  }

  function setupChartDefaults() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.font.family = '"Inter", "Segoe UI", system-ui, sans-serif';
    Chart.defaults.font.size = 10.5;
    Chart.defaults.color = "#6D746E";
    Chart.defaults.borderColor = "#E8E3D9";
  }

  function createCharts() {
    if (typeof Chart === "undefined") {
      showEmptyState("The chart library could not be loaded. Reload the page to try again.");
      return;
    }

    lineChart = new Chart(elements.lineCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimation(420),
        interaction: {
          mode: "index",
          intersect: false,
          axis: "x",
        },
        layout: {
          padding: { top: 8, right: 12, left: 2, bottom: 0 },
        },
        plugins: {
          legend: {
            position: "top",
            align: "start",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 5,
              boxHeight: 5,
              padding: 16,
              color: "#6D746E",
              font: { size: 9.5, weight: "500" },
            },
          },
          tooltip: {
            backgroundColor: "#FFFFFF",
            titleColor: "#182430",
            bodyColor: "#3E4A56",
            borderColor: "#D9D4C9",
            borderWidth: 1,
            cornerRadius: 3,
            padding: 10,
            usePointStyle: true,
            titleFont: { size: 10.5, weight: "600" },
            bodyFont: { size: 9.5 },
            itemSort: (first, second) => first.parsed.y - second.parsed.y,
            callbacks: {
              title: (items) => (items.length ? `Input size · ${formatInteger(items[0].label)}` : ""),
              label: (context) => ` ${context.dataset.label}: ${formatTime(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: "#8D948C",
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
              font: { size: 9 },
              callback(value) {
                const label = this.getLabelForValue(value);
                return formatInteger(label);
              },
            },
            title: {
              display: true,
              text: "Input size (n)",
              color: "#6D746E",
              font: { size: 9, weight: "600" },
              padding: { top: 7 },
            },
          },
          y: {
            type: state.logScale ? "logarithmic" : "linear",
            beginAtZero: !state.logScale,
            grid: {
              color: "#ECE9E2",
              drawTicks: false,
            },
            border: { display: false },
            ticks: {
              color: "#8D948C",
              maxTicksLimit: 6,
              font: { size: 9 },
              padding: 7,
              callback(value) {
                return formatTime(value);
              },
            },
            title: {
              display: true,
              text: "Execution time",
              color: "#6D746E",
              font: { size: 9, weight: "600" },
              padding: { bottom: 5 },
            },
          },
        },
      },
      plugins: [],
    });

    barChart = new Chart(elements.barCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Execution time",
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 0,
            borderRadius: 2,
            borderSkipped: false,
            minBarLength: 3,
            barPercentage: 0.64,
            categoryPercentage: 0.82,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimation(380),
        layout: {
          padding: { top: 1, right: 64, left: 2, bottom: 0 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#FFFFFF",
            titleColor: "#182430",
            bodyColor: "#3E4A56",
            borderColor: "#D9D4C9",
            borderWidth: 1,
            cornerRadius: 3,
            padding: 10,
            displayColors: false,
            titleFont: { size: 10.5, weight: "600" },
            bodyFont: { size: 9.5 },
            callbacks: {
              title: (items) => items[0]?.label || "",
              label: (context) => formatTime(context.parsed.x),
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: "#ECE9E2",
              drawTicks: false,
            },
            border: { display: false },
            ticks: {
              color: "#8D948C",
              maxTicksLimit: 5,
              font: { size: 9 },
              padding: 6,
              callback(value) {
                return formatTime(value);
              },
            },
            title: {
              display: true,
              text: "Execution time",
              color: "#6D746E",
              font: { size: 9, weight: "600" },
              padding: { top: 5 },
            },
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: "#3E4A56",
              autoSkip: false,
              font: { size: 9.5, weight: "500" },
              padding: 6,
            },
          },
        },
      },
      plugins: [barValueLabelsPlugin],
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        lineChart?.resize();
        barChart?.resize();
      });
    }
  }

  function getOrderedAlgorithms() {
    if (!state.results) return [];
    return Object.values(state.results.algorithms).sort((first, second) => {
      const categoryDifference =
        (first.category === "sorting" ? 0 : 1) - (second.category === "sorting" ? 0 : 1);
      if (categoryDifference) return categoryDifference;
      return (ALGORITHM_ORDER.get(first.id) ?? 99) - (ALGORITHM_ORDER.get(second.id) ?? 99);
    });
  }

  function updateViewLabels() {
    if (!state.results) {
      elements.viewChip.textContent = "Awaiting run";
      return;
    }

    const label = CASE_LABELS[state.viewCase];
    const benchmarkSize = formatInteger(state.results.meta.benchmark_size);
    elements.viewChip.textContent = label;
    elements.lineSubtitle.textContent = `${label} · median wall-clock time across ${state.results.meta.sizes.length} benchmarked input sizes.`;
    elements.barSubtitle.textContent = `${label} execution time at n = ${benchmarkSize}.`;
    elements.barCaption.textContent = `Largest input · n = ${benchmarkSize}`;
    elements.tableSubtitle.textContent = `Execution time at n = ${benchmarkSize} across all included cases.`;
  }

  function syncCaseButtons() {
    const availableCases = state.results?.meta.cases || [];
    elements.caseButtons.forEach((button) => {
      const caseId = button.dataset.chartCase;
      const available = availableCases.includes(caseId);
      button.disabled = !available;
      button.setAttribute("aria-pressed", String(available && caseId === state.viewCase));
    });
  }

  function updateLineChart() {
    if (!lineChart || !state.results) return;

    const algorithms = getOrderedAlgorithms();
    const finalTimes = algorithms
      .map((algorithm) => {
        const caseData = algorithm.cases[state.viewCase];
        if (!caseData) return null;
        const lastPoint = caseData.at || caseData.series[caseData.series.length - 1];
        return { id: algorithm.id, milliseconds: lastPoint.ms };
      })
      .filter(Boolean)
      .sort((first, second) => first.milliseconds - second.milliseconds);
    const fastestId = finalTimes[0]?.id || null;

    const datasets = algorithms
      .map((algorithm) => {
        const caseData = algorithm.cases[state.viewCase];
        if (!caseData) return null;
        const isFastest = algorithm.id === fastestId;
        return {
          label: algorithm.name,
          data: caseData.series.map((point) => point.ms),
          borderColor: algorithm.color,
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return withAlpha(algorithm.color, 0.08);
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, withAlpha(algorithm.color, 0.18));
            gradient.addColorStop(0.55, withAlpha(algorithm.color, 0.045));
            gradient.addColorStop(1, withAlpha(algorithm.color, 0));
            return gradient;
          },
          pointBackgroundColor: "#0B0C10",
          pointBorderColor: algorithm.color,
          pointBorderWidth: 1.6,
          pointHoverBackgroundColor: algorithm.color,
          pointHoverBorderColor: "#FFFFFF",
          pointHoverBorderWidth: 2,
          pointRadius: isFastest ? 3.1 : 2.4,
          pointHoverRadius: 5.5,
          pointHitRadius: 14,
          borderWidth: isFastest ? 2.8 : 1.8,
          tension: 0.32,
          cubicInterpolationMode: "monotone",
          fill: isFastest,
          order: isFastest ? 0 : 1,
        };
      })
      .filter(Boolean);

    lineChart.data.labels = state.results.meta.sizes;
    lineChart.data.datasets = datasets;
    lineChart.options.scales.y.type = state.logScale ? "logarithmic" : "linear";
    lineChart.options.scales.y.beginAtZero = !state.logScale;
    lineChart.options.plugins.tooltip.callbacks.title = (items) =>
      items.length ? `Input size · ${formatInteger(items[0].label)}` : "";

    elements.lineCanvas.setAttribute(
      "aria-label",
      `Line chart of ${CASE_LABELS[state.viewCase].toLowerCase()} execution time by input size for ${datasets.length} algorithms.`
    );

    lineChart.update();
  }

  function updateBarChart() {
    if (!barChart || !state.results) return;

    const entries = currentCaseEntries();

    const colors = entries.map((entry) => withAlpha(entry.algorithm.color, 0.82));
    const borderColors = entries.map((entry) => entry.algorithm.color);

    barChart.data.labels = entries.map((entry) => entry.algorithm.name);
    barChart.data.datasets[0].data = entries.map((entry) => entry.milliseconds);
    barChart.data.datasets[0].backgroundColor = colors;
    barChart.data.datasets[0].borderColor = borderColors;

    elements.barCanvas.setAttribute(
      "aria-label",
      `Bar chart comparing ${CASE_LABELS[state.viewCase].toLowerCase()} execution times for ${entries.length} algorithms at ${formatInteger(state.results.meta.benchmark_size)} values.`
    );

    if (entries.length) {
      elements.barWinner.hidden = false;
      elements.barWinnerText.textContent = `${entries[0].algorithm.name} · ${formatTime(entries[0].milliseconds)}`;
      elements.barWinner.title = `Fastest at n = ${formatInteger(state.results.meta.benchmark_size)}`;
    } else {
      elements.barWinner.hidden = true;
    }

    barChart.update();
  }

  function updateStats() {
    if (!state.results) return;
    const meta = state.results.meta;
    const benchmarkSize = formatInteger(meta.benchmark_size);
    const entries = currentCaseEntries();
    const sortingWinner = entries.find((entry) => entry.algorithm.category === "sorting") || null;
    const searchingWinner = entries.find((entry) => entry.algorithm.category === "searching") || null;

    elements.fastestSortValue.textContent = sortingWinner ? formatTime(sortingWinner.milliseconds) : "—";
    elements.fastestSortMeta.textContent = sortingWinner
      ? `${sortingWinner.algorithm.name} · n = ${benchmarkSize}`
      : "Add a sorting algorithm to compare";

    elements.fastestSearchValue.textContent = searchingWinner ? formatTime(searchingWinner.milliseconds) : "—";
    elements.fastestSearchMeta.textContent = searchingWinner
      ? `${searchingWinner.algorithm.name} · n = ${benchmarkSize}`
      : "Add a search algorithm to compare";

    elements.inputSizeValue.textContent = benchmarkSize;
    elements.inputSizeMeta.textContent = meta.was_sampled
      ? `${formatInteger(meta.effective_input_length)} sampled from ${formatInteger(meta.input_length)}`
      : `${formatInteger(meta.effective_input_length)} values in dataset`;

    elements.qStatValue.textContent = `Q = ${Number(meta.q).toFixed(2)}`;
    if (!meta.categories.includes("searching")) {
      elements.qStatMeta.textContent = "No search algorithms in this run";
    } else if (!meta.cases.includes("average")) {
      elements.qStatMeta.textContent = "Average case was not included";
    } else {
      elements.qStatMeta.textContent = `${formatPercent(meta.q)} absent · average search`;
    }
    if (elements.qStatMeter) {
      elements.qStatMeter.style.width = `${Number(meta.q) * 100}%`;
    }

    elements.resultsSubtitle.textContent =
      `${meta.algorithms.length} algorithms · ${meta.cases.length} cases · ` +
      `n = ${formatInteger(meta.sizes[0])}–${benchmarkSize} · ${formatDuration(meta.duration_ms)} engine time`;

    updateViewLabels();
    updateCaseButtons();
    updatePerformanceHeadline(entries);
    updateSparklines(sortingWinner, searchingWinner);
    updateAllocation(entries);
    updateActivity(entries);
  }

  function updatePerformanceHeadline(entries) {
    if (!elements.perfValue || !elements.perfDelta) return;

    if (!entries.length) {
      elements.perfValue.textContent = "—";
      elements.perfDelta.textContent = "Awaiting run";
      return;
    }

    const fastest = entries[0];
    const median = entries[Math.floor((entries.length - 1) / 2)].milliseconds;
    const ratio = fastest.milliseconds > 0 ? median / fastest.milliseconds : null;
    const benchmarkSize = formatInteger(state.results.meta.benchmark_size);

    elements.perfValue.textContent = formatTime(fastest.milliseconds);
    elements.perfDelta.textContent = ratio && ratio >= 1.08
      ? `${fastest.algorithm.name} · ${ratio.toFixed(1)}× faster than median`
      : `${fastest.algorithm.name} · fastest at n = ${benchmarkSize}`;
    elements.perfValue.title = `${fastest.algorithm.name} at n = ${benchmarkSize}`;
  }

  function updateSparklines(sortingWinner, searchingWinner) {
    updateSparkline(sortingWinner?.series, elements.sortSparkLine, elements.sortSparkArea);
    updateSparkline(searchingWinner?.series, elements.searchSparkLine, elements.searchSparkArea);
  }

  function updateAllocation(entries) {
    if (!elements.allocationList || !elements.allocationTotal || !elements.allocationMeta) return;

    if (!entries.length) {
      elements.allocationTotal.textContent = "—";
      elements.allocationMeta.textContent = "Total measured time across algorithms";
      const empty = document.createElement("div");
      empty.className = "allocation-empty";
      empty.textContent = "Run a benchmark to allocate execution time.";
      elements.allocationList.replaceChildren(empty);
      return;
    }

    const total = entries.reduce((sum, entry) => sum + entry.milliseconds, 0);
    const benchmarkSize = formatInteger(state.results.meta.benchmark_size);
    const caseLabel = CASE_LABELS[state.viewCase];

    elements.allocationTotal.textContent = formatTime(total);
    elements.allocationMeta.textContent =
      `${entries.length} algorithms · ${caseLabel.toLowerCase()} at n = ${benchmarkSize}`;

    const fragment = document.createDocumentFragment();
    const sorted = [...entries].sort((first, second) => second.milliseconds - first.milliseconds);

    sorted.forEach((entry) => {
      const percentage = total > 0 ? (entry.milliseconds / total) * 100 : 0;

      const item = document.createElement("div");
      item.className = "allocation-item";
      item.style.setProperty("--algo-color", entry.algorithm.color);

      const row = document.createElement("div");
      row.className = "allocation-row";

      const dot = document.createElement("span");
      dot.className = "allocation-dot";
      dot.setAttribute("aria-hidden", "true");

      const name = document.createElement("span");
      name.className = "allocation-name";
      name.textContent = entry.algorithm.name;

      const pct = document.createElement("span");
      pct.className = "allocation-pct";
      pct.textContent = percentage > 0 && percentage < 0.1
        ? "<0.1%"
        : formatPercent(percentage / 100);

      row.append(dot, name, pct);

      const track = document.createElement("div");
      track.className = "allocation-track";
      track.setAttribute("aria-hidden", "true");
      const fill = document.createElement("span");
      fill.className = "allocation-fill";
      fill.style.width = `${percentage > 0 ? Math.max(percentage, 1.5) : 0}%`;
      track.append(fill);

      const metaRow = document.createElement("div");
      metaRow.className = "allocation-meta";
      const metaLabel = document.createElement("span");
      metaLabel.textContent = `${caseLabel} · n = ${benchmarkSize}`;
      const metaTime = document.createElement("span");
      metaTime.textContent = formatTime(entry.milliseconds);
      metaRow.append(metaLabel, metaTime);

      item.append(row, track, metaRow);
      fragment.append(item);
    });

    elements.allocationList.replaceChildren(fragment);
  }

  function createActivityItem({ icon, color, title, subtitle, value, success = false }) {
    const item = document.createElement("div");
    item.className = "activity-item";

    const iconWrap = document.createElement("span");
    iconWrap.className = `activity-icon${success ? " is-success" : ""}`;
    iconWrap.style.setProperty("--item-color", color);
    iconWrap.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#icon-${icon}"></use></svg>`;

    const copy = document.createElement("div");
    copy.className = "activity-copy";
    const titleElement = document.createElement("span");
    titleElement.className = "activity-title";
    titleElement.textContent = title;
    const subtitleElement = document.createElement("span");
    subtitleElement.className = "activity-subtitle";
    subtitleElement.textContent = subtitle;
    copy.append(titleElement, subtitleElement);

    const valueElement = document.createElement("span");
    valueElement.className = "activity-value";
    valueElement.textContent = value;

    item.append(iconWrap, copy, valueElement);
    return item;
  }

  function updateActivity(entries) {
    if (!elements.activityFeed || !elements.activityFoot) return;

    if (!entries.length) {
      elements.activityFeed.replaceChildren();
      const empty = document.createElement("div");
      empty.className = "activity-empty";
      empty.innerHTML = `
        <span class="activity-empty-icon" aria-hidden="true"><svg class="icon"><use href="#icon-activity"></use></svg></span>
        <strong>Awaiting execution</strong>
        <span>Algorithm events will stream in here.</span>
      `;
      elements.activityFeed.append(empty);
      elements.activityFoot.textContent = "No runs yet";
      return;
    }

    const meta = state.results.meta;
    const benchmarkSize = formatInteger(meta.benchmark_size);
    const fragment = document.createDocumentFragment();

    fragment.append(
      createActivityItem({
        icon: "check",
        color: "#34D399",
        success: true,
        title: "Benchmark run completed",
        subtitle: `${meta.algorithms.length} algorithms · ${meta.cases.length} cases · ${meta.profile} profile`,
        value: formatDuration(meta.duration_ms),
      })
    );

    entries.slice(0, 4).forEach((entry) => {
      fragment.append(
        createActivityItem({
          icon: entry.algorithm.category === "sorting" ? "bar-chart" : "target",
          color: entry.algorithm.color,
          title: entry.algorithm.name,
          subtitle: `${CASE_LABELS[state.viewCase]} · n = ${benchmarkSize}`,
          value: formatTime(entry.milliseconds),
        })
      );
    });

    elements.activityFeed.replaceChildren(fragment);
    elements.activityFoot.textContent = `Run ${state.results.run_id} · ${formatDuration(meta.duration_ms)} engine time`;
  }

  function updateCaseButtons() {
    const availableCases = state.results?.meta.cases || [];
    elements.caseButtons.forEach((button) => {
      const caseId = button.dataset.chartCase;
      const available = availableCases.includes(caseId);
      button.disabled = !available;
      button.setAttribute("aria-pressed", String(available && caseId === state.viewCase));
    });
  }

  function updateTable() {
    if (!state.results) return;
    const algorithms = getOrderedAlgorithms();
    const includedCases = new Set(state.results.meta.cases);
    const benchmarkSize = state.results.meta.benchmark_size;

    const bestTimeByCase = {};
    CASE_ORDER.forEach((caseId) => {
      if (!includedCases.has(caseId)) return;
      const times = algorithms
        .map((algorithm) => algorithm.cases[caseId])
        .filter(Boolean)
        .map((caseData) => caseData.at?.ms ?? caseData.series[caseData.series.length - 1]?.ms)
        .filter(Number.isFinite);
      if (times.length) bestTimeByCase[caseId] = Math.min(...times);
    });

    const fragment = document.createDocumentFragment();

    if (!algorithms.length) {
      const row = document.createElement("tr");
      row.className = "table-placeholder";
      const cell = document.createElement("td");
      cell.colSpan = 5;
      cell.textContent = "No algorithms were included in this benchmark.";
      row.append(cell);
      fragment.append(row);
    }

    algorithms.forEach((algorithm) => {
      const row = document.createElement("tr");

      const algorithmCell = document.createElement("td");
      const algorithmWrap = document.createElement("span");
      algorithmWrap.className = "table-algo";
      algorithmWrap.style.setProperty("--algo-color", algorithm.color);
      algorithmWrap.title = algorithm.description;
      const dot = document.createElement("span");
      dot.className = "table-algo-dot";
      dot.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.textContent = algorithm.name;
      algorithmWrap.append(dot, name);
      algorithmCell.append(algorithmWrap);

      const classCell = document.createElement("td");
      const classBadge = document.createElement("span");
      classBadge.className = `class-badge ${algorithm.category}`;
      classBadge.textContent = algorithm.category === "sorting" ? "Sorting" : "Searching";
      classCell.append(classBadge);

      row.append(algorithmCell, classCell);

      CASE_ORDER.forEach((caseId) => {
        const cell = document.createElement("td");
        if (!includedCases.has(caseId) || !algorithm.cases[caseId]) {
          const empty = document.createElement("span");
          empty.className = "time-value time-empty";
          empty.textContent = "—";
          empty.title = "This case was not included in the run.";
          cell.append(empty);
          row.append(cell);
          return;
        }

        const caseData = algorithm.cases[caseId];
        const lastPoint = caseData.at || caseData.series[caseData.series.length - 1];
        const time = document.createElement("span");
        time.className = "time-value";
        time.textContent = formatTime(lastPoint.ms);

        if (
          Number.isFinite(bestTimeByCase[caseId]) &&
          Math.abs(lastPoint.ms - bestTimeByCase[caseId]) <= 1e-9
        ) {
          time.classList.add("time-best");
          time.title = `Fastest ${CASE_LABELS[caseId].toLowerCase()} time at n = ${formatInteger(benchmarkSize)}`;
        }

        cell.append(time);
        row.append(cell);
      });

      fragment.append(row);
    });

    elements.resultsBody.replaceChildren(fragment);
    const missingCases = 3 - includedCases.size;
    elements.tableNote.hidden = missingCases === 0;
    elements.tableNote.textContent =
      "— means that case was not included in this run. Select it in the sidebar and run again.";
  }

  function updateSearchModel() {
    if (!state.results) return;
    const model = state.results.search_model;
    const meta = state.results.meta;
    const q = Number(model.q);
    const hasAverage = meta.cases.includes("average");
    const hasSearch = meta.categories.includes("searching");

    elements.modelQBadge.textContent = `Q = ${q.toFixed(2)}`;
    elements.modelPresent.textContent = formatPercent(1 - q);
    elements.modelAbsent.textContent = formatPercent(q);
    elements.modelPresentTrack.style.width = `${(1 - q) * 100}%`;
    elements.modelAbsentTrack.style.width = `${q * 100}%`;
    elements.modelN.textContent = formatInteger(model.n);
    elements.modelExpected.textContent = formatComparisons(model.linear_expected_comparisons);

    if (!hasSearch) {
      elements.modelNote.textContent =
        "No search algorithm was part of the last run, so Q did not affect its timings.";
    } else if (!hasAverage) {
      elements.modelNote.textContent =
        "Average case was not included. Q only weights average-case Linear and Binary Search trials.";
    } else if (q === 1) {
      elements.modelNote.textContent =
        "Q = 1 weights average-case searches entirely toward absent-target runs. Lower Q to blend in present targets.";
    } else if (q === 0) {
      elements.modelNote.textContent =
        "Q = 0 measures only present-target searches. Raise Q to blend in the cost of an absent target.";
    } else {
      elements.modelNote.textContent =
        `Q = ${q.toFixed(2)} blends absent-target and present-target search measurements at a ${formatPercent(q)}/${formatPercent(1 - q)} weighting.`;
    }
  }

  function updateNotes() {
    if (!state.results) return;
    const notes = Array.isArray(state.results.meta.notes) ? state.results.meta.notes : [];
    elements.benchmarkNotes.replaceChildren();

    if (!notes.length) {
      elements.benchmarkNotes.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();
    notes.forEach((note) => {
      const type = note.type === "warning" ? "warning" : "info";
      const text = typeof note === "string" ? note : note.text;
      const item = document.createElement("div");
      item.className = `note-item${type === "warning" ? " warning" : ""}`;

      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("class", "icon");
      icon.setAttribute("aria-hidden", "true");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "#icon-info");
      icon.append(use);

      const copy = document.createElement("span");
      copy.textContent = text;
      item.append(icon, copy);
      fragment.append(item);
    });

    elements.benchmarkNotes.append(fragment);
    elements.benchmarkNotes.hidden = false;
  }

  function applyResults(payload, { initial = false, submittedSignature = "" } = {}) {
    if (!payload?.meta || !payload?.algorithms) {
      throw new Error("The benchmark engine returned an incomplete response.");
    }

    state.results = payload;
    state.hasData = true;
    state.appliedSignature = submittedSignature;
    const availableCases = payload.meta.cases;
    if (!availableCases.includes(state.viewCase)) {
      state.viewCase = availableCases.includes("average") ? "average" : availableCases[0];
    }

    setChartsLoading(false);
    elements.lineEmpty.hidden = true;
    elements.barEmpty.hidden = true;
    syncCaseButtons();
    updateStats();
    updateLineChart();
    updateBarChart();
    updateTable();
    updateSearchModel();
    updateNotes();

    setRunStatus("success", `Complete · ${formatDuration(payload.meta.duration_ms)}`);
    setEngineState("online", "Python engine", "Online · perf_counter timing");
    elements.runFootnote.textContent = "Runs locally · results are ready";
    updateDirtyHint();

    if (!initial) {
      showToast(
        "success",
        "Benchmark complete",
        `${payload.meta.algorithms.length} algorithms across ${payload.meta.cases.length} case${payload.meta.cases.length === 1 ? "" : "s"} in ${formatDuration(payload.meta.duration_ms)}.`
      );
    }
  }

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------

  function exportResults() {
    if (!state.results) {
      showToast("info", "No report yet", "Run a benchmark before exporting the measurement report.");
      return;
    }

    const rows = [["Algorithm", "Class", "Case", "Input size", "Time (ms)"]];
    getOrderedAlgorithms().forEach((algorithm) => {
      Object.entries(algorithm.cases).forEach(([caseId, caseData]) => {
        caseData.series.forEach((point) => {
          rows.push([
            algorithm.name,
            algorithm.category,
            CASE_LABELS[caseId] || caseId,
            point.n,
            point.ms,
          ]);
        });
      });
    });

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `benchmark-${state.results.run_id}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast(
      "success",
      "Report exported",
      `${rows.length - 1} measurements saved as benchmark-${state.results.run_id}.csv.`
    );
  }

  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------

  async function runBenchmark({ initial = false } = {}) {
    if (state.running) return;
    clearFormError();

    const algorithms = getSelectedAlgorithms();
    if (!algorithms.length) {
      validationFailure("Select at least one algorithm to benchmark.", "algorithms");
      return;
    }

    const cases = getSelectedCases();
    if (!cases.length) {
      validationFailure("Select at least one case to include.", "cases");
      return;
    }

    const q = getQValue();
    if (!q.valid) {
      updateQVisual();
      validationFailure("Q must be a number between 0 and 1. Leave it blank for Q = 1.", "q");
      return;
    }

    let values;
    try {
      values = parseDatasetValues();
    } catch (error) {
      validationFailure(error.message, "values");
      return;
    }

    const submittedSignature = getFormSignature();
    const payload = {
      values,
      algorithms,
      cases,
      q: q.defaulted ? null : q.value,
    };

    // A new valid run supersedes any notice from the previous configuration.
    dismissToasts();

    const requestId = ++state.requestSerial;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90000);

    setRunBusy(true);
    setChartsLoading(true);
    setEngineState("running", "Python engine", "Executing algorithms…");

    try {
      const response = await fetch("/api/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (requestId !== state.requestSerial) return;

      if (!response.ok) {
        const message = data?.error || `The benchmark request failed (${response.status}).`;
        showFormError(message);
        throw new Error(message);
      }

      applyResults(data, { initial, submittedSignature });
    } catch (error) {
      if (requestId !== state.requestSerial) return;
      const message = error.name === "AbortError"
        ? "The benchmark timed out. Try a smaller dataset or fewer algorithms."
        : error.message || "The benchmark could not be completed.";

      setChartsLoading(false);
      setRunStatus("error", "Run failed");
      setEngineState("error", "Python engine", "Last run failed");
      showFormError(message);

      if (!state.hasData) {
        showEmptyState("Adjust the configuration and press Start to try again.");
      }

      showToast("error", initial ? "Benchmark failed to load" : "Benchmark failed", message);
    } finally {
      window.clearTimeout(timeoutId);
      if (requestId === state.requestSerial) {
        setRunBusy(false);
        if (state.hasData) {
          setChartsLoading(false);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Events and initialization
  // -------------------------------------------------------------------------

  function setupNavSpy() {
    const navItems = Array.from(document.querySelectorAll(".sidebar-nav .nav-item"));
    if (!navItems.length) return;

    const sections = navItems
      .map((item) => {
        const hash = item.getAttribute("href") || "";
        const target = hash.startsWith("#") ? document.getElementById(hash.slice(1)) : null;
        return target ? { item, target } : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    let frame = 0;

    const setActive = (activeItem) => {
      navItems.forEach((item) => item.classList.toggle("is-active", item === activeItem));
    };

    const update = () => {
      frame = 0;
      const threshold = Math.min(window.innerHeight * 0.32, 260);
      let current = sections[0];

      sections.forEach((section) => {
        if (section.target.getBoundingClientRect().top <= threshold) {
          current = section;
        }
      });

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 48;
      if (atBottom) {
        current = sections[sections.length - 1];
      }

      setActive(current.item);
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    navItems.forEach((item) => {
      item.addEventListener("click", () => setActive(item));
    });

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  }

  function bindEvents() {
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      runBenchmark({ initial: false });
    });

    elements.exportButton?.addEventListener("click", exportResults);

    elements.form.addEventListener("input", (event) => {
      if (event.target === elements.valuesInput) {
        updateValueCount();
      }
      if (event.target === elements.qInput) {
        updateQVisual();
      }
      markDirty();
    });

    elements.form.addEventListener("change", () => {
      updateAlgorithmUI();
      updateCaseUI();
      markDirty();
    });

    elements.selectAllButton.addEventListener("click", () => {
      const checkboxes = Array.from(
        elements.form.querySelectorAll('input[name="algorithms"]')
      );
      const allChecked = checkboxes.every((checkbox) => checkbox.checked);
      checkboxes.forEach((checkbox) => {
        checkbox.checked = !allChecked;
      });
      updateAlgorithmUI();
      markDirty();
    });

    elements.qRange.addEventListener("input", () => {
      elements.qInput.value = Number(elements.qRange.value).toFixed(2);
      updateQVisual();
      markDirty();
    });

    elements.randomizeButton.addEventListener("click", () => {
      const values = Array.from({ length: 24 }, () => Math.floor(Math.random() * 99) + 1);
      elements.valuesInput.value = values.join(", ");
      updateValueCount();
      markDirty();
      elements.valuesInput.focus();
    });

    elements.resetButton.addEventListener("click", () => {
      elements.form.querySelectorAll('input[name="algorithms"]').forEach((checkbox) => {
        checkbox.checked = true;
      });
      elements.form.querySelectorAll('input[name="cases"]').forEach((checkbox) => {
        checkbox.checked = true;
      });
      elements.qInput.value = "";
      elements.qRange.value = "1";
      elements.valuesInput.value = DEFAULT_VALUES;
      clearFormError();
      updateAlgorithmUI();
      updateCaseUI();
      updateValueCount();
      updateQVisual();
      markDirty();
      showToast("info", "Configuration reset", "Default algorithms, cases, and dataset restored.");
    });

    elements.caseButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled || !state.results) return;
        const nextCase = button.dataset.chartCase;
        if (!CASE_ORDER.includes(nextCase) || nextCase === state.viewCase) return;
        state.viewCase = nextCase;
        updateCaseButtons();
        updateStats();
        updateLineChart();
        updateBarChart();
      });
    });

    elements.logScaleToggle.addEventListener("click", () => {
      state.logScale = !state.logScale;
      elements.logScaleToggle.classList.toggle("is-on", state.logScale);
      elements.logScaleToggle.setAttribute("aria-checked", String(state.logScale));
      if (lineChart) {
        lineChart.options.scales.y.type = state.logScale ? "logarithmic" : "linear";
        lineChart.options.scales.y.beginAtZero = !state.logScale;
        lineChart.update();
      }
    });

    window.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!state.running) elements.form.requestSubmit();
      }
    });

    // Charts created while another view is active start with zero dimensions.
    // Resize them once the dashboard is visible again.
    window.addEventListener("algolab:viewchange", (event) => {
      if (event.detail?.view !== "dashboard") return;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          lineChart?.resize();
          barChart?.resize();
        });
      });
    });
  }

  // -------------------------------------------------------------------------
  // Public bridge (used by the catalog views and navigation)
  // -------------------------------------------------------------------------

  function selectAlgorithmsForBenchmark(ids, { announce = true } = {}) {
    if (!elements.form) return false;

    const requested = Array.isArray(ids) ? ids : [ids];
    const validIds = new Set(ALGORITHMS.map((algorithm) => algorithm.id));
    const selectedIds = requested.filter((id) => validIds.has(id));
    if (!selectedIds.length) return false;

    const selectedSet = new Set(selectedIds);
    elements.form.querySelectorAll('input[name="algorithms"]').forEach((checkbox) => {
      checkbox.checked = selectedSet.has(checkbox.value);
    });

    updateAlgorithmUI();
    markDirty();

    if (announce) {
      const names = ALGORITHMS
        .filter((algorithm) => selectedSet.has(algorithm.id))
        .map((algorithm) => algorithm.name);
      showToast(
        "info",
        "Benchmark configured",
        `${names.join(", ")} selected. Adjust cases or run when ready.`
      );
    }

    return true;
  }

  window.AlgoLabBenchmark = {
    selectAlgorithm(id, options) {
      return selectAlgorithmsForBenchmark([id], options);
    },
    selectAlgorithms(ids, options) {
      return selectAlgorithmsForBenchmark(ids, options);
    },
    run() {
      elements.form?.requestSubmit();
    },
    exportReport: exportResults,
    hasResults() {
      return Boolean(state.results);
    },
  };

  function init() {
    if (!elements.form) return;

    setupChartDefaults();
    createCharts();
    bindEvents();
    setupNavSpy();
    updateAlgorithmUI();
    updateCaseUI();
    updateValueCount();
    updateQVisual();
    syncCaseButtons();
    updateDirtyHint();
    elements.viewChip.textContent = "Awaiting run";
    setRunStatus("loading", "Starting engine");
    setEngineState("online", "Python engine", "Online · perf_counter timing");

    window.setTimeout(() => runBenchmark({ initial: true }), 180);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

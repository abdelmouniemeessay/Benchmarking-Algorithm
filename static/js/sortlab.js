/* ==========================================================================
   AlgoLab SortLab controller
   A thin playback layer over the precomputed step traces in
   sortlab-algorithms.js. Algorithm logic and rendering stay separate: the
   generators return compare / swap / overwrite / pivot / select / sorted
   events, and this file replays them.
   ========================================================================== */
(() => {
  "use strict";

  const ALGORITHMS = window.SortLabAlgorithms || {};
  const ALGORITHM_KEYS = Object.keys(ALGORITHMS);

  const FAMILIES = [
    {
      label: "Elementary",
      keys: ["bubble", "selection", "insertion", "cocktail", "comb", "gnome", "oddeven", "cycle"],
    },
    {
      label: "Divide & conquer",
      keys: ["merge", "quick", "sample", "parmerge", "parquick"],
    },
    {
      label: "Heap & tree",
      keys: ["heap", "smooth", "tree", "tournament"],
    },
    {
      label: "Distribution",
      keys: ["counting", "radix", "bucket", "pigeonhole", "flash"],
    },
    {
      label: "Advanced & hybrid",
      keys: ["shell", "timsort", "intro", "extmerge", "bitonic"],
    },
    {
      label: "Specialized",
      keys: ["pancake", "bogo"],
    },
  ];

  const FAMILY_BY_KEY = new Map();
  FAMILIES.forEach((family) => {
    family.keys.forEach((key) => FAMILY_BY_KEY.set(key, family.label));
  });

  const BOGO_KEY = "bogo";
  const BOGO_CAP = 8;
  const MIN_SIZE = 5;
  const MAX_SIZE = 60;
  const MIN_VALUE = 1;
  const MAX_VALUE = 500;
  const DEFAULT_SIZE = 30;
  const DEFAULT_ALGORITHM = "bubble";
  const DEFAULT_CUSTOM_HINT = `Integers from ${MIN_VALUE} to ${MAX_VALUE}.`;
  const REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const elements = {
    algorithm: document.getElementById("slAlgorithm"),
    algorithmHint: document.getElementById("slAlgorithmHint"),
    size: document.getElementById("slSize"),
    sizeValue: document.getElementById("slSizeValue"),
    speed: document.getElementById("slSpeed"),
    speedValue: document.getElementById("slSpeedValue"),
    custom: document.getElementById("slCustom"),
    applyCustom: document.getElementById("slApplyCustom"),
    customHint: document.getElementById("slCustomHint"),
    randomize: document.getElementById("slRandomize"),
    reset: document.getElementById("slReset"),
    bars: document.getElementById("slBars"),
    comparisons: document.getElementById("slComparisons"),
    swaps: document.getElementById("slSwaps"),
    execution: document.getElementById("slExecution"),
    stepCount: document.getElementById("slStepCount"),
    progressBar: document.getElementById("slProgressBar"),
    status: document.getElementById("slStatus"),
    play: document.getElementById("slPlay"),
    playLabel: document.getElementById("slPlayLabel"),
    prev: document.getElementById("slPrev"),
    next: document.getElementById("slNext"),
    stepReset: document.getElementById("slStepReset"),
    stepLabel: document.getElementById("slStepLabel"),
    codeFile: document.getElementById("slCodeFile"),
    code: document.getElementById("slCode"),
    docsHeading: document.getElementById("slDocsHeading"),
    algoBadge: document.getElementById("slAlgoBadge"),
    intuition: document.getElementById("slIntuition"),
    best: document.getElementById("slBest"),
    bestWhy: document.getElementById("slBestWhy"),
    avg: document.getElementById("slAvg"),
    avgWhy: document.getElementById("slAvgWhy"),
    worst: document.getElementById("slWorst"),
    worstWhy: document.getElementById("slWorstWhy"),
    space: document.getElementById("slSpace"),
    spaceWhy: document.getElementById("slSpaceWhy"),
  };

  const state = {
    algoKey: DEFAULT_ALGORITHM,
    sourceArray: [],
    baseArray: [],
    workArray: [],
    barElements: [],
    steps: [],
    stepIndex: 0,
    sortedSet: new Set(),
    comparisons: 0,
    swaps: 0,
    playing: false,
    timer: null,
    speed: 5,
    traceMs: 0,
    maxValue: 1,
    padded: 0,
    labelCount: 0,
    labelDigits: 0,
    lastSwapAt: 0,
    initialized: false,
  };

  // -------------------------------------------------------------------------
  // Formatting and helpers
  // -------------------------------------------------------------------------

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value)));
  }

  function randomArray(size) {
    return Array.from(
      { length: clamp(size, MIN_SIZE, MAX_SIZE) },
      () => Math.floor(Math.random() * 96) + 5
    );
  }

  function formatTraceTime(milliseconds) {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
    if (milliseconds < 0.1) return "<0.1 ms";
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(milliseconds < 10 ? 2 : 1)} ms`;
    }
    return `${(milliseconds / 1000).toFixed(2)} s`;
  }

  function complexityClass(average) {
    const value = String(average || "");
    if (/n!|n\s*×\s*n!/i.test(value)) return "Combinatorial";
    if (/n\s*log²\s*n|n\s*log\^2\s*n/i.test(value)) return "Linearithmic²";
    if (/n\s*log\s*n/i.test(value)) return "Linearithmic";
    if (/n²|n\^2/i.test(value)) return "Quadratic";
    if (/log\s*n/i.test(value)) return "Logarithmic";
    if (/n\s*\+\s*(k|range|b)/i.test(value) || /O\(n\)/.test(value)) return "Linear";
    if (/unbounded/i.test(value)) return "Unbounded";
    return "Complexity";
  }

  function setStatus(kind) {
    if (!elements.status) return;
    const labels = {
      idle: "Idle",
      running: "Running",
      paused: "Paused",
      done: "Sorted",
      error: "Error",
    };
    elements.status.textContent = labels[kind] || kind;
    elements.status.dataset.state = kind;
  }

  function setCustomHint(text, kind = "") {
    if (!elements.customHint) return;
    elements.customHint.textContent = text;
    elements.customHint.classList.toggle("is-error", kind === "error");
    elements.customHint.classList.toggle("is-note", kind === "note");
  }

  function hashAlgorithm() {
    const match = /^#\/sortlab\/([a-z0-9_-]+)\/?$/i.exec(window.location.hash || "");
    if (match && ALGORITHMS[match[1]]) return match[1];
    return null;
  }

  // -------------------------------------------------------------------------
  // Algorithm picker
  // -------------------------------------------------------------------------

  function populateAlgorithms() {
    if (!elements.algorithm) return;

    const fragment = document.createDocumentFragment();
    const added = new Set();

    FAMILIES.forEach((family) => {
      const keys = family.keys.filter((key) => ALGORITHMS[key]);
      if (!keys.length) return;

      const group = document.createElement("optgroup");
      group.label = family.label;
      keys.forEach((key) => {
        const algorithm = ALGORITHMS[key];
        const option = document.createElement("option");
        option.value = key;
        option.textContent = algorithm.name;
        group.append(option);
        added.add(key);
      });
      fragment.append(group);
    });

    const remaining = ALGORITHM_KEYS.filter((key) => !added.has(key));
    if (remaining.length) {
      const group = document.createElement("optgroup");
      group.label = "Other";
      remaining.forEach((key) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = ALGORITHMS[key].name;
        group.append(option);
      });
      fragment.append(group);
    }

    elements.algorithm.replaceChildren(fragment);
  }

  function updateAlgorithmHint() {
    if (!elements.algorithmHint) return;
    const algorithm = ALGORITHMS[state.algoKey];
    if (!algorithm) return;

    const family = FAMILY_BY_KEY.get(state.algoKey) || "Algorithm";
    let text = `${family} · average ${algorithm.docs.avg} · ${algorithm.docs.space} auxiliary space`;
    let note = false;

    if (state.algoKey === BOGO_KEY) {
      text = `Educational only · capped at ${BOGO_CAP} elements so the trace stays responsive.`;
      note = true;
    } else if (state.padded > 0) {
      text = `${family} · padded to ${state.baseArray.length} bars for the sorting network.`;
      note = true;
    }

    elements.algorithmHint.textContent = text;
    elements.algorithmHint.classList.toggle("is-note", note);
  }

  // -------------------------------------------------------------------------
  // Trace setup
  // -------------------------------------------------------------------------

  function pausePlayback({ updateStatus = true } = {}) {
    state.playing = false;
    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = null;
    }
    updatePlaybackUI();
    if (updateStatus && state.stepIndex > 0 && state.stepIndex < state.steps.length) {
      setStatus("paused");
    }
  }

  function setupRun(source) {
    pausePlayback({ updateStatus: false });

    const algorithm = ALGORITHMS[state.algoKey];
    if (!algorithm) {
      setStatus("error");
      return;
    }

    let input = Array.isArray(source) ? source.slice() : [];
    if (input.length < MIN_SIZE) {
      input = randomArray(Math.max(MIN_SIZE, input.length));
    }
    if (input.length > MAX_SIZE) {
      input = input.slice(0, MAX_SIZE);
    }
    if (state.algoKey === BOGO_KEY && input.length > BOGO_CAP) {
      input = input.slice(0, BOGO_CAP);
    }

    const started = performance.now();
    let result;
    try {
      result = algorithm.generate(input.slice());
    } catch (error) {
      console.error("SortLab trace generation failed:", error);
      setStatus("error");
      setCustomHint("This algorithm could not generate a trace for that array.", "error");
      return;
    }
    const elapsed = performance.now() - started;

    let steps;
    let effectiveArray;
    if (Array.isArray(result)) {
      steps = result;
      effectiveArray = input;
    } else {
      steps = Array.isArray(result?.steps) ? result.steps : [];
      effectiveArray = Array.isArray(result?.displayArray) ? result.displayArray : input;
    }

    state.sourceArray = input.slice();
    state.baseArray = effectiveArray.slice();
    state.workArray = effectiveArray.slice();
    state.barElements = [];
    state.steps = steps;
    state.stepIndex = 0;
    state.sortedSet = new Set();
    state.comparisons = 0;
    state.swaps = 0;
    state.traceMs = elapsed;
    state.maxValue = Math.max(...state.baseArray, 1);
    state.padded = Math.max(0, state.baseArray.length - state.sourceArray.length);

    if (elements.size) elements.size.value = String(state.sourceArray.length);
    updateSizeLabel();
    renderBars(null);
    renderCode();
    renderDocs();
    updateAlgorithmHint();
    updateCounters();
    updateExecutionTime();
    updateBounds();
    updatePlaybackUI();
    clearCodeHighlight();

    if (!state.steps.length) {
      state.sortedSet = new Set(state.workArray.map((_, index) => index));
      renderBars(null);
      setStatus("done");
    } else {
      setStatus("idle");
    }
  }

  function selectAlgorithm(key, { keepArray = true, initial = false } = {}) {
    if (!ALGORITHMS[key]) return false;

    if (
      key === state.algoKey &&
      state.initialized &&
      state.steps.length &&
      keepArray
    ) {
      if (elements.algorithm) elements.algorithm.value = key;
      return true;
    }

    state.algoKey = key;
    if (elements.algorithm) elements.algorithm.value = key;

    let keepCustomHint = false;

    if (keepArray && state.sourceArray.length >= MIN_SIZE) {
      let source = state.sourceArray;
      if (key === BOGO_KEY && source.length > BOGO_CAP) {
        source = randomArray(BOGO_CAP);
        setCustomHint(
          `Bogo Sort is capped at ${BOGO_CAP} values; a smaller array was generated.`,
          "note"
        );
        keepCustomHint = true;
      }
      setupRun(source);
    } else {
      const size = clamp(elements.size?.value || DEFAULT_SIZE, MIN_SIZE, MAX_SIZE);
      setupRun(randomArray(key === BOGO_KEY ? Math.min(size, BOGO_CAP) : size));
    }

    if (!initial && !keepCustomHint) {
      setCustomHint(DEFAULT_CUSTOM_HINT);
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // Playback engine
  // -------------------------------------------------------------------------

  function applyStep(step) {
    if (!step) return;

    switch (step.type) {
      case "compare":
        state.comparisons += 1;
        break;
      case "swap": {
        const [first, second] = step.indices || [];
        if (Number.isInteger(first) && Number.isInteger(second)) {
          const temporary = state.workArray[first];
          state.workArray[first] = state.workArray[second];
          state.workArray[second] = temporary;
          state.swaps += 1;
        }
        break;
      }
      case "overwrite":
        if (Number.isInteger(step.index)) {
          state.workArray[step.index] = step.value;
          state.swaps += 1;
        }
        break;
      case "sorted":
        if (Number.isInteger(step.index)) state.sortedSet.add(step.index);
        break;
      case "pivot":
      case "select":
      default:
        break;
    }
  }

  function rebuildTo(index) {
    const target = clamp(index, 0, state.steps.length);
    state.workArray = state.baseArray.slice();
    state.sortedSet = new Set();
    state.comparisons = 0;
    state.swaps = 0;

    for (let stepIndex = 0; stepIndex < target; stepIndex += 1) {
      applyStep(state.steps[stepIndex]);
    }

    state.stepIndex = target;
    rebuildBarElements(state.workArray);
    const activeStep = target > 0 ? state.steps[target - 1] : null;
    renderBars(activeStep);
    if (activeStep) {
      highlightCodeLine(activeStep.line);
    } else {
      clearCodeHighlight();
    }
    updateCounters();
    updateBounds();
    updatePlaybackUI();
    setStatus(target === 0 ? "idle" : target >= state.steps.length ? "done" : "paused");

    if (target >= state.steps.length) {
      state.sortedSet = new Set(state.workArray.map((_, barIndex) => barIndex));
      renderBars(null);
    }
  }

  function completeRun() {
    pausePlayback({ updateStatus: false });
    state.sortedSet = new Set(state.workArray.map((_, index) => index));
    renderBars(null);
    updateCounters();
    updateBounds();
    updatePlaybackUI();
    setStatus("done");
  }

  function stepForward() {
    if (state.stepIndex >= state.steps.length) {
      completeRun();
      return false;
    }

    const step = state.steps[state.stepIndex];
    applyStep(step);
    state.stepIndex += 1;
    if (step.type === "swap") {
      const [first, second] = step.indices || [];
      swapBarElements(first, second);
    }
    renderBars(step);
    highlightCodeLine(step.line);
    updateCounters();
    updateBounds();
    updatePlaybackUI();

    if (state.stepIndex >= state.steps.length) {
      completeRun();
    } else if (!state.playing) {
      setStatus("paused");
    }

    return true;
  }

  function stepBackward() {
    if (state.stepIndex <= 0) return;
    pausePlayback({ updateStatus: false });
    rebuildTo(state.stepIndex - 1);
  }

  function speedToDelay(speed) {
    return Math.max(6, Math.round(900 / Math.pow(speed, 1.8)));
  }

  function startPlayback() {
    if (!state.steps.length) return;
    if (state.stepIndex >= state.steps.length) {
      rebuildTo(0);
    }

    state.playing = true;
    updatePlaybackUI();
    setStatus("running");

    const tick = () => {
      if (!state.playing) return;
      const advanced = stepForward();
      if (advanced && state.playing) {
        state.timer = window.setTimeout(tick, speedToDelay(state.speed));
      }
    };

    tick();
  }

  function togglePlayback() {
    if (state.playing) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }

  function resetTrace() {
    pausePlayback({ updateStatus: false });
    rebuildTo(0);
    setStatus("idle");
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  function activeIndices(step) {
    const groups = {
      compare: new Set(),
      swap: new Set(),
      pivot: new Set(),
    };
    if (!step) return groups;

    if (step.type === "compare") {
      (step.indices || []).forEach((index) => groups.compare.add(index));
    } else if (step.type === "swap") {
      (step.indices || []).forEach((index) => groups.swap.add(index));
    } else if (step.type === "overwrite") {
      if (Number.isInteger(step.index)) groups.swap.add(step.index);
    } else if (step.type === "pivot" || step.type === "select") {
      if (Number.isInteger(step.index)) groups.pivot.add(step.index);
    }

    return groups;
  }

  function describeStep(step) {
    if (!step) return "";
    if (step.type === "compare") {
      const [first, second] = step.indices || [];
      return `Comparing positions ${first + 1} and ${second + 1}.`;
    }
    if (step.type === "swap") {
      const [first, second] = step.indices || [];
      return `Swapping positions ${first + 1} and ${second + 1}.`;
    }
    if (step.type === "overwrite") {
      return `Writing ${step.value} to position ${step.index + 1}.`;
    }
    if (step.type === "pivot" || step.type === "select") {
      return `Selecting position ${step.index + 1}.`;
    }
    if (step.type === "sorted") {
      return `Position ${step.index + 1} is in final order.`;
    }
    return "Applying the next trace event.";
  }

  function createBarElement(value, index) {
    const bar = document.createElement("div");
    bar.className = "sl-bar";
    bar.title = `Index ${index + 1}: ${value}`;

    const label = document.createElement("span");
    label.className = "sl-bar-value";
    label.textContent = value;
    bar.append(label);

    return bar;
  }

  function rebuildBarElements(array) {
    state.barElements = array.map((value, index) => createBarElement(value, index));
    elements.bars.replaceChildren(...state.barElements);
  }

  function updateLabelSize() {
    if (!elements.bars || !state.workArray.length) return;

    const width = elements.bars.clientWidth;
    if (!width) return;

    const styles = window.getComputedStyle(elements.bars);
    const horizontalPadding =
      (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const gap = parseFloat(styles.columnGap) || 3;
    const count = state.workArray.length;
    const available = Math.max(
      1,
      width - horizontalPadding - gap * Math.max(0, count - 1)
    );
    const digits = String(Math.max(...state.workArray, 1)).length;
    const labelSize = clamp(available / count / (digits * 0.64), 5, 9);

    elements.bars.style.setProperty("--sl-label-size", `${labelSize.toFixed(1)}px`);
    elements.bars.classList.toggle("is-dense", count > 32);
    elements.bars.classList.toggle("is-very-dense", count > 48);
  }

  function swapDomNodes(first, second) {
    const parent = first.parentElement;
    if (!parent || second.parentElement !== parent) return;

    const placeholder = document.createComment("swap");
    parent.insertBefore(placeholder, first);
    parent.insertBefore(first, second);
    parent.insertBefore(second, placeholder);
    parent.removeChild(placeholder);
  }

  function swapBarElements(first, second) {
    if (!Number.isInteger(first) || !Number.isInteger(second) || first === second) {
      return;
    }

    const bars = state.barElements;
    if (first < 0 || second < 0 || first >= bars.length || second >= bars.length) {
      return;
    }

    const firstBar = bars[first];
    const secondBar = bars[second];
    if (
      !firstBar ||
      !secondBar ||
      firstBar.parentElement !== elements.bars ||
      secondBar.parentElement !== elements.bars
    ) {
      return;
    }

    const now = performance.now();
    const shouldAnimate =
      !REDUCED_MOTION &&
      typeof firstBar.animate === "function" &&
      (state.playing || now - state.lastSwapAt > 45);
    state.lastSwapAt = now;

    let firstRect;
    let secondRect;
    if (shouldAnimate) {
      firstRect = firstBar.getBoundingClientRect();
      secondRect = secondBar.getBoundingClientRect();
    }

    [bars[first], bars[second]] = [bars[second], bars[first]];
    swapDomNodes(firstBar, secondBar);

    if (!shouldAnimate) return;

    const duration = state.playing
      ? Math.max(24, Math.min(130, speedToDelay(state.speed) * 0.8))
      : 170;

    [
      [firstBar, firstRect],
      [secondBar, secondRect],
    ].forEach(([bar, fromRect]) => {
      const toRect = bar.getBoundingClientRect();
      const deltaX = fromRect.left - toRect.left;
      const deltaY = fromRect.top - toRect.top;
      if (!deltaX && !deltaY) return;

      bar.style.zIndex = "2";
      const animation = bar.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: "translate(0, 0)" },
        ],
        {
          duration,
          easing: "cubic-bezier(0.22, 0.7, 0.3, 1)",
        }
      );

      animation.finished
        .catch(() => {})
        .finally(() => {
          bar.style.zIndex = "";
        });
    });
  }

  function renderBars(activeStep) {
    if (!elements.bars) return;

    const array = state.workArray;
    const maxValue = state.maxValue || Math.max(...array, 1);
    const groups = activeIndices(activeStep);

    if (
      state.barElements.length !== array.length ||
      state.barElements.some((bar) => bar.parentElement !== elements.bars)
    ) {
      rebuildBarElements(array);
    }

    const digits = String(Math.max(...array, 1)).length;
    if (state.labelCount !== array.length || state.labelDigits !== digits) {
      state.labelCount = array.length;
      state.labelDigits = digits;
      updateLabelSize();
    }

    array.forEach((value, index) => {
      const bar = state.barElements[index];
      if (!bar) return;

      bar.style.height = `${Math.max((value / maxValue) * 100, 1.5)}%`;
      bar.title = `Index ${index + 1}: ${value}`;
      bar.className = "sl-bar";
      if (index >= state.sourceArray.length) bar.classList.add("is-padding");

      const label = bar.firstElementChild;
      if (label) label.textContent = value;

      const isCompare = groups.compare.has(index);
      const isSwap = groups.swap.has(index);
      const isPivot = groups.pivot.has(index);

      if (isCompare) {
        bar.classList.add("is-compare");
      } else if (isSwap) {
        bar.classList.add("is-swap");
      } else if (isPivot) {
        bar.classList.add("is-pivot");
      } else if (state.sortedSet.has(index)) {
        bar.classList.add("is-sorted");
      }
    });

    if (activeStep) {
      elements.bars.setAttribute(
        "aria-label",
        `Array of ${array.length} values. Step ${state.stepIndex}: ${describeStep(activeStep)}`
      );
    } else if (state.stepIndex >= state.steps.length && state.steps.length) {
      elements.bars.setAttribute(
        "aria-label",
        `Array of ${array.length} values, fully sorted.`
      );
    } else {
      elements.bars.setAttribute(
        "aria-label",
        `Array of ${array.length} values ready for playback.`
      );
    }
  }

  function renderCode() {
    if (!elements.code || !elements.codeFile) return;
    const algorithm = ALGORITHMS[state.algoKey];
    if (!algorithm) return;

    elements.codeFile.textContent = algorithm.file;
    const fragment = document.createDocumentFragment();
    algorithm.code.forEach((text, index) => {
      const line = document.createElement("span");
      line.className = "sl-code-line";
      line.dataset.line = String(index);

      const number = document.createElement("span");
      number.className = "sl-line-number";
      number.textContent = String(index + 1);

      line.append(number, document.createTextNode(text || " "));
      fragment.append(line);
    });

    elements.code.replaceChildren(fragment);
    elements.code.scrollTop = 0;
    elements.code.setAttribute("aria-label", `${algorithm.name} source code`);
  }

  function highlightCodeLine(lineIndex) {
    if (!elements.code) return;
    const lines = elements.code.querySelectorAll(".sl-code-line");
    lines.forEach((line) => line.classList.remove("is-active"));

    if (!Number.isInteger(lineIndex)) return;
    const target = elements.code.querySelector(`.sl-code-line[data-line="${lineIndex}"]`);
    if (!target) return;

    target.classList.add("is-active");
    const top = target.offsetTop - elements.code.clientHeight / 2 + target.offsetHeight / 2;
    elements.code.scrollTop = Math.max(0, top);
  }

  function clearCodeHighlight() {
    elements.code?.querySelectorAll(".sl-code-line").forEach((line) => {
      line.classList.remove("is-active");
    });
  }

  function renderDocs() {
    const algorithm = ALGORITHMS[state.algoKey];
    if (!algorithm || !algorithm.docs) return;
    const docs = algorithm.docs;

    if (elements.docsHeading) elements.docsHeading.textContent = algorithm.name;
    if (elements.algoBadge) elements.algoBadge.textContent = complexityClass(docs.avg);
    if (elements.intuition) elements.intuition.textContent = docs.intuition;
    if (elements.best) elements.best.textContent = docs.best;
    if (elements.bestWhy) elements.bestWhy.textContent = docs.bestWhy;
    if (elements.avg) elements.avg.textContent = docs.avg;
    if (elements.avgWhy) elements.avgWhy.textContent = docs.avgWhy;
    if (elements.worst) elements.worst.textContent = docs.worst;
    if (elements.worstWhy) elements.worstWhy.textContent = docs.worstWhy;
    if (elements.space) elements.space.textContent = docs.space;
    if (elements.spaceWhy) elements.spaceWhy.textContent = docs.spaceWhy;
  }

  function updateCounters() {
    if (elements.comparisons) elements.comparisons.textContent = String(state.comparisons);
    if (elements.swaps) elements.swaps.textContent = String(state.swaps);
    if (elements.stepCount) {
      elements.stepCount.textContent = `${state.stepIndex} / ${state.steps.length}`;
    }
    if (elements.stepLabel) elements.stepLabel.textContent = String(state.stepIndex);
    if (elements.progressBar) {
      const progress = state.steps.length
        ? (state.stepIndex / state.steps.length) * 100
        : 0;
      elements.progressBar.style.width = `${progress}%`;
    }
  }

  function updateExecutionTime() {
    if (!elements.execution) return;
    elements.execution.textContent = formatTraceTime(state.traceMs);
    elements.execution.title = "Time to generate the complete execution trace in the browser";
  }

  function updatePlaybackUI() {
    if (!elements.play) return;
    const playIcon = elements.play.querySelector(".sl-icon-play");
    const pauseIcon = elements.play.querySelector(".sl-icon-pause");
    if (playIcon) playIcon.hidden = state.playing;
    if (pauseIcon) pauseIcon.hidden = !state.playing;
    if (elements.playLabel) elements.playLabel.textContent = state.playing ? "Pause" : "Play";
    elements.play.setAttribute("aria-label", state.playing ? "Pause playback" : "Play playback");
  }

  function updateBounds() {
    if (elements.prev) elements.prev.disabled = state.stepIndex <= 0;
    if (elements.next) elements.next.disabled = state.stepIndex >= state.steps.length;
    if (elements.stepReset) elements.stepReset.disabled = state.stepIndex <= 0;
    if (elements.play) elements.play.disabled = state.steps.length === 0;
  }

  function updateSizeLabel() {
    if (elements.sizeValue && elements.size) {
      elements.sizeValue.textContent = String(elements.size.value);
    }
  }

  function updateSpeedLabel() {
    if (elements.speedValue && elements.speed) {
      elements.speedValue.textContent = `${elements.speed.value}×`;
    }
  }

  // -------------------------------------------------------------------------
  // Custom arrays and controls
  // -------------------------------------------------------------------------

  function parseCustomArray() {
    if (!elements.custom) return null;
    const raw = elements.custom.value.trim();
    if (!raw) {
      setCustomHint("Enter at least 5 comma-separated values.", "error");
      return null;
    }

    const tokens = raw.split(/[\s,;]+/).filter(Boolean);
    if (tokens.length < MIN_SIZE || tokens.length > MAX_SIZE) {
      setCustomHint(
        `Enter between ${MIN_SIZE} and ${MAX_SIZE} values (you entered ${tokens.length}).`,
        "error"
      );
      return null;
    }

    const values = tokens.map(Number);
    if (
      values.some(
        (value) =>
          !Number.isFinite(value) ||
          !Number.isInteger(value) ||
          value < MIN_VALUE ||
          value > MAX_VALUE
      )
    ) {
      setCustomHint(`Use whole numbers from ${MIN_VALUE} to ${MAX_VALUE}.`, "error");
      return null;
    }

    if (state.algoKey === BOGO_KEY && values.length > BOGO_CAP) {
      setCustomHint(
        `Bogo Sort is capped at ${BOGO_CAP} values. Choose another algorithm or enter fewer values.`,
        "error"
      );
      return null;
    }

    return values;
  }

  function applyCustomArray() {
    const values = parseCustomArray();
    if (!values) return;

    if (elements.size) elements.size.value = String(values.length);
    updateSizeLabel();
    setupRun(values);
    if (elements.custom) elements.custom.value = values.join(", ");
    setCustomHint(`Applied ${values.length} values.`, "note");
  }

  function randomizeArray() {
    const size = clamp(elements.size?.value || DEFAULT_SIZE, MIN_SIZE, MAX_SIZE);
    const values = randomArray(state.algoKey === BOGO_KEY ? Math.min(size, BOGO_CAP) : size);
    if (elements.custom) elements.custom.value = values.join(", ");
    setupRun(values);
    setCustomHint(DEFAULT_CUSTOM_HINT);
  }

  function handleSizeChange() {
    const size = clamp(elements.size?.value || DEFAULT_SIZE, MIN_SIZE, MAX_SIZE);
    const values = randomArray(state.algoKey === BOGO_KEY ? Math.min(size, BOGO_CAP) : size);
    if (elements.custom) elements.custom.value = values.join(", ");
    setupRun(values);
    setCustomHint(DEFAULT_CUSTOM_HINT);
  }

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  function bindEvents() {
    elements.algorithm?.addEventListener("change", () => {
      selectAlgorithm(elements.algorithm.value);
    });

    elements.size?.addEventListener("input", updateSizeLabel);
    elements.size?.addEventListener("change", handleSizeChange);

    elements.speed?.addEventListener("input", () => {
      state.speed = Number(elements.speed.value) || 5;
      updateSpeedLabel();
    });

    elements.applyCustom?.addEventListener("click", applyCustomArray);
    elements.custom?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCustomArray();
      }
    });

    elements.randomize?.addEventListener("click", randomizeArray);
    elements.reset?.addEventListener("click", resetTrace);
    elements.stepReset?.addEventListener("click", resetTrace);

    elements.play?.addEventListener("click", togglePlayback);
    elements.next?.addEventListener("click", () => {
      pausePlayback({ updateStatus: false });
      stepForward();
    });
    elements.prev?.addEventListener("click", stepBackward);

    document.addEventListener("algolab:sortlab-select", (event) => {
      const key = event.detail?.key;
      if (key) selectAlgorithm(key, { keepArray: true });
    });

    document.addEventListener("algolab:viewchange", (event) => {
      if (event.detail?.view !== "sortlab" && state.playing) {
        pausePlayback();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (document.body.dataset.view !== "sortlab") return;
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('input, textarea, select, button, a, pre, [contenteditable="true"]')
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepBackward();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepForward();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.playing) pausePlayback();
    });
  }

  // -------------------------------------------------------------------------
  // Boot
  // -------------------------------------------------------------------------

  function init() {
    if (!elements.algorithm || !elements.bars) return;

    if (!ALGORITHM_KEYS.length) {
      setStatus("error");
      setCustomHint("SortLab algorithms could not be loaded. Reload the page.", "error");
      if (elements.play) elements.play.disabled = true;
      return;
    }

    populateAlgorithms();
    bindEvents();

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(updateLabelSize).observe(elements.bars);
    }

    window.addEventListener("algolab:viewchange", (event) => {
      if (event.detail?.view === "sortlab") {
        window.requestAnimationFrame(updateLabelSize);
      }
    });

    state.speed = Number(elements.speed?.value) || 5;
    updateSpeedLabel();
    updateSizeLabel();

    const initialKey = hashAlgorithm() || DEFAULT_ALGORITHM;
    state.algoKey = ALGORITHMS[initialKey] ? initialKey : DEFAULT_ALGORITHM;
    if (elements.algorithm) elements.algorithm.value = state.algoKey;

    const size = clamp(elements.size?.value || DEFAULT_SIZE, MIN_SIZE, MAX_SIZE);
    const initialSize = state.algoKey === BOGO_KEY ? Math.min(size, BOGO_CAP) : size;
    state.sourceArray = randomArray(initialSize);
    if (elements.custom) elements.custom.value = state.sourceArray.join(", ");
    setCustomHint(DEFAULT_CUSTOM_HINT);
    state.initialized = true;

    selectAlgorithm(state.algoKey, { keepArray: true, initial: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.AlgoLabSortLab = {
    selectAlgorithm(key, options) {
      return selectAlgorithm(key, options);
    },
    reset: resetTrace,
    pause: pausePlayback,
    randomize: randomizeArray,
    currentAlgorithm() {
      return state.algoKey;
    },
    isInitialized() {
      return state.initialized;
    },
  };
})();

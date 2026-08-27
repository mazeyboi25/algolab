(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const el = {
    algorithmSelect: $("#algorithmSelect"),
    algorithmTitle: $("#algorithmTitle"),
    complexityBadge: $("#complexityBadge"),
    bestComplexity: $("#bestComplexity"),
    avgComplexity: $("#avgComplexity"),
    worstComplexity: $("#worstComplexity"),
    spaceComplexity: $("#spaceComplexity"),
    sizeRange: $("#sizeRange"),
    sizeValue: $("#sizeValue"),
    speedRange: $("#speedRange"),
    speedValue: $("#speedValue"),
    randomizeBtn: $("#randomizeBtn"),
    customBtn: $("#customBtn"),
    customRow: $("#customRow"),
    customInput: $("#customInput"),
    applyCustomBtn: $("#applyCustomBtn"),
    searchRow: $("#searchRow"),
    targetInput: $("#targetInput"),
    applyTargetBtn: $("#applyTargetBtn"),
    bars: $("#bars"),
    operationName: $("#operationName"),
    operationText: $("#operationText"),
    playBtn: $("#playBtn"),
    playIcon: $("#playIcon"),
    playText: $("#playText"),
    prevBtn: $("#prevBtn"),
    nextBtn: $("#nextBtn"),
    resetBtn: $("#resetBtn"),
    timelineRange: $("#timelineRange"),
    stepReadout: $("#stepReadout"),
    timeReadout: $("#timeReadout"),
    comparisonsMetric: $("#comparisonsMetric"),
    swapsMetric: $("#swapsMetric"),
    writesMetric: $("#writesMetric"),
    sessionStatus: $("#sessionStatus"),
    codeFile: $("#codeFile"),
    codeBlock: $("#codeBlock")
  };

  const definitions = {
    bubble: {
      name: "BUBBLE SORT", file: "bubble-sort.js", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", search: false,
      code: [
        "for end = n - 1 down to 1",
        "  swapped = false",
        "  for i = 0 to end - 1",
        "    compare a[i] and a[i + 1]",
        "    if a[i] > a[i + 1]",
        "      swap a[i], a[i + 1]",
        "      swapped = true",
        "  if swapped == false: stop"
      ], build: buildBubble
    },
    selection: {
      name: "SELECTION SORT", file: "selection-sort.js", best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", search: false,
      code: [
        "for i = 0 to n - 2",
        "  minIndex = i",
        "  for j = i + 1 to n - 1",
        "    compare a[j] and a[minIndex]",
        "    if a[j] < a[minIndex]",
        "      minIndex = j",
        "  swap a[i], a[minIndex]",
        "  mark i as sorted"
      ], build: buildSelection
    },
    insertion: {
      name: "INSERTION SORT", file: "insertion-sort.js", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", search: false,
      code: [
        "for i = 1 to n - 1",
        "  key = a[i]",
        "  j = i - 1",
        "  while j >= 0 and a[j] > key",
        "    a[j + 1] = a[j]",
        "    j = j - 1",
        "  a[j + 1] = key",
        "  expand sorted region"
      ], build: buildInsertion
    },
    merge: {
      name: "MERGE SORT", file: "merge-sort.js", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", search: false,
      code: [
        "mergeSort(left, right)",
        "  if left >= right: return",
        "  mid = floor((left + right) / 2)",
        "  mergeSort(left, mid)",
        "  mergeSort(mid + 1, right)",
        "  compare front values of both halves",
        "  write smaller value into output",
        "  copy remaining values"
      ], build: buildMerge
    },
    quick: {
      name: "QUICK SORT", file: "quick-sort.js", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)", search: false,
      code: [
        "quickSort(low, high)",
        "  if low < high",
        "    pivotIndex = partition(low, high)",
        "    quickSort(low, pivotIndex - 1)",
        "    quickSort(pivotIndex + 1, high)",
        "partition(low, high)",
        "  pivot = a[high]",
        "  compare each value with pivot",
        "  swap smaller values left",
        "  place pivot in final position"
      ], build: buildQuick
    },
    linear: {
      name: "LINEAR SEARCH", file: "linear-search.js", best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)", search: true,
      code: [
        "for i = 0 to n - 1",
        "  compare a[i] with target",
        "  if a[i] == target",
        "    return i",
        "return -1"
      ], build: buildLinear
    },
    binary: {
      name: "BINARY SEARCH", file: "binary-search.js", best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)", search: true,
      code: [
        "low = 0, high = n - 1",
        "while low <= high",
        "  mid = floor((low + high) / 2)",
        "  compare a[mid] with target",
        "  if equal: return mid",
        "  if a[mid] < target: move low",
        "  else: move high",
        "return -1"
      ], build: buildBinary
    }
  };

  const state = {
    algorithm: "quick",
    data: [42, 17, 68, 31, 83, 24, 55, 11, 73, 37, 91, 49, 64, 28],
    steps: [],
    step: 0,
    playing: false,
    token: 0,
    speed: 1,
    target: 42
  };

  function recorder(input) {
    const a = [...input];
    const done = new Set();
    let comparisons = 0, swaps = 0, writes = 0;
    const steps = [];

    const push = ({ line = 0, name = "READY", text = "", compare = [], pivot = null, found = null, muted = [], finalDone = null } = {}) => {
      steps.push({
        data: [...a], line, name, text, compare: [...compare], pivot, found, muted: [...muted],
        done: finalDone ? [...finalDone] : [...done], comparisons, swaps, writes
      });
    };

    return {
      a, done, steps,
      push,
      compare(indices, info = {}) { comparisons++; push({ ...info, compare: indices }); },
      swap(i, j, info = {}) { [a[i], a[j]] = [a[j], a[i]]; swaps++; writes += 2; push({ ...info, compare: [i, j] }); },
      write(i, value, info = {}) { a[i] = value; writes++; push({ ...info, compare: [i] }); },
      finish(text) { for (let i = 0; i < a.length; i++) done.add(i); push({ name: "COMPLETE", text, finalDone: [...done] }); }
    };
  }

  function buildBubble(input) {
    const r = recorder(input); r.push({ line: 0, name: "READY", text: "Bubble Sort is ready to run." });
    for (let end = r.a.length - 1; end > 0; end--) {
      let swapped = false;
      for (let i = 0; i < end; i++) {
        const l = r.a[i], rr = r.a[i + 1];
        r.compare([i, i + 1], { line: 3, name: "COMPARE", text: `${l} vs ${rr}` });
        if (l > rr) { r.swap(i, i + 1, { line: 5, name: "SWAP", text: `${l} moves right of ${rr}` }); swapped = true; }
      }
      r.done.add(end); r.push({ line: 7, name: "PASS COMPLETE", text: `Index ${end} is final.` });
      if (!swapped) break;
    }
    r.finish("The dataset is sorted."); return r.steps;
  }

  function buildSelection(input) {
    const r = recorder(input); r.push({ name: "READY", text: "Selection Sort is ready to run." });
    for (let i = 0; i < r.a.length - 1; i++) {
      let min = i;
      for (let j = i + 1; j < r.a.length; j++) {
        r.compare([min, j], { line: 3, name: "COMPARE", text: `Is ${r.a[j]} smaller than ${r.a[min]}?` });
        if (r.a[j] < r.a[min]) min = j;
      }
      if (min !== i) r.swap(i, min, { line: 6, name: "PLACE MINIMUM", text: `Move ${r.a[i]} into position ${i}.` });
      r.done.add(i); r.push({ line: 7, name: "POSITION LOCKED", text: `Index ${i} is final.` });
    }
    r.finish("The dataset is sorted."); return r.steps;
  }

  function buildInsertion(input) {
    const r = recorder(input); r.push({ name: "READY", text: "Insertion Sort is ready to run." });
    for (let i = 1; i < r.a.length; i++) {
      const key = r.a[i]; let j = i - 1;
      r.push({ line: 1, name: "PICK KEY", text: `${key} enters the sorted region.`, compare: [i] });
      while (j >= 0) {
        r.compare([j, j + 1], { line: 3, name: "COMPARE", text: `Is ${r.a[j]} greater than ${key}?` });
        if (r.a[j] <= key) break;
        r.write(j + 1, r.a[j], { line: 4, name: "SHIFT", text: `${r.a[j]} shifts one place right.` });
        j--;
      }
      r.write(j + 1, key, { line: 6, name: "INSERT", text: `${key} is inserted at index ${j + 1}.` });
    }
    r.finish("The dataset is sorted."); return r.steps;
  }

  function buildMerge(input) {
    const r = recorder(input); r.push({ name: "READY", text: "Merge Sort is ready to run." });
    function sort(left, right) {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);
      r.push({ line: 2, name: "SPLIT", text: `Split ${left}–${right} at ${mid}.`, compare: [left, right] });
      sort(left, mid); sort(mid + 1, right); merge(left, mid, right);
    }
    function merge(left, mid, right) {
      const L = r.a.slice(left, mid + 1), R = r.a.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;
      while (i < L.length && j < R.length) {
        r.compare([k, Math.min(k + 1, right)], { line: 5, name: "COMPARE", text: `${L[i]} vs ${R[j]}` });
        if (L[i] <= R[j]) r.write(k++, L[i++], { line: 6, name: "WRITE", text: "Write the smaller left value." });
        else r.write(k++, R[j++], { line: 6, name: "WRITE", text: "Write the smaller right value." });
      }
      while (i < L.length) r.write(k++, L[i++], { line: 7, name: "COPY", text: "Copy remaining left value." });
      while (j < R.length) r.write(k++, R[j++], { line: 7, name: "COPY", text: "Copy remaining right value." });
    }
    sort(0, r.a.length - 1); r.finish("The dataset is sorted."); return r.steps;
  }

  function buildQuick(input) {
    const r = recorder(input); r.push({ name: "READY", text: "Quick Sort is ready to run." });
    function quick(low, high) {
      if (low > high) return;
      if (low === high) { r.done.add(low); r.push({ line: 1, name: "SINGLE VALUE", text: `${r.a[low]} is already final.`, compare: [low] }); return; }
      const p = partition(low, high); r.done.add(p); r.push({ line: 2, name: "PIVOT LOCKED", text: `${r.a[p]} is final at index ${p}.`, pivot: p });
      quick(low, p - 1); quick(p + 1, high);
    }
    function partition(low, high) {
      const pivot = r.a[high]; let i = low - 1;
      r.push({ line: 6, name: "CHOOSE PIVOT", text: `${pivot} becomes the pivot.`, pivot: high });
      for (let j = low; j < high; j++) {
        const v = r.a[j]; r.compare([j, high], { line: 7, name: "COMPARE", text: `Is ${v} smaller than pivot ${pivot}?`, pivot: high });
        if (v < pivot) { i++; if (i !== j) r.swap(i, j, { line: 8, name: "PARTITION SWAP", text: `${v} moves to the left partition.`, pivot: high }); }
      }
      const p = i + 1;
      if (p !== high) r.swap(p, high, { line: 9, name: "PLACE PIVOT", text: `${pivot} moves to index ${p}.`, pivot: p });
      return p;
    }
    quick(0, r.a.length - 1); r.finish("The dataset is sorted."); return r.steps;
  }

  function buildLinear(input, target) {
    const r = recorder(input); r.push({ name: "READY", text: `Search for ${target}.` });
    for (let i = 0; i < r.a.length; i++) {
      r.compare([i], { line: 1, name: "CHECK", text: `Is ${r.a[i]} equal to ${target}?` });
      if (r.a[i] === target) { r.push({ line: 3, name: "FOUND", text: `${target} found at index ${i}.`, found: i }); return r.steps; }
    }
    r.push({ line: 4, name: "NOT FOUND", text: `${target} is not in this dataset.` }); return r.steps;
  }

  function buildBinary(input, target) {
    const sorted = [...input].sort((a, b) => a - b); const r = recorder(sorted); r.push({ name: "READY", text: `Sorted dataset. Search for ${target}.` });
    let low = 0, high = r.a.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2); const muted = [];
      for (let i = 0; i < r.a.length; i++) if (i < low || i > high) muted.push(i);
      r.compare([mid], { line: 3, name: "MIDPOINT", text: `Check ${r.a[mid]} at index ${mid}.`, pivot: mid, muted });
      if (r.a[mid] === target) { r.push({ line: 4, name: "FOUND", text: `${target} found at index ${mid}.`, found: mid, muted }); return r.steps; }
      if (r.a[mid] < target) { r.push({ line: 5, name: "MOVE RIGHT", text: `${r.a[mid]} is too small.`, pivot: mid, muted }); low = mid + 1; }
      else { r.push({ line: 6, name: "MOVE LEFT", text: `${r.a[mid]} is too large.`, pivot: mid, muted }); high = mid - 1; }
    }
    r.push({ line: 7, name: "NOT FOUND", text: `${target} is not in this dataset.` }); return r.steps;
  }

  function randomData(size) {
    const out = [];
    while (out.length < size) {
      const v = Math.floor(Math.random() * 91) + 8;
      if (!out.includes(v) || size > 30) out.push(v);
    }
    return out;
  }

  function rebuild() {
    pause();
    const def = definitions[state.algorithm];
    state.steps = def.search ? def.build(state.data, state.target) : def.build(state.data);
    state.step = 0;
    el.timelineRange.min = 0;
    el.timelineRange.max = Math.max(0, state.steps.length - 1);
    el.timelineRange.value = 0;
    render(0, false);
  }

  function render(index, animate = true) {
    if (!state.steps.length) return;
    state.step = clamp(index, 0, state.steps.length - 1);
    const step = state.steps[state.step];
    const max = Math.max(...step.data, 1);

    el.bars.innerHTML = step.data.map((value, i) => {
      const classes = ["bar"];
      if (step.compare.includes(i)) classes.push("is-compare");
      if (step.pivot === i) classes.push("is-pivot");
      if (step.done.includes(i)) classes.push("is-done");
      if (step.found === i) classes.push("is-found");
      if (step.muted.includes(i)) classes.push("is-muted");
      const h = Math.max(8, (value / max) * 100);
      return `<div class="${classes.join(" ")}" data-value="${value}" data-index="${i}" style="--h:${h}%"></div>`;
    }).join("");

    el.operationName.textContent = step.name;
    el.operationText.textContent = step.text || "";
    el.comparisonsMetric.textContent = step.comparisons;
    el.swapsMetric.textContent = step.swaps;
    el.writesMetric.textContent = step.writes;
    el.timelineRange.value = state.step;
    el.stepReadout.textContent = `STEP ${state.step} / ${Math.max(0, state.steps.length - 1)}`;
    el.timeReadout.textContent = formatTime(state.step * delay());
    el.sessionStatus.textContent = state.step === state.steps.length - 1 ? "COMPLETE" : state.playing ? "RUNNING" : state.step ? "PAUSED" : "READY";
    renderCode(step.line);

    if (animate && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      $$(".bar.is-compare", el.bars).forEach((bar) => {
        bar.animate([{ transform: "translateY(0)" }, { transform: "translateY(-12px)" }, { transform: "translateY(-8px)" }], { duration: 260, easing: "ease-out" });
      });
    }
  }

  function renderCode(activeLine) {
    const def = definitions[state.algorithm];
    el.codeBlock.innerHTML = def.code.map((line, i) => {
      const active = i === activeLine;
      return `<span class="code-line${active ? " is-active" : ""}"><em>${String(i + 1).padStart(2, "0")}</em>${escapeHTML(line)}</span>`;
    }).join("");
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  }

  function delay() { return 520 / state.speed; }
  function formatTime(ms) {
    const s = Math.round(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  async function play() {
    if (state.playing) { pause(); return; }
    if (state.step >= state.steps.length - 1) { state.step = 0; render(0, false); }
    state.playing = true; state.token++; const token = state.token;
    updatePlayButton(); el.sessionStatus.textContent = "RUNNING";

    while (state.playing && token === state.token && state.step < state.steps.length - 1) {
      await sleep(delay());
      if (!state.playing || token !== state.token) break;
      state.step++; render(state.step, true);
    }

    if (state.playing && state.step >= state.steps.length - 1) {
      state.playing = false; updatePlayButton(); el.sessionStatus.textContent = "COMPLETE";
    }
  }

  function pause() { state.playing = false; state.token++; updatePlayButton(); }
  function updatePlayButton() {
    el.playBtn.classList.toggle("is-playing", state.playing);
    el.playIcon.textContent = state.playing ? "Ⅱ" : "▶";
    el.playText.textContent = state.playing ? "PAUSE" : "PLAY";
    el.playBtn.setAttribute("aria-label", state.playing ? "Pause visualization" : "Play visualization");
  }

  function chooseAlgorithm(key, scroll = false) {
    if (!definitions[key]) return;
    state.algorithm = key; el.algorithmSelect.value = key;
    const d = definitions[key];
    el.algorithmTitle.textContent = d.name;
    el.complexityBadge.textContent = d.avg;
    el.bestComplexity.textContent = d.best;
    el.avgComplexity.textContent = d.avg;
    el.worstComplexity.textContent = d.worst;
    el.spaceComplexity.textContent = d.space;
    el.codeFile.textContent = d.file;
    el.searchRow.hidden = !d.search;
    rebuild();
    if (scroll) $("#visualizer").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  el.algorithmSelect.addEventListener("change", () => chooseAlgorithm(el.algorithmSelect.value));
  el.randomizeBtn.addEventListener("click", () => {
    state.data = randomData(Number(el.sizeRange.value));
    if (definitions[state.algorithm].search && !state.data.includes(state.target)) {
      state.target = state.data[Math.floor(Math.random() * state.data.length)];
      el.targetInput.value = state.target;
    }
    rebuild();
  });
  el.customBtn.addEventListener("click", () => {
    const open = el.customRow.hidden; el.customRow.hidden = !open; el.customBtn.setAttribute("aria-expanded", String(open)); if (open) el.customInput.focus();
  });
  el.applyCustomBtn.addEventListener("click", () => {
    const values = el.customInput.value.split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
    if (values.length < 4 || values.length > 36 || values.some((v) => v < 1 || v > 99)) {
      el.customInput.setCustomValidity("Enter 4–36 comma-separated numbers from 1–99."); el.customInput.reportValidity(); return;
    }
    el.customInput.setCustomValidity(""); state.data = values; el.sizeRange.value = values.length; el.sizeValue.textContent = values.length; el.customRow.hidden = true; rebuild();
  });
  el.applyTargetBtn.addEventListener("click", () => { state.target = Number(el.targetInput.value); rebuild(); });
  el.sizeRange.addEventListener("input", () => { el.sizeValue.textContent = el.sizeRange.value; });
  el.sizeRange.addEventListener("change", () => { state.data = randomData(Number(el.sizeRange.value)); rebuild(); });
  el.speedRange.addEventListener("input", () => { state.speed = Number(el.speedRange.value); el.speedValue.textContent = `${state.speed % 1 === 0 ? state.speed.toFixed(1) : state.speed.toFixed(2)}×`; render(state.step, false); });
  el.playBtn.addEventListener("click", play);
  el.prevBtn.addEventListener("click", () => { pause(); render(state.step - 1, false); });
  el.nextBtn.addEventListener("click", () => { pause(); render(state.step + 1, true); });
  el.resetBtn.addEventListener("click", () => { pause(); state.step = 0; render(0, false); });
  el.timelineRange.addEventListener("input", () => { pause(); render(Number(el.timelineRange.value), false); });
  $$('[data-pick]').forEach((card) => card.addEventListener("click", () => chooseAlgorithm(card.dataset.pick, true)));

  document.addEventListener("keydown", (event) => {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if (event.code === "Space") { event.preventDefault(); play(); }
    if (event.key === "ArrowRight") { event.preventDefault(); pause(); render(state.step + 1, true); }
    if (event.key === "ArrowLeft") { event.preventDefault(); pause(); render(state.step - 1, false); }
    if (event.key.toLowerCase() === "r") { state.data = randomData(Number(el.sizeRange.value)); rebuild(); }
  });

  chooseAlgorithm("quick");
})();

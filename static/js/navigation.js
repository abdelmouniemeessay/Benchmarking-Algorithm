/* ==========================================================================
   AlgoLab navigation
   Hash-based view routing, the Algorithms dropdown, mobile navigation, and
   catalog actions. The Flask app keeps a single server route; every workspace
   view is a client-side section selected by the URL hash.
   ========================================================================== */
(() => {
  "use strict";

  const VIEWS = {
    dashboard: {
      element: "view-dashboard",
      title: "Algorithm performance — AlgoLab",
    },
    benchmark: {
      element: "view-benchmark",
      title: "Performance benchmark — AlgoLab",
    },
    sorting: {
      element: "view-sorting",
      title: "Sorting algorithms — AlgoLab",
    },
    searching: {
      element: "view-searching",
      title: "Searching algorithms — AlgoLab",
    },
    complexity: {
      element: "view-complexity",
      title: "Complexity reference — AlgoLab",
    },
    sortlab: {
      element: "view-sortlab",
      title: "SortLab — AlgoLab",
    },
  };

  const ROUTES = [
    { pattern: /^#\/dashboard\/?$/i, view: "dashboard" },
    { pattern: /^#\/benchmark\/?$/i, view: "benchmark" },
    { pattern: /^#\/algorithms\/sorting\/?$/i, view: "sorting" },
    { pattern: /^#\/algorithms\/searching\/?$/i, view: "searching" },
    { pattern: /^#\/complexity\/?$/i, view: "complexity" },
    { pattern: /^#\/sortlab\/?$/i, view: "sortlab" },
    {
      pattern: /^#\/sortlab\/([a-z0-9_-]+)\/?$/i,
      view: "sortlab",
      paramIndex: 1,
    },
  ];

  const ALGORITHM_VIEWS = new Set(["sorting", "searching", "sortlab"]);

  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("appSidebar");
  const sidebarScrim = document.getElementById("sidebarScrim");
  const dropdown = document.querySelector("[data-dropdown]");
  const dropdownToggle = document.getElementById("algorithmsMenuButton");
  const dropdownMenu = document.getElementById("algorithmsMenu");
  const mainContent = document.getElementById("results");

  let currentView = null;
  let initialRender = true;

  // -------------------------------------------------------------------------
  // Routing
  // -------------------------------------------------------------------------

  function parseRoute() {
    const hash = window.location.hash || "";

    // In-page anchors (#tableHeading, #resultsHeading, …) are not views. The
    // dashboard stays visible and the browser performs its normal scroll.
    if (!hash.startsWith("#/")) {
      return { view: "dashboard", param: null, inPageAnchor: Boolean(hash) };
    }

    for (const route of ROUTES) {
      const match = route.pattern.exec(hash);
      if (match) {
        return {
          view: route.view,
          param: route.paramIndex ? decodeURIComponent(match[route.paramIndex] || "") : null,
          inPageAnchor: false,
        };
      }
    }

    return { view: "dashboard", param: null, unknown: true, inPageAnchor: false };
  }

  function renderRoute({ initial = false } = {}) {
    const route = parseRoute();

    if (route.unknown) {
      window.history.replaceState(null, "", "#/dashboard");
      route.view = "dashboard";
    }

    const viewChanged = route.view !== currentView;
    currentView = route.view;

    document.querySelectorAll(".app-view").forEach((section) => {
      section.hidden = section.dataset.view !== route.view;
    });

    document.body.dataset.view = route.view;

    document.querySelectorAll("[data-nav-view]").forEach((link) => {
      const active = link.dataset.navView === route.view;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (dropdownToggle) {
      const algorithmActive = ALGORITHM_VIEWS.has(route.view);
      dropdownToggle.classList.toggle("is-active", algorithmActive);
      if (algorithmActive) {
        dropdownToggle.setAttribute("aria-current", "true");
      } else {
        dropdownToggle.removeAttribute("aria-current");
      }
    }

    const meta = VIEWS[route.view] || VIEWS.dashboard;
    document.title = meta.title;

    if (viewChanged && !initial) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    if (route.view === "sortlab" && route.param) {
      window.setTimeout(() => selectSortLabAlgorithm(route.param), 0);
    }

    window.dispatchEvent(
      new CustomEvent("algolab:viewchange", {
        detail: { view: route.view, param: route.param, initial },
      })
    );

    closeMobileNav();
    closeSidebar();
    closeDropdown();

    if (initialRender) {
      initialRender = false;
    }

    return route;
  }

  function selectSortLabAlgorithm(key) {
    if (!key) return;
    if (window.AlgoLabSortLab?.selectAlgorithm) {
      window.AlgoLabSortLab.selectAlgorithm(key, { keepArray: true });
      return;
    }
    document.dispatchEvent(
      new CustomEvent("algolab:sortlab-select", { detail: { key } })
    );
  }

  // -------------------------------------------------------------------------
  // Algorithms dropdown
  // -------------------------------------------------------------------------

  function openDropdown({ focusFirst = false } = {}) {
    if (!dropdownToggle || !dropdownMenu) return;
    dropdownMenu.hidden = false;
    dropdownToggle.setAttribute("aria-expanded", "true");
    if (focusFirst) {
      const firstItem = dropdownMenu.querySelector(".menu-item");
      firstItem?.focus();
    }
  }

  function closeDropdown({ returnFocus = false } = {}) {
    if (!dropdownToggle || !dropdownMenu) return;
    const wasOpen = !dropdownMenu.hidden;
    dropdownMenu.hidden = true;
    dropdownToggle.setAttribute("aria-expanded", "false");
    if (returnFocus && wasOpen) dropdownToggle.focus();
  }

  function toggleDropdown() {
    if (!dropdownMenu) return;
    if (dropdownMenu.hidden) {
      openDropdown();
    } else {
      closeDropdown();
    }
  }

  function dropdownItems() {
    return dropdownMenu
      ? Array.from(dropdownMenu.querySelectorAll(".menu-item"))
      : [];
  }

  function moveDropdownFocus(current, direction) {
    const items = dropdownItems();
    if (!items.length) return;
    const index = items.indexOf(current);
    const nextIndex = (index + direction + items.length) % items.length;
    items[nextIndex].focus();
  }

  dropdownToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDropdown();
  });

  dropdownToggle?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openDropdown({ focusFirst: true });
    } else if (event.key === "Escape") {
      closeDropdown();
    }
  });

  dropdownMenu?.addEventListener("keydown", (event) => {
    const item = event.target.closest(".menu-item");
    if (!item) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveDropdownFocus(item, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveDropdownFocus(item, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      dropdownItems()[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      dropdownItems().at(-1)?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown({ returnFocus: true });
    }
  });

  dropdownMenu?.addEventListener("click", (event) => {
    if (event.target.closest(".menu-item")) {
      closeDropdown();
      closeMobileNav();
    }
  });

  // -------------------------------------------------------------------------
  // Mobile navigation and sidebar
  // -------------------------------------------------------------------------

  function isMobileNav() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function openMobileNav() {
    if (!primaryNav || !navToggle) return;
    primaryNav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    closeDropdown();
  }

  function closeMobileNav() {
    if (!primaryNav || !navToggle) return;
    primaryNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  function toggleMobileNav() {
    if (!primaryNav) return;
    if (primaryNav.classList.contains("is-open")) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  function openSidebar() {
    if (!sidebar || !sidebarScrim) return;
    sidebar.classList.add("is-open");
    sidebarToggle?.setAttribute("aria-expanded", "true");
    sidebarScrim.hidden = false;
    closeMobileNav();
  }

  function closeSidebar() {
    if (!sidebar || !sidebarScrim) return;
    sidebar.classList.remove("is-open");
    sidebarToggle?.setAttribute("aria-expanded", "false");
    sidebarScrim.hidden = true;
  }

  function toggleSidebar() {
    if (!sidebar) return;
    if (sidebar.classList.contains("is-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  navToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMobileNav();
  });

  sidebarToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSidebar();
  });

  sidebarScrim?.addEventListener("click", closeSidebar);

  primaryNav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMobileNav();
    }
  });

  sidebar?.addEventListener("click", (event) => {
    if (event.target.closest("a[href^='#/']") && isMobileNav()) {
      closeSidebar();
    }
  });

  // -------------------------------------------------------------------------
  // Catalog actions
  // -------------------------------------------------------------------------

  function configureBenchmarkFallback(id) {
    const form = document.getElementById("benchmarkForm");
    if (!form) return false;

    const checkbox = form.querySelector(
      `input[name="algorithms"][value="${window.CSS?.escape ? window.CSS.escape(id) : id}"]`
    );
    if (!checkbox) return false;

    form.querySelectorAll('input[name="algorithms"]').forEach((input) => {
      input.checked = input === checkbox;
    });
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  document.addEventListener("click", (event) => {
    const sortLabButton = event.target.closest("[data-open-sortlab]");
    if (sortLabButton) {
      event.preventDefault();
      const key = sortLabButton.dataset.openSortlab;
      if (!key) return;
      const target = `#/sortlab/${encodeURIComponent(key)}`;
      if (window.location.hash === target) {
        selectSortLabAlgorithm(key);
      } else {
        window.location.hash = target;
      }
      return;
    }

    const benchmarkButton = event.target.closest("[data-benchmark-algorithm]");
    if (benchmarkButton) {
      event.preventDefault();
      const id = benchmarkButton.dataset.benchmarkAlgorithm;
      if (!id) return;

      const configured = window.AlgoLabBenchmark?.selectAlgorithm(id);
      if (!configured) configureBenchmarkFallback(id);

      if (window.location.hash === "#/benchmark") {
        renderRoute();
      } else {
        window.location.hash = "#/benchmark";
      }
    }
  });

  // -------------------------------------------------------------------------
  // Global events
  // -------------------------------------------------------------------------

  document.addEventListener("click", (event) => {
    if (!dropdown || !dropdownMenu) return;
    if (!dropdown.contains(event.target)) {
      closeDropdown();
    }
    if (
      primaryNav?.classList.contains("is-open") &&
      !primaryNav.contains(event.target) &&
      !navToggle?.contains(event.target)
    ) {
      closeMobileNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!dropdownMenu?.hidden) {
      closeDropdown({ returnFocus: true });
      return;
    }
    if (primaryNav?.classList.contains("is-open")) {
      closeMobileNav();
      navToggle?.focus();
      return;
    }
    if (sidebar?.classList.contains("is-open")) {
      closeSidebar();
      sidebarToggle?.focus();
    }
  });

  window.addEventListener("hashchange", () => {
    renderRoute();
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav()) {
      closeMobileNav();
      closeSidebar();
    }
  });

  // -------------------------------------------------------------------------
  // Boot
  // -------------------------------------------------------------------------

  function init() {
    if (!mainContent) return;

    const hash = window.location.hash;
    if (!hash || hash === "#/" || hash === "#") {
      window.history.replaceState(null, "", "#/dashboard");
    }

    renderRoute({ initial: true });

    // If sortlab.js initialized before this file (or the hash was set before
    // its listeners were ready), replay the requested algorithm.
    if (window.location.hash.startsWith("#/sortlab/")) {
      const key = decodeURIComponent(window.location.hash.split("/").at(-1));
      window.setTimeout(() => selectSortLabAlgorithm(key), 40);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.AlgoLabNavigation = {
    go(view) {
      if (VIEWS[view]) {
        window.location.hash = `#/${view === "sorting" ? "algorithms/sorting" : view === "searching" ? "algorithms/searching" : view}`;
      }
    },
    currentView() {
      return currentView;
    },
  };
})();

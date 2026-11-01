(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // -------------------------------------------------------------------------
  // Carbon calculator preview
  // -------------------------------------------------------------------------

  const calculator = {
    commute: "transit",
    energy: 48,
    diet: "balanced",
  };

  const commuteFactors = {
    cycle: 0.35,
    transit: 1.15,
    car: 3.6,
  };

  const dietFactors = {
    plant: 1.1,
    balanced: 1.8,
    meat: 3.1,
  };

  const calculatorEls = {
    value: document.getElementById("footprintValue"),
    status: document.getElementById("footprintStatus"),
    ring: document.getElementById("footprintRing"),
    ringPercent: document.getElementById("ringPercent"),
    note: document.getElementById("scoreNote"),
    energy: document.getElementById("energyRange"),
    energyOutput: document.getElementById("energyOutput"),
    travel: document.getElementById("travelValue"),
    home: document.getElementById("homeValue"),
    food: document.getElementById("foodValue"),
    travelBar: document.getElementById("travelBar"),
    homeBar: document.getElementById("homeBar"),
    foodBar: document.getElementById("foodBar"),
    commuteButtons: Array.from(document.querySelectorAll("[data-commute]")),
    dietButtons: Array.from(document.querySelectorAll("[data-diet]")),
  };

  let displayedFootprint = 5.8;
  let footprintFrame = null;
  let statusTimer = null;

  function homeFactor(energy) {
    return 1.1 + (energy / 100) * 3.6;
  }

  function getFootprint() {
    const travel = commuteFactors[calculator.commute];
    const home = homeFactor(calculator.energy);
    const food = dietFactors[calculator.diet];
    return { travel, home, food, total: travel + home + food };
  }

  function energyLabel(energy) {
    if (energy < 30) return "Efficient home";
    if (energy < 65) return "Balanced mix";
    return "Energy-heavy";
  }

  function paintFootprint(value) {
    const total = Number(value);
    const percent = Math.min(100, (total / 12) * 100);
    const message = `Estimated footprint ${total.toFixed(1)} tonnes of CO2e per year, ${Math.round(percent)} percent of the 12 tonne goal.`;

    calculatorEls.value.textContent = total.toFixed(1);
    calculatorEls.ring.style.setProperty("--fill", `${percent.toFixed(2)}%`);
    calculatorEls.ringPercent.textContent = `${Math.round(percent)}%`;
    calculatorEls.ring.setAttribute("aria-label", message);

    const difference = 11.6 - total;
    calculatorEls.note.textContent = difference >= 0
      ? `${total.toFixed(1)} t below the UK average of 11.6 t`
      : `${Math.abs(difference).toFixed(1)} t above the UK average of 11.6 t`;
  }

  function animateFootprint(target) {
    if (reduceMotion) {
      displayedFootprint = target;
      paintFootprint(target);
      return;
    }

    const from = displayedFootprint;
    const start = performance.now();
    const duration = 420;

    if (footprintFrame) cancelAnimationFrame(footprintFrame);

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (target - from) * eased;
      displayedFootprint = value;
      paintFootprint(value);

      if (progress < 1) {
        footprintFrame = requestAnimationFrame(tick);
      } else {
        displayedFootprint = target;
        paintFootprint(target);
        footprintFrame = null;
      }
    }

    footprintFrame = requestAnimationFrame(tick);
  }

  function updateFootprint() {
    if (!calculatorEls.value) return;

    const { travel, home, food, total } = getFootprint();
    const safeTotal = Math.max(total, 0.1);

    calculatorEls.travel.textContent = `${travel.toFixed(1)} t`;
    calculatorEls.home.textContent = `${home.toFixed(1)} t`;
    calculatorEls.food.textContent = `${food.toFixed(1)} t`;

    calculatorEls.travelBar.style.width = `${(travel / safeTotal) * 100}%`;
    calculatorEls.homeBar.style.width = `${(home / safeTotal) * 100}%`;
    calculatorEls.foodBar.style.width = `${(food / safeTotal) * 100}%`;

    calculatorEls.energy.style.setProperty("--range-fill", `${calculator.energy}%`);
    calculatorEls.energyOutput.textContent = energyLabel(calculator.energy);

    calculatorEls.commuteButtons.forEach((button) => {
      const active = button.dataset.commute === calculator.commute;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    calculatorEls.dietButtons.forEach((button) => {
      const active = button.dataset.diet === calculator.diet;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    animateFootprint(total);

    if (calculatorEls.status) {
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => {
        calculatorEls.status.textContent =
          `Footprint updated to ${total.toFixed(1)} tonnes of CO2e per year. ` +
          `Travel ${travel.toFixed(1)}, home ${home.toFixed(1)}, food ${food.toFixed(1)} tonnes.`;
      }, 450);
    }
  }

  calculatorEls.commuteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      calculator.commute = button.dataset.commute;
      updateFootprint();
    });
  });

  calculatorEls.dietButtons.forEach((button) => {
    button.addEventListener("click", () => {
      calculator.diet = button.dataset.diet;
      updateFootprint();
    });
  });

  if (calculatorEls.energy) {
    calculatorEls.energy.addEventListener("input", () => {
      calculator.energy = Number(calculatorEls.energy.value);
      updateFootprint();
    });
  }

  updateFootprint();

  // -------------------------------------------------------------------------
  // Animated impact counters
  // -------------------------------------------------------------------------

  const counters = Array.from(document.querySelectorAll("[data-counter]"));

  function renderCounter(element, value) {
    const decimals = Number(element.dataset.decimals || 0);
    const formatter = new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    element.textContent = formatter.format(value);
  }

  function runCounter(element) {
    const target = Number(element.dataset.target);
    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      renderCounter(element, target);
      return;
    }

    const start = performance.now();
    const duration = 1450;
    const from = 0;

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      renderCounter(element, from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else renderCounter(element, target);
    }

    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.55 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach((counter) => renderCounter(counter, Number(counter.dataset.target)));
  }

  // -------------------------------------------------------------------------
  // Scroll reveals
  // -------------------------------------------------------------------------

  const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  // -------------------------------------------------------------------------
  // Header state
  // -------------------------------------------------------------------------

  const header = document.getElementById("siteHeader");

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // -------------------------------------------------------------------------
  // Mobile navigation
  // -------------------------------------------------------------------------

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobileNav");
  let navCloseTimer = null;
  let navFocusTimer = null;

  function setMobileNav(open, returnFocus = false) {
    if (!menuToggle || !mobileNav) return;

    window.clearTimeout(navCloseTimer);
    window.clearTimeout(navFocusTimer);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.setAttribute("aria-hidden", String(!open));
    mobileNav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);

    if (open) {
      navFocusTimer = window.setTimeout(() => {
        if (menuToggle.getAttribute("aria-expanded") === "true") {
          mobileNav.querySelector("a")?.focus({ preventScroll: true });
        }
      }, 250);
    } else if (returnFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  }

  if (menuToggle && mobileNav) {
    mobileNav.setAttribute("aria-hidden", "true");

    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      setMobileNav(open, !open);
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navCloseTimer = window.setTimeout(() => setMobileNav(false), 110);
      });
    });

    document.addEventListener("click", (event) => {
      if (menuToggle.getAttribute("aria-expanded") !== "true") return;
      if (mobileNav.contains(event.target) || menuToggle.contains(event.target)) return;
      setMobileNav(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMobileNav(false, true);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) setMobileNav(false);
    });
  }

  // -------------------------------------------------------------------------
  // Forms
  // -------------------------------------------------------------------------

  const signupForm = document.getElementById("signupForm");
  const emailInput = document.getElementById("email");
  const formError = document.getElementById("formError");
  const formSuccess = document.getElementById("formSuccess");

  if (signupForm && emailInput && formError && formSuccess) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = emailInput.value.trim();

      if (!value) {
        formError.textContent = "Please add your work email so we know where to send your assessment.";
        formError.hidden = false;
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.focus();
        return;
      }

      if (!emailInput.validity.valid) {
        formError.textContent = "That email doesn’t look quite right. Try name@company.com.";
        formError.hidden = false;
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.focus();
        return;
      }

      formError.hidden = true;
      emailInput.removeAttribute("aria-invalid");
      signupForm.hidden = true;
      formSuccess.hidden = false;
      formSuccess.setAttribute("tabindex", "-1");
      formSuccess.focus({ preventScroll: true });
    });

    emailInput.addEventListener("input", () => {
      if (formError.hidden) return;
      formError.hidden = true;
      emailInput.removeAttribute("aria-invalid");
    });
  }

  const footerForm = document.getElementById("footerForm");
  const footerEmail = document.getElementById("footerEmail");
  const footerFormNote = document.getElementById("footerFormNote");

  if (footerForm && footerEmail && footerFormNote) {
    footerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = footerEmail.value.trim();

      if (!value || !footerEmail.validity.valid) {
        footerFormNote.textContent = "Add a valid email to join the letter.";
        return;
      }

      footerFormNote.textContent = "You’re on the list. The next note lands soon.";
      footerEmail.value = "";
    });
  }

  // -------------------------------------------------------------------------
  // Keep the page state tidy when printing or restoring from bfcache
  // -------------------------------------------------------------------------

  window.addEventListener("pageshow", () => {
    updateHeader();
    paintFootprint(displayedFootprint);
  });
})();

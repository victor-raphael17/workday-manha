import { branch, navigation } from "./data.js";
import { api, auth, initials as toInitials } from "./api.js";
import logoMark from "../images/logo-mark.svg";

const ROLE_LABELS = {
  pharmacist: "Pharmacist",
  technician: "Technician",
  admin: "Administrator",
};

export function renderShell(pageId) {
  const sidebar = document.getElementById("appSidebar");
  const topbar = document.getElementById("appTopbar");

  if (!sidebar || !topbar) {
    return;
  }

  // Prefer the signed-in user; fall back to the static branch identity.
  const user = auth.user;
  const displayName = user?.name || branch.shiftLead;
  const displayRole = user ? ROLE_LABELS[user.role] || user.role : branch.role;
  const initials = toInitials(displayName);

  const main = document.querySelector("main.app-content");
  if (main && !document.querySelector(".skip-link")) {
    main.id = main.id || "mainContent";
    main.setAttribute("tabindex", "-1");
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = `#${main.id}`;
    skip.textContent = "Skip to content";
    document.body.prepend(skip);
  }

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <img src="${logoMark}" alt="CA Pharmacy">
      <div class="sidebar-brand-title">CA <span>Pharmacy</span></div>
    </div>
    <nav class="sidebar-nav" aria-label="Primary navigation">
      ${navigation
        .map(
          (item) => `
          <a class="sidebar-link ${pageId === item.id ? "active" : ""}" href="${item.href}" ${pageId === item.id ? 'aria-current="page"' : ""}>
            <i data-lucide="${item.icon}"></i>
            <span>${item.label}</span>
            <span class="sidebar-link-count d-none" data-nav-count="${item.id}"></span>
          </a>
        `,
        )
        .join("")}
    </nav>
    <div class="sidebar-section-label">Current shift</div>
    <div class="sidebar-shift-card d-flex align-items-center gap-3">
      <span class="shift-avatar">${initials}</span>
      <div>
        <div class="sidebar-shift-name">${displayName}</div>
        <div class="sidebar-shift-role">${displayRole} · ${branch.name}</div>
      </div>
    </div>
  `;

  topbar.innerHTML = `
    <button class="topbar-menu" id="mobileNavToggle" type="button" aria-label="Open navigation">
      <i data-lucide="menu"></i>
    </button>
    <label class="topbar-search mb-0">
      <i data-lucide="search"></i>
      <input type="search" placeholder="Search medications, patients, scripts..." aria-label="Search">
      <kbd>/</kbd>
    </label>
    <div class="topbar-actions">
      <div class="topbar-branch">
        <i data-lucide="store"></i>
        <span>${branch.name}</span>
      </div>
      <button class="topbar-icon" type="button" aria-label="Notifications">
        <i data-lucide="bell"></i>
      </button>
      <button class="topbar-icon" type="button" aria-label="Help">
        <i data-lucide="help-circle"></i>
      </button>
      <button class="topbar-icon" id="logoutButton" type="button" aria-label="Sign out">
        <i data-lucide="log-out"></i>
      </button>
    </div>
  `;
}

/** Populate the inventory / prescriptions badges from the dashboard summary. */
export async function loadNavCounts() {
  const setCount = (id, value) => {
    const badge = document.querySelector(`[data-nav-count="${id}"]`);
    if (!badge) {
      return;
    }
    if (value) {
      badge.textContent = value;
      badge.classList.remove("d-none");
    } else {
      badge.classList.add("d-none");
    }
  };

  try {
    const summary = await api.dashboard();
    setCount("inventory", summary.alerts?.low_stock || 0);
    setCount("prescriptions", summary.dispensing_queue?.open || 0);
  } catch {
    // Counts are non-critical chrome; ignore if the API is unavailable.
  }
}

export function bindShellEvents() {
  const toggle = document.getElementById("mobileNavToggle");
  const scrim = document.getElementById("appScrim");
  const links = document.querySelectorAll(".sidebar-link");
  const logout = document.getElementById("logoutButton");

  const closeNav = () => document.body.classList.remove("nav-open");

  logout?.addEventListener("click", async () => {
    logout.disabled = true;
    try {
      await api.logout();
    } catch {
      // Even if the network call fails, clear the local session below.
    }
    auth.clear();
    auth.redirectToLogin();
  });

  toggle?.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });

  scrim?.addEventListener("click", closeNav);
  links.forEach((link) => link.addEventListener("click", closeNav));

  const searchInput = document.querySelector(".topbar-search input");

  // ── Global search ────────────────────────────────────────────────────────────
  if (searchInput) {
    const searchWrapper = searchInput.closest(".topbar-search");

    // Create the results dropdown and attach it right after the search wrapper.
    const dropdown = document.createElement("div");
    dropdown.className = "search-dropdown d-none";
    dropdown.setAttribute("role", "listbox");
    dropdown.setAttribute("aria-label", "Search results");
    searchWrapper.after(dropdown);

    // Keep track of which result is keyboard-highlighted.
    let activeIndex = -1;

    /** Remove highlight from all items and optionally set a new one. */
    const setActive = (index) => {
      const items = dropdown.querySelectorAll(".search-result-item");
      items.forEach((el) => el.classList.remove("active"));
      activeIndex = index;
      if (index >= 0 && items[index]) {
        items[index].classList.add("active");
        items[index].scrollIntoView({ block: "nearest" });
      }
    };

    const closeDropdown = () => {
      dropdown.classList.add("d-none");
      dropdown.innerHTML = "";
      activeIndex = -1;
    };

    /**
     * Render the results returned by api.search().
     * Expected shape: { medications: [], patients: [], prescriptions: [] }
     * Each item: { id, label, sublabel?, href, type }
     */
    const renderResults = (groups, query) => {
      dropdown.innerHTML = "";
      activeIndex = -1;

      const allItems = [
        ...(groups.medications || []).map((r) => ({
          ...r,
          _group: "Medications",
        })),
        ...(groups.patients || []).map((r) => ({ ...r, _group: "Patients" })),
        ...(groups.prescriptions || []).map((r) => ({
          ...r,
          _group: "Prescriptions",
        })),
      ];

      if (!allItems.length) {
        dropdown.innerHTML = `<div class="search-empty">No results for <strong>${query}</strong></div>`;
        dropdown.classList.remove("d-none");
        return;
      }

      // Group by section header.
      let lastGroup = null;
      allItems.forEach((item, idx) => {
        if (item._group !== lastGroup) {
          lastGroup = item._group;
          const header = document.createElement("div");
          header.className = "search-group-header";
          header.textContent = item._group;
          dropdown.appendChild(header);
        }

        const el = document.createElement("a");
        el.className = "search-result-item";
        el.href = item.href || "#";
        el.setAttribute("role", "option");
        el.dataset.index = idx;
        el.innerHTML = `
          <span class="search-result-label">${item.label}</span>
          ${item.sublabel ? `<span class="search-result-sub">${item.sublabel}</span>` : ""}
        `;

        el.addEventListener("mouseenter", () => setActive(idx));
        el.addEventListener("click", () => {
          closeDropdown();
          searchInput.value = "";
          searchInput.blur();
        });

        dropdown.appendChild(el);
      });

      dropdown.classList.remove("d-none");
    };

    // Debounce helper — waits for the user to stop typing before calling the API.
    let debounceTimer = null;
    const debounce = (fn, ms) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fn, ms);
    };

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();

      if (!query) {
        closeDropdown();
        return;
      }

      // Show a loading state immediately so the UI feels responsive.
      dropdown.innerHTML = `<div class="search-loading">Searching…</div>`;
      dropdown.classList.remove("d-none");

      debounce(async () => {
        try {
          const results = await api.search(query);
          renderResults(results, query);
        } catch {
          dropdown.innerHTML = `<div class="search-empty">Search unavailable — try again.</div>`;
        }
      }, 280);
    });

    // Keyboard navigation inside the dropdown.
    searchInput.addEventListener("keydown", (event) => {
      const items = dropdown.querySelectorAll(".search-result-item");

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(Math.min(activeIndex + 1, items.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(Math.max(activeIndex - 1, 0));
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        items[activeIndex]?.click();
      } else if (event.key === "Escape") {
        closeDropdown();
        searchInput.blur();
      }
    });

    // Close when clicking outside the search area.
    document.addEventListener("pointerdown", (event) => {
      if (
        !searchWrapper.contains(event.target) &&
        !dropdown.contains(event.target)
      ) {
        closeDropdown();
      }
    });
  }
  // ── End global search ────────────────────────────────────────────────────────

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }

    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    if (event.key === "/" && !isTyping && searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
  });
}

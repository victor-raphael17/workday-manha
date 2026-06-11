/**
 * Small dependency-free UI helpers shared across pages: toast notifications and
 * a promise-based form modal (the project ships Bootstrap CSS but not its JS, so
 * these are hand-rolled to keep the bundle framework-light).
 */

import { toneClass } from "./api.js";

export function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let toastHost = null;

export function toast(message, tone = "info") {
  if (!toastHost) {
    toastHost = document.createElement("div");
    toastHost.className = "toast-host";
    
    // Define o container global como uma região de aria-live persistente.
    // Isso garante que leitores de tela monitorem qualquer inserção de toast aqui dentro.
    toastHost.setAttribute("aria-live", "polite");
    toastHost.setAttribute("aria-atomic", "false");
    
    document.body.appendChild(toastHost);
  }

  const el = document.createElement("div");
  el.className = `toast-note toast-${tone}`;
  
  // Adiciona o papel semântico de status para o toast individual.
  el.setAttribute("role", "status");
  
  el.textContent = message;
  toastHost.appendChild(el);

  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

export function statusBadge(stateKey, label) {
  return `<span class="status-badge ${esc(toneClass(stateKey))}">${esc(label)}</span>`;
}

/** Render a centered "empty" / "error" / "loading" placeholder string. */
export function placeholder(message, tone = "muted") {
  const cls = tone === "error" ? "text-danger" : "text-body-secondary";
  
  // Se for um estado de erro, usamos role="alert" (assertivo) para avisar o usuário imediatamente.
  // Caso contrário (loading, vazio), usamos role="status" (polite).
  const role = tone === "error" ? "alert" : "status";
  const live = tone === "error" ? "assertive" : "polite";

  return `<div class="muted-note text-center w-100 py-4 ${esc(cls)}" role="${role}" aria-live="${live}">${esc(message)}</div>`;
}

/**
 * Open a modal form. `fields` is an array of:
 * { name, label, type?, required?, value?, placeholder?, options?, help? }
 * `type` may be text | number | email | date | select | checkbox.
 * Resolves to a values object, or null if cancelled.
 */
export function openForm({ title, fields, submitLabel = "Save" }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const renderField = (field) => {
      const id = `f_${esc(field.name)}`;
      if (field.type === "select") {
        const options = (field.options || [])
          .map((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            const selected =
              String(field.value ?? "") === String(value) ? "selected" : "";
            return `<option value="${esc(value)}" ${selected}>${esc(label)}</option>`;
          })
          .join("");
        return `
          <label class="modal-field">
            <span>${esc(field.label)}${field.required ? " *" : ""}</span>
            <select id="${id}" name="${esc(field.name)}" ${field.required ? "required" : ""}>${options}</select>
          </label>`;
      }
      if (field.type === "checkbox") {
        return `
          <label class="modal-field modal-field-inline">
            <input type="checkbox" id="${id}" name="${esc(field.name)}" ${field.value ? "checked" : ""}>
            <span>${esc(field.label)}</span>
          </label>`;
      }
      return `
        <label class="modal-field">
          <span>${esc(field.label)}${field.required ? " *" : ""}</span>
          <input type="${esc(field.type || "text")}" id="${id}" name="${esc(field.name)}"
            value="${esc(field.value ?? "")}" placeholder="${esc(field.placeholder || "")}"
            ${field.required ? "required" : ""} ${field.step ? `step="${esc(String(field.step))}"` : ""}>
          ${field.help ? `<small class="text-body-secondary">${esc(field.help)}</small>` : ""}
        </label>`;
    };

    const previouslyFocused = document.activeElement;
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head">
          <h2 class="section-title mb-0">${esc(title)}</h2>
          <button type="button" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form class="modal-body">
          ${fields.map(renderField).join("")}
          <div class="modal-actions">
            <button type="button" class="btn btn-outline-secondary btn-sm px-3" data-cancel>Cancel</button>
            <button type="submit" class="btn btn-success btn-sm px-3">${esc(submitLabel)}</button>
          </div>
        </form>
      </div>`;

    const close = (result) => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
      resolve(result);
    };
    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(overlay.querySelectorAll(FOCUSABLE)).filter(
        (el) => getComputedStyle(el).display !== "none",
      );

    const onKey = (e) => {
      if (e.key === "Escape") {
        close(null);
        return;
      }
      if (e.key === "Tab") {
        const focusable = getFocusable();
        if (!focusable.length) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    overlay
      .querySelector(".modal-close")
      .addEventListener("click", () => close(null));
    overlay
      .querySelector("[data-cancel]")
      .addEventListener("click", () => close(null));
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) {
        close(null);
      }
    });
    overlay.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const values = {};
      fields.forEach((field) => {
        const input = overlay.querySelector(`#f_${field.name}`);
        values[field.name] =
          field.type === "checkbox" ? input.checked : input.value.trim();
      });
      close(values);
    });

    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    const first = overlay.querySelector("input, select");
    if (first) {
      first.focus();
    }
  });
}

/**
 * Encapsulates reusable table body rendering logic.
 * Manages UI states (loading, empty, error) and guarantees HTML table semantics.
 *
 * @param {HTMLTableSectionElement} tbody - Target <tbody> element.
 * @param {Array} list - Array of data models.
 * @param {Function} renderRowFn - Callback returning a table row template string (<tr>).
 * @param {Object} options - State flags and messages ({ loading: boolean, error: string, placeholderMessage: string }).
 */
export function renderTableBody(tbody, list, renderRowFn, options = {}) {
  if (!tbody) return;

  if (options.error) {
    tbody.innerHTML = `<tr><td colspan="100%">${placeholder(options.error, "error")}</td></tr>`;
    return;
  }

  if (options.loading) {
    const msg = options.placeholderMessage || "Loading data...";
    tbody.innerHTML = `<tr><td colspan="100%">${placeholder(msg, "muted")}</td></tr>`;
    return;
  }

  if (!list || list.length === 0) {
    const msg = options.placeholderMessage || "No records found.";
    tbody.innerHTML = `<tr><td colspan="100%">${placeholder(msg, "muted")}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(renderRowFn).join("");
}
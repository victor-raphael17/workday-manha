import { describe, it, expect } from "vitest";
import { formatDate, initials, toneClass, ApiError } from "../assets/js/api.js";
// formatDate
describe("formatDate", () => {
  it("formata uma data ISO válida", () => {
    expect(formatDate("2026-08-12")).toBe("12 Aug 2026");
  });
  it("formata outra data", () => {
    expect(formatDate("2024-01-05")).toBe("05 Jan 2024");
  });
  it("retorna — para null", () => {
    expect(formatDate(null)).toBe("—");
  });
  it("retorna — para undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });
  it("retorna — para string vazia", () => {
    expect(formatDate("")).toBe("—");
  });
  it("retorna o valor original para data inválida", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

// initials
describe("initials", () => {
  it("duas iniciais de nome completo", () => {
    expect(initials("Amara Okafor")).toBe("AO");
  });
  it("máximo duas iniciais", () => {
    expect(initials("João Carlos da Silva")).toBe("JC");
  });
  it("uma inicial para nome único", () => {
    expect(initials("Carlos")).toBe("C");
  });
  it("retorna vazio para string vazia", () => {
    expect(initials("")).toBe("");
  });
  it("retorna vazio para null", () => {
    expect(initials(null)).toBe("");
  });
  it("retorna vazio para undefined", () => {
    expect(initials(undefined)).toBe("");
  });
});

// toneClass
describe("toneClass", () => {
  it("in -> status-success", () => {
    expect(toneClass("in")).toBe("status-success");
  });
  it("low -> status-warning", () => {
    expect(toneClass("low")).toBe("status-warning");
  });
  it("out -> status-danger", () => {
    expect(toneClass("out")).toBe("status-danger");
  });
  it("draft -> status-neutral", () => {
    expect(toneClass("draft")).toBe("status-neutral");
  });
  it("voided -> status-danger", () => {
    expect(toneClass("voided")).toBe("status-danger");
  });
  it("chave desconhecida -> status-neutral", () => {
    expect(toneClass("xyz")).toBe("status-neutral");
  });
  it("undefined -> status-neutral", () => {
    expect(toneClass(undefined)).toBe("status-neutral");
  });
});

// ApiError
describe("ApiError", () => {
  it("guarda status e message", () => {
    const err = new ApiError(404, "Not found");
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.name).toBe("ApiError");
    expect(err.fields).toBeNull();
  });
  it("guarda fields quando fornecido", () => {
    const err = new ApiError(422, "Validation error", { email: "required" });
    expect(err.fields).toEqual({ email: "required" });
  });
  it("usa mensagem de fallback quando não há message", () => {
    const err = new ApiError(500);
    expect(err.message).toContain("500");
  });
  it("é instância de Error", () => {
    expect(new ApiError(400, "bad")).toBeInstanceOf(Error);
  });
});

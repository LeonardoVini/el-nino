/**
 * Utilidades mínimas de DOM, compartilhadas pelos módulos de interface.
 */

export const $ = (s, raiz = document) => raiz.querySelector(s);
export const $$ = (s, raiz = document) => [...raiz.querySelectorAll(s)];

export const token = (n) =>
  getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export function elemento(tag, cls, pai, texto) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (texto !== undefined) n.textContent = texto;
  pai?.appendChild(n);
  return n;
}

/** Agrupa chamadas no próximo quadro: usado nos ouvintes de rolagem. */
export function porQuadro(fn) {
  let agendado = false;
  return (...args) => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      agendado = false;
      fn(...args);
    });
  };
}

/**
 * Curva de easing quadrática in-out.
 * Entrada t: 0.0 → 1.0 (progresso linear)
 * Saída: 0.0 → 1.0 (progresso com aceleração/desaceleração)
 */
export function easeInOutQuad(t: number): number {
    return t < 0.5
        ? 2 * t * t
        : -1 + (4 - 2 * t) * t;
}

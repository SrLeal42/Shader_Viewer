import { useEffect, useRef, useState } from 'react';
import styles from './CustomCursor.module.css';

export function CustomCursor({ isHidden = false }: { isHidden?: boolean }) {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [cursorState, setCursorState] = useState<string>('idle');

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (cursorRef.current) {
                // Deslocamos -16px para que o centro exato do SVG fique na ponta do mouse
                cursorRef.current.style.transform = `translate3d(${e.clientX - 16}px, ${e.clientY - 16}px, 0)`;
            }
        };

        const handleCursorAction = (e: Event) => {
            const customEvent = e as CustomEvent;
            setCursorState(customEvent.detail);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('cursor_action', handleCursorAction);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('cursor_action', handleCursorAction);
        };
    }, []);

    const activeClass = styles[cursorState] || styles.idle;

    return (
        <div
            ref={cursorRef}
            className={`${styles.cursor} ${activeClass}`}
            style={{
                opacity: isHidden ? 0 : 1,
                transition: 'opacity 0.5s ease'
            }}
        >
            <svg width="32" height="32" viewBox="0 0 32 32">

                <defs>
                    {/* O Gradiente 3D Radial (Efeito Donut/Torus) */}
                    <radialGradient id="ringGradient" cx="50%" cy="50%" r="70%">
                        {/* 1. Borda Interna (Sombra suave para dar profundidade) */}
                        <stop offset="40%" stopColor="currentColor" stopOpacity="0.4" />

                        {/* 2. Corpo do Anel Interno (Cor 100% viva e sólida) */}
                        <stop offset="65%" stopColor="currentColor" stopOpacity="1" />

                        {/* 3. O Reflexo Especular (Brilho branco da luz batendo no topo do tubo) */}
                        <stop offset="78%" stopColor="white" stopOpacity="0.9" />

                        {/* 4. Corpo do Anel Externo (Cor 100% viva descendo a curva) */}
                        <stop offset="90%" stopColor="currentColor" stopOpacity="1" />

                        {/* 5. Borda Externa (Sombra suave final) */}
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
                    </radialGradient>
                </defs>

                {/* Anel na base da Seta */}
                <circle cx="32" cy="32" r="8" className={styles.ring} />

                {/* Seta */}
                <path
                    d="M16 16 L16 27 L19.5 23.5 L25.5 23.5 Z"
                    className={styles.arrow}
                    transform="rotate(-20 16 16)"
                />
            </svg>

        </div>
    );
}

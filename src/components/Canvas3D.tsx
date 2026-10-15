import { useEffect, useRef, useState } from 'react';

import { PerformanceBar } from './ui/PerformanceBar';

import { SceneController } from '../babylon/controllers/SceneController';
import { CustomCursor } from './ui/CustomCursor';

import styles from './Canvas3D.module.css';

const INACTIVE_TIME = 3000;// 3 segundos para considerar "inativo"

export function Canvas3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tweakpaneRightRef = useRef<HTMLDivElement>(null);
    const tweakpaneLeftRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<SceneController | null>(null);

    const [isUIVisible, setIsUIVisible] = useState(true);
    const [isIdle, setIsIdle] = useState(false);

    const [isStatsVisible, setIsStatsVisible] = useState(false);

    // O cursor e o botão só devem sumir se a UI estiver oculta E o usuário inativo
    const isCinematicHidden = !isUIVisible && isIdle;

    // --- Lógica do Timer de Inatividade ---
    useEffect(() => {

        if (isUIVisible) {
            setIsIdle(false);
            return;
        }

        let timeoutId: number;

        const handleActivity = () => {
            setIsIdle(false);

            clearTimeout(timeoutId);

            timeoutId = window.setTimeout(() => {
                setIsIdle(true);
            }, INACTIVE_TIME);
        };

        // Escuta qualquer atividade humana na janela
        window.addEventListener('pointermove', handleActivity);
        window.addEventListener('pointerdown', handleActivity);
        window.addEventListener('keydown', handleActivity);
        handleActivity();
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('pointermove', handleActivity);
            window.removeEventListener('pointerdown', handleActivity);
            window.removeEventListener('keydown', handleActivity);
        };
    }, [isUIVisible]);


    useEffect(() => {

        const handleKeyDown = (e: KeyboardEvent) => {

            if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.altKey && !e.metaKey) {

                setIsUIVisible(prev => {
                    const next = !prev;
                    if (next) setIsIdle(false);
                    return next;
                });
            }

        };
        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F3') {
                e.preventDefault(); // Evita abrir a caixa de busca nativa do navegador
                setIsStatsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    // --- Setup do BabylonJS ---
    useEffect(() => {
        if (!canvasRef.current || !tweakpaneRightRef.current || !tweakpaneLeftRef.current) return;

        const abortController = new AbortController();

        SceneController.create(
            canvasRef.current,
            tweakpaneRightRef.current,
            tweakpaneLeftRef.current,
            abortController.signal
        ).then((controller) => {

            if (abortController.signal.aborted) {
                controller.dispose();
                return;
            }

            controllerRef.current = controller;

        }).catch((err) => {
            if (abortController.signal.aborted) return;
            console.error('[Canvas3D] Falha ao inicializar:', err);
        });

        return () => {
            abortController.abort();

            if (controllerRef.current) {
                controllerRef.current.dispose();
                controllerRef.current = null;
            }

        };

    }, []);

    return (
        <div className={`${styles.container} ${isCinematicHidden ? styles.idle : ''}`}>
            <CustomCursor isHidden={isCinematicHidden} />
            <canvas ref={canvasRef}
                className={styles.canvas}
                id="renderCanvas" />

            <div ref={tweakpaneLeftRef}
                className={`${styles.tweakpaneContainerLeft} ${!isUIVisible ? styles.hiddenUI : ''}`} />

            <div ref={tweakpaneRightRef}
                className={`${styles.tweakpaneContainerRight} ${!isUIVisible ? styles.hiddenUI : ''}`} />


            {/* Botão de Toggle */}
            <button
                className={`${styles.toggleUIButton} ${isCinematicHidden ? styles.hiddenButton : ''}`}
                onClick={() => {
                    setIsUIVisible(prev => {
                        const next = !prev;
                        if (next) setIsIdle(false);
                        return next;
                    });
                }}
                title={isUIVisible ? "Ocultar Interface (H)" : "Mostrar Interface (H)"}
            >
                {isUIVisible ? (
                    /* Ícone de Olho Aberto */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                ) : (
                    /* Ícone de Olho Cortado */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                )}
            </button>


            <button
                className={`${styles.toggleStatsButton} ${isStatsVisible ? styles.statsButtonActive : ''} ${isCinematicHidden ? styles.hiddenButton : ''}`}
                onClick={() => setIsStatsVisible(prev => !prev)}
                title={isStatsVisible ? "Ocultar Estatísticas (F3)" : "Ver Estatísticas (F3)"}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
            </button>


            <PerformanceBar controller={controllerRef.current} isVisible={isStatsVisible && !isCinematicHidden} />


        </div>
    );
}


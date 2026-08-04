import { useEffect, useRef, useState } from 'react';
import { SceneController } from '../babylon/SceneController';

import styles from './Canvas3D.module.css';

const INACTIVE_TIME = 3000;// 3 segundos para considerar "inativo"

export function Canvas3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tweakpaneRightRef = useRef<HTMLDivElement>(null);
    const tweakpaneLeftRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<SceneController | null>(null);

    const [isUIVisible, setIsUIVisible] = useState(true);
    const [isIdle, setIsIdle] = useState(false);

    // --- Lógica do Timer de Inatividade ---
    useEffect(() => {
        // Se a UI está visível, o modo cinemático está desligado e não escondemos o cursor
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
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('mousedown', handleActivity);
        window.addEventListener('keydown', handleActivity);

        handleActivity(); // Inicializa o timer

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('keydown', handleActivity);
        };
    }, [isUIVisible]);

    // --- Lógica da Tecla de Atalho (H) ---
    useEffect(() => {

        const handleKeyDown = (e: KeyboardEvent) => {
            // Alterna a UI apenas se apertar H sem Control, Alt ou Shift
            if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                setIsUIVisible(prev => !prev);
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
        <div className={`${styles.container} ${isIdle ? styles.idle : ''}`}>

            <canvas ref={canvasRef}
                className={styles.canvas}
                id="renderCanvas" />

            <div ref={tweakpaneLeftRef}
                className={`${styles.tweakpaneContainerLeft} ${!isUIVisible ? styles.hiddenUI : ''}`} />

            <div ref={tweakpaneRightRef}
                className={`${styles.tweakpaneContainerRight} ${!isUIVisible ? styles.hiddenUI : ''}`} />

            {/* Botão de Toggle */}
            {/* <button
                className={`${styles.toggleUIButton} ${isIdle ? styles.hiddenButton : ''}`}
                onClick={() => setIsUIVisible(!isUIVisible)}
                title={isUIVisible ? "Ocultar Interface (H)" : "Mostrar Interface (H)"}
            >
                👁
            </button> */}
            <button
                className={`${styles.toggleUIButton} ${isIdle ? styles.hiddenButton : ''}`}
                onClick={() => setIsUIVisible(!isUIVisible)}
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

        </div>
    );
}


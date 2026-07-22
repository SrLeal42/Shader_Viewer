import { useEffect, useRef } from 'react';
import { SceneController } from '../babylon/SceneController';

import styles from './Canvas3D.module.css';

export function Canvas3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tweakpaneRightRef = useRef<HTMLDivElement>(null);
    const tweakpaneLeftRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<SceneController | null>(null);

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
            if (abortController.signal.aborted) return; // Cancelamento esperado
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
        <div className={styles.container}>
            <canvas ref={canvasRef}
                className={styles.canvas}
                id="renderCanvas" />
            <div ref={tweakpaneLeftRef} className={styles.tweakpaneContainerLeft} />
            <div ref={tweakpaneRightRef} className={styles.tweakpaneContainerRight} />
        </div>
    );

}
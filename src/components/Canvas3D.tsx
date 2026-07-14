import { useEffect, useRef } from 'react';
import { SceneController } from '../babylon/SceneController';

import styles from './Canvas3D.module.css';

export function Canvas3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tweakpaneRightRef = useRef<HTMLDivElement>(null);
    const tweakpaneLeftRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<SceneController | null>(null);

    useEffect(() => {
        // Agora verificamos os 3 refs
        if (!canvasRef.current || !tweakpaneRightRef.current || !tweakpaneLeftRef.current) return;
        let disposed = false;

        // Passamos os dois containers para o SceneController
        SceneController.create(canvasRef.current, tweakpaneRightRef.current, tweakpaneLeftRef.current)
            .then((controller) => {
                if (disposed) {
                    controller.dispose();
                    return;
                }
                controllerRef.current = controller;
            });

        return () => {
            disposed = true;
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
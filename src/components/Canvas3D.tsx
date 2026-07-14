import { useEffect, useRef } from 'react';
import { SceneController } from '../babylon/SceneController';

import styles from './Canvas3D.module.css';

export function Canvas3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tweakpaneRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<SceneController | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !tweakpaneRef.current) return;

        // Guard contra StrictMode: se o cleanup rodar antes do create resolver,
        // descartamos o controller logo que ele ficar pronto.
        let disposed = false;

        SceneController.create(canvasRef.current, tweakpaneRef.current)
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
            <canvas
                ref={canvasRef}
                className={styles.canvas}
            />
            <div
                ref={tweakpaneRef}
                className={styles.tweakpaneContainer}
            ></div>
        </div>
    );
}

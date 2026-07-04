import { useEffect, useRef } from 'react';
import { SceneController } from '../babylon/SceneController';

import styles from './Canvas3D.module.css';

export function Canvas3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tweakpaneRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<SceneController | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !tweakpaneRef.current) return;

        // Instancia o Babylon apontando para o Canvas e o container do Tweakpane
        controllerRef.current = new SceneController(
            canvasRef.current,
            tweakpaneRef.current
        );

        // Cleanup: Proteção essencial para o React.StrictMode e para troca de rotas
        return () => {
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

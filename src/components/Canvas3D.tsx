import { useEffect, useRef } from 'react';
import { SceneController } from '../babylon/SceneController';

import styles from './Canvas3D.module.css';

export function Canvas3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const controllerRef = useRef<SceneController | null>(null);


    useEffect(() => {
        if (!canvasRef.current) return;

        // Instancia o Babylon apontando para o Canvas
        controllerRef.current = new SceneController(canvasRef.current);

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

            {/* Já deixamos a âncora preparada para o Tweakpane que faremos depois */}
            <div
                id="tweakpane-container"
                className={styles.tweakpaneContainer}
            ></div>
        </div>
    );
}

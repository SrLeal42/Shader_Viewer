import { useEffect, useState } from 'react';
import type { SceneController, PerformanceMetrics } from '../../babylon/controllers/SceneController';
import styles from './PerformanceBar.module.css';

interface PerformanceBarProps {
    controller: SceneController | null;
    isVisible: boolean;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
}

export function PerformanceBar({ controller, isVisible }: PerformanceBarProps) {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

    useEffect(() => {
        
        if (!isVisible || !controller) return;
        
        // Atualiza 5x por segundo para não gerar sobrecarga no React
        const interval = window.setInterval(() => {
            setMetrics(controller.getPerformanceMetrics());
        }, 200);

        return () => {
            window.clearInterval(interval);
            setMetrics(null);
        };
        
    }, [isVisible, controller]);

    if (!isVisible || !metrics) return null;

    const fpsColor = metrics.fps >= 55 ? styles.fpsGood : metrics.fps >= 30 ? styles.fpsMed : styles.fpsLow;

    return (
    
        <div className={styles.bar}>

            <div className={styles.item}>
                <span className={styles.label}>FPS //</span>
                <span className={`${styles.value} ${fpsColor}`}>{metrics.fps}</span>
                <span className={styles.sub}>[{metrics.frameTimeMs.toFixed(1)}ms]</span>
            </div>

            <div className={styles.separator} />

            <div className={styles.item}>
                <span className={styles.label}>DRAW CALLS //</span>
                <span className={styles.value}>{metrics.drawCalls}</span>
            </div>

            <div className={styles.separator} />

            <div className={styles.item}>
                <span className={styles.label}>TRIS //</span>
                <span className={styles.value}>{formatNumber(metrics.triangles)}</span>
            </div>

            <div className={styles.separator} />

            <div className={styles.item}>
                <span className={styles.label}>MESHES //</span>
                <span className={styles.value}>{metrics.activeMeshes}</span>
                <span className={styles.sub}>/{metrics.totalMeshes}</span>
            </div>

            <div className={styles.separator} />

            <div className={styles.item}>
                <span className={styles.label}>PARTICLES //</span>
                <span className={styles.value}>{formatNumber(metrics.activeParticles)}</span>
                <span className={styles.sub}>[{metrics.particlesTimeMs.toFixed(1)}ms]</span>
            </div>

            {metrics.physicsTimeMs > 0.05 && (
                <>
                    <div className={styles.separator} />
                    <div className={styles.item}>
                        <span className={styles.label}>PHYSICS //</span>
                        <span className={styles.value}>{metrics.physicsTimeMs.toFixed(1)}ms</span>
                    </div>
                </>
            )}
        </div>

    );

}

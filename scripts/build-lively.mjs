import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist-lively');

// Resolução do argumento --preset=<name> ou posicional
const args = process.argv.slice(2);
let cliPreset = null;
for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--preset=')) {
        cliPreset = args[i].split('=')[1];
    } else if (args[i] === '--preset' && args[i + 1]) {
        cliPreset = args[i + 1];
        i++;
    } else if (!args[i].startsWith('-')) {
        cliPreset = args[i];
    }
}

// Extração estática do preset em ScenePresets.ts e SkyboxConfigs.ts
const presetsSource = fs.readFileSync(path.join(ROOT, 'src/configs/ScenePresets.ts'), 'utf-8');
const skyboxSource = fs.readFileSync(path.join(ROOT, 'src/configs/SkyboxConfigs.ts'), 'utf-8');

const activeMatch = presetsSource.match(/export\s+const\s+ACTIVE_PRESET[^=]*=\s*['"]([^'"]+)['"]/);
const defaultPreset = activeMatch ? activeMatch[1] : 'default';
const targetPreset = cliPreset || defaultPreset;

// Localiza o bloco completo do preset balanceando abertura e fechamento de chaves
const presetKeyRegex = new RegExp(`\\b${targetPreset}\\s*:\\s*\\{`);
const presetMatch = presetsSource.match(presetKeyRegex);

if (!presetMatch) {
    console.error(`[build:lively] Erro: Preset '${targetPreset}' não encontrado em ScenePresets.ts.`);
    process.exit(1);
}

const startIndex = presetMatch.index + presetMatch[0].length;

let braceCount = 1;
let endIndex = startIndex;

while (braceCount > 0 && endIndex < presetsSource.length) {
    if (presetsSource[endIndex] === '{') braceCount++;
    else if (presetsSource[endIndex] === '}') braceCount--;
    endIndex++;
}

const block = presetsSource.slice(startIndex, endIndex - 1);

const modelId = block.match(/model\s*:\s*['"]([^'"]+)['"]/)?.[1] ?? 'sphere';
const skyboxId = block.match(/skybox\s*:\s*['"]([^'"]+)['"]/)?.[1] ?? 'color';
const weatherId = block.match(/weather\s*:\s*['"]([^'"]+)['"]/)?.[1] ?? 'none';

console.log(`[build:lively] Iniciando build para preset: "${targetPreset}" (model: ${modelId}, skybox: ${skyboxId}, weather: ${weatherId})`);

// Executa TypeCheck e Vite Build (modo lively)
execSync('npx tsc -b', { cwd: ROOT, stdio: 'inherit' });
execSync('npx vite build --mode lively', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, LIVELY_PRESET: targetPreset }
});

// Pruning Cirúrgico de Assets
const copyFileSafe = (relPath) => {
    const src = path.join(PUBLIC_DIR, relPath);
    const dest = path.join(DIST_DIR, relPath);
    if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        console.log(`[build:lively] Asset copiado: ${relPath}`);
    } else {
        console.warn(`[build:lively] Aviso: Asset não encontrado em ${src}`);
    }
};

// Modelo 3D (.glb)
const PROCEDURAL_MODELS = new Set(['sphere', 'box']);
if (!PROCEDURAL_MODELS.has(modelId)) {
    copyFileSafe(`models/${modelId}.glb`);
}

// Skybox (.env)
if (skyboxId && skyboxId !== 'color') {
    const skyboxBlockRegex = new RegExp(`\\b${skyboxId}\\s*:\\s*\\{([\\s\\S]*?)\\}`, 'm');
    const skyboxBlock = skyboxSource.match(skyboxBlockRegex)?.[1] ?? '';
    const envPathMatch = skyboxBlock.match(/path\s*:\s*['"]\.?\/?(skyboxes\/[^'"]+)['"]/);
    if (envPathMatch) {
        copyFileSafe(envPathMatch[1]);
    }
}

// Texturas de Clima (Weather)
const WEATHER_ASSETS = {
    snow: ['textures/weather/snow/flakes.png', 'textures/weather/snow/frost_overlay.png'],
    rain: ['textures/weather/rain/rain_overlay.png'],
    sandstorm: ['textures/weather/sand/sand_overlay.png'],
    ashes: ['textures/weather/ashes/ashes.png', 'textures/weather/ashes/ashes_overlay.png'],
};
if (WEATHER_ASSETS[weatherId]) {
    for (const texPath of WEATHER_ASSETS[weatherId]) {
        copyFileSafe(texPath);
    }
}

// 5. Limpeza de fontes externas no index.html gerado
const indexHtmlPath = path.join(DIST_DIR, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf-8');
    html = html
        .replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\s*/gi, '')
        .replace(/<link[^>]*fonts\.gstatic\.com[^>]*>\s*/gi, '')
        .replace(/<link[^>]*favicon\.svg[^>]*>\s*/gi, '');
    fs.writeFileSync(indexHtmlPath, html, 'utf-8');
}

// Geração do LivelyInfo.json
const livelyInfo = {
    AppVersion: '1.0.0',
    Title: `Shader Viewer - ${targetPreset}`,
    Thumbnail: '',
    Preview: '',
    Desc: `Interactive 3D WebGL Wallpaper (${targetPreset}) powered by Babylon.js`,
    Author: 'Shader Viewer',
    License: 'MIT',
    Contact: '',
    Type: 1,
    FileName: 'index.html',
    Arguments: '--system-nowebgl=false',
    IsAbsolutePath: false
};

fs.writeFileSync(
    path.join(DIST_DIR, 'LivelyInfo.json'),
    JSON.stringify(livelyInfo, null, 2),
    'utf-8'
);

console.log(`[build:lively] Pacote gerado com sucesso em: ${DIST_DIR}`);
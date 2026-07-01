## Objetivo do Projeto

Projeto de portfólio: uma aplicação web onde o usuário pode escolher entre diferentes objetos 3D pré-selecionados, aplicar diferentes shaders (materiais e pós-processamento) sobre eles, e ajustar os parâmetros de cada shader em tempo real através de uma interface de controles.

Além do resultado visual, o projeto serve como veículo de aprendizado/aprofundamento em:

- **Babylon.js**, com foco na API de shaders (`ShaderMaterial`, `PostProcess`, pipeline de renderização);
- **TypeScript**, com tipagem forte aplicada a uniforms, materiais e estado da aplicação;
- Fundamentos de shaders em si (GLSL, vertex/fragment, pós-processamento).

---

## Funcionalidades planejadas

### Objetos 3D

- Esfera
- Suzanne
- Dragão
- Carro
- Upload de modelo customizado pelo usuário (_talvez_)

### Shaders de pós-processamento

- Dithering
- ASCII
- Portal Effect
- Edge Detector

### Materiais com shader próprio

- Cartoon (toon shading)
- Pixel Art
- Vidro (_talvez_)
- Espelho (_talvez_)

### Vertex shaders

- Ondas (deformação de vértices)
- Flickering

### Interatividade

- Painel de parâmetros ajustáveis por shader (uniforms expostos)
- Interações físicas com os modelos (ex: lançar confete)

---

## Stack Tecnológica

### Núcleo

| Tecnologia                                                    | Função                                                                                                                                                                                                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Babylon.js**                                                | Engine de renderização 3D. Escolhido por expor a API de shaders (`ShaderMaterial`, `PostProcess`, sistema de plugins de material) de forma mais direta que outras alternativas, favorecendo o aprendizado profundo do pipeline gráfico. |
| **TypeScript**                                                | Tipagem forte para uniforms, estado da aplicação, controllers e integração entre camadas.                                                                                                                                               |
| **Vite**                                                      | Bundler e dev server. Integração rápida com TS, HMR, e suporte a importar arquivos `.glsl`/`.fx` como string bruta (`?raw`), mantendo os shaders em arquivos separados.                                                                 |
| **@babylonjs/core, @babylonjs/loaders, @babylonjs/materials** | Pacotes modulares do Babylon (em vez do bundle monolítico), para manter o tamanho final do bundle enxuto.                                                                                                                               |

### Interface (UI)

| Tecnologia    | Função                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React**     | Camada de UI "de fora" do canvas: seletor de modelo, seletor de shader, dropzone de upload, estados estruturais (baixa frequência de mudança). **Não** controla o render loop nem os uniforms em tempo real.                                                                                                                                   |
| **Tweakpane** | Painel de parâmetros dos shaders (sliders, color pickers, etc). Vive do lado imperativo, junto ao controller do Babylon — os bindings apontam diretamente para os uniforms do `ShaderMaterial` ativo, sem passar pelo ciclo de re-render do React. Escrito em TS, ativamente mantido, com plugins e boa estética para esse tipo de ferramenta. |

### Física / Interações

| Tecnologia                   | Função                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Havok (@babylonjs/havok)** | Motor de física padrão e oficialmente recomendado pelo Babylon desde a v6 (substituiu Cannon/Ammo/Oimo como primeira opção). WebAssembly, gratuito (MIT). Usado para a interação de confete e, potencialmente, outras interações físicas com os modelos (drag, colisão, destruição). Carregado via _dynamic import_, apenas quando o usuário interage pela primeira vez, para não pesar o carregamento inicial. |

### Ferramentas de apoio

| Tecnologia                                | Função                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| **ESLint + Prettier (typescript-eslint)** | Padronização e qualidade de código.                                                       |
| **gltf-pipeline / Draco compression**     | Compressão dos modelos 3D (especialmente o dragão) para carregamento mais rápido.         |
| **Fontes de assets**                      | glTF-Sample-Models (Khronos), Poly Haven, Sketchfab (filtrando CC0) para os modelos base. |

### Consideração futura (fase 2)

- **WebGPU**: Babylon possui suporte maduro a WebGPU desde a v5 (2022), com shaders internos reescritos em WGSL nativo desde 2024, e ampla cobertura de navegadores em 2026. A troca de engine é simples (`WebGPUEngine` + fallback automático para WebGL). Plano: começar com WebGL/GLSL (mais documentação disponível) e, futuramente, adicionar um toggle WebGL/WebGPU como diferencial do projeto.

---

## Decisões de Arquitetura

### Separação estrita entre React e Babylon

- O `Engine`/`Scene` do Babylon é criado e gerenciado dentro de um `useEffect` (mount único), guardado em uma `ref`, com `dispose()` no unmount.
- O render loop do Babylon roda de forma independente do ciclo de vida do React.
- Comunicação majoritariamente de mão única: React envia comandos imperativos para o Babylon (trocar modelo, trocar shader). O Babylon não deve chamar `setState` a cada frame.
- Cuidado com `React.StrictMode`, que invoca `useEffect` duas vezes em dev — o cleanup precisa estar correto para não duplicar o `Engine`.
- Valores de alta frequência (tempo do shader, FPS) ficam fora do state do React.

### Posicionamento do Tweakpane

- O painel de parâmetros **não** é um componente React — é instanciado pelo controller do Babylon, usando um container DOM reservado pelo React (`<div ref={panelContainerRef} />`), mas cujo conteúdo é gerenciado pelo Tweakpane.
- Ao trocar de shader, o controller Babylon destrói os bindings antigos e recria os controles para os uniforms do novo shader.
- Essa divisão mantém a responsabilidade clara: **React decide o quê está ativo** (seleção estrutural); **Babylon + Tweakpane decidem como aquilo se comporta em tempo real** (valores contínuos, frame a frame).

### Mapeamento de features → API do Babylon

| Feature                                        | Abordagem técnica                                                                                                                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dithering, ASCII, Edge Detector, Portal Effect | `BABYLON.PostProcess` customizados, encadeados em uma `PostProcessRenderPipeline` (liga/desliga e reordena efeitos). Edge Detector como Sobel filter escrito à mão. Portal Effect via stencil buffer + render-to-texture (mais complexo, deixar por último). |
| Cartoon, Pixel Art                             | `ShaderMaterial` próprio (vertex + fragment escritos do zero).                                                                                                                                                                                               |
| Vidro                                          | `PBRMaterial` com `subSurface.isRefractionEnabled`, ou `ShaderMaterial` próprio com Fresnel + refração de env map para fins de aprendizado.                                                                                                                  |
| Espelho                                        | `MirrorTexture` / reflection probe nativa do Babylon (recurso pronto, ganho de aprendizado menor em reescrever).                                                                                                                                             |
| Ondas, Flickering                              | `ShaderMaterial` com deslocamento de `position` no vertex shader, usando `time` como uniform.                                                                                                                                                                |
| Upload de modelo                               | `SceneLoader.ImportMeshAsync` a partir de um `Blob URL` gerado por `<input type="file">` — 100% client-side.                                                                                                                                                 |
| Confete / interações físicas                   | `PhysicsAggregate` (Havok) com massa baixa, gravidade e restituição, disparado por interação do usuário.                                                                                                                                                     |

---

## Deploy

- Hospedagem estática (Vercel, Netlify ou GitHub Pages) — projeto inteiramente client-side, sem necessidade de backend.
- Possível feature futura: compartilhar uma configuração de parâmetros via URL (query string codificada em base64), também sem necessidade de backend.
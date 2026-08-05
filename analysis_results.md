# 🔍 Auditoria de Código — Shader Viewer (`src/`)

Análise completa de todos os arquivos dentro de `src/`. Cada achado está classificado por categoria e inclui a localização exata, o problema e uma sugestão de ação.

> [!NOTE]
> Nenhum arquivo foi alterado — este documento é apenas um catálogo para revisão.

---

## Índice

1. [Código Duplicado](#1-código-duplicado)
2. [Funções/Métodos Grandes (fazem mais de uma coisa)](#2-funçõesmétodos-grandes)
3. [Números e Strings Mágicos](#3-números-e-strings-mágicos)
4. [Acoplamento Excessivo](#4-acoplamento-excessivo)
5. [Código Morto](#5-código-morto)
6. [Tratamento de Erros Frágil](#6-tratamento-de-erros-frágil)
7. [Estado Mutável Desnecessário](#7-estado-mutável-desnecessário)
8. [Lógica Repetida](#8-lógica-repetida)
9. [Complexidade Ciclomática Alta](#9-complexidade-ciclomática-alta)
10. [Performance (TS + GLSL)](#10-performance)
11. [Valores Nulos Não Tratados](#11-valores-nulos-não-tratados)
12. [Dependências Obsoletas / APIs Depreciadas](#12-dependências-obsoletas--apis-depreciadas)

---

## 1. Código Duplicado

### 1.1 `setUniformOnMaterial` × `setUniformOnEffect` — lógica idêntica com tipos diferentes

| Arquivo | Linhas |
|---|---|
| [ShaderManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ShaderManager.ts#L167-L197) | 167–197 |

Os dois métodos privados fazem exatamente a mesma coisa (switch sobre `uniform.type`, aplicando `float`, `color` ou `boolean`), apenas em alvos diferentes (`B.ShaderMaterial` vs `B.Effect`). Ambos possuem a interface `setFloat`, `setColor3`, portanto é possível extrair um helper genérico que receba a interface de "setter" em vez de duplicar o switch.

---

### 1.2 `buildPanel` × `buildPostProcessPanel` — lógica de criação de UI quase idêntica

| Arquivo | Linhas |
|---|---|
| [ShaderSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/ShaderSection.ts#L78-L203) | 78–203 |

`buildPanel` (L78-142) e `buildPostProcessPanel` (L146-204) compartilham ~90% do código:
- Inicialização do `targetProxy` com `defaultValue`
- Construção de `bindingOptions` baseada no `type`
- Botão "Restaurar Padrões" com a mesma lógica de reset

**Ação sugerida:** Extrair um método privado tipo `buildUniformFolder(folder, uniforms, proxy, onChange)` e reutilizar em ambos.

---

### 1.3 Padrão de loader repetido em `ModelConfigs`

| Arquivo | Linhas |
|---|---|
| [ModelConfigs.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/configs/ModelConfigs.ts#L61-L157) | 61–157 |

Os loaders de `suzanne`, `candelabra` e `axis` são idênticos — apenas diferem no nome do arquivo `.glb`:
```ts
loader: async (scene: B.Scene) => {
    const result = await B.SceneLoader.ImportMeshAsync('', '/models/', 'NOME.glb', scene);
    return result.meshes[0];
}
```

**Ação sugerida:** Criar uma função factory `createGLBLoader(filename: string)` e reutilizar.

---

### 1.4 Padrão de `onApply` de escala repetido em `ModelConfigs`

| Arquivo | Linhas |
|---|---|
| [ModelConfigs.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/configs/ModelConfigs.ts) | Múltiplas |

Todos os modelos `.glb` usam a mesma estrutura de `onApply` para escala:
```ts
onApply: (mesh, value) => { mesh.scaling.setAll(baseScale * value); }
```
Apenas o `baseScale` varia. Poderia ser uma factory `createScaleParam(baseScale, ...)`.

---

## 2. Funções/Métodos Grandes

### 2.1 `SceneController.constructor` — ~80 linhas, faz muitas coisas

| Arquivo | Linhas |
|---|---|
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L61-L145) | 61–145 |

O construtor:
1. Cria `Engine` e `Scene`
2. Instancia 8 managers
3. Registra interações
4. Configura toda a UI (modelo, shaders, interações, skybox, efeitos, luzes, transformação)

**Ação sugerida:** Extrair a configuração da UI para um método privado como `setupUI()`. O construtor deveria apenas instanciar os managers.

---

### 2.2 `SceneController.switchModel` — ~110 linhas, mistura muitas responsabilidades

| Arquivo | Linhas |
|---|---|
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L253-L363) | 253–363 |

Este método:
1. Salva estado do modelo anterior (velocidade, posição, rotação)
2. Restaura materiais do modelo anterior
3. Constrói painel dinâmico de UI
4. Carrega modelo novo (async)
5. Aplica defaults dos parâmetros
6. Centraliza na origem + aplica rotação
7. Restaura posição/rotação do modelo anterior
8. Habilita/desabilita física
9. Transfere velocidade
10. Re-aplica shader ativo

**Ação sugerida:** Dividir em submétodos (ex: `captureCurrentState()`, `applyInitialTransform()`, `transferVelocity()`).

---

### 2.3 `EnvironmentManager.setSkybox` — ~85 linhas, lida com cache + transição + animação

| Arquivo | Linhas |
|---|---|
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts#L84-L170) | 84–170 |

Mistura: carregamento/cache de textura, configuração de PBR/iluminação da cena, setup de uniforms GLSL do crossfade e disparo de animações.

**Ação sugerida:** Separar em `loadOrGetTexture(id)`, `configureEnvironmentLighting(envTexture, config)`, e `startSkyboxTransition(...)`.

---

### 2.4 `LightSection.setup` — ~70 linhas numa só função, sem decomposição

| Arquivo | Linhas |
|---|---|
| [LightSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/LightSection.ts#L13-L85) | 13–85 |

Configura tudo numa só função: modo de iluminação, controles hemisféricos, controles de ponto de luz e sub-pasta de animação.

---

## 3. Números e Strings Mágicos

### 3.1 Strings mágicas em nomes de uniform

| Arquivo | Ocorrências |
|---|---|
| [ShaderManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ShaderManager.ts#L157) | `'u_time'` (L157) |
| [SkyboxEffectManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/SkyboxEffectManager.ts#L70) | `'u_time'` (L70) |
| [SkyboxFadeMaterial.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/skybox/SkyboxFadeMaterial.ts) | `"u_mix"`, `"u_rotation1"`, `"u_visibility"`, etc. (~30 strings) |
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts) | `"u_mix"`, `"u_visibility"`, `"u_bgColor"`, `"texture1"`, `"texture2"`, etc. (~15 strings) |

Esses nomes de uniform são duplicados entre `SkyboxFadeMaterial.ts` (defaults) e `EnvironmentManager.ts` (animação), sem uma constante compartilhada. Se alguém renomear um, o outro silenciosamente para de funcionar.

**Ação sugerida:** Criar um enum/constantes como `SKYBOX_UNIFORMS = { MIX: 'u_mix', VISIBILITY: 'u_visibility', ... }` e usar em ambos os arquivos.

---

### 3.2 Números mágicos

| Arquivo | Local | Valor | Significado |
|---|---|---|---|
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts#L56) | L56 | `1000` | Tamanho do skybox box |
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts#L97) | L97 | `10000` | Timeout de carregamento do skybox (ms) |
| [CameraManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/CameraManager.ts#L20) | L20 | `Math.PI / 2`, `Math.PI / 3`, `5` | Ângulos e raio iniciais da câmera |
| [CameraManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/CameraManager.ts#L56) | L56 | `1.5`, `2.0` | Multiplicadores do frustum Z |
| [CameraManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/CameraManager.ts#L39) | L39 | `2.5` | Multiplicador de enquadramento |
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L470) | L470 | `150` | Debounce do resize (ms) |
| [FingerInteraction.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/interactions/FingerInteraction.ts#L10) | L10 | `1.5` | Força do impulso |
| [LightManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/LightManagers.ts#L124) | L124 | `5` | Fallback do raio de órbita |
| [LightManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/LightManagers.ts#L134) | L134 | `0.2`, `0.8` | Fator de pulse |
| [LightManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/LightManagers.ts#L176) | L176 | `0.3` | Escala do helper |
| [Toon.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/materials/toon/Toon.fragment.glsl#L28) | L28 | `0.1` | Fator de atenuação |
| [Toon.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/materials/toon/Toon.fragment.glsl#L40) | L40 | `0.15` | Sombra mínima |
| [Bloom.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/bloom/Bloom.fragment.glsl#L45) | L45 | `0.2` | Softness do smoothstep |
| [Bloom.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/bloom/Bloom.fragment.glsl#L49) | L49 | `4.0` | Sigma do peso gaussiano |
| [SkyboxFade.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/skybox/SkyboxFade.fragment.glsl#L39) | L39 | `7.0` | MAX_LOD |
| [SkyboxFade.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/skybox/SkyboxFade.fragment.glsl#L55) | L55 | `57.0`, `113.0` | Constantes de hash |

> [!TIP]
> Nos shaders GLSL, números mágicos em constantes de hash/ruído (`43758.5453`, `57.0`, `113.0`) são idiomáticos e universalmente reconhecidos — **não precisam** de constantes. Mas valores como `MAX_LOD`, fatores de atenuação e limites de sombra beneficiam-se de `#define` ou uniforms para documentação.

---

### 3.3 Strings mágicas em nomes de mesh

| Arquivo | Local | Strings |
|---|---|---|
| [EdgeConfig.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/edge/EdgeConfig.ts#L14) | L14 | `['skybox', 'floor', 'ceil', 'left', 'right', 'front', 'back']` |
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts#L297-L304) | L297-304 | `'floor'`, `'ceil'`, `'left'`, `'right'`, `'front'`, `'back'` |
| [LightManagers.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/LightManagers.ts#L179) | L179 | `'Esfera'`, `'__root__'` |

O `EdgeConfig` depende de nomes definidos no `EnvironmentManager` sem nenhuma referência cruzada. Há até um comentário em `EnvironmentManager.ts` L296 avisando disso.

**Ação sugerida:** Exportar os nomes como constantes de `EnvironmentManager` (ou `EnvironmentConfigs`) e importar no `EdgeConfig`.

---

## 4. Acoplamento Excessivo

### 4.1 `SceneController` é um God Object

| Arquivo |
|---|
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts) |

Possui 8 managers + estado de transformação + estado de shaders + estado de post-processes + geração de switch + timeout de resize. Ele orquestra **toda** a comunicação entre managers e UI, resultando em ~500 linhas e conhecimento íntimo de cada subsistema.

Enquanto um orquestrador central é aceitável, o `SceneController` também:
- Mantém estado local de `shaderParams`, `ppParams`, `activePostProcesses`, `transformState` que poderiam viver nos managers respectivos
- Faz lógica FIFO de post-processes que deveria viver no `ShaderManager`

---

### 4.2 `ShaderManager.updateTime` chama `lightManager.injectLightUniforms` a cada frame

| Arquivo | Linhas |
|---|---|
| [ShaderManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ShaderManager.ts#L152-L163) | 152–163 |

O `ShaderManager` depende diretamente do `LightManager` para injetar uniforms. Além disso, faz isso **a cada frame** via o `updateTime`:

```ts
// INJETAMOS AS LUZES AQUI TODO FRAME PARA AS ANIMAÇÕES FUNCIONAREM!
this.lightManager.injectLightUniforms(mat);
```

Se os uniforms de luz só mudam quando o `LightManager` anima, seria melhor o próprio `LightManager` injetar diretamente no `ShaderMaterial` ativo via um callback, em vez do `ShaderManager` puxar.

---

### 4.3 `EnvironmentManager` depende de detalhes internos de `SkyboxConfigs`

| Arquivo | Linhas |
|---|---|
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts#L114-L121) | 114–121 |

Para fazer o crossfade, o `EnvironmentManager` busca o config **anterior** de volta de `SkyboxConfigs[this.currentSkyboxId]` para ler `rotationY` e `blur`. Isso é frágil — se o config não existir mais, falha silenciosamente.

**Ação sugerida:** Guardar os parâmetros do skybox anterior em estado interno em vez de re-consultar o config.

---

## 5. Código Morto

### 5.1 Arquivo vazio: `App.css`

| Arquivo |
|---|
| [App.css](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/App.css) |

Arquivo vazio, mas importado em `App.tsx`. Pode ser removido (ou mantido intencionalmente para o futuro).

---

### 5.2 Diretórios vazios: `shaders/materials/pixelart/` e `shaders/postprocess/ASCII/`

Vazios, presumivelmente placeholders para shaders futuros. OK manter, mas vale um comentário ou `.gitkeep`.

---

### 5.3 Código comentado em `CameraManager`

| Arquivo | Linhas |
|---|---|
| [CameraManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/CameraManager.ts#L25-L31) | 25–31 |

```ts
// this.camera.attachControl(canvas, true);
// this.camera.wheelPrecision = 50;
// ...
```

6 linhas de configuração de câmera comentadas. Se forem features planejadas, mover para um TODO ou issue; senão, remover.

---

### 5.4 Código comentado em `Canvas3D.tsx`

| Arquivo | Linhas |
|---|---|
| [Canvas3D.tsx](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/components/Canvas3D.tsx#L119-L125) | 119–125 |

Botão antigo de toggle comentado inteiro, seguido pela versão atual com SVG (L126-144).

---

### 5.5 Código comentado em `EnvironmentManager.ts`

| Arquivo | Linhas |
|---|---|
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts#L144) | L144, L165 |

```ts
// this.skyboxMesh.setEnabled(true);
```

Duas ocorrências comentadas.

---

### 5.6 Import não utilizado: `@babylonjs/loaders/glTF` em `LightManagers.ts`

| Arquivo | Linha |
|---|---|
| [LightManagers.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/LightManagers.ts#L2) | 2 |

```ts
import '@babylonjs/loaders/glTF';
```

Esse side-effect import registra os loaders glTF. Provavelmente necessário no `ModelManager` (que já o tem), mas não no `LightManager`. O loader pode já estar registrado quando `LightManager` chama `ImportMeshAsync` para o helper — mas é melhor importar apenas onde é semanticamente necessário.

---

### 5.7 `ControlType` exportado mas nunca utilizado

| Arquivo | Linha |
|---|---|
| [UI.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/types/UI.ts#L39) | 39 |

```ts
export type ControlType = UIParameter['type'];
```

Não encontrei uso em nenhum arquivo.

---

### 5.8 `ShaderConfig` exportado mas nunca utilizado

| Arquivo | Linha |
|---|---|
| [Types.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/Types.ts#L50) | 50 |

```ts
export type ShaderConfig = MaterialShaderConfig | PostProcessShaderConfig;
```

Nenhum consumidor.

---

### 5.9 `ModelManager.restoreOriginalMaterials` nunca chamado

| Arquivo | Linha |
|---|---|
| [ModelManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ModelManager.ts#L66-L68) | 66–68 |

O `SceneController` chama `entity.restoreOriginalMaterials()` diretamente na `ModelEntity` (L277, L371), nunca usa o proxy do `ModelManager`.

---

### 5.10 `TransformSection.transformFolder` — campo declarado, atribuído no construtor, mas **nunca populado**

| Arquivo | Linhas |
|---|---|
| [TransformSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/TransformSection.ts#L8) | 8, 72-77 |

`this.transformFolder` é declarado na L8, usado no `dispose()` (L73-76) mas **nunca é atribuído**. O `setup()` usa `this.folder` (a pasta raiz passada pelo construtor), não `this.transformFolder`. O `dispose()` tenta limpar algo que nunca existe — sem efeito prático, mas é confuso e pode mascarar um leak.

---

### 5.11 `description` em `UIParameter` — existente no tipo `FloatParam` dos `ModelConfigs` mas não declarado na interface

| Arquivo | Linhas |
|---|---|
| [UI.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/types/UI.ts) | Tipo `BaseParam` |
| [ModelSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/ModelSection.ts#L64-L66) | 64-66 |

`ModelSection.buildDynamicPanel` faz `if ('description' in param && param.description)`, mas `description` não faz parte de `BaseParam` em `UI.ts`. Funciona por duck typing em runtime, mas é um type-hole.

---

## 6. Tratamento de Erros Frágil

### 6.1 Timeout de carregamento do skybox — race condition com a Promise

| Arquivo | Linhas |
|---|---|
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts#L95-L98) | 95–98 |

```ts
await new Promise<void>((resolve, reject) => {
    envTexture!.onLoadObservable.addOnce(() => resolve());
    setTimeout(() => reject(new Error(`Timeout...`)), 10000);
});
```

> [!WARNING]
> **Race condition:** Se a textura carregar com sucesso, o `setTimeout` continua agendado e nunca é cancelado. A Promise já resolveu, então o `reject` posterior é ignorado pelo runtime — mas o timer fica preso no event loop até disparar. Se houver múltiplas trocas rápidas de skybox, acumula timers desnecessários.
>
> Além disso, se a textura falhar por um motivo diferente de timeout (ex: 404), não há listener para `onError`.

---

### 6.2 `gBuffer` pode ser nulo no `EdgeConfig.create`

| Arquivo | Linhas |
|---|---|
| [EdgeConfig.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/edge/EdgeConfig.ts#L22-L25) | 22–25 |

```ts
const gBuffer = scene.enableGeometryBufferRenderer();
if (gBuffer) { ... }
```

O check é feito na criação, mas dentro do `onSizeChangedObservable` (L40-49), a textura de normais é acessada dentro de `if (gBuffer)` que captura a closure. Isso é OK, mas se o `gBuffer` falhar, o edge detection funciona **sem** normais silenciosamente — sem aviso ao usuário.

---

### 6.3 `switchModel` — modelo anterior pode não ser re-ativado se o catch erra

| Arquivo | Linhas |
|---|---|
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L294-L308) | 294–308 |

O bloco catch tenta re-ativar o modelo anterior, mas a `restoreOriginalMaterials` já foi chamada na L277 **antes** do try. Se o load falhar e o shader ativo tiver alterado o material, o re-enable na L301-303 vai restaurar o mesh **sem** o shader.

---

### 6.4 `onApply` no callback de `onSizeChangedObservable` — acumula observers

| Arquivo | Linhas |
|---|---|
| [EdgeConfig.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/edge/EdgeConfig.ts#L39-L50) | 39–50 |

```ts
pp.onSizeChangedObservable.add(() => {
    pp.onApplyObservable.add((effect) => { ... });
});
```

> [!CAUTION]
> Cada vez que o tamanho do post-process muda (resize da janela), um **novo** observer é adicionado ao `onApplyObservable` **sem remover o anterior**. Isso significa que após N resizes, o callback de injeção de uniforms roda N vezes por frame. É um memory leak e um desperdício de performance.

**Ação sugerida:** Usar `pp.onApply` (callback direto, não `onApplyObservable`) como já é feito no `ShaderManager`, ou limpar o observer anterior.

---

## 7. Estado Mutável Desnecessário

### 7.1 `SceneController.activePostProcesses` duplica estado do `ShaderManager.activePostProcesses`

| Arquivo | Linhas |
|---|---|
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L44) | 44 |
| [ShaderManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ShaderManager.ts#L24) | 24 |

Ambos mantêm uma lista/map de post-processes ativos. O `SceneController` mantém a fila FIFO, o `ShaderManager` mantém o map de instances. Se ficarem dessincronizados, bugs sutis aparecem.

**Ação sugerida:** Centralizar a lógica FIFO no `ShaderManager` e expor apenas métodos de consulta.

---

### 7.2 `SceneController.shaderParams` e `ppParams` — estado duplicado dos defaults

| Arquivo | Linhas |
|---|---|
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L42-L43) | 42–43 |

Esses proxies existem apenas para alimentar o Tweakpane. São criados e populados no `SceneController`, mas os valores "reais" vivem dentro dos `ShaderMaterial` e `PostProcess` do Babylon. Se ficarem dessincronizados (ex: um `setFloat` direto no material), o Tweakpane mostra o valor antigo.

---

## 8. Lógica Repetida

### 8.1 Padrão de "tooltip via `element.title`" em todas as UI Sections

| Arquivos | Padrão |
|---|---|
| [ModelSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/ModelSection.ts#L31-L35), [ShaderSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/ShaderSection.ts#L46-L51), [InteractionSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/InteractionSection.ts#L31-L38), [EnvironmentSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/EnvironmentSection.ts#L46) | Todas fazem `binding.element.title = description` |

Cada section repete a mesma lógica: cria binding → se tem `description`, seta o `element.title`. Poderia ser um helper tipo `addBindingWithTooltip(folder, ...)`.

---

### 8.2 Padrão de "dropdown data-driven" repetido

| Arquivos |
|---|
| [ModelSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/ModelSection.ts#L19-L22), [ShaderSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/ShaderSection.ts#L31-L34), [EnvironmentSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/EnvironmentSection.ts#L24-L27), [InteractionSection.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ui/sections/InteractionSection.ts#L21-L23) |

Todas as sections criam dropdowns com o mesmo padrão:
```ts
const options: Record<string, string> = {};
for (const [id, config] of Object.entries(Configs)) {
    options[config.label] = id;
}
```

---

### 8.3 Cálculo de `frustumLimits` chamado 2× no constructor + create

| Arquivo | Linhas |
|---|---|
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L74) | L74 (constructor) |
| [SceneController.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L165) | L165 (create) |

O `calculateFrustumLimits()` é chamado no construtor (L74) para o `setupTransformControls`, e novamente no `create` (L165) para o `resizeBoundaries`. São chamadas consecutivas antes do render loop começar. Poderia calcular uma vez e reutilizar.

---

## 9. Complexidade Ciclomática Alta

### 9.1 `SceneController.switchModel` — 11 decisões condicionais

Possui verificações encadeadas de `if` para: config existir, modelo anterior existir, rotationQuaternion, initialRotation, prevRotationQuat, prevPosition, physics enabled, materialShader ativo, e a guard de geração.

### 9.2 `EnvironmentManager.setSkybox` — 7 decisões

Combinação de cache hit/miss, estado anterior (skybox vs cor), visibilidade atual, e decisão de crossfade vs fade-in.

### 9.3 `LightManager.startAnimationLoop` — 5 branches aninhados

```
if (mode !== 'hemi') → if (animationType === 'orbit') → ...
                     → if (animationType === 'pulse') → ...
                       else if (mode === 'point' || 'both') → ...
                     → if (helperSphereMat) → ...
```

---

## 10. Performance

### 10.1 🔴 **[GLSL CRÍTICO]** Bloom — Gaussian blur com loop 2D fixo (49 texture reads por pixel)

| Arquivo | Linhas |
|---|---|
| [Bloom.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/bloom/Bloom.fragment.glsl#L35-L53) | 35–53 |

```glsl
const int KERNEL_RADIUS = 3;
for(int x = -KERNEL_RADIUS; x <= KERNEL_RADIUS; x++) {
    for(int y = -KERNEL_RADIUS; y <= KERNEL_RADIUS; y++) {
        // 49 texture samples por pixel
    }
}
```

> [!CAUTION]
> **49 amostras de textura por pixel** é extremamente pesado para um efeito de pós-processamento que roda em tela cheia a cada frame. Em 1080p são ~100 milhões de leituras de textura por frame.
>
> O padrão de bloom da indústria é um **two-pass separable Gaussian blur** (horizontal + vertical), que reduz de N² para 2N amostras (de 49 para 14). Alternativamente, usar **dual Kawase blur** (downscale + upscale em múltiplas resoluções) que é ainda mais rápido com menos passes.
>
> Além disso, o bloom está rodando em **resolução 1.0** (`1` no construtor do PostProcess), quando tipicamente roda a 0.5x ou 0.25x para economia.

**Impacto visual de corrigir:** Nenhum — a separação do blur em dois passes produz resultado visualmente idêntico.

---

### 10.2 🔴 **[GLSL]** Bloom — `exp()` e `length()` calculados dentro do loop interno

| Arquivo | Linhas |
|---|---|
| [Bloom.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/bloom/Bloom.fragment.glsl#L48-L49) | 48–49 |

```glsl
float dist = length(offset);
float weight = exp(-(dist * dist) / 4.0);
```

Para um kernel 7×7, os pesos gaussianos são **constantes** e podem ser pré-calculados numa tabela. Atualmente, `exp()` e `length()` são executados 49 vezes por pixel por frame desnecessariamente.

---

### 10.3 🟡 **[GLSL]** Edge Detection — 16 texture reads por pixel

| Arquivo | Linhas |
|---|---|
| [Edge.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/edge/Edge.fragment.glsl#L28-L59) | 28–59 |

O Sobel filter faz 8 leituras de profundidade + 8 de normais = 16 amostras. Isso é o esperado para Sobel (não há otimização trivial), mas vale notar que:

- As 16 leituras podem ser reduzidas para 8 usando **shared texture fetches** — `getDepth(vUV + offset)` e `getNormal(vUV + offset)` buscam na mesma coordenada UV, portanto poderiam ser feitas numa única leitura se o depth e normal fossem empacotados numa mesma textura. Porém, como são texturas separadas do Babylon, não é viável sem refatoração pesada.
- **Otimização prática:** Um approach de **Roberts Cross** (2×2 em vez de 3×3) reduziria para 4+4=8 amostras com resultado visualmente muito próximo. Mas isso pode afetar a sensibilidade de detecção.

**Veredito:** Aceitável para a maioria dos GPUs — Sobel 3×3 é a escolha padrão.

---

### 10.4 🟡 **[GLSL]** SkyboxFade — `noise()` chama `hash()` 8 vezes por invocação

| Arquivo | Linhas |
|---|---|
| [SkyboxFade.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/skybox/SkyboxFade.fragment.glsl#L51-L60) | 51–60 |

A função `noise()` faz 8 chamadas a `hash()`, cada uma com `fract(sin(n) * 43758.5453)`. Para o Warp e Aurora, `noise()` é chamada 1-3 vezes por pixel. Isso é ~24 operações `sin()` por pixel quando esses efeitos estão ativos. Aceitável para skybox (baixa resolução efetiva + roda só 1× por frame), mas se fosse usar esses efeitos em tela cheia, valeria trocar por um lookup de noise texture.

---

### 10.5 🟡 **[TS]** `LightManager.injectLightUniforms` chamado a cada frame duplamente

| Arquivo | Linhas |
|---|---|
| [ShaderManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ShaderManager.ts#L159-L160) | 159–160 |

```ts
mat.setFloat('u_time', time);
this.lightManager.injectLightUniforms(mat); // A cada frame!
```

A injeção envolve 2× `scaleToRef` + 4× `setVector3`/`setColor3` por frame, mesmo quando as luzes não mudaram. O custo individual é baixo, mas a redundância pode ser evitada com um flag de "dirty" no `LightManager`.

---

### 10.6 🟢 **[TS]** `PhysicsManager.applySpring` — cria vetores temporários a cada frame

| Arquivo | Linhas |
|---|---|
| [PhysicsManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/PhysicsManager.ts#L38) | 38 |

```ts
const direction = config.anchorPoint.subtract(mesh.position);
```

`subtract()` cria um novo `Vector3` a cada frame. Em render loops de 60fps+, isso gera 60+ alocações/segundo. Poderia usar `subtractToRef()` com um vetor reutilizável.

---

### 10.7 🟢 **[TS]** `LightManager` — `Math.sqrt()` + `**` a cada frame na órbita

| Arquivo | Linhas |
|---|---|
| [LightManagers.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/LightManagers.ts#L124) | 124 |

```ts
const radius = Math.sqrt(this.pointBasePosition.x ** 2 + this.pointBasePosition.z ** 2) || 5;
```

O raio de órbita é recalculado a cada frame, mas só muda quando o usuário move o slider de posição. Poderia ser cacheado e recalculado apenas no `updatePointLight`.

---

### 10.8 🟢 **[TS]** `EnvironmentManager.resizeBoundaries` — recria 6 meshes + aggregates

| Arquivo | Linhas |
|---|---|
| [EnvironmentManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/EnvironmentManager.ts#L278-L317) | 278–317 |

Cada resize destrói e recria 6 meshes + 6 `PhysicsAggregate`. Isso é mitigado pelo debounce de 150ms, mas poderia simplesmente reposicionar e reescalar os meshes existentes.

---

## 11. Valores Nulos Não Tratados

### 11.1 `ModelManager.currentEntity` — acesso sem null-check em vários locais

O `SceneController` faz **20+** acessos a `this.modelManager.currentEntity` com guards inconsistentes:

| Local | Guard |
|---|---|
| [SceneController.ts L193](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L193) | ✅ `if (... && this.modelManager.currentEntity)` |
| [SceneController.ts L208-209](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L208-L209) | ✅ `if (!entity) return` |
| [SceneController.ts L266-268](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L266-L268) | ✅ `if (this.modelManager.currentEntity)` |
| [SceneController.ts L300-301](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/SceneController.ts#L300-L301) | ✅ No catch block |

Mas note que `ModelManager.currentModelId` é **nunca resetado para null** no `loadModel` em caso de erro — se o load falhar, `currentModelId` ainda aponta para o modelo que não existe.

---

### 11.2 `!` non-null assertions

| Arquivo | Linhas | Expressão |
|---|---|---|
| [main.tsx](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/main.tsx#L6) | L6 | `document.getElementById('root')!` |
| [ModelEntity.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/entities/ModelEntity.ts#L65-L66) | L65-66 | `this.physicsBody!.setLinearDamping(...)` |
| [ShaderManager.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/managers/ShaderManager.ts#L59) | L59 | `this.materialCache.get(shaderId)!` |

O `main.tsx` é idiomático e aceitável. Os outros poderiam usar early-return ou optional chaining.

---

### 11.3 `ModelEntity.enableConvexHullPhysics` — restaura transform antes de checar se merged foi null

| Arquivo | Linhas |
|---|---|
| [ModelEntity.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/babylon/entities/ModelEntity.ts#L111-L116) | 111–116 |

```ts
this.mesh.position.copyFrom(savedPos);       // L111
this.mesh.rotationQuaternion = savedRotQuat;  // L112
if (!merged) { ... return; }                  // L113-116
```

O transform é restaurado antes do null check — isso é correto! Mas note que `savedRotQuat` pode ser `null` (L99), e atribuir `null` a `rotationQuaternion` faz o Babylon reverter para `rotation` (Euler), o que pode não ser o comportamento desejado se o modelo estava usando quaternions antes.

---

## 12. Dependências Obsoletas / APIs Depreciadas

### 12.1 `gl_FragColor` nos shaders que usam GLSL 1.0 (sem `#version`)

| Arquivos |
|---|
| [Toon.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/materials/toon/Toon.fragment.glsl), [SkyboxFade.fragment.glsl](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/skybox/SkyboxFade.fragment.glsl) |

Usam `gl_FragColor` e `varying`/`attribute` (GLSL 1.0 / WebGL 1 syntax). Em contraste, os post-processes (`Edge.fragment.glsl`, `Bloom.fragment.glsl`) usam `#version 300 es` com `in`/`out`.

Isso funciona hoje porque o Babylon lida com ambos, mas é inconsistente. Se migrar para WebGPU (mencionado no README como fase 2), os shaders GLSL 1.0 precisarão ser convertidos de qualquer forma.

> [!NOTE]
> Não é urgente — funciona perfeitamente no WebGL2. Mas padronizar todos para `#version 300 es` agora reduz trabalho na migração futura.

---

### 12.2 `B.Effect.ShadersStore` — API funcional mas é registrada no escopo de módulo

| Arquivo | Linha |
|---|---|
| [BloomConfig.ts](file:///c:/Users/Cliente/Documents/GitHub/Shader_Viewer/src/shaders/postprocess/bloom/BloomConfig.ts#L6) | 6 |

```ts
B.Effect.ShadersStore['customBloomFragmentShader'] = bloomFragmentShader;
```

Este registro acontece no **top-level do módulo** (fora da função `create`), enquanto o `ToonConfig` e `EdgeConfig` registram **dentro** da `create`. Inconsistência que pode causar confusão — o shader do Bloom é registrado mesmo que nunca seja usado.

---

### 12.3 `new B.PostProcess(...)` — constructor depreciado no Babylon 7+

> [!IMPORTANT]
> A partir do Babylon.js v7 (2024+), o construtor de `PostProcess` com muitos parâmetros posicionais é marcado como deprecated em favor de um objeto de opções. Se o projeto estiver usando Babylon 7+, vale migrar para:
> ```ts
> new B.PostProcess({ name: '...', fragmentUrl: '...', ... })
> ```
> Verificar a versão exata do `@babylonjs/core` no `package.json`.

---

## Resumo por Prioridade

| Prioridade | Item | Impacto |
|---|---|---|
| 🔴 Alta | **Bloom 2D loop** (10.1) | Performance — 49 texture reads/pixel |
| 🔴 Alta | **EdgeConfig observer leak** (6.4) | Memory leak + performance degradada ao fazer resize |
| 🔴 Alta | **Skybox timeout race** (6.1) | Timer leak no event loop |
| 🟠 Média | Código duplicado `buildPanel` / `buildPostProcessPanel` (1.2) | Manutenibilidade |
| 🟠 Média | Código duplicado `setUniformOnMaterial` / `setUniformOnEffect` (1.1) | Manutenibilidade |
| 🟠 Média | Loaders duplicados em ModelConfigs (1.3, 1.4) | Manutenibilidade |
| 🟠 Média | Strings de nomes de mesh não centralizadas (3.3) | Fragilidade |
| 🟠 Média | Strings de uniform duplicadas sem constantes (3.1) | Fragilidade |
| 🟠 Média | `activePostProcesses` duplicado (7.1) | Bug potencial de dessincronização |
| 🟠 Média | `switchModel` muito grande (2.2) | Legibilidade |
| 🟠 Média | `TransformSection.transformFolder` nunca populado (5.10) | Bug silencioso no dispose |
| 🟡 Baixa | Código morto / comentado (5.x) | Limpeza |
| 🟡 Baixa | `injectLightUniforms` a cada frame (10.5) | Performance marginal |
| 🟡 Baixa | Números mágicos (3.2) | Documentação |
| 🟡 Baixa | Inconsistência GLSL 1.0 vs 3.0 (12.1) | Dívida técnica |
| 🟢 Info | PostProcess constructor deprecated (12.3) | Futuro |
| 🟢 Info | Diretórios vazios (5.2) | Organização |

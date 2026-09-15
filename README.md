# El Niño e o Brasil

Site educativo, em português, sobre o El Niño: **como o fenômeno se forma no
Pacífico, como é medido e o que ele faz com os ecossistemas e as regiões do
Brasil** — explicado com animações 3D interativas, gráficos e dados.

O site é estático e **não depende de nenhum serviço externo**: bibliotecas,
geodados e conjuntos de dados estão todos no repositório. Nenhuma requisição
sai para fora enquanto a página roda.

---

## Rodando localmente

O site usa módulos ES e `fetch()` para carregar os geodados, então precisa ser
servido por HTTP — abrir o `index.html` direto do disco (`file://`) não
funciona.

```bash
git clone https://github.com/LeonardoVini/el-nino.git
cd el-nino
python3 -m http.server 4173      # ou: npm start
```

Depois abra <http://localhost:4173>.

---

## Publicando

O site é estático e todos os caminhos são relativos, então funciona tanto na
raiz de um domínio quanto em subpasta (`/el-nino/`). Não existe etapa de build
em nenhum dos dois caminhos abaixo.

### GitHub Pages

O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica
a cada push na branch. Falta **um passo manual, uma única vez**: o token
automático do Actions não tem permissão para criar o site do Pages, então é
preciso ligá-lo à mão.

1. **Settings → Pages → Source**: escolha **GitHub Actions**.
2. **Actions → Publicar no GitHub Pages → Run workflow**.

Daí em diante toda publicação é automática. O endereço é
`https://<usuário>.github.io/el-nino/` e aparece no resumo da execução.

Alternativa sem workflow nenhum: em **Settings → Pages → Source**, escolha
**Deploy from a branch**, aponte para a branch e a pasta `/ (root)`. O site é
estático e o `.nojekyll` já está no repositório, então funciona direto — nesse
caso o workflow fica sobrando e pode ser apagado.

### Vercel

O [`vercel.json`](vercel.json) já declara a raiz como diretório de saída e os
cabeçalhos de cache — o `three.js` e os geodados são imutáveis e ficam em cache
por um ano.

Pelo painel: **Add New → Project**, importe o repositório, deixe o framework
como **Other** e publique. Não preencha comando de build.

Pela linha de comando:

```bash
npx vercel --prod
```

---

## O que tem no site

| Seção | Conteúdo |
|---|---|
| **O que é** | ENOS como sistema acoplado oceano-atmosfera: poça quente, ressurgência, circulação de Walker |
| **Como ocorre** | Corte 3D interativo do Pacífico equatorial, com as três fases, mais a realimentação de Bjerknes passo a passo e os dois caminhos que levam o sinal até o Brasil |
| **Como se mede** | ONI, região Niño 3.4, limiares oficiais, instrumentos (boias TAO/TRITON, altimetria, Argo, IOS) e a série de 1950 a 2025 |
| **No Brasil** | Globo de teleconexão, mapa interativo das cinco regiões, desvio de chuva e temperatura por região e matriz de impacto por setor |
| **2023–24** | Estudo de caso: a seca dos rios amazônicos, as enchentes no Sul, calor e dengue recordes |
| **Ecossistemas** | Amazônia, Caatinga, recifes de coral, pesca, Pantanal e Mata Atlântica |
| **História** | 1877–79, 1982–83, 1997–98, 2015–16 e 2023–24 |
| **Clima** | A diferença entre oscilação natural e tendência de aquecimento, e como as duas se somam |
| **O que fazer** | Adaptação em quatro horizontes e onde acompanhar o monitoramento oficial |

### As três cenas 3D

Construídas em [three.js](https://threejs.org/) sem geometria pré-modelada —
tudo é gerado por código a partir de funções paramétricas:

1. **Globo (herói)** — planeta com textura desenhada em `<canvas>` a partir dos
   contornos do Natural Earth, camada de anomalia de temperatura calculada num
   shader e as caixas das regiões Niño.
2. **Corte do Pacífico** — o explicador principal. Um único número, a *fase*
   (−1 La Niña, 0 neutro, +1 El Niño), controla a inclinação da termoclina, o
   campo de temperatura da água, a força e o sentido dos alísios, a posição da
   convecção, o número de células de Walker e a ressurgência costeira. Trocar de
   fase interpola tudo junto.
3. **Teleconexão** — globo centrado na América do Sul, com a anomalia do
   Pacífico e os arcos pulsantes que ligam o oceano às regiões brasileiras.

Todas as cenas respeitam `prefers-reduced-motion` (desenham um quadro estático
em vez de animar), pausam quando saem da tela ou a aba perde o foco, e degradam
para um aviso quando não há WebGL.

---

## Dados e fontes

Os conjuntos de dados vivem em [`assets/js/data.js`](assets/js/data.js), cada um
com o campo `fonte` declarando a instituição de origem. Os gráficos repetem a
fonte no rodapé e todos oferecem **a mesma informação em tabela**, aberta pelo
link "Ver os dados em tabela".

| Conjunto | Instituição |
|---|---|
| ONI (Niño 3.4), série DJF 1950–2025 e evolução dos maiores eventos | NOAA / Climate Prediction Center |
| Nível mínimo do rio Negro em Manaus | Porto de Manaus / SGB-CPRM |
| Desvios de chuva e temperatura por região | Composição a partir de INPE/CPTEC, INMET e IRI |
| Matriz de impacto por setor | Síntese de Conab, ONS, Embrapa, Ministério da Saúde e Cemaden |
| Área queimada, focos de calor | MapBiomas Fogo e INPE/Programa Queimadas |
| Indicadores de 2023–24 | INMET, Ministério da Saúde, OMM, Defesa Civil |

> **Importante.** Os valores foram compilados de boletins e séries publicadas
> por essas instituições e estão aqui com finalidade educativa. Para uso
> científico ou operacional, consulte sempre a fonte primária — a tabela
> oficial do ONI está em
> <https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php>.

### Atualizando os dados

Os números ficam todos em um único módulo, sem banco nem build: basta editar
`assets/js/data.js`. Para atualizar a série do ONI depois de um novo trimestre,
substitua ou acrescente as entradas de `oniDJF` com os valores da tabela do CPC
e, se for o caso, inclua o evento em `eventosRanking`.

Os geodados são gerados por script e podem ser refeitos a qualquer momento:

```bash
npm install          # baixa world-atlas, topojson-client e @svg-maps/brazil
npm run build:geo    # regenera os três arquivos em assets/vendor/
```

---

## Estrutura

```
index.html                  página única, todo o texto explicativo
vercel.json                 configuração de publicação na Vercel
.github/workflows/pages.yml publicação automática no GitHub Pages
assets/
  css/style.css             tema oceânico escuro e componentes
  js/
    main.js                 orquestra tudo e injeta o conteúdo dos dados
    data.js                 dados e textos, com fonte declarada
    charts.js               biblioteca de gráficos em SVG, escrita para o projeto
    brasil-map.js           mapa interativo das regiões
    scenes/
      runtime.js            laço de renderização, arrasto, rótulos 3D
      globo.js              cenas do globo (herói e teleconexão)
      pacifico.js           corte 3D do Pacífico equatorial
  vendor/                   three.js e geodados (gerados por scripts/build-geo.mjs)
scripts/build-geo.mjs       converte Natural Earth e o mapa do Brasil
```

Não há empacotador, transpilador nem passo de build para o site. O único script
do projeto serve para regenerar os geodados.

---

## Acessibilidade e cor

- **Contraste**: texto principal em 16,3:1 e secundário em 9,1:1 sobre a
  superfície dos cartões; rótulos de eixo em 5,5:1. Todas as cores de dado
  ficam acima de 3:1 contra o fundo.
- **Daltonismo**: as paletas passaram por validação de separação perceptual em
  OKLab com simulação de protanopia, deuteranopia e tritanopia. Os polos
  divergentes (quente `#e2603a` × frio `#3f9ae0`) têm ΔE 23,7 sob protanopia; a
  paleta categórica de quatro séries tem ΔE mínimo de 8,4.
- **Cor nunca sozinha**: cada gráfico traz legenda, rótulos diretos nos extremos
  e uma tabela equivalente. O mapa do Brasil tem botões de texto além das áreas
  clicáveis.
- **Movimento**: `prefers-reduced-motion` desliga animações, transições e o laço
  de renderização 3D.
- **Teclado**: link de pular para o conteúdo, ordem de foco natural e foco
  visível em todos os controles.
- **Sem JavaScript**: o texto explicativo continua legível; as visualizações
  não são exibidas e um aviso explica por quê.

---

## Créditos e licenças

| Componente | Origem | Licença |
|---|---|---|
| Código e textos do site | este repositório | MIT (código) · CC BY 4.0 (conteúdo) |
| [three.js](https://threejs.org/) | mrdoob e colaboradores | MIT |
| Contornos de terra e do Brasil | [Natural Earth](https://www.naturalearthdata.com/) via `world-atlas` | domínio público |
| Mapa das unidades da federação | [svg-maps/brazil](https://github.com/VictorCazanave/svg-maps), de Victor Cazanave | CC BY 4.0 |

Os dados citados nos gráficos pertencem às instituições indicadas em cada
figura e são reproduzidos aqui com finalidade educativa.

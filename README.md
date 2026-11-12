<div align="center">

<img src="docs/media/hero.svg" alt="GitVitals — the health check for GitHub" width="100%">

<p>
  <a href="https://repository-insights-kappa.vercel.app"><img alt="Live" src="https://img.shields.io/badge/live-paste%20a%20repo-3fb950?style=for-the-badge&labelColor=0d1117"></a>
  <img alt="React" src="https://img.shields.io/badge/React-shadcn%2Fui-58a6ff?style=for-the-badge&labelColor=0d1117">
  <img alt="Express" src="https://img.shields.io/badge/Express-API-d29922?style=for-the-badge&labelColor=0d1117">
  <img alt="Sign-up" src="https://img.shields.io/badge/sign--up-none-3fb950?style=for-the-badge&labelColor=0d1117">
</p>

<p><em>A complete picture of any public GitHub repository or developer, in seconds.<br>
Paste a URL, get deep insights. No sign-up, no API keys.</em></p>

</div>

<img src="docs/media/divider.svg" width="100%" alt="">

## Features

| | |
|---|---|
| **Repo analyser** | A health score, commit trends, language breakdown and risk assessment. |
| **Developer insights** | A developer score, language expertise, portfolio stats and a shareable card. |
| **Compare** | Two repositories side by side across ten-plus metrics. |
| **History** | Recent analyses saved locally, one click to revisit. |
| **PDF export** | The full report as a PDF. |
| **Languages and themes** | English and Turkish, dark and light. |

```mermaid
flowchart LR
  URL[Repo or profile URL] --> API[Express API]
  API --> GH[GitHub REST]
  GH --> SC[Scoring<br/>health · activity · risk]
  SC --> UI[Dashboard · charts]
  UI --> PDF[PDF report]
  UI --> H[(Local history)]
```

<img src="docs/media/divider.svg" width="100%" alt="">

## Türkçe özet

**GitVitals**, herhangi bir herkese açık GitHub deposunun ya da geliştirici profilinin tam resmini saniyeler içinde çıkaran bir analiz aracı. Adresi yapıştırınca sağlık puanı, commit eğilimleri, dil dağılımı ve risk değerlendirmesi geliyor; iki depoyu yan yana karşılaştırıp raporu PDF olarak indirebiliyorsun. Kayıt ya da API anahtarı gerekmiyor.

<img src="docs/media/divider.svg" width="100%" alt="">

## Development

```sh
npm install
npm run dev      # Express + Vite
npm run build
npm start
```

```
client/   React app
server/   Express API and GitHub client
shared/   shared types and schema
```

<div align="center">
<br>
<a href="https://github.com/kutluhangil"><img src="docs/media/signature.svg" width="100%" alt="Built by kutluhangil"></a>
<sub>Take your repository's pulse.</sub>
</div>

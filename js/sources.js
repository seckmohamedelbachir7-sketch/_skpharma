/**
 * sources.js — Module "Sources & Références" pour SKPharma
 * Style "Apothicaire de Luxe" (or antique / bleu marine / parchemin)
 *
 * Chargé en script global (pas de modules ES), comme les autres fichiers
 * de /js/. La page est injectée dans #page-sources au premier appel.
 */

const SOURCES = [
  {
    category: "OFFICIELLE FR",
    name: "BDPM",
    subtitle: "Base de Données Publique des Médicaments",
    description: "RCP, notices et données d'AMM des médicaments commercialisés en France.",
    url: "https://base-donnees-publique.medicaments.gouv.fr/"
  },
  {
    category: "OFFICIELLE FR",
    name: "ANSM",
    subtitle: "Agence nationale de sécurité du médicament et des produits de santé",
    description: "Alertes, ruptures de stock, AMM, pharmacovigilance, thésaurus interactions.",
    url: "https://ansm.sante.fr/"
  },
  {
    category: "OFFICIELLE FR",
    name: "HAS",
    subtitle: "Haute Autorité de Santé",
    description: "Recommandations cliniques, bon usage du médicament, guides ALD.",
    url: "https://www.has-sante.fr/"
  },
  {
    category: "OFFICIELLE FR",
    name: "Ameli",
    subtitle: "Assurance Maladie en ligne",
    description: "Remboursements, ALD, parcours de soins, droits patients.",
    url: "https://www.ameli.fr/"
  },
  {
    category: "OFFICIELLE FR",
    name: "Légifrance",
    subtitle: "Service public de la diffusion du droit",
    description: "Textes réglementaires : Code de la sécurité sociale, décrets et arrêtés.",
    url: "https://www.legifrance.gouv.fr/"
  },
  {
    category: "OFFICIELLE FR",
    name: "CNAMTS LPP",
    subtitle: "Caisse Nationale d'Assurance Maladie — Codage LPP",
    description: "Codes et tarifs LPP (dispositifs médicaux, prestations remboursables).",
    url: "https://www.codage.ext.cnamts.fr/"
  },
  {
    category: "OFFICIELLE FR",
    name: "ANSES",
    subtitle: "Agence nationale de sécurité sanitaire de l'alimentation, de l'environnement et du travail",
    description: "Compléments alimentaires, nutrivigilance, plantes, dispositifs médicaux.",
    url: "https://www.anses.fr/"
  },
  {
    category: "OFFICIELLE FR",
    name: "OMEDIT Normandie",
    subtitle: "Observatoire du Médicament, des Dispositifs médicaux et de l'Innovation Thérapeutique de Normandie",
    description: "Liste nationale d'écrasabilité des comprimés et d'ouverture des gélules (partenariat SFPC).",
    url: "https://www.omedit-normandie.fr/"
  },
  {
    category: "ORDRE DES PHARMACIENS",
    name: "Meddispar",
    subtitle: "Médicaments à dispensation particulière",
    description: "Règles de dispensation (stupéfiants, médicaments à prescription restreinte).",
    url: "https://www.meddispar.fr/"
  },
  {
    category: "ORDRE DES PHARMACIENS",
    name: "Ordre des pharmaciens",
    subtitle: "Conseil National de l'Ordre des Pharmaciens",
    description: "Doctrine professionnelle, déontologie, communications de l'Ordre.",
    url: "https://www.ordre.pharmacien.fr/"
  },
  {
    category: "ÉPIDÉMIO",
    name: "SPF",
    subtitle: "Santé publique France",
    description: "Veille épidémiologique, vaccination, alertes sanitaires.",
    url: "https://www.santepubliquefrance.fr/"
  },
  {
    category: "RCP GRAND PUBLIC",
    name: "Vidal",
    subtitle: "Vidal — Encyclopédie du médicament",
    description: "Encyclopédie du médicament grand public et professionnel (accès limité).",
    url: "https://www.vidal.fr/"
  }
];

const CATEGORY_COLORS = {
  "OFFICIELLE FR": "#3b5bdb",
  "ORDRE DES PHARMACIENS": "#8a6d00",
  "ÉPIDÉMIO": "#9c3848",
  "RCP GRAND PUBLIC": "#2f7a52"
};

function injectStylesOnce() {
  if (document.getElementById("skpharma-sources-styles")) return;
  const style = document.createElement("style");
  style.id = "skpharma-sources-styles";
  style.textContent = `
    .sources-page {
      font-family: 'DM Sans', sans-serif;
      padding: 2.5rem 2rem;
      max-width: 1280px;
      margin: 0 auto;
      color: #2c2a26;
    }
    .sources-page__header {
      margin-bottom: 2rem;
    }
    .sources-page__title {
      font-family: 'DM Serif Display', serif;
      font-size: 2.1rem;
      color: #1c2541;
      margin: 0 0 0.4rem 0;
      letter-spacing: 0.01em;
    }
    .sources-page__subtitle {
      font-size: 0.98rem;
      color: #6b6357;
    }
    .sources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .source-card {
      background: #fdfbf5;
      border: 1px solid #e6dfca;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
      position: relative;
    }
    .source-card:hover {
      border-color: #c9a45c;
      box-shadow: 0 6px 18px rgba(28, 37, 65, 0.08);
      transform: translateY(-2px);
    }
    .source-card__badge {
      align-self: flex-start;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      background: rgba(59, 91, 219, 0.1);
      color: #3b5bdb;
      text-transform: uppercase;
    }
    .source-card__name {
      font-family: 'DM Serif Display', serif;
      font-size: 1.25rem;
      color: #1c2541;
      margin: 0;
    }
    .source-card__subtitle {
      font-size: 0.82rem;
      color: #8a8273;
      line-height: 1.35;
    }
    .source-card__description {
      font-size: 0.9rem;
      color: #4a463d;
      line-height: 1.45;
      flex-grow: 1;
    }
    .source-card__link {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #2f7a52;
      text-decoration: none;
      margin-top: 0.3rem;
    }
    .source-card__link:hover {
      text-decoration: underline;
    }
    .sources-search {
      width: 100%;
      max-width: 420px;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      border: 1px solid #e6dfca;
      background: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.92rem;
      margin-bottom: 1.5rem;
    }
    .sources-search:focus {
      outline: none;
      border-color: #c9a45c;
    }
    .sources-empty {
      color: #8a8273;
      font-style: italic;
      padding: 2rem 0;
    }
  `;
  document.head.appendChild(style);
}

function badgeColor(category) {
  return CATEGORY_COLORS[category] || "#3b5bdb";
}

function cardTemplate(source) {
  const color = badgeColor(source.category);
  return `
    <div class="source-card" style="border-top: 3px solid ${color}">
      <span class="source-card__badge" style="background:${color}1a; color:${color}">
        ${source.category}
      </span>
      <h3 class="source-card__name">${source.name}</h3>
      <div class="source-card__subtitle">${source.subtitle}</div>
      <p class="source-card__description">${source.description}</p>
      <a class="source-card__link" href="${source.url}" target="_blank" rel="noopener noreferrer">
        Voir le site ↗
      </a>
    </div>
  `;
}

function renderGrid(grid, list) {
  grid.innerHTML = list.length
    ? list.map(cardTemplate).join("")
    : `<div class="sources-empty">Aucune source ne correspond à votre recherche.</div>`;
}

function renderSourcesPage(container) {
  if (!container) return;
  injectStylesOnce();

  container.innerHTML = `
    <div class="sources-page">
      <div class="sources-page__header">
        <h1 class="sources-page__title">Sources & Références</h1>
        <p class="sources-page__subtitle">
          Bases officielles et ressources professionnelles utilisées pour la vérification clinique.
        </p>
      </div>
      <input
        type="text"
        class="sources-search"
        placeholder="Rechercher une source (ANSM, HAS, Vidal...)"
      />
      <div class="sources-grid"></div>
    </div>
  `;

  const grid = container.querySelector(".sources-grid");
  const search = container.querySelector(".sources-search");

  renderGrid(grid, SOURCES);

  search.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = SOURCES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
    renderGrid(grid, filtered);
  });
}

// Appelée depuis la nav : onclick="showPage('sources',this);loadSourcesPage()"
function loadSourcesPage() {
  const container = document.getElementById("page-sources");
  renderSourcesPage(container);
}

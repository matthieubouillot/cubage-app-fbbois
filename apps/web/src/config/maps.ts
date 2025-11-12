// Configuration des cartes - Géoplateforme IGN (GRATUIT, SANS CLÉ)
// Documentation : https://geoservices.ign.fr/documentation/services/api-et-services-ogc/tuiles-vectorielles-tmswmts

export const MAP_LAYERS = {
  // Plan IGN Standard - GRATUIT SANS CLÉ via Géoplateforme
  IGN_PLAN: {
    url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    attribution: '&copy; <a href="https://www.ign.fr/">IGN-F/Géoportail</a>',
    maxZoom: 19,
  },

  // Cartes IGN (topographique) - GRATUIT SANS CLÉ
  IGN_MAPS: {
    url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    attribution: '&copy; <a href="https://www.ign.fr/">IGN-F/Géoportail</a>',
    maxZoom: 18,
  },

  // OpenStreetMap (fallback de secours)
  OSM: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
};

// Couche par défaut : Plan IGN (meilleur pour la France)
export const DEFAULT_MAP_LAYER = MAP_LAYERS.IGN_PLAN;

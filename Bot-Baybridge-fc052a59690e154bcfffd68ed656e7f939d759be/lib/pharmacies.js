/**
 * Dataset fictif de pharmacies partenaires BayBridge
 * Utilisé pour le scoring de recommandations alternatives
 */
const pharmacies = [
  {
    id: "PH001",
    name: "Pharmacie du Louvre",
    address: "10 Rue de Rivoli, Paris 75001",
    city: "Paris 1er",
    lat: 48.8606,
    lng: 2.3464,
    distanceKm: 1.2,
    demandScore: 88,
    interactionCount: 13,
    disponibilite: true,
    creneauxDisponibles: ["Mardi 14h", "Jeudi 10h", "Vendredi 15h"],
    contact: "01 42 60 11 22",
    responsable: "Dr. Martin Lefebvre",
    derniereVisite: "2025-01-10",
    notes: "Client fidèle, commande régulière antalgiques et OTC.",
  },
  {
    id: "PH002",
    name: "Pharmacie des Grands Boulevards",
    address: "32 Boulevard Bonne Nouvelle, Paris 75002",
    city: "Paris 2ème",
    lat: 48.8698,
    lng: 2.3512,
    distanceKm: 1.8,
    demandScore: 75,
    interactionCount: 8,
    disponibilite: true,
    creneauxDisponibles: ["Lundi 9h", "Mercredi 11h"],
    contact: "01 42 33 33 44",
    responsable: "Dr. Sophie Renard",
    derniereVisite: "2025-01-15",
    notes: "Intérêt fort pour la nouvelle gamme vitamines et immunité.",
  },
  {
    id: "PH003",
    name: "Pharmacie du Marais",
    address: "18 Rue des Francs-Bourgeois, Paris 75003",
    city: "Paris 3ème",
    lat: 48.8580,
    lng: 2.3570,
    distanceKm: 2.1,
    demandScore: 82,
    interactionCount: 14,
    disponibilite: false,
    creneauxDisponibles: [],
    contact: "01 42 72 55 66",
    responsable: "Dr. Ahmed Bensalem",
    derniereVisite: "2025-02-20",
    notes: "Très forte rotation produits anti-douleur. Calendrier chargé.",
  },
  {
    id: "PH004",
    name: "Pharmacie Saint-Antoine",
    address: "50 Rue du Faubourg Saint-Antoine, Paris 75012",
    city: "Paris 12ème",
    lat: 48.8527,
    lng: 2.3720,
    distanceKm: 3.4,
    demandScore: 65,
    interactionCount: 6,
    disponibilite: true,
    creneauxDisponibles: ["Jeudi 14h", "Vendredi 9h"],
    contact: "01 43 45 77 88",
    responsable: "Dr. Claire Dupont",
    derniereVisite: "2025-01-05",
    notes: "Clientèle familiale, fort potentiel pédiatrie et dermatologie.",
  },
  {
    id: "PH005",
    name: "Pharmacie de la Bastille",
    address: "5 Place de la Bastille, Paris 75011",
    city: "Paris 11ème",
    lat: 48.8533,
    lng: 2.3692,
    distanceKm: 2.9,
    demandScore: 72,
    interactionCount: 10,
    disponibilite: true,
    creneauxDisponibles: ["Mardi 10h", "Mercredi 16h", "Vendredi 11h"],
    contact: "01 43 57 99 10",
    responsable: "Dr. Paul Moreau",
    derniereVisite: "2025-03-01",
    notes: "Zone animée, bon volume vente parapharmacie et compléments.",
  },
  {
    id: "PH006",
    name: "Pharmacie de Neuilly-sur-Seine",
    address: "25 Avenue Charles de Gaulle, Neuilly-sur-Seine 92200",
    city: "Neuilly-sur-Seine",
    lat: 48.8847,
    lng: 2.2672,
    distanceKm: 4.5,
    demandScore: 85,
    interactionCount: 12,
    disponibilite: true,
    creneauxDisponibles: ["Lundi 11h", "Mardi 15h", "Jeudi 9h"],
    contact: "01 46 24 22 33",
    responsable: "Dr. Isabelle Garnier",
    derniereVisite: "2025-02-10",
    notes: "Clientèle aisée, fort intérêt compléments alimentaires premium et cosméceutiques.",
  },
  {
    id: "PH007",
    name: "Pharmacie de Boulogne-Billancourt",
    address: "12 Rue de la Paix, Boulogne-Billancourt 92100",
    city: "Boulogne-Billancourt",
    lat: 48.8354,
    lng: 2.2410,
    distanceKm: 5.8,
    demandScore: 60,
    interactionCount: 5,
    disponibilite: true,
    creneauxDisponibles: ["Mercredi 10h", "Vendredi 14h"],
    contact: "01 46 05 44 55",
    responsable: "Dr. Thomas Blanc",
    derniereVisite: "2025-01-20",
    notes: "Proche cliniques, bon potentiel médicaments OTC et prescription.",
  },
  {
    id: "PH008",
    name: "Pharmacie de la République",
    address: "8 Place de la République, Paris 75010",
    city: "Paris 10ème",
    lat: 48.8672,
    lng: 2.3636,
    distanceKm: 2.4,
    demandScore: 90,
    interactionCount: 15,
    disponibilite: true,
    creneauxDisponibles: ["Lundi 14h", "Mardi 9h", "Jeudi 16h", "Vendredi 10h"],
    contact: "01 42 41 66 77",
    responsable: "Dr. Nathalie Vidal",
    derniereVisite: "2025-03-15",
    notes: "Grand trafic piéton, excellente exposition produits, clientèle mixte.",
  },
];

/**
 * Calcule un score pondéré pour chaque pharmacie selon 4 critères :
 * - Proximité (distance km réelle) : 30%
 * - Demande locale                 : 20%
 * - Historique interactions        : 15%
 * - Disponibilité                  : 35%
 */

// Scoring weights (must sum to 1.0)
const WEIGHT_PROXIMITY = 0.3;
const WEIGHT_DEMAND = 0.2;
const WEIGHT_HISTORY = 0.15;
const WEIGHT_AVAILABILITY = 0.35;

// Interactions are capped at 100 points; 15 visits ≈ 100 pts → factor ≈ 6.67
const MAX_INTERACTION_SCORE = 100;
const INTERACTION_SCORE_FACTOR = 6.67;

// Availability score: full points if available, partial if not
const AVAILABILITY_SCORE_FULL = 100;
const AVAILABILITY_SCORE_PARTIAL = 30;

function scorePharmacies(options = {}) {
  const { excludeId = null, limit = 3 } = options;

  const candidates = pharmacies.filter((p) => p.id !== excludeId);

  // Normalise distance: closest pharmacy scores 100, farthest scores 0
  const maxDistance = Math.max(...candidates.map((p) => p.distanceKm));

  const scored = candidates
    .map((p) => {
      const proximityScore = maxDistance > 0
        ? Math.max(0, 100 * (1 - p.distanceKm / maxDistance))
        : 100;

      const score =
        proximityScore * WEIGHT_PROXIMITY +
        p.demandScore * WEIGHT_DEMAND +
        Math.min(p.interactionCount * INTERACTION_SCORE_FACTOR, MAX_INTERACTION_SCORE) * WEIGHT_HISTORY +
        (p.disponibilite ? AVAILABILITY_SCORE_FULL : AVAILABILITY_SCORE_PARTIAL) * WEIGHT_AVAILABILITY;

      return { ...p, score: Math.round(score) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

module.exports = { pharmacies, scorePharmacies };

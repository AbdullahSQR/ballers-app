// Haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
          + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Ghubrah South, Muscat
const PLAYER_LAT = 23.598;
const PLAYER_LON = 58.518;

const stadiums = [
  { name: 'Al Arouba Sports Complex', lat: 23.5880, lon: 58.3829 },
  { name: 'Qurum FC Arena',           lat: 23.5966, lon: 58.3951 },
  { name: 'Bowsher Football Park',    lat: 23.6101, lon: 58.5512 },
];

const MAX_DISTANCE_KM = 50;

console.log('\nDistances from Ghubrah South (23.598, 58.518):\n');
const scored = stadiums.map(s => {
  const km       = haversineKm(PLAYER_LAT, PLAYER_LON, s.lat, s.lon);
  const distScore = Math.min(km / MAX_DISTANCE_KM, 1);
  return { ...s, km: km.toFixed(2), distScore: distScore.toFixed(3) };
}).sort((a, b) => a.km - b.km);

scored.forEach(s =>
  console.log(`  ${s.name.padEnd(28)} ${s.km} km  →  dist score ${s.distScore}`)
);

console.log('\nConclusion: matchmaking picks the stadium with the LOWEST combined score.');
console.log('The 0.4 × distScore weight means Bowsher has a ~' +
  ((parseFloat(scored[1].distScore) - parseFloat(scored[0].distScore)) * 0.4).toFixed(3) +
  ' head start over 2nd place.\n');

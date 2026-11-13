/* DATAsaster content file.
   This file holds the things groupmates most often edit: news outlets and agencies,
   forecast cities, sample incidents, sample headlines and emergency contacts.
   Keep the quotes, commas and brackets exactly as they are, save, then reload the page. */

var SRC = {
  pagasa: { name: 'PAGASA', kind: 'official' }, phivolcs: { name: 'PHIVOLCS', kind: 'official' },
  ndrrmc: { name: 'NDRRMC', kind: 'official' }, bfp: { name: 'BFP', kind: 'official' }, usgs: { name: 'USGS', kind: 'official' }, emsc: { name: 'EMSC', kind: 'official' },
  abs: { name: 'ABS-CBN News', kind: 'news', site: 'abs-cbn.com', url: 'https://www.abs-cbn.com/news' },
  gma: { name: 'GMA News', kind: 'news', site: 'gmanetwork.com', url: 'https://www.gmanetwork.com/news/' },
  rappler: { name: 'Rappler', kind: 'news', site: 'rappler.com', url: 'https://www.rappler.com/' },
  inquirer: { name: 'Inquirer', kind: 'news', site: 'inquirer.net', url: 'https://www.inquirer.net/' },
  philstar: { name: 'Philstar', kind: 'news', site: 'philstar.com', url: 'https://www.philstar.com/' },
  mb: { name: 'Manila Bulletin', kind: 'news', site: 'mb.com.ph', url: 'https://mb.com.ph/category/philippines' }
};

var NEWS_KEYS = ['abs', 'gma', 'rappler', 'inquirer', 'philstar', 'mb'];

var SRC_KEYS = ['pagasa', 'phivolcs', 'ndrrmc', 'bfp', 'usgs', 'emsc'].concat(NEWS_KEYS);

var LAYERS = [
  ['radar', 'Rain radar', 'RainViewer'],
  ['cloud', 'Cloud cover (infrared)', 'RainViewer'],
  ['rain', 'Rainfall forecast, next 24 h', 'Open-Meteo model'],
  ['river', 'River flood outlook', 'Open-Meteo GloFAS model'],
  ['fire', 'Fire hotspots', 'NASA EONET'],
  ['storm', 'Storms and typhoons', 'NASA EONET']
];

var POINTS = [['Laoag', 18.20, 120.59], ['Tuguegarao', 17.61, 121.73], ['Baguio', 16.41, 120.59], ['Dagupan', 16.04, 120.33], ['Baler', 15.76, 121.56], ['Tarlac', 15.48, 120.60], ['Manila', 14.60, 120.98], ['Batangas', 13.76, 121.06], ['Calapan', 13.41, 121.18], ['Naga', 13.62, 123.19], ['Legazpi', 13.14, 123.74], ['Virac', 13.58, 124.23], ['Catarman', 12.50, 124.64], ['Puerto Princesa', 9.74, 118.74], ['Roxas', 11.58, 122.75], ['Iloilo', 10.72, 122.56], ['Bacolod', 10.68, 122.95], ['Cebu', 10.32, 123.89], ['Tacloban', 11.24, 125.00], ['Surigao', 9.79, 125.50], ['Butuan', 8.95, 125.54], ['Cagayan de Oro', 8.48, 124.65], ['Zamboanga', 6.91, 122.08], ['Davao', 7.07, 125.61], ['General Santos', 6.11, 125.17]];

/* ---------- sample records (edit freely) ----------
   h = hours before the page opens. trust: official, verified, news or unverified. sev: 0 Low to 3 Critical. */
var SEED = [
  { type: 'flood', sev: 2, trust: 'official', src: 'pagasa', srcLabel: 'PAGASA bulletin', h: 12, title: 'Rainfall warning for Metro Manila and Rizal', desc: 'Sustained heavy rain expected. Residents of low-lying areas should prepare for flooding.', place: 'Marikina River basin, Marikina', lat: 14.6507, lng: 121.1029, obsTitle: 'Bulletin details', obs: [['Warning level', 'Orange'], ['Expected rainfall', '50 to 100 mm in 3 hours'], ['Valid for', 'Next 3 hours'], ['Affected areas', 'Marikina, Quezon City, Rizal']] },
  { type: 'flood', sev: 2, trust: 'unverified', h: 18, title: 'Waist-deep flood on the national highway in Dagupan', desc: 'Tricycles and jeepneys cannot pass. Commuters are waiting on higher ground.', place: 'Barangay Tapuac, Dagupan', lat: 16.0433, lng: 120.3333, obsTitle: 'Observations', obs: [['Water depth', '95 cm'], ['Flooded for', '3 hours'], ['Road', 'Not passable'], ['Water', 'Rising slowly']] },
  { type: 'flood', sev: 1, trust: 'news', src: 'gma', srcLabel: 'GMA News', h: 10, title: 'Class suspensions as floods hit Cagayan de Oro villages', desc: 'Local officials suspended classes in barangays with knee-level water.', place: 'Barangay Kauswagan, Cagayan de Oro', lat: 8.4985, lng: 124.629, obsTitle: 'News report', obs: [['Flood depth', 'Knee-level in low streets'], ['Local action', 'Class suspension for 2 days']] },
  { type: 'flood', sev: 3, trust: 'verified', h: 6, title: 'Chest-deep water cuts off Tacloban downtown market', desc: 'Rescue boats are moving residents out. A barangay responder confirmed the level.', place: 'Downtown Tacloban', lat: 11.244, lng: 125.003, obsTitle: 'Observations', obs: [['Water depth', '1.3 m'], ['Flooded for', '6 hours'], ['Road', 'Not passable'], ['Water', 'Rising fast'], ['Evacuation', 'Ongoing']] },
  { type: 'flood', sev: 1, trust: 'unverified', h: 20, title: 'Knee-deep flooding on J.P. Rizal Street', desc: 'Motorcycles and small cars are turning back.', place: 'J.P. Rizal St., Makati', lat: 14.5649, lng: 121.0236, obsTitle: 'Observations', obs: [['Water depth', '45 cm'], ['Flooded for', '2 hours'], ['Road', 'Passable to high vehicles only'], ['Water', 'Steady']] },
  { type: 'flood', sev: 0, trust: 'unverified', h: 30, resolved: true, resH: 22, resNote: 'Water receded and side streets reopened.', title: 'Ankle-level water on side streets in Iloilo City', desc: 'Main roads remain open.', place: 'Jaro District, Iloilo City', lat: 10.7202, lng: 122.5621, obsTitle: 'Observations', obs: [['Water depth', '15 cm'], ['Flooded for', '1 hour'], ['Road', 'Passable to all vehicles'], ['Water', 'Receding']] },
  { type: 'flood', sev: 1, trust: 'official', src: 'ndrrmc', srcLabel: 'NDRRMC report', h: 26, title: 'River levels rising in Camarines Sur, monitoring advised', desc: 'Local disaster offices are on monitoring status near Naga City.', place: 'Naga City, Camarines Sur', lat: 13.6218, lng: 123.1948, obsTitle: 'Report details', obs: [['Status', 'Monitoring'], ['River level', 'Above normal'], ['Advice', 'Prepare go-bags in low-lying households']] },
  { type: 'flood', sev: 2, trust: 'unverified', h: 310, resolved: true, resH: 260, resNote: 'Water fully receded. Roads reopened.', title: 'Flooded rice fields and roads in Candaba after overnight rain', desc: 'Water stayed for two days before receding.', place: 'Candaba, Pampanga', lat: 15.0919, lng: 120.8269, obsTitle: 'Observations', obs: [['Water depth', '80 cm'], ['Flooded for', '40 hours'], ['Road', 'Passable to high vehicles only']] },
  { type: 'fire', sev: 3, trust: 'news', src: 'inquirer', srcLabel: 'Inquirer', h: 8, title: 'Fire spreads through a dense residential block in Tondo', desc: 'Firefighters are containing the blaze and families are moving to a nearby school.', place: 'Tondo, Manila', lat: 14.6196, lng: 120.9678, obsTitle: 'News report', obs: [['Alarm level', 'Task Force Bravo'], ['Families displaced', 'About 120'], ['Evacuation', 'Ongoing']] },
  { type: 'fire', sev: 0, trust: 'official', src: 'bfp', srcLabel: 'BFP bulletin', h: 40, resolved: true, resH: 38, resNote: 'Fire out. Warehouse inspected and cleared.', title: 'Warehouse fire contained in Davao City', desc: 'A small warehouse fire was brought under control. No injuries.', place: 'Bajada, Davao City', lat: 7.0731, lng: 125.6128, obsTitle: 'Bulletin details', obs: [['Status', 'Under control'], ['Duration', 'About 30 minutes'], ['Injuries', 'None reported']] },
  { type: 'fire', sev: 1, trust: 'unverified', h: 15, title: 'Fire moving along market stalls in Cebu City', desc: 'Flames are moving along wooden stalls. Smoke is visible from several streets away.', place: 'Carbon Market, Cebu City', lat: 10.2926, lng: 123.902, obsTitle: 'Observations', obs: [['Burning for', '1.5 hours'], ['Structures affected', 'About 6 stalls']] },
  { type: 'fire', sev: 2, trust: 'verified', h: 3, title: 'Large fire in a residential block in Quezon City', desc: 'A barangay official confirmed the location and that responders are on site.', place: 'Barangay Bahay Toro, Quezon City', lat: 14.676, lng: 121.0437, obsTitle: 'Observations', obs: [['Burning for', '3 hours'], ['Structures affected', 'About 15 houses'], ['Evacuation', 'Needed']] },
  { type: 'fire', sev: 2, trust: 'news', src: 'philstar', srcLabel: 'Philstar', h: 520, resolved: true, resH: 500, resNote: 'Fire out. Families moved to relief shelters.', title: 'Fire destroys houses near the Navotas fish port', desc: 'Dozens of families lost their homes.', place: 'Navotas', lat: 14.6667, lng: 120.9417, obsTitle: 'News report', obs: [['Houses destroyed', 'About 40'], ['Duration', '5 hours']] },
  { type: 'quake', sev: 1, trust: 'official', src: 'phivolcs', srcLabel: 'PHIVOLCS bulletin', h: 14, title: 'Magnitude 5.4 earthquake off Surigao del Norte', desc: 'Strong shaking was felt in nearby towns. Small cracks on a school wall.', place: 'Off Surigao del Norte', lat: 9.757, lng: 125.514, obsTitle: 'Official parameters', obs: [['Magnitude', '5.4'], ['Depth', '18 km'], ['Origin', 'Tectonic'], ['Reported intensity', 'Intensity V, Surigao City']] },
  { type: 'quake', sev: 0, trust: 'unverified', h: 27, title: 'Brief tremor felt in Lipa City', desc: 'Hanging lamps swayed for a few seconds. No damage seen.', place: 'Lipa City, Batangas', lat: 13.7565, lng: 121.0583, obsTitle: 'Observed effects', obs: [['Effects', 'Felt shaking'], ['Damage', 'None']] },
  { type: 'quake', sev: 2, trust: 'verified', h: 33, title: 'Shaking damages houses and blocks a road in Davao Occidental', desc: 'A landslide blocked the road after strong shaking. A municipal responder confirmed.', place: 'Jose Abad Santos, Davao Occidental', lat: 6.3, lng: 125.6, obsTitle: 'Observed effects', obs: [['Effects', 'Damaged buildings, landslide'], ['Road', 'Blocked'], ['Evacuation', 'Needed']] },
  { type: 'quake', sev: 1, trust: 'official', src: 'phivolcs', srcLabel: 'PHIVOLCS bulletin', h: 760, title: 'Magnitude 5.1 earthquake recorded off Davao Oriental', desc: 'Felt in several towns. No damage reported.', place: 'Off Davao Oriental', lat: 7.1, lng: 126.6, obsTitle: 'Official parameters', obs: [['Magnitude', '5.1'], ['Depth', '32 km'], ['Origin', 'Tectonic']] },
  { type: 'volcano', sev: 1, trust: 'official', src: 'phivolcs', srcLabel: 'PHIVOLCS bulletin', h: 9, title: 'Steam plume observed at Taal Volcano main crater', desc: 'White steam and weak tremor recorded. Entry to the island stays discouraged.', place: 'Taal Volcano Island, Batangas', lat: 14.002, lng: 120.993, obsTitle: 'Bulletin details', obs: [['Alert level', 'Level 1, abnormal'], ['Plume', 'White steam, 300 m'], ['Advisory', 'No entry to the island']] },
  { type: 'volcano', sev: 2, trust: 'verified', h: 16, title: 'Rockfall and night glow on the Mayon slopes', desc: 'Residents saw glowing rocks and heard rumbling. A local official confirmed families are leaving the danger zone.', place: 'Mayon Volcano, Albay', lat: 13.257, lng: 123.686, obsTitle: 'Observations', obs: [['Ashfall', 'Light'], ['Observed', 'Rumbling, lava glow'], ['Evacuation', 'Ongoing']] },
  { type: 'volcano', sev: 1, trust: 'unverified', h: 35, title: 'Light ashfall covers roofs in Negros Occidental', desc: 'Fine grey ash is covering roofs and crops near the volcano.', place: 'La Castellana, Negros Occidental', lat: 10.412, lng: 123.132, obsTitle: 'Observations', obs: [['Ashfall', 'Light'], ['Observed', 'Roads and crops covered in ash']] },
  { type: 'volcano', sev: 1, trust: 'official', src: 'phivolcs', srcLabel: 'PHIVOLCS bulletin', h: 900, resolved: true, resH: 880, resNote: 'Activity returned to baseline.', title: 'Bulusan Volcano records a short steam-driven explosion', desc: 'A brief explosion produced a grey plume. Alert Level 1 remained in effect.', place: 'Bulusan, Sorsogon', lat: 12.77, lng: 124.05, obsTitle: 'Bulletin details', obs: [['Alert level', 'Level 1, abnormal'], ['Plume', 'Grey, 1,000 m']] }
];

var SAMPLE_HEADLINES = [
  ['abs', 'Heavy rain prompts flood advisories in parts of Luzon', 3], ['gma', 'Evacuation centers open as rainfall continues', 5],
  ['rappler', 'What to pack in an emergency go-bag', 7], ['inquirer', 'Local governments review flood-control plans', 9],
  ['philstar', 'Tremors felt in several provinces, no major damage', 11], ['mb', 'Disaster offices on monitoring status as rivers rise', 13]
];

var CONTACTS = [
  ['National Emergency Hotline', [['911', '911']], 'Police, fire and medical emergencies nationwide.', true],
  ['Philippine Red Cross', [['143', '143'], ['(02) 8790-2300', '0287902300']], 'Ambulance, first aid and rescue.'],
  ['Philippine National Police', [['117', '117']], 'Police assistance and incident reports.'],
  ['Bureau of Fire Protection', [['(02) 8426-0219', '0284260219'], ['(02) 8426-0246', '0284260246']], 'Fire reports. Call 911 first for a fire in progress.'],
  ['NDRRMC Operations Center', [['(02) 8911-1406', '0289111406']], 'Disaster situation reports and coordination.'],
  ['PAGASA', [['(02) 8284-0800', '0282840800']], 'Weather, rainfall and tropical cyclone bulletins.'],
  ['PHIVOLCS', [['(02) 8426-1468', '0284261468']], 'Earthquake information and volcano alert levels.'],
  ['MMDA', [['136', '136']], 'Metro Manila traffic and flooding advisories.'],
  ['Philippine Coast Guard', [['(02) 8527-8481', '0285278481']], 'Sea rescue and maritime emergencies.']
];

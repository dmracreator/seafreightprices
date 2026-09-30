/*!
 * SeaFreightPrices.com — data layer
 * ---------------------------------------------------------------
 * Sample market data for demonstration. Every series is generated
 * deterministically from a fixed seed, so the site renders the
 * same numbers on every load and in every environment.
 *
 * Replace the arrays below (or the whole module) with live feeds
 * from the SeaFreightPrices API. The shape each consumer expects
 * is documented in README.md.
 */
window.SFP=(function(){
"use strict";

/* ============================================================
   Deterministic pseudo-random series generator
   ============================================================ */
function seeded(seed){var s=seed>>>0;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function makeSeries(base,seed,n,vol,drift){
  var r=seeded(seed),out=[],v=base*(1+(r()-0.5)*0.25);
  for(var i=0;i<n;i++){
    var shock=(r()-0.5)*2*vol;
    var season=Math.sin((i/n)*Math.PI*2+seed%7)*vol*0.55;
    v=v*(1+shock+season+drift);
    out.push(Math.max(base*0.35,v));
  }
  // pin the last point near base so the headline number matches
  var adj=base/out[out.length-1];
  return out.map(function(x,i){var w=i/(n-1);return x*(1+(adj-1)*w*w);});
}

/* ============================================================
   Data
   ============================================================ */
var CORRIDORS=['Asia – North Europe','Asia – Mediterranean','Transpacific East','Transatlantic West','Europe – West Africa','Europe – South America','Asia – Middle East','Intra-Asia','Europe – East Africa','Asia – South America'];

var RAW=[
 ['Shanghai','CNSHA','Rotterdam','NLRTM',0,2480,32,41],
 ['Ningbo','CNNGB','Rotterdam','NLRTM',0,2415,33,36],
 ['Shanghai','CNSHA','Hamburg','DEHAM',0,2560,34,33],
 ['Qingdao','CNTAO','Antwerp','BEANR',0,2495,35,29],
 ['Shenzhen','CNSZX','Felixstowe','GBFXT',0,2620,31,24],
 ['Shanghai','CNSHA','Genoa','ITGOA',1,2190,27,31],
 ['Ningbo','CNNGB','Valencia','ESVLC',1,2085,28,26],
 ['Port Klang','MYPKG','Piraeus','GRPIR',1,1980,24,19],
 ['Shanghai','CNSHA','Los Angeles','USLAX',2,2760,18,44],
 ['Ningbo','CNNGB','Long Beach','USLGB',2,2705,19,38],
 ['Yantian','CNYTN','New York','USNYC',2,3980,29,27],
 ['Busan','KRPUS','Seattle','USSEA',2,2540,16,21],
 ['Rotterdam','NLRTM','New York','USNYC',3,1690,14,34],
 ['Antwerp','BEANR','Houston','USHOU',3,1845,17,28],
 ['Hamburg','DEHAM','Montreal','CAMTR',3,1720,15,22],
 ['Rotterdam','NLRTM','Lagos','NGLOS',4,2340,21,26],
 ['Antwerp','BEANR','Tema','GHTEM',4,2260,20,23],
 ['Le Havre','FRLEH','Abidjan','CIABJ',4,2185,18,17],
 ['Rotterdam','NLRTM','Santos','BRSSZ',5,2050,22,29],
 ['Antwerp','BEANR','Buenos Aires','ARBUE',5,2310,26,20],
 ['Hamburg','DEHAM','Callao','PECLL',5,2680,30,16],
 ['Shanghai','CNSHA','Jebel Ali','AEJEA',6,1240,19,25],
 ['Ningbo','CNNGB','Dammam','SADMM',6,1385,22,18],
 ['Shanghai','CNSHA','Singapore','SGSIN',7,620,7,32],
 ['Busan','KRPUS','Ho Chi Minh','VNSGN',7,540,8,24],
 ['Rotterdam','NLRTM','Mombasa','KEMBA',8,2470,24,21],
 ['Antwerp','BEANR','Durban','ZADUR',8,2395,25,19],
 ['Shanghai','CNSHA','Santos','BRSSZ',9,3120,38,23],
 ['Ningbo','CNNGB','Valparaiso','CLVAP',9,3260,35,15]
];

var LANES=RAW.map(function(x,i){
  var series=makeSeries(x[5],(i+3)*977,52,0.045,-0.0016);
  var last=series[51],prev=series[50],m4=series[47];
  return {
    id:x[1]+'-'+x[3],o:x[0],oc:x[1],d:x[2],dc:x[3],
    corridor:CORRIDORS[x[4]],rate:Math.round(last),transit:x[6],contrib:x[7],
    wk:((last/prev)-1)*100, mo:((last/m4)-1)*100, series:series
  };
});

var INDICES=[
 ['SFP Global Composite',2148,-2.7],
 ['Asia – N. Europe',2480,-3.2],
 ['Asia – Mediterranean',2190,-1.4],
 ['Transpacific East',2760,0.2],
 ['Transatlantic West',1690,1.8],
 ['Europe – W. Africa',2340,-0.6],
 ['Europe – S. America',2050,-1.1],
 ['Asia – Middle East',1240,2.4],
 ['Intra-Asia',620,-0.3],
 ['Europe – E. Africa',2470,0.9],
 ['Brent crude',68.40,-1.2],
 ['VLSFO Rotterdam',498,-0.8]
];

var PORTS=[
 ['Rotterdam','NL','Europe',1.6,78,-0.4],
 ['Antwerp-Bruges','BE','Europe',1.9,82,-0.3],
 ['Hamburg','DE','Europe',2.3,85,0.2],
 ['Le Havre','FR','Europe',1.1,71,-0.2],
 ['Felixstowe','GB','Europe',2.7,88,0.5],
 ['Piraeus','GR','Europe',1.4,74,-0.1],
 ['Valencia','ES','Europe',1.8,79,0.1],
 ['Gdansk','PL','Europe',0.9,66,-0.3],
 ['Shanghai','CN','Asia',2.1,86,0.4],
 ['Ningbo-Zhoushan','CN','Asia',2.4,89,0.6],
 ['Shenzhen','CN','Asia',1.7,81,-0.2],
 ['Qingdao','CN','Asia',1.3,75,-0.4],
 ['Busan','KR','Asia',1.0,69,-0.1],
 ['Singapore','SG','Asia',1.5,84,0.3],
 ['Port Klang','MY','Asia',1.2,72,-0.2],
 ['Ho Chi Minh','VN','Asia',2.0,80,0.3],
 ['Los Angeles','US','North America',3.4,91,0.8],
 ['Long Beach','US','North America',3.1,90,0.7],
 ['New York','US','North America',1.9,77,-0.2],
 ['Savannah','US','North America',2.6,84,0.4],
 ['Houston','US','North America',2.2,79,0.1],
 ['Vancouver','CA','North America',1.4,70,-0.5],
 ['Jebel Ali','AE','Middle East',1.1,68,-0.2],
 ['Dammam','SA','Middle East',1.6,74,0.2],
 ['Santos','BR','South America',3.8,92,1.1],
 ['Buenos Aires','AR','South America',2.5,83,0.4],
 ['Callao','PE','South America',2.9,86,0.5],
 ['Valparaiso','CL','South America',1.8,76,-0.1],
 ['Durban','ZA','Africa',4.2,94,0.9],
 ['Mombasa','KE','Africa',3.3,88,-0.6],
 ['Lagos','NG','Africa',5.1,96,1.4],
 ['Tema','GH','Africa',2.8,85,0.2],
 ['Sydney','AU','Oceania',1.3,73,-0.3],
 ['Melbourne','AU','Oceania',1.7,78,0.1]
];

var ARCHIVE=[
 ['22 Sep 2026','Transpacific jumps on the rush to clear cargo before Golden Week','Issue 38'],
 ['15 Sep 2026','Composite holds a second week as Asia\u2013Europe keeps slipping','Issue 37'],
 ['08 Sep 2026','Flat index, split market: transpacific up, Asia\u2013Europe down','Issue 36'],
 ['01 Sep 2026','September GRI holds on both US coasts as typhoon congestion bites','Issue 35'],
 ['25 Aug 2026','Asia\u2013Europe softens into September as capacity returns','Issue 34'],
 ['18 Aug 2026','Capacity returns to North Europe as blank sailings unwind','Issue 33'],
 ['11 Aug 2026','Transpacific holds the line ahead of contract talks','Issue 32'],
 ['04 Aug 2026','Durban backlog spills into the Indian Ocean rotation','Issue 31']
];

var DRIVERS=[
 ['Capacity deployment','Newbuild deliveries continue through Q4 and blank sailings are unwinding faster than in previous cycles. Net effective capacity on Asia–Europe is up an estimated 6% quarter on quarter.','Bearish','strong'],
 ['Demand and restocking','European import volumes are running slightly ahead of last year but below the pre-peak forecast. Retail restocking finished early, removing the usual September support.','Bearish','moderate'],
 ['Fuel and carbon cost','VLSFO has drifted lower and carbon compliance costs are stable quarter on quarter, taking pressure off the floor rather than adding to it.','Bearish','light'],
 ['Routing and disruption risk','Cape of Good Hope routing remains the base case on Asia–Europe. Any normalisation would release effective capacity quickly and push rates down further; renewed disruption would do the opposite.','Two-sided','strong']
];

var GLOSSARY=[
 ['Spot benchmark','The trimmed mean of validated port-to-port rate submissions for cargo booked within the next two weeks, all-in, excluding local charges at origin and destination unless explicitly stated.'],
 ['Contract benchmark','The equivalent trimmed mean for cargo moving under a fixed-term agreement of three months or longer, weighted by reported volume where volume is disclosed.'],
 ['All-in','Base ocean freight plus bunker, carbon, currency and peak-season surcharges applicable on the publication date. Terminal handling and inland costs are excluded.'],
 ['Percentile position','Where today’s benchmark sits within the distribution of the previous 52 weekly observations. The 0th percentile is the 12-month low; the 100th is the high.'],
 ['Volatility','Annualised standard deviation of weekly logarithmic returns over the trailing 52 weeks, expressed as a percentage.'],
 ['Contributor count','The number of independent organisations whose submissions entered the validated sample for that lane in the current week.'],
 ['Indicative lane','A lane published with fewer than eight independent contributors. Directionally useful, but not suitable as a contractual reference.'],
 ['Berth waiting time','Rolling seven-day median hours between arrival at the designated anchorage and first line ashore, converted to days.']
];


/* ------------------------------------------------------------
   Editorial index. Each entry maps to a real, crawlable page at
   /insights/<slug>/ — never a hash route — so search engines and
   readers land on the article itself.
   ------------------------------------------------------------ */
var ARTICLES=[
 {slug:'transpacific-asia-europe-rate-divergence-september-2026',
  title:'Flat index, split market: transpacific climbs as Asia–Europe slides',
  cat:'Market news', date:'2026-09-08', shown:'8 September 2026', mins:6,
  dek:'Drewry\'s composite index did not move last week. Underneath it, transpacific rates set fresh highs while Shanghai–Genoa fell 10% — the clearest case this year for reading corridors rather than composites.'},

 {slug:'panama-canal-transit-slots-cut-september-2026',
  title:'Panama Canal cuts daily transit slots as watershed rainfall disappoints',
  cat:'Market news', date:'2026-09-05', shown:'5 September 2026', mins:6,
  dek:'The Authority has switched from limiting how deep ships load to limiting how many transit at all. For Asia–US East Coast services routed through the canal, that is the more consequential lever.'},

 {slug:'seventeen-gri-transpacific-2026',
  title:'Seventeen rate increases in eight months: reading the transpacific GRI cadence',
  cat:'Market news', date:'2026-09-04', shown:'4 September 2026', mins:6,
  dek:'An increase that sticks does not need repeating a fortnight later. The frequency, not the level, is what the transpacific is telling you — and the exposure it creates is about quote validity.'},

 {slug:'how-to-read-a-container-freight-rate-index',
  title:'How to read a container freight rate index (and where it misleads you)',
  cat:'Methodology', date:'2026-08-26', shown:'26 August 2026', mins:9,
  dek:'An index is an average of other people\u2019s deals, not a quote for yours. A practical guide to what a freight benchmark measures, the four questions to ask before you trust one, and the situations where the number will be wrong for your cargo.'},

 {slug:'container-shipping-surcharges-explained',
  title:'Container shipping surcharges explained: BAF, CAF, PSS, THC and the rest',
  cat:'Guides', date:'2026-08-24', shown:'24 August 2026', mins:11,
  dek:'Base ocean freight is rarely half the invoice. Every major surcharge on a container shipment, what triggers it, who is allowed to charge it, and which ones you can reasonably challenge.'},

 {slug:'fcl-vs-lcl',
  title:'FCL vs LCL: how to work out which is actually cheaper',
  cat:'Guides', date:'2026-08-21', shown:'21 August 2026', mins:8,
  dek:'The usual rule of thumb \u2014 switch at 15 cubic metres \u2014 is wrong more often than it is right. A method for comparing full-container and groupage properly, including the costs that only appear on one side.'},

 {slug:'how-to-predict-port-congestion',
  title:'How to see port congestion coming three weeks early',
  cat:'Ports', date:'2026-08-19', shown:'19 August 2026', mins:9,
  dek:'Berth waiting time tells you a port is already congested. Three leading indicators \u2014 schedule reliability drift, yard density and inland dwell \u2014 tell you it is about to be.'},

 {slug:'ocean-freight-contract-negotiation',
  title:'Ocean freight contract negotiation: the clauses that matter more than the rate',
  cat:'Contracts', date:'2026-08-17', shown:'17 August 2026', mins:10,
  dek:'A good rate with no capacity commitment is worth less than a fair rate you can actually use. What to negotiate in an annual ocean contract, in the order it deserves your attention.'},

 {slug:'asia-europe-container-rates',
  title:'Asia\u2013Europe container rates: what actually sets the floor',
  cat:'Analysis', date:'2026-08-14', shown:'14 August 2026', mins:9,
  dek:'The headline number moves on capacity, but the floor is set by something slower: operating cost per slot, and how long carriers are willing to sail below it.'},

 {slug:'blank-sailings-explained',
  title:'Blank sailings explained: how carriers manage capacity, and how to plan around them',
  cat:'Capacity', date:'2026-08-12', shown:'12 August 2026', mins:8,
  dek:'A cancelled sailing is a pricing instrument as much as an operational decision. How blanking programmes work, why they are announced late, and how to build slack into a booking plan.'},

 {slug:'eu-ets-fueleu-freight-surcharges',
  title:'EU ETS and FuelEU surcharges: how to audit what your carrier charges',
  cat:'Regulation', date:'2026-08-10', shown:'10 August 2026', mins:10,
  dek:'Carbon surcharges on identical lanes now differ by a factor of four. The arithmetic behind an ETS charge, what a defensible figure looks like, and the questions that get you a breakdown.'},

 {slug:'reefer-container-rates',
  title:'Reefer container rates: why perishable freight prices on a different clock',
  cat:'Commodities', date:'2026-08-06', shown:'6 August 2026', mins:8,
  dek:'Reefer capacity is finite, seasonal and directional in a way dry capacity is not. What drives the premium, when to fix, and why the dry-box index will not help you.'},

 {slug:'cape-of-good-hope-routing-cost',
  title:'Cape of Good Hope routing: the real cost, eighteen months on',
  cat:'Analysis', date:'2026-08-03', shown:'3 August 2026', mins:9,
  dek:'Longer transits have been absorbed into schedules and priced into rates. A breakdown of where the extra cost actually landed \u2014 and which of it would come back out.'}
];

return {seeded:seeded, makeSeries:makeSeries, CORRIDORS:CORRIDORS, LANES:LANES,
        INDICES:INDICES, PORTS:PORTS, ARTICLES:ARTICLES, ARCHIVE:ARCHIVE,
        DRIVERS:DRIVERS, GLOSSARY:GLOSSARY};
})();

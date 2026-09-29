/*!
 * SeaFreightPrices.com — application
 * ---------------------------------------------------------------
 * Progressive by design: every page renders readable HTML without
 * this file. What lives here is the interactive layer — the rate
 * explorer, Port Watch filters, forecast charts, hash router and
 * command palette.
 *
 * Depends on assets/js/data.js (window.SFP).
 */
(function(){
"use strict";

var S=window.SFP;
var LANES=S.LANES, INDICES=S.INDICES, PORTS=S.PORTS, ARTICLES=S.ARTICLES,
    ARCHIVE=S.ARCHIVE, DRIVERS=S.DRIVERS, GLOSSARY=S.GLOSSARY,
    makeSeries=S.makeSeries;

/* ============================================================
   Chart helpers
   ============================================================ */
function fmt(n){return Math.round(n).toLocaleString('en-US');}
function sign(n,d){d=d===undefined?1:d;return (n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(d);}
function cls(n){return n>0.05?'up':n<-0.05?'down':'flat';}

function lineChart(series,opts){
  opts=opts||{};
  var w=opts.w||760,h=opts.h||opts.height||210,pl=opts.pl===undefined?42:opts.pl,pr=8,pt=10,pb=opts.pb===undefined?22:opts.pb;
  var min=Math.min.apply(null,series),max=Math.max.apply(null,series);
  var pad=(max-min)*0.18||1;min-=pad;max+=pad;
  var iw=w-pl-pr,ih=h-pt-pb;
  var X=function(i){return pl+(i/(series.length-1))*iw;};
  var Y=function(v){return pt+ih-((v-min)/(max-min))*ih;};
  var d='',a='';
  for(var i=0;i<series.length;i++){d+=(i?'L':'M')+X(i).toFixed(1)+' '+Y(series[i]).toFixed(1)+' ';}
  a='M'+X(0).toFixed(1)+' '+(pt+ih)+' '+d.replace(/^M/,'L')+'L'+X(series.length-1).toFixed(1)+' '+(pt+ih)+' Z';
  var color=opts.color||'var(--blue)';
  var uid='g'+Math.random().toString(36).slice(2,8);
  var s='<svg class="chart" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Rate history chart">';
  s+='<defs><linearGradient id="'+uid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity=".26"/><stop offset="100%" stop-color="'+color+'" stop-opacity="0"/></linearGradient></defs>';
  for(var g=0;g<=4;g++){
    var y=pt+(ih/4)*g;
    s+='<line class="grid-l" x1="'+pl+'" y1="'+y.toFixed(1)+'" x2="'+(w-pr)+'" y2="'+y.toFixed(1)+'"/>';
    var val=max-((max-min)/4)*g;
    s+='<text class="axis" x="'+(pl-8)+'" y="'+(y+3.5).toFixed(1)+'" text-anchor="end">'+fmt(val)+'</text>';
  }
  s+='<path d="'+a+'" fill="url(#'+uid+')"/>';
  s+='<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  s+='<circle cx="'+X(series.length-1).toFixed(1)+'" cy="'+Y(series[series.length-1]).toFixed(1)+'" r="4" fill="'+color+'"/>';
  if(opts.labels){
    for(var t=0;t<opts.labels.length;t++){
      var lx=pl+(opts.labels[t].at/(series.length-1))*iw;
      s+='<text class="axis" x="'+lx.toFixed(1)+'" y="'+(h-6)+'" text-anchor="middle">'+opts.labels[t].t+'</text>';
    }
  }
  s+='</svg>';
  return s;
}

function sparkline(series,color){
  var w=110,h=28,min=Math.min.apply(null,series),max=Math.max.apply(null,series),r=(max-min)||1,d='';
  for(var i=0;i<series.length;i++){
    var x=(i/(series.length-1))*w, y=h-((series[i]-min)/r)*(h-4)-2;
    d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' ';
  }
  return '<svg class="spark" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}

function coneChart(hist,fc,lo,hi,cw){
  var w=cw||760,h=250,pl=46,pr=10,pt=12,pb=26;
  var all=hist.concat(hi).concat(lo);
  var min=Math.min.apply(null,all),max=Math.max.apply(null,all);
  var pad=(max-min)*0.14||1;min-=pad;max+=pad;
  var n=hist.length+fc.length,iw=w-pl-pr,ih=h-pt-pb;
  var X=function(i){return pl+(i/(n-1))*iw;};
  var Y=function(v){return pt+ih-((v-min)/(max-min))*ih;};
  var s='<svg class="chart" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Forecast chart">';
  for(var g=0;g<=4;g++){
    var y=pt+(ih/4)*g;
    s+='<line class="grid-l" x1="'+pl+'" y1="'+y.toFixed(1)+'" x2="'+(w-pr)+'" y2="'+y.toFixed(1)+'"/>';
    s+='<text class="axis" x="'+(pl-8)+'" y="'+(y+3.5).toFixed(1)+'" text-anchor="end">'+fmt(max-((max-min)/4)*g)+'</text>';
  }
  var b=hist.length-1;
  var up='M'+X(b).toFixed(1)+' '+Y(hist[b]).toFixed(1)+' ';
  for(var i=0;i<hi.length;i++){up+='L'+X(b+1+i).toFixed(1)+' '+Y(hi[i]).toFixed(1)+' ';}
  for(var j=lo.length-1;j>=0;j--){up+='L'+X(b+1+j).toFixed(1)+' '+Y(lo[j]).toFixed(1)+' ';}
  up+='Z';
  s+='<path d="'+up+'" fill="var(--blue)" opacity=".16"/>';
  var dh='';for(var k=0;k<hist.length;k++){dh+=(k?'L':'M')+X(k).toFixed(1)+' '+Y(hist[k]).toFixed(1)+' ';}
  s+='<path d="'+dh+'" fill="none" stroke="var(--navy-800)" stroke-width="2.2" stroke-linejoin="round"/>';
  var df='M'+X(b).toFixed(1)+' '+Y(hist[b]).toFixed(1)+' ';
  for(var m=0;m<fc.length;m++){df+='L'+X(b+1+m).toFixed(1)+' '+Y(fc[m]).toFixed(1)+' ';}
  s+='<path d="'+df+'" fill="none" stroke="var(--blue)" stroke-width="2.2" stroke-dasharray="6 5" stroke-linejoin="round"/>';
  s+='<line x1="'+X(b).toFixed(1)+'" y1="'+pt+'" x2="'+X(b).toFixed(1)+'" y2="'+(pt+ih)+'" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>';
  s+='<text class="axis" x="'+(X(b)-8).toFixed(1)+'" y="'+(h-8)+'" text-anchor="end">today</text>';
  s+='<text class="axis" x="'+(w-pr).toFixed(1)+'" y="'+(h-8)+'" text-anchor="end">+90 days</text>';
  s+='</svg>';
  return s;
}

/* ------------------------------------------------------------
   Charts are drawn at 1:1 with their container so axis labels
   never scale. Every chart registers a redraw fn, replayed on
   resize and on route change (containers are hidden until then).
   ------------------------------------------------------------ */
var REDRAW=[];
function cw(el){var w=el?el.clientWidth:0;return w>200?Math.round(w):760;}
function redrawAll(){for(var i=0;i<REDRAW.length;i++){try{REDRAW[i]();}catch(e){}}}
(function(){var t;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(redrawAll,180);});})();

/* ============================================================
   Ticker
   ============================================================ */
(function(){
  var html='';
  for(var pass=0;pass<2;pass++){
    for(var i=0;i<INDICES.length;i++){
      var x=INDICES[i];
      html+='<span class="tick"><b>'+x[0]+'</b><span class="v">'+(x[1]<100?x[1].toFixed(2):fmt(x[1]))+'</span><span class="c '+cls(x[2])+'">'+sign(x[2])+'%</span></span>';
    }
  }
  document.getElementById('tickerRail').innerHTML=html;
})();

/* ============================================================
   Home: hero index chart
   ============================================================ */
var HERO=makeSeries(2148,4211,52,0.04,-0.0018);
var heroRange=13;
function renderHero(r){
  if(r)heroRange=r;
  var s=HERO.slice(HERO.length-heroRange),rr=heroRange;
  var labels=rr===52?[{at:0,t:'Sep 25'},{at:Math.floor(rr/2),t:'Feb 26'},{at:rr-1,t:'Aug 26'}]
           :rr===26?[{at:0,t:'Feb 26'},{at:Math.floor(rr/2),t:'May 26'},{at:rr-1,t:'Aug 26'}]
                   :[{at:0,t:'Jun 26'},{at:Math.floor(rr/2),t:'Jul 26'},{at:rr-1,t:'Aug 26'}];
  var el=document.getElementById('heroChart');
  el.innerHTML=lineChart(s,{w:cw(el),h:170,pl:38,color:'#7FB0E6',labels:labels});
}
REDRAW.push(function(){renderHero();});
renderHero(13);
document.getElementById('heroRanges').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  [].forEach.call(this.children,function(c){c.classList.remove('on');});
  b.classList.add('on');renderHero(parseInt(b.dataset.r,10));
});
document.getElementById('heroVal').textContent=fmt(HERO[51]);
document.getElementById('heroHigh').textContent=fmt(Math.max.apply(null,HERO));
document.getElementById('heroLow').textContent=fmt(Math.min.apply(null,HERO));
(function(){
  var avg=HERO.reduce(function(a,b){return a+b;},0)/HERO.length;
  var d=((HERO[51]/avg)-1)*100;
  var el=document.getElementById('heroAvg');
  el.textContent=sign(d,0)+'%';
})();

/* ============================================================
   Home: market movers
   ============================================================ */
(function(){
  var sorted=LANES.slice().sort(function(a,b){return Math.abs(b.wk)-Math.abs(a.wk);}).slice(0,7);
  document.getElementById('moversBody').innerHTML=sorted.map(function(l){
    return '<tr>'+
      '<td><span class="lane-cell">'+l.o+' <span class="arrow">→</span> '+l.d+'</span></td>'+
      '<td style="color:var(--muted);font-size:.83rem">'+l.corridor+'</td>'+
      '<td class="num"><b>$'+fmt(l.rate)+'</b></td>'+
      '<td class="num"><span class="delta '+cls(l.wk)+'">'+sign(l.wk)+'%</span></td>'+
      '<td class="num"><span class="delta '+cls(l.mo)+'">'+sign(l.mo)+'%</span></td>'+
      '<td>'+sparkline(l.series.slice(39),l.wk>0?'var(--rise)':'var(--fall)')+'</td>'+
    '</tr>';
  }).join('');
})();

/* ============================================================
   Rates explorer
   ============================================================ */
var ORIGINS=[],DESTS=[];
LANES.forEach(function(l){if(ORIGINS.indexOf(l.o)<0)ORIGINS.push(l.o);if(DESTS.indexOf(l.d)<0)DESTS.push(l.d);});
var oSel=document.getElementById('oSel'),dSel=document.getElementById('dSel'),cSel=document.getElementById('cSel');
oSel.innerHTML=ORIGINS.map(function(o){return '<option>'+o+'</option>';}).join('');
dSel.innerHTML=DESTS.map(function(d){return '<option>'+d+'</option>';}).join('');
oSel.value='Shanghai';dSel.value='Rotterdam';

var expState={basis:'spot',range:26,watch:{}};

function currentLane(){
  var m=LANES.filter(function(l){return l.o===oSel.value&&l.d===dSel.value;})[0];
  return m||LANES.filter(function(l){return l.o===oSel.value;})[0]||LANES[0];
}

function renderExplorer(){
  var l=currentLane();
  if(l.o!==oSel.value||l.d!==dSel.value){oSel.value=l.o;dSel.value=l.d;}
  var mult=parseFloat(cSel.value)*(expState.basis==='contract'?0.88:1);
  var series=l.series.map(function(v){return v*mult;});
  var view=series.slice(series.length-expState.range);
  var last=series[51],prev=series[50];
  var hi=Math.max.apply(null,series),lo=Math.min.apply(null,series);
  var avg=series.reduce(function(a,b){return a+b;},0)/series.length;
  var rets=[];for(var i=1;i<series.length;i++){rets.push(Math.log(series[i]/series[i-1]));}
  var mean=rets.reduce(function(a,b){return a+b;},0)/rets.length;
  var vr=rets.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/rets.length;
  var vol=Math.sqrt(vr)*Math.sqrt(52)*100;
  var pct=((last-lo)/((hi-lo)||1))*100;
  var wk=((last/prev)-1)*100;

  document.getElementById('expLane').innerHTML=l.o+' <span class="arrow">→</span> '+l.d+' <small>'+l.oc+'–'+l.dc+'</small>';
  document.getElementById('expMeta').textContent=l.corridor+' · '+l.transit+' days port-to-port · '+l.contrib+' contributors · '+(expState.basis==='contract'?'contract basis':'spot basis');
  document.getElementById('expRate').textContent=fmt(last);
  var dEl=document.getElementById('expDelta');
  dEl.textContent=sign(wk)+'% w/w';dEl.className='delta '+cls(wk);

  var r=expState.range;
  var labels=r===52?[{at:0,t:'Sep 25'},{at:26,t:'Feb 26'},{at:51,t:'Aug 26'}]
           :r===26?[{at:0,t:'Feb 26'},{at:13,t:'May 26'},{at:25,t:'Aug 26'}]
                  :[{at:0,t:'Jun 26'},{at:6,t:'Jul 26'},{at:12,t:'Aug 26'}];
  var cEl=document.getElementById('expChart');
  cEl.innerHTML=lineChart(view,{w:cw(cEl),h:230,color:'var(--blue)',labels:labels});

  document.getElementById('s12h').textContent='$'+fmt(hi);
  document.getElementById('s12l').textContent='$'+fmt(lo);
  document.getElementById('s12a').textContent=sign(((last/avg)-1)*100,0)+'%';
  document.getElementById('s12v').textContent=vol.toFixed(0)+'%';
  document.getElementById('pctLabel').textContent=Math.round(pct)+'th percentile';
  document.getElementById('bandMarker').style.left=Math.max(0,Math.min(100,pct))+'%';
  document.getElementById('bandLo').textContent='$'+fmt(lo);
  document.getElementById('bandHi').textContent='$'+fmt(hi);

  var on=!!expState.watch[l.id];
  var wb=document.getElementById('watchBtn');
  wb.classList.toggle('on',on);
  document.getElementById('watchLabel').textContent=on?'Watching this lane':'Watch this lane';
}
[oSel,dSel,cSel].forEach(function(el){el.addEventListener('change',renderExplorer);});
document.getElementById('basisToggle').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  [].forEach.call(this.children,function(c){c.classList.remove('on');});
  b.classList.add('on');expState.basis=b.dataset.b;renderExplorer();
});
document.getElementById('rangeToggle').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  [].forEach.call(this.children,function(c){c.classList.remove('on');});
  b.classList.add('on');expState.range=parseInt(b.dataset.r,10);renderExplorer();
});
document.getElementById('watchBtn').addEventListener('click',function(){
  var l=currentLane();expState.watch[l.id]=!expState.watch[l.id];renderExplorer();
});
REDRAW.push(renderExplorer);
renderExplorer();

/* ============================================================
   Lane board
   ============================================================ */
(function(){
  var cf=document.getElementById('corridorFilter');
  var seen=[];
  LANES.forEach(function(l){if(seen.indexOf(l.corridor)<0)seen.push(l.corridor);});
  cf.innerHTML='<option value="">All corridors</option>'+seen.map(function(c){return '<option>'+c+'</option>';}).join('');

  function draw(){
    var q=document.getElementById('laneSearch').value.toLowerCase();
    var c=cf.value, sort=document.getElementById('sortSel').value;
    var rows=LANES.filter(function(l){
      var hay=(l.o+' '+l.d+' '+l.corridor+' '+l.oc+' '+l.dc).toLowerCase();
      return hay.indexOf(q)>=0 && (!c||l.corridor===c);
    });
    if(sort==='rate')rows.sort(function(a,b){return b.rate-a.rate;});
    else if(sort==='wk')rows.sort(function(a,b){return Math.abs(b.wk)-Math.abs(a.wk);});
    else rows.sort(function(a,b){return a.corridor.localeCompare(b.corridor)||a.o.localeCompare(b.o);});

    document.getElementById('laneBody').innerHTML=rows.length?rows.map(function(l){
      return '<tr>'+
        '<td><span class="lane-cell">'+l.o+' <span class="arrow">→</span> '+l.d+' <small>'+l.oc+'–'+l.dc+'</small></span></td>'+
        '<td style="color:var(--muted);font-size:.83rem">'+l.corridor+'</td>'+
        '<td class="num" style="color:var(--muted)">'+l.transit+'d</td>'+
        '<td class="num"><b>$'+fmt(l.rate)+'</b></td>'+
        '<td class="num"><span class="delta '+cls(l.wk)+'">'+sign(l.wk)+'%</span></td>'+
        '<td class="num"><span class="delta '+cls(l.mo)+'">'+sign(l.mo)+'%</span></td>'+
        '<td>'+sparkline(l.series.slice(39),l.wk>0?'var(--rise)':'var(--fall)')+'</td>'+
      '</tr>';
    }).join(''):'<tr><td colspan="7" style="padding:34px;text-align:center;color:var(--faint)">No lanes match that search.</td></tr>';
  }
  document.getElementById('laneSearch').addEventListener('input',draw);
  cf.addEventListener('change',draw);
  document.getElementById('sortSel').addEventListener('change',draw);
  draw();
})();

/* ============================================================
   Freight Pulse
   ============================================================ */
(function(){
  var METERS=[['Demand vs last year','+2%',54],['Deployed capacity','+6%',72],['Booking lead time','11 days',38],['Rate pressure','Downward',30]];
  document.getElementById('meters').innerHTML=METERS.map(function(m){
    return '<div class="meter"><div class="meter-top"><span>'+m[0]+'</span><b>'+m[1]+'</b></div>'+
           '<div class="meter-bar"><i class="meter-fill" style="width:'+m[2]+'%"></i></div></div>';
  }).join('');

  var SENTI=[['Asia – North Europe','bad','Softening'],['Asia – Mediterranean','warn','Flat to soft'],['Transpacific East','warn','Flat'],['Transatlantic West','ok','Firming'],['Europe – W. Africa','warn','Flat'],['Asia – Middle East','ok','Firming']];
  document.getElementById('sentiList').innerHTML=SENTI.map(function(s){
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:.87rem">'+
           '<span>'+s[0]+'</span><span class="chip chip-'+s[1]+'">'+s[2]+'</span></div>';
  }).join('');

  document.getElementById('archive').innerHTML=ARCHIVE.map(function(a){
    return '<div class="arch-row"><span class="arch-date">'+a[0]+'</span>'+
           '<span class="arch-title">'+a[1]+'</span><span class="arch-tag">'+a[2]+'</span></div>';
  }).join('');
})();

/* ============================================================
   Port Watch
   ============================================================ */
(function(){
  var regions=['All'];
  PORTS.forEach(function(p){if(regions.indexOf(p[2])<0)regions.push(p[2]);});
  var active='All';
  document.getElementById('regionChips').innerHTML=regions.map(function(r,i){
    return '<button data-r="'+r+'"'+(i===0?' class="on"':'')+'>'+r+'</button>';
  }).join('');

  function status(wait){
    if(wait>=3.5)return ['chip-bad','Congested'];
    if(wait>=2.2)return ['chip-warn','Elevated'];
    return ['chip-ok','Fluid'];
  }
  function heatColor(u){return u>=90?'var(--rise)':u>=80?'var(--amber)':'var(--fall)';}

  function draw(){
    var rows=PORTS.filter(function(p){return active==='All'||p[2]===active;})
                  .sort(function(a,b){return b[3]-a[3];});
    document.getElementById('portBody').innerHTML=rows.map(function(p){
      var st=status(p[3]);
      return '<tr>'+
        '<td><span class="lane-cell">'+p[0]+' <small>'+p[1]+'</small></span></td>'+
        '<td style="color:var(--muted);font-size:.83rem">'+p[2]+'</td>'+
        '<td class="num"><b>'+p[3].toFixed(1)+'d</b></td>'+
        '<td class="num"><span class="heat"><i style="width:'+p[4]+'%;background:'+heatColor(p[4])+'"></i></span>'+p[4]+'%</td>'+
        '<td class="num"><span class="delta '+cls(p[5])+'">'+sign(p[5])+'d</span></td>'+
        '<td><span class="chip '+st[0]+'">'+st[1]+'</span></td>'+
      '</tr>';
    }).join('');
  }
  document.getElementById('regionChips').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    [].forEach.call(this.children,function(c){c.classList.remove('on');});
    b.classList.add('on');active=b.dataset.r;draw();
  });
  draw();
})();

/* ============================================================
   Rate Outlook
   ============================================================ */
(function(){
  var sel=document.getElementById('outlookSel');
  var OUT=[
    ['Asia – North Europe',2480,-0.16,0.13],
    ['Asia – Mediterranean',2190,-0.08,0.11],
    ['Transpacific East',2760,-0.03,0.15],
    ['Transatlantic West',1690,0.09,0.09],
    ['Europe – West Africa',2340,-0.04,0.10],
    ['Europe – South America',2050,-0.06,0.12]
  ];
  sel.innerHTML=OUT.map(function(o,i){return '<option value="'+i+'">'+o[0]+'</option>';}).join('');

  var outIdx=0;
  function draw(i){
    if(i!==undefined)outIdx=i;
    var o=OUT[outIdx];
    var hist=makeSeries(o[1],(outIdx+11)*613,26,0.04,-0.001);
    var base=hist[hist.length-1];
    var fc=[],lo=[],hi=[];
    for(var k=1;k<=13;k++){
      var t=k/13;
      var mid=base*(1+o[2]*t);
      var spread=base*o[3]*Math.sqrt(t);
      fc.push(mid);lo.push(mid-spread);hi.push(mid+spread);
    }
    var oEl=document.getElementById('outlookChart');
    oEl.innerHTML=coneChart(hist,fc,lo,hi,cw(oEl));
    var mid90=fc[12],lo90=lo[12],hi90=hi[12];
    document.getElementById('scenarioGrid').innerHTML=
      '<div class="scenario"><span class="sname">Downside · 20%</span><div class="sval" style="color:var(--fall)">$'+fmt(lo90)+'</div><p>Capacity keeps returning, restocking stays weak and routing normalises faster than expected.</p></div>'+
      '<div class="scenario base"><span class="sname">Base case · 60%</span><div class="sval">$'+fmt(mid90)+'</div><p>Gradual softening into November, then a floor as carriers defend the level ahead of the contract round.</p></div>'+
      '<div class="scenario"><span class="sname">Upside · 20%</span><div class="sval" style="color:var(--rise)">$'+fmt(hi90)+'</div><p>Renewed disruption or a sharper capacity withdrawal tightens the corridor into the year-end.</p></div>';
  }
  sel.addEventListener('change',function(){draw(parseInt(this.value,10));});
  REDRAW.push(function(){draw();});
  draw(0);

  document.getElementById('driverList').innerHTML=DRIVERS.map(function(d,i){
    var chip=d[2]==='Bearish'?'chip-ok':d[2]==='Bullish'?'chip-bad':'chip-warn';
    return '<div class="driver"><span class="dnum">0'+(i+1)+'</span><div>'+
      '<div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:6px">'+
      '<h4>'+d[0]+'</h4><span class="chip '+chip+'">'+d[2]+'</span>'+
      '<span class="chip chip-neutral">'+d[3]+' weight</span></div>'+
      '<p>'+d[1]+'</p></div></div>';
  }).join('');
})();

/* ============================================================
   Insights teaser (full archive lives at /insights/)
   ============================================================ */
document.getElementById('homePosts').innerHTML=ARTICLES.slice(0,3).map(function(a){
  return '<a class="post" href="/insights/'+a.slug+'/">'+
    '<span class="thumb"><img src="/assets/img/insights/'+a.slug+'.svg" alt="" loading="lazy" decoding="async" width="640" height="400"></span>'+
    '<span class="body">'+
      '<span class="meta"><span>'+a.cat+'</span><span aria-hidden="true">·</span><span>'+a.shown+'</span></span>'+
      '<span class="h3">'+a.title+'</span>'+
      '<span class="dek">'+a.dek+'</span>'+
      '<span class="go">Read analysis <span aria-hidden="true">→</span></span>'+
    '</span></a>';
}).join('');

/* ============================================================
   Glossary
   ============================================================ */
document.getElementById('glossary').innerHTML=GLOSSARY.map(function(g){
  return '<details><summary>'+g[0]+'</summary><p>'+g[1]+'</p></details>';
}).join('');

/* ============================================================
   Contact form
   ============================================================ */
document.getElementById('contactForm').addEventListener('submit',function(e){
  e.preventDefault();
  var subject='['+document.getElementById('fTopic').value+'] SeaFreightPrices.com enquiry';
  var body='Name: '+document.getElementById('fName').value+
           '\nCompany: '+document.getElementById('fCompany').value+
           '\nEmail: '+document.getElementById('fEmail').value+
           '\n\n'+document.getElementById('fMsg').value;
  document.getElementById('formNote').textContent='Opening your email app with the message ready to send. Prefer to write directly? info@seafreightprices.com';
  window.location.href='mailto:info@seafreightprices.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
});

/* ============================================================
   Router
   ============================================================ */
var ROUTES=['/','/rates','/pulse','/ports','/outlook','/methodology','/access','/contact'];
function route(){
  var h=(location.hash||'#/').replace('#','');
  if(ROUTES.indexOf(h)<0)h='/';
  [].forEach.call(document.querySelectorAll('[data-route]'),function(el){
    el.classList.toggle('on',el.dataset.route===h);
  });
  [].forEach.call(document.querySelectorAll('.nav-links a'),function(a){
    a.classList.toggle('active',a.getAttribute('href')==='#'+h);
  });
  var lr=document.querySelector('link[rel="canonical"]');
  if(lr)lr.setAttribute('href','https://www.seafreightprices.com/'+(h==='/'?'':'#'+h));
  document.getElementById('siteHeader').classList.remove('open');
  var bg=document.getElementById('burger');
  if(bg){bg.setAttribute('aria-expanded','false');bg.setAttribute('aria-label','Open menu');}
  window.scrollTo({top:0,behavior:'auto'});
  redrawAll();
  var titles={'/':'Freight markets, made clear.','/rates':'Rates & trade lanes','/pulse':'Freight Pulse','/ports':'Port Watch','/outlook':'Rate Outlook','/methodology':'Methodology','/access':'Access & pricing','/contact':'Contact'};
  document.title='SeaFreightPrices.com — '+titles[h];
}
window.addEventListener('hashchange',route);
route();

document.getElementById('burger').addEventListener('click',function(){
  var open=document.getElementById('siteHeader').classList.toggle('open');
  this.setAttribute('aria-expanded',open?'true':'false');
  this.setAttribute('aria-label',open?'Close menu':'Open menu');
});

/* ============================================================
   Command palette
   ============================================================ */
(function(){
  var box=document.getElementById('cmdk'),input=document.getElementById('cmdInput'),list=document.getElementById('cmdList');
  var items=[];
  ROUTES.forEach(function(r){
    var names={'/':'Home','/rates':'Rates & trade lanes','/pulse':'Freight Pulse','/ports':'Port Watch','/outlook':'Rate Outlook','/methodology':'Methodology','/access':'Access & pricing','/contact':'Contact'};
    items.push({label:names[r],type:'Page',go:function(){location.hash='#'+r;}});
  });
  items.push({label:'Insights — all articles',type:'Page',go:function(){location.href='/insights/';}});
  ARTICLES.forEach(function(a){
    items.push({label:a.title,type:'Article',go:function(){location.href='/insights/'+a.slug+'/';}});
  });
  LANES.forEach(function(l){
    items.push({label:l.o+' → '+l.d,type:'Lane',go:function(){
      location.hash='#/rates';oSel.value=l.o;dSel.value=l.d;renderExplorer();
    }});
  });
  PORTS.forEach(function(p){
    items.push({label:p[0]+' ('+p[1]+')',type:'Port',go:function(){location.hash='#/ports';}});
  });

  var sel=0,shown=[];
  function draw(){
    var q=input.value.toLowerCase().trim();
    shown=items.filter(function(i){return !q||i.label.toLowerCase().indexOf(q)>=0;}).slice(0,30);
    sel=0;
    list.innerHTML=shown.length?shown.map(function(i,n){
      return '<div class="cmdk-item'+(n===0?' sel':'')+'" data-n="'+n+'">'+i.label+'<span class="t">'+i.type+'</span></div>';
    }).join(''):'<div class="cmdk-empty">Nothing matches that.</div>';
  }
  function open(){box.classList.add('open');input.value='';draw();input.focus();}
  function close(){box.classList.remove('open');}
  function pick(n){if(shown[n]){close();shown[n].go();}}

  document.getElementById('openCmd').addEventListener('click',open);
  input.addEventListener('input',draw);
  list.addEventListener('click',function(e){
    var it=e.target.closest('.cmdk-item');if(it)pick(parseInt(it.dataset.n,10));
  });
  box.addEventListener('click',function(e){if(e.target===box)close();});
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();box.classList.contains('open')?close():open();return;}
    if(!box.classList.contains('open'))return;
    if(e.key==='Escape'){close();}
    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();
      sel=Math.max(0,Math.min(shown.length-1,sel+(e.key==='ArrowDown'?1:-1)));
      [].forEach.call(list.children,function(c,n){c.classList.toggle('sel',n===sel);});
      if(list.children[sel])list.children[sel].scrollIntoView({block:'nearest'});
    }
    else if(e.key==='Enter'){e.preventDefault();pick(sel);}
  });
})();

})();

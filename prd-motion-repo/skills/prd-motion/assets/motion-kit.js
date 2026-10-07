/* prd-motion 공통 헬퍼. 페이지의 <script> 맨 앞에 그대로 넣어 쓴다. 외부 의존성 없음. */
var MK=(function(){
  'use strict';
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
  var lerp=function(a,b,t){return a+(b-a)*t};
  var ease=function(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2};
  var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function token(name){return getComputedStyle(document.documentElement).getPropertyValue('--'+name).trim()}

  /* 화면에 보이는 동안만 fn(time, dt)를 매 프레임 호출 */
  function runWhenVisible(el,fn){
    var vis=true,raf=0,last=0;
    function tick(t){raf=0;if(!vis)return;var dt=last?Math.min(.05,(t-last)/1000):.016;last=t;fn(t,dt);raf=requestAnimationFrame(tick)}
    function start(){if(!raf){last=0;raf=requestAnimationFrame(tick)}}
    if('IntersectionObserver' in window){new IntersectionObserver(function(es){vis=es[es.length-1].isIntersecting;if(vis)start()}).observe(el)}
    start();return {start:start};
  }
  /* 처음 화면에 들어올 때 한 번만 실행 */
  function onceVisible(el,fn,threshold){
    if(!('IntersectionObserver' in window)){fn();return}
    var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){io.disconnect();fn()}},{threshold:threshold==null?.25:threshold});
    io.observe(el);
  }
  /* 캔버스를 논리 좌표 W×H로 쓰게 해 준다. 그릴 때 ctx.setTransform(st.k,0,0,st.k,0,0). st.s = CSS px / 논리 px */
  function fitCanvas(cv,W,H){
    var st={W:W,H:H,s:1,k:1};
    st.resize=function(){var w=cv.clientWidth||st.W,dpr=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(w*dpr);cv.height=Math.round(w*st.H/st.W*dpr);st.s=w/st.W;st.k=w*dpr/st.W};
    st.setSize=function(W2,H2){st.W=W2;st.H=H2;cv.width=W2;cv.height=H2;st.resize()};
    st.resize();window.addEventListener('resize',st.resize);return st;
  }
  /* 스크롤 + 슬라이더 + 재생 버튼을 하나의 진행값 p(0~1)로 묶는다.
     o = {wrap, stage, range, play, reset, onP(p), duration(초, 기본 7), extra(px, 기본 1300 / 좁은 화면 900), nav(px, 기본 56)}
     반환: {get p}. onP는 매 프레임이 아니라 값이 바뀔 때 호출되며, 부드러운 보간은 장면 쪽에서 한다. */
  function scrubber(o){
    var p=0,playing=false,nav=o.nav||56,dur=o.duration||7,raf=0,last=0;
    function set(v,src){p=clamp(v,0,1);if(o.range&&src!=='range')o.range.value=Math.round(p*1000);o.onP(p)}
    function size(){if(!o.wrap||!o.stage)return;o.wrap.style.height=(o.stage.offsetHeight+(o.extra||(innerWidth<860?900:1300)))+'px'}
    function onScroll(){
      var r=o.wrap.getBoundingClientRect(),span=o.wrap.offsetHeight-o.stage.offsetHeight-20;
      if(span<100||r.bottom<0||r.top>innerHeight)return;
      stop();set((nav+10-r.top)/span,'scroll');
    }
    function stop(){playing=false;cancelAnimationFrame(raf);raf=0;if(o.play)o.play.textContent=p>=1?'다시 재생':(o.playLabel||'재생')}
    function step(t){var dt=last?(t-last)/1000:0;last=t;set(p+dt/dur,'play');if(p>=1){stop();return}raf=requestAnimationFrame(step)}
    if(o.play)o.play.addEventListener('click',function(){
      if(playing){stop();return}
      if(p>=.99)set(0,'play');
      playing=true;last=0;o.play.textContent='일시정지';
      if(reduce){set(1,'play');stop();return}
      raf=requestAnimationFrame(step);
    });
    if(o.reset)o.reset.addEventListener('click',function(){stop();set(0,'reset');if(o.play)o.play.textContent=o.playLabel||'재생'});
    if(o.range)o.range.addEventListener('input',function(){stop();set(o.range.value/1000,'range')});
    if(o.wrap&&o.stage){size();window.addEventListener('resize',size);window.addEventListener('scroll',onScroll,{passive:true})}
    set(0,'init');
    return {get p(){return p},set:function(v){stop();set(v,'api')}};
  }
  /* 숫자를 from→to로 올린다. fmt(v)로 표시 형식 지정 */
  function countTo(el,from,to,ms,fmt){
    fmt=fmt||function(v){return Math.round(v).toLocaleString()};
    if(reduce){el.textContent=fmt(to);return}
    var t0=performance.now();ms=ms||1200;
    (function f(now){var u=clamp((now-t0)/ms,0,1);el.textContent=fmt(lerp(from,to,ease(u)));if(u<1)requestAnimationFrame(f)})(t0);
  }
  /* 출발 안내판처럼 글자가 넘어가며 정해진 단어로 멈춘다. el에 data-flap="단어" */
  function flap(el,charset,delay){
    var word=el.getAttribute('data-flap'),CH=charset||'가나다라마바사아자차카타파하0123456789';
    el.setAttribute('aria-label',word);
    el.innerHTML=word.split('').map(function(c){return '<span aria-hidden="true">'+(c===' '?'&nbsp;':esc(c))+'</span>'}).join('');
    if(reduce)return;
    $$('span',el).forEach(function(sp,i){
      if(word[i]===' ')return;var n=0,max=10+i*3+(delay||0);
      var iv=setInterval(function(){n++;if(n>=max){sp.textContent=word[i];clearInterval(iv)}else sp.textContent=CH[Math.floor(Math.random()*CH.length)]},55);
    });
  }
  /* 꼭짓점 배열 경로에서 비율 t 위치. pts=[[x,y],...], cum=누적 길이(pathCum으로 생성) */
  function pathCum(pts){var c=[0];for(var i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return c}
  function along(pts,cum,t){var L=cum[cum.length-1]*t;for(var i=1;i<pts.length;i++){if(L<=cum[i]||i===pts.length-1){var seg=cum[i]-cum[i-1]||1,u=clamp((L-cum[i-1])/seg,0,1);return [lerp(pts[i-1][0],pts[i][0],u),lerp(pts[i-1][1],pts[i][1],u)]}}return pts[pts.length-1]}
  /* 3차 베지어 위 점. c=[p0,p1,p2,p3] */
  function bez(c,t){var u=1-t;return [u*u*u*c[0][0]+3*u*u*t*c[1][0]+3*u*t*t*c[2][0]+t*t*t*c[3][0],u*u*u*c[0][1]+3*u*u*t*c[1][1]+3*u*t*t*c[2][1]+t*t*t*c[3][1]]}
  /* 공유 상태: 기능끼리 연결 */
  /* 구독 함수는 등록 순서대로 실행된다. 앞 기능이 계산한 값을 뒤 기능이 읽도록 의존 순서대로 push한다.
     한 모듈이 오류를 내도 나머지가 죽지 않게 각 호출을 감싼다. */
  function store(init){var s=init||{};s.subs=[];s.emit=function(){s.subs.forEach(function(f){try{f()}catch(e){console.error('[prd-motion]',e)}})};return s}
  /* 토큰 색 → rgba, 캔버스용 */
  function rgba(hex,a){var h=String(hex).trim().replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c}).join('');var n=parseInt(h,16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'}
  /* 캔버스 빗금 패턴(대기·미처리 구간 표시용) */
  function hatch(ctx,color){var c=document.createElement('canvas');c.width=c.height=8;var x=c.getContext('2d');x.strokeStyle=color;x.lineWidth=1.4;x.beginPath();x.moveTo(-2,10);x.lineTo(10,-2);x.moveTo(-2,2);x.lineTo(2,-2);x.moveTo(6,10);x.lineTo(10,6);x.stroke();return ctx.createPattern(c,'repeat')}
  /* 좁은 화면에서도 읽히는 캔버스 글자 크기(논리 px). st = fitCanvas 반환값 */
  function fsz(st,base,minCss){return Math.max(base,(minCss||10)/st.s)}
  /* 시드 고정 난수: PRD 총계에 맞춘 예시 분포를 매번 같게 만든다 */
  function seeded(seed){return function(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}}
  /* 분 → HH:MM */
  function hm(m){m=Math.round(m);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
  /* FLIP 재정렬: 순서를 바꾸기 전 위치를 재고, 바꾼 뒤 이전 위치에서 미끄러져 오게 한다 */
  function flip(els,reorder){var first=els.map(function(e){return e.getBoundingClientRect().top});reorder();if(reduce||!Element.prototype.animate)return;els.forEach(function(e,i){var d=first[i]-e.getBoundingClientRect().top;if(Math.abs(d)>2)e.animate([{transform:'translateY('+d+'px)'},{transform:'none'}],{duration:500,easing:'cubic-bezier(.2,.8,.3,1)'})})}
  /* 하단 토스트 */
  var tt;function toast(msg){var el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){el.classList.remove('show')},2600)}

  return {$:$,$$:$$,clamp:clamp,lerp:lerp,ease:ease,reduce:reduce,esc:esc,token:token,runWhenVisible:runWhenVisible,onceVisible:onceVisible,fitCanvas:fitCanvas,scrubber:scrubber,countTo:countTo,flap:flap,pathCum:pathCum,along:along,bez:bez,store:store,toast:toast,rgba:rgba,hatch:hatch,fsz:fsz,seeded:seeded,hm:hm,flip:flip};
})();

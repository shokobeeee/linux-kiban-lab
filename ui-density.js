(function(){
  'use strict';
  var mq=window.matchMedia('(max-width: 820px)');
  if(!mq.matches) return;

  document.body.classList.add('mobile-v5');

  document.querySelectorAll('.flow,.trace-line,.port-map,.packet-path').forEach(function(el){
    el.classList.add('mobile-structure-scroller');
  });
  document.querySelectorAll('.series-nav,.mobile-install-note').forEach(function(el){el.style.display='none';});

  var headings=Array.prototype.slice.call(document.querySelectorAll('h2'));
  var opHeading=headings.find(function(h){return (h.textContent||'').trim().indexOf('操作してみる')>=0;});
  if(!opHeading) return;
  var section=opHeading.closest('section');
  if(!section) return;

  var container=null;
  Array.prototype.slice.call(section.children).forEach(function(ch){
    if(!container && ch.classList && (ch.classList.contains('lab-grid') || ch.classList.contains('lab'))) container=ch;
  });
  if(!container) container=section.querySelector('.lab-grid,.lab');
  if(!container) return;

  var slides=Array.prototype.slice.call(container.children).filter(function(el){return el.nodeType===1;}).slice(0,3);
  if(slides.length<3) return;
  container.classList.add('mobile-operation-slider');
  slides.forEach(function(el,i){el.classList.add('mobile-slide','mobile-slide-'+i);});

  var desc=opHeading.nextElementSibling;
  if(desc && desc.tagName==='P'){
    desc.textContent='操作を選ぶ →「結果」「Linux」で変化を確認。下のタブ、または横スワイプで切り替えます。';
  }

  var tabs=document.createElement('div');
  tabs.className='mobile-slider-tabs';
  tabs.setAttribute('role','tablist');
  var labels=['① 操作','② 結果','③ Linux'];
  var buttons=labels.map(function(label,i){
    var b=document.createElement('button');
    b.type='button';
    b.textContent=label;
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected',i===0?'true':'false');
    if(i===0)b.classList.add('active');
    b.addEventListener('click',function(){
      container.scrollTo({left:slides[i].offsetLeft,behavior:'smooth'});
      setActive(i);
    });
    tabs.appendChild(b);
    return b;
  });
  var help=document.createElement('div');
  help.className='mobile-slider-help';
  help.textContent='← 横にスワイプでも切替 →';
  container.parentNode.insertBefore(tabs,container);
  container.parentNode.insertBefore(help,container);

  function setActive(idx){
    buttons.forEach(function(b,i){
      var on=i===idx;
      b.classList.toggle('active',on);
      b.setAttribute('aria-selected',on?'true':'false');
    });
  }
  var ticking=false;
  container.addEventListener('scroll',function(){
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(function(){
      var best=0,bestDist=Infinity;
      slides.forEach(function(s,i){
        var d=Math.abs(s.offsetLeft-container.scrollLeft);
        if(d<bestDist){bestDist=d;best=i;}
      });
      setActive(best);
      ticking=false;
    });
  },{passive:true});
})();

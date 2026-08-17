(function(){
  'use strict';
  var mq=window.matchMedia('(max-width: 820px)');
  if(!mq.matches) return;

  document.body.classList.add('mobile-v10');

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
    desc.textContent='操作を選ぶと、同じ画面のLIVE Terminalが即時更新されます。「結果」「Linux詳細」はタブまたは横スワイプで確認できます。';
  }

  var tabs=document.createElement('div');
  tabs.className='mobile-slider-tabs';
  tabs.setAttribute('role','tablist');
  var labels=['① 操作＋Terminal','② 結果','③ Linux詳細'];
  var activeIndex=0;

  function syncSliderHeight(idx){
    var s=slides[idx];
    if(!s) return;
    requestAnimationFrame(function(){
      var h=Math.ceil(Math.max(s.scrollHeight,s.getBoundingClientRect().height));
      if(h>0) container.style.height=h+'px';
    });
  }

  function setActive(idx){
    activeIndex=idx;
    buttons.forEach(function(b,i){
      var on=i===idx;
      b.classList.toggle('active',on);
      b.setAttribute('aria-selected',on?'true':'false');
    });
    syncSliderHeight(idx);
  }

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
  help.textContent='← 横スワイプでも切替 →';
  container.parentNode.insertBefore(tabs,container);
  container.parentNode.insertBefore(help,container);

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

  var operationSlide=slides[0];
  var linuxSlide=slides[2];
  var originalTerminal=linuxSlide.querySelector('.terminal') || linuxSlide.querySelector('pre') || linuxSlide.querySelector('.mini-console');

  if(operationSlide && originalTerminal){
    var existingChildren=Array.prototype.slice.call(operationSlide.childNodes);
    var controlScroll=document.createElement('div');
    controlScroll.className='mobile-control-scroll';
    existingChildren.forEach(function(node){controlScroll.appendChild(node);});
    operationSlide.appendChild(controlScroll);

    var live=document.createElement('section');
    live.className='mobile-live-terminal';
    live.setAttribute('aria-label','操作に連動するLinux Terminal');

    var liveHead=document.createElement('div');
    liveHead.className='mobile-live-terminal-head';

    var title=document.createElement('strong');
    title.textContent='🖥 LIVE Terminal';
    liveHead.appendChild(title);

    var actions=document.createElement('div');
    actions.className='mobile-live-terminal-actions';

    var detail=document.createElement('button');
    detail.type='button';
    detail.textContent='詳細';
    detail.title='Linux詳細スライドを開く';
    detail.addEventListener('click',function(){
      container.scrollTo({left:slides[2].offsetLeft,behavior:'smooth'});
      setActive(2);
    });

    var resize=document.createElement('button');
    resize.type='button';
    resize.textContent='拡大';
    resize.setAttribute('aria-expanded','false');
    resize.addEventListener('click',function(){
      var expanded=live.classList.toggle('expanded');
      resize.textContent=expanded?'縮小':'拡大';
      resize.setAttribute('aria-expanded',expanded?'true':'false');
      setTimeout(function(){syncSliderHeight(activeIndex)},0);
    });

    actions.appendChild(detail);
    actions.appendChild(resize);
    liveHead.appendChild(actions);

    var liveBody=document.createElement('div');
    liveBody.className='mobile-live-terminal-body';

    live.appendChild(liveHead);
    live.appendChild(liveBody);
    operationSlide.appendChild(live);

    function syncTerminal(){
      liveBody.innerHTML=originalTerminal.innerHTML;
      if(!liveBody.textContent.trim()) liveBody.textContent='$';
      liveBody.scrollTop=liveBody.scrollHeight;
      syncSliderHeight(activeIndex);
    }
    syncTerminal();

    var observer=new MutationObserver(syncTerminal);
    observer.observe(originalTerminal,{subtree:true,childList:true,characterData:true,attributes:true});

    operationSlide.addEventListener('click',function(e){
      if(e.target.closest('button')){
        setTimeout(syncTerminal,0);
        setTimeout(syncTerminal,80);
      }
    });
  }

  if('ResizeObserver' in window){
    var ro=new ResizeObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.target===slides[activeIndex])syncSliderHeight(activeIndex);
      });
    });
    slides.forEach(function(s){ro.observe(s);});
  }

  window.addEventListener('resize',function(){syncSliderHeight(activeIndex)},{passive:true});
  setTimeout(function(){setActive(0)},0);
  setTimeout(function(){syncSliderHeight(activeIndex)},120);
})();

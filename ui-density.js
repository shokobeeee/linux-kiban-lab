(function(){
  'use strict';
  var KEY='linux_kiban_ui_density';
  var mq=window.matchMedia('(max-width: 820px)');
  var saved=null;
  try{saved=localStorage.getItem(KEY);}catch(e){}
  var compact=saved?saved==='compact':mq.matches;

  function apply(){
    document.body.classList.toggle('ui-compact',compact);
    if(btn){
      btn.textContent=compact?'↗':'↘';
      btn.title=compact?'標準表示に戻す':'コンパクト表示にする';
      btn.setAttribute('aria-label',btn.title);
    }
  }

  var btn=document.createElement('button');
  btn.type='button';
  btn.className='density-toggle';
  btn.id='densityToggle';
  btn.addEventListener('click',function(){
    compact=!compact;
    try{localStorage.setItem(KEY,compact?'compact':'normal');}catch(e){}
    apply();
  });

  var bar=document.querySelector('.mobile-labbar');
  if(bar){
    var current=bar.querySelector('.mobile-current');
    if(current){bar.insertBefore(btn,current);}else{bar.appendChild(btn);}
  }else{
    btn.style.position='fixed';
    btn.style.right='10px';
    btn.style.bottom='calc(10px + env(safe-area-inset-bottom, 0px))';
    btn.style.zIndex='9999';
    btn.style.background='#182441';
    btn.style.color='#e8edf7';
    btn.style.border='1px solid #2a3858';
    btn.style.borderRadius='10px';
    btn.style.minHeight='40px';
    document.body.appendChild(btn);
  }

  apply();
})();

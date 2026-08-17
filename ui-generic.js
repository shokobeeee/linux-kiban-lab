(function(){
'use strict';

function genericizeText(s){
  var out=String(s||'');
  var rules=[
    [/Parrot OS Linux基盤ラボ/g,'Linux基盤ラボ'],
    [/Parrot OS Linux 基盤ラボ/g,'Linux基盤ラボ'],
    [/Parrot GNU\/Linux/g,'Linux'],
    [/learner@parrot/g,'learner@server01'],
    [/root@parrot/g,'root@server01'],
    [/parrot\.local/g,'server01.lab.test'],
    [/Parrot OS/g,'Linux Host'],
    [/\bParrot\b/g,'Linux Host']
  ];
  rules.forEach(function(r){out=out.replace(r[0],r[1]);});
  return out;
}

function genericizeTree(root){
  if(!root)return;
  if(root.nodeType===3){
    var p=root.parentElement;
    if(p && /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.tagName))return;
    var next=genericizeText(root.nodeValue);
    if(next!==root.nodeValue)root.nodeValue=next;
    return;
  }
  if(root.nodeType!==1 && root.nodeType!==9)return;

  if(root.nodeType===1){
    ['title','aria-label','placeholder'].forEach(function(a){
      if(root.hasAttribute && root.hasAttribute(a)){
        var old=root.getAttribute(a),next=genericizeText(old);
        if(next!==old)root.setAttribute(a,next);
      }
    });
  }

  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  var n;
  while((n=walker.nextNode())){
    var parent=n.parentElement;
    if(parent && /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(parent.tagName))continue;
    var t=genericizeText(n.nodeValue);
    if(t!==n.nodeValue)n.nodeValue=t;
  }

  if(root.querySelectorAll){
    root.querySelectorAll('[title],[aria-label],[placeholder]').forEach(function(el){
      ['title','aria-label','placeholder'].forEach(function(a){
        if(!el.hasAttribute(a))return;
        var old=el.getAttribute(a),next=genericizeText(old);
        if(next!==old)el.setAttribute(a,next);
      });
    });
  }
}

function scope(cmd){
  var s=(cmd||'').toLowerCase();
  if(/\b(apt|apt-get|apt-key|dpkg|ufw)\b/.test(s))return{c:'debian',l:'🟠 Debian / Ubuntu系'};
  if(/\b(systemctl|journalctl|systemd-analyze|loginctl)\b/.test(s))return{c:'systemd',l:'⚙ systemd系'};
  if(/\b(grub-reboot|update-grub|grub-install|firewall-cmd|nft|podman|docker|ansible)\b/.test(s))return{c:'special',l:'🟣 ツール / 環境依存'};
  return{c:'common',l:'🟢 Linuxで広く共通'};
}

function addLegend(){
  var mode=document.querySelector('.mobile-learning-mode');
  if(!mode||document.querySelector('.linux-scope-legend'))return;
  var d=document.createElement('div');d.className='linux-scope-legend';
  d.innerHTML='<strong>コマンドの適用範囲</strong><span class="linux-scope-chip common">🟢 広く共通</span><span class="linux-scope-chip systemd">⚙ systemd系</span><span class="linux-scope-chip debian">🟠 Debian / Ubuntu系</span><span>概念はLinux共通でも、実コマンドは環境で変わることがあります。</span>';
  mode.insertAdjacentElement('afterend',d);
}

function tagCommands(root){
  (root||document).querySelectorAll('.mobile-command-choices code:not([data-scope-tagged])').forEach(function(code){
    code.dataset.scopeTagged='1';
    var x=scope(code.textContent),b=document.createElement('span');b.className='command-scope-badge '+x.c;b.textContent=x.l;
    code.parentElement.appendChild(b);
  });
}

function addHomeNote(){
  if(!/(?:\/|index\.html)$/.test(location.pathname))return;
  if(document.querySelector('.linux-generic-home-note'))return;
  var hero=document.querySelector('.hero')||document.querySelector('main');if(!hero)return;
  var n=document.createElement('div');n.className='linux-generic-home-note';
  n.innerHTML='<strong>🐧 Linux汎用教材</strong> — IP・権限・Process・Filesystem・Log・障害切り分けなどの考え方はディストリビューション横断で学び、<code>apt</code> や <code>ufw</code> など環境差のあるコマンドは適用範囲を表示します。';
  hero.insertAdjacentElement('afterend',n);
}

function applyAll(root){
  genericizeTree(root||document);
  addLegend();
  tagCommands(root||document);
  addHomeNote();
  var dt=genericizeText(document.title);
  if(dt!==document.title)document.title=dt;
}

applyAll(document);

new MutationObserver(function(ms){
  ms.forEach(function(m){
    m.addedNodes.forEach(function(n){
      if(n.nodeType===1||n.nodeType===3)applyAll(n.nodeType===1?n:n.parentElement);
    });
    if(m.type==='characterData')genericizeTree(m.target);
  });
}).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
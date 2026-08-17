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
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;
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

function scopeOne(cmd){
  var s=String(cmd||'').trim().replace(/^\$\s*/,'').replace(/^sudo\s+/,'').toLowerCase();
  var first=(s.match(/^([a-z0-9_.+\/-]+)/)||[])[1]||'';
  if(/^(apt|apt-get|apt-key|dpkg|ufw)$/.test(first))return{c:'debian',l:'🟠 Debian / Ubuntu系',d:'パッケージ管理やufwなど、Debian系で使う代表コマンド'};
  if(/^(systemctl|journalctl|systemd-analyze|loginctl)$/.test(first))return{c:'systemd',l:'⚙ systemd系',d:'systemdを採用するLinuxで使うサービス・ログ管理コマンド'};
  if(first==='nginx')return{c:'nginx',l:'🟣 nginx固有',d:'Webサーバーnginx自身が提供するコマンド'};
  if(/^(grub-reboot|update-grub|grub-install|firewall-cmd|nft|podman|docker|ansible|ansible-playbook)$/.test(first))return{c:'special',l:'🟣 ツール / 環境依存',d:'導入ツールやディストリビューション構成によって変わるコマンド'};
  return{c:'common',l:'🟢 Linux / Unixで広く利用',d:'多くのLinux環境で同じ考え方・書式を使いやすいコマンド'};
}

function scopeParts(cmd){
  var parts=String(cmd||'').split(/\s*(?:;|&&|\|\|)\s*/).filter(Boolean);
  if(!parts.length)parts=[cmd];
  var seen={},out=[];
  parts.forEach(function(p){var x=scopeOne(p);if(!seen[x.c]){seen[x.c]=1;out.push(x);}});
  return out;
}

function scopeBadge(x){
  return '<span class="linux-scope-chip '+x.c+'" title="'+x.d.replace(/"/g,'&quot;')+'">'+x.l+'</span>';
}

function addLegend(){
  var mode=document.querySelector('.mobile-learning-mode');
  if(!mode||document.querySelector('.linux-scope-legend'))return;
  var d=document.createElement('div');d.className='linux-scope-legend';
  d.innerHTML='<strong>コマンドの適用範囲</strong><span class="linux-scope-chip common">🟢 広く利用</span><span class="linux-scope-chip systemd">⚙ systemd系</span><span class="linux-scope-chip debian">🟠 Debian / Ubuntu系</span><span class="linux-scope-chip nginx">🟣 nginx固有</span><span>実行するとLIVE Terminal直上にも表示します。</span>';
  mode.insertAdjacentElement('afterend',d);
}

function tagCommands(root){
  (root||document).querySelectorAll('.mobile-command-choices code:not([data-scope-tagged])').forEach(function(code){
    code.dataset.scopeTagged='1';
    var wrap=document.createElement('span');wrap.className='command-scope-badges';
    scopeParts(code.textContent).forEach(function(x){
      var b=document.createElement('span');b.className='command-scope-badge '+x.c;b.textContent=x.l;b.title=x.d;wrap.appendChild(b);
    });
    code.parentElement.appendChild(wrap);
  });
}

function latestCommand(text){
  var lines=String(text||'').split(/\r?\n/);
  for(var i=lines.length-1;i>=0;i--){
    var line=lines[i].trim();
    var m=line.match(/^\$\s+(.+)$/);
    if(m&&m[1].trim())return m[1].trim();
    m=line.match(/(?:^|\s)[#$]\s+(.+)$/);
    if(m&&m[1].trim())return m[1].trim();
  }
  return '';
}

function ensureLiveScope(){
  var live=document.querySelector('.mobile-live-terminal');
  if(!live)return null;
  var bar=live.querySelector('.mobile-live-command-scope');
  if(bar)return bar;
  bar=document.createElement('div');
  bar.className='mobile-live-command-scope';
  bar.dataset.command='__init__';
  var head=live.querySelector('.mobile-live-terminal-head');
  if(head)head.insertAdjacentElement('afterend',bar);else live.insertBefore(bar,live.firstChild);
  return bar;
}

function updateLiveScope(){
  var live=document.querySelector('.mobile-live-terminal');
  var body=live&&live.querySelector('.mobile-live-terminal-body');
  var bar=ensureLiveScope();
  if(!body||!bar)return;
  var cmd=genericizeText(latestCommand(body.textContent));
  if(bar.dataset.command===cmd)return;
  bar.dataset.command=cmd;
  if(!cmd){
    bar.innerHTML='<span class="mobile-live-command-scope-label">適用範囲</span><span class="mobile-live-command-scope-empty">コマンド実行後にここへ表示</span>';
    return;
  }
  var chips=scopeParts(cmd).map(scopeBadge).join('');
  var safe=cmd.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  bar.innerHTML='<div class="mobile-live-command-scope-top"><span class="mobile-live-command-scope-label">このコマンドは</span>'+chips+'</div><code>$ '+safe+'</code>';
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
  addLegend();tagCommands(root||document);ensureLiveScope();updateLiveScope();addHomeNote();
  var dt=genericizeText(document.title);if(dt!==document.title)document.title=dt;
}

applyAll(document);
new MutationObserver(function(ms){
  ms.forEach(function(m){
    m.addedNodes.forEach(function(n){if(n.nodeType===1||n.nodeType===3)applyAll(n.nodeType===1?n:n.parentElement);});
    if(m.type==='characterData')genericizeTree(m.target);
  });
  updateLiveScope();
}).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
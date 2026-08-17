(function(){
'use strict';
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
addLegend();tagCommands(document);addHomeNote();
new MutationObserver(function(ms){addLegend();ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)tagCommands(n)})})}).observe(document.body,{subtree:true,childList:true});
})();

(function(){
'use strict';
var KEY='linux_kiban_distro';
function profile(){var id='debian';try{id=localStorage.getItem(KEY)||'debian'}catch(e){};return id==='rhel'?{id:'rhel',chip:'🔵',pkg:'dnf / rpm',fw:'firewalld'}:{id:'debian',chip:'🟠',pkg:'apt / dpkg',fw:'ufw'};}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function clean(s){return String(s||'').trim().replace(/^\$\s*/,'').replace(/^sudo\s+/,'').toLowerCase()}
function classifyOne(cmd){
  var p=profile(),s=clean(cmd),first=(s.match(/^([a-z0-9_.+\/-]+)/)||[])[1]||'';
  if(/^(apt|apt-get|apt-cache|apt-mark|apt-key|dpkg|dnf|yum|rpm)$/.test(first))return{c:'env',l:p.chip+' Package管理：'+p.pkg};
  if(/^(ufw|firewall-cmd)$/.test(first))return{c:'env',l:p.chip+' Firewall：'+p.fw};
  if(/^(systemctl|journalctl|systemd-analyze|loginctl|timedatectl)$/.test(first))return{c:'systemd',l:'⚙ Service / Log管理：systemd'};
  if(first==='nginx')return{c:'tool',l:'🟣 nginx固有'};
  if(/^(docker|podman)$/.test(first))return{c:'tool',l:'🟣 Container：'+first};
  if(/^(ansible|ansible-playbook|ansible-inventory)$/.test(first))return{c:'tool',l:'🟣 Ansible固有'};
  if(first==='openssl')return{c:'tool',l:'🟣 TLSツール：OpenSSL'};
  if(first==='promtool')return{c:'tool',l:'🟣 Prometheusツール'};
  if(first==='aws')return{c:'tool',l:'🟣 Cloud Provider：AWS CLI'};
  if(first==='virsh')return{c:'tool',l:'🟣 Virtualization：libvirt'};
  if(first==='cloud-init')return{c:'tool',l:'🟣 Provisioning：cloud-init'};
  if(first==='ausearch')return{c:'tool',l:'🟣 Audit：auditd'};
  return{c:'common',l:'🟢 Linuxで広く共通'};
}
function classify(cmd){
  var parts=String(cmd||'').split(/\s*(?:;|&&|\|\|)\s*/).filter(Boolean),seen={},out=[];
  if(!parts.length)parts=[cmd];
  parts.forEach(function(x){var c=classifyOne(x),k=c.l;if(!seen[k]){seen[k]=1;out.push(c)}});return out;
}
function chips(cmd){return classify(cmd).map(function(x){return'<span class="context-scope-chip '+x.c+'">'+esc(x.l)+'</span>'}).join('')}
function rewriteLegend(){
  var el=document.querySelector('.linux-scope-legend');if(!el)return;var p=profile();
  if(el.dataset.contextProfile===p.id)return;
  el.dataset.contextProfile=p.id;el.classList.add('contextualized');
  el.innerHTML='<strong>現在の学習環境での役割</strong>'+
    '<span class="context-scope-chip common">🟢 Linux共通</span>'+
    '<span class="context-scope-chip env">'+p.chip+' Package管理：'+esc(p.pkg)+'</span>'+
    '<span class="context-scope-chip env">'+p.chip+' Firewall：'+esc(p.fw)+'</span>'+
    '<span class="context-scope-chip systemd">⚙ Service / Log管理：systemd</span>'+
    '<span class="context-scope-chip tool">🟣 製品・ツール固有</span>'+
    '<span class="context-scope-help">別環境との比較は上部の「環境を変更」で切り替えます。</span>';
}
function rewriteLive(){
  var bar=document.querySelector('.mobile-live-command-scope');if(!bar)return;
  var code=bar.querySelector('code'),cmd=code?(code.textContent||'').replace(/^\$\s*/,''):'';
  if(!cmd)return;var sig=profile().id+'|'+cmd;
  if(bar.dataset.contextSig===sig)return;
  bar.dataset.contextSig=sig;bar.classList.add('contextualized');
  bar.innerHTML='<div class="mobile-live-command-scope-top"><span class="mobile-live-command-scope-label">この環境では</span>'+chips(cmd)+'</div><code>$ '+esc(cmd)+'</code>';
}
function rewriteChoices(root){
  (root||document).querySelectorAll('.mobile-command-choices button').forEach(function(b){
    var code=b.querySelector('code');if(!code)return;
    var old=b.querySelector('.command-scope-badges');if(old)old.style.display='none';
    var sig=profile().id+'|'+code.textContent,wrap=b.querySelector('.context-scope-badges');
    if(!wrap){wrap=document.createElement('span');wrap.className='context-scope-badges';b.appendChild(wrap)}
    if(wrap.dataset.contextSig===sig)return;wrap.dataset.contextSig=sig;wrap.innerHTML=chips(code.textContent);
  });
  (root||document).querySelectorAll('.incident-command-choice').forEach(function(b){
    var code=b.querySelector('code');if(!code)return;
    var sig=profile().id+'|'+code.textContent,wrap=b.querySelector('.context-scope-badges');
    if(!wrap){wrap=document.createElement('span');wrap.className='context-scope-badges';b.appendChild(wrap)}
    if(wrap.dataset.contextSig===sig)return;wrap.dataset.contextSig=sig;wrap.innerHTML=chips(code.textContent);
  });
}
function apply(root){rewriteLegend();rewriteLive();rewriteChoices(root||document)}
apply(document);
new MutationObserver(function(ms){var touched=false;ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1){rewriteChoices(n);touched=true}});if(m.type==='characterData')touched=true});if(touched||ms.length)apply(document)}).observe(document.body,{subtree:true,childList:true,characterData:true});
window.addEventListener('storage',function(e){if(e.key===KEY)setTimeout(function(){apply(document)},0)});
document.addEventListener('click',function(){setTimeout(function(){apply(document)},0)},true);
})();

(function(){
'use strict';
var KEY='linux_kiban_distro';
function current(){var id='debian';try{id=localStorage.getItem(KEY)||'debian'}catch(e){}return id==='rhel'?{id:'rhel',name:'RHEL / Rocky / AlmaLinux',pkg:'dnf / rpm',fw:'firewalld',chip:'🔵'}:{id:'debian',name:'Debian / Ubuntu',pkg:'apt / dpkg',fw:'ufw',chip:'🟠'};}
function guideHTML(compact){var p=current();return '<div class="linux-layer-guide'+(compact?' compact':'')+'">'+
'<div class="linux-layer-guide-title"><strong>🧭 分類の軸は同じではありません</strong><span>ディストリビューション ≠ Service管理方式</span></div>'+
'<div class="linux-layer-map">'+
'<div class="linux-layer-row distro"><b>① ディストリビューション</b><span>'+p.chip+' '+p.name+'</span><small>Linux OSの系統。まずここを選びます。</small></div>'+
'<div class="linux-layer-branch"><div><b>② Package管理</b><code>'+p.pkg+'</code></div><div><b>② Firewall管理</b><code>'+p.fw+'</code></div></div>'+
'<div class="linux-layer-arrow">↓ その環境の中で使う管理基盤</div>'+
'<div class="linux-layer-row shared"><b>③ Service / Log管理</b><span>⚙ systemd</span><small>Ubuntu系でもRHEL系でも採用される共通基盤。ディストリビューションとは別の分類軸です。</small></div>'+
'<div class="linux-layer-arrow">↓ systemdがServiceを管理</div>'+
'<div class="linux-layer-row app"><b>④ アプリ / ツール</b><span>nginx / Docker / Ansible …</span><small>それぞれ固有のコマンドを持つことがあります。</small></div>'+
'</div>'+
'<p class="linux-layer-summary">覚え方：<strong>「どのLinux？」→「何を管理する？」→「どのツール？」</strong>。<code>systemctl</code> は「systemdにService操作を頼むコマンド」です。</p></div>';}
function decorateDistroModal(root){var dlg=(root||document).querySelector&& (root||document).querySelector('.linux-distro-dialog');if(!dlg||dlg.querySelector('.linux-layer-guide'))return;var help=dlg.querySelector('.linux-distro-help');var wrap=document.createElement('div');wrap.innerHTML=guideHTML(false);var guide=wrap.firstElementChild;if(help)dlg.insertBefore(guide,help);else dlg.appendChild(guide);dlg.querySelectorAll('.linux-distro-card .linux-distro-stack').forEach(function(stack){var rows=stack.querySelectorAll('span');if(rows[2])rows[2].innerHTML='Service管理 <code>systemd</code> <small class="linux-layer-shared-note">← 両系統で共通</small>';});}
function openGuide(){var old=document.querySelector('.linux-layer-modal');if(old)old.remove();var modal=document.createElement('div');modal.className='linux-layer-modal';modal.innerHTML='<div class="linux-layer-dialog" role="dialog" aria-modal="true" aria-label="Linux分類レイヤーの説明"><button type="button" class="linux-layer-close" aria-label="閉じる">×</button><h2>Linuxの分類をレイヤーで見る</h2>'+guideHTML(false)+'</div>';document.body.appendChild(modal);modal.querySelector('.linux-layer-close').onclick=function(){modal.remove()};modal.addEventListener('click',function(e){if(e.target===modal)modal.remove()});}
function addBarButton(){var bar=document.querySelector('.linux-distro-bar');if(!bar||bar.querySelector('.linux-layer-open'))return;var b=document.createElement('button');b.type='button';b.className='linux-layer-open';b.textContent='分類の見方';b.onclick=openGuide;bar.appendChild(b);}
function addScopeNote(){var legend=document.querySelector('.linux-scope-legend');if(!legend||document.querySelector('.linux-layer-mini-note'))return;var n=document.createElement('button');n.type='button';n.className='linux-layer-mini-note';n.innerHTML='<strong>💡 ここは別レイヤー</strong><span>Debian / RHEL = OSの系統　｜　systemd = Service管理基盤</span><em>図で見る →</em>';n.onclick=openGuide;legend.insertAdjacentElement('afterend',n);}
function apply(root){decorateDistroModal(root||document);addBarButton();addScopeNote();}
apply(document);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)decorateDistroModal(n)})});addBarButton();addScopeNote();}).observe(document.body,{subtree:true,childList:true});
})();

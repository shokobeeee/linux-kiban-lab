(function(){
'use strict';
var KEY='linux_kiban_distro';
var PROFILES={
  debian:{id:'debian',label:'Debian / Ubuntu',family:'Debian系',pkg:'apt',fw:'ufw',init:'systemd',chip:'🟠'},
  rhel:{id:'rhel',label:'RHEL / Rocky / AlmaLinux',family:'RHEL系',pkg:'dnf',fw:'firewalld',init:'systemd',chip:'🔵'}
};
var selected='';try{selected=localStorage.getItem(KEY)||''}catch(e){}
var profile=PROFILES[selected]||null;

function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function clean(s){return String(s||'').replace(/^\s*\$\s*/,'').trim()}

function rhelForward(input){
  var s=String(input||'');
  var rules=[
    [/sudo apt install -y ([a-z0-9_.+:-]+)/gi,'sudo dnf install -y $1'],
    [/sudo apt install ([a-z0-9_.+:-]+)/gi,'sudo dnf install $1'],
    [/\bapt install -y ([a-z0-9_.+:-]+)/gi,'dnf install -y $1'],
    [/\bapt install ([a-z0-9_.+:-]+)/gi,'dnf install $1'],
    [/sudo apt full-upgrade\b/gi,'sudo dnf upgrade'],
    [/sudo apt upgrade\b/gi,'sudo dnf upgrade'],
    [/\bapt full-upgrade\b/gi,'dnf upgrade'],
    [/\bapt upgrade\b/gi,'dnf upgrade'],
    [/sudo apt update\b/gi,'sudo dnf makecache'],
    [/\bapt update\b/gi,'dnf makecache'],
    [/\bapt list --upgradable\b/gi,'dnf check-update'],
    [/sudo apt purge ([a-z0-9_.+:-]+)/gi,'sudo dnf remove $1'],
    [/\bapt purge ([a-z0-9_.+:-]+)/gi,'dnf remove $1'],
    [/sudo apt remove ([a-z0-9_.+:-]+)/gi,'sudo dnf remove $1'],
    [/\bapt remove ([a-z0-9_.+:-]+)/gi,'dnf remove $1'],
    [/sudo apt autoremove\b/gi,'sudo dnf autoremove'],
    [/\bapt autoremove\b/gi,'dnf autoremove'],
    [/\bapt clean\b/gi,'dnf clean all'],
    [/\bapt-cache policy ([a-z0-9_.+:-]+)/gi,'dnf info $1'],
    [/\bapt list -a ([a-z0-9_.+:-]+)/gi,'dnf --showduplicates list $1'],
    [/\bapt-mark hold ([a-z0-9_.+:-]+)/gi,'dnf versionlock add $1'],
    [/\bapt-mark unhold ([a-z0-9_.+:-]+)/gi,'dnf versionlock delete $1'],
    [/\bapt-cache depends ([a-z0-9_.+:-]+)/gi,'dnf repoquery --requires $1'],
    [/\bapt --fix-broken install\b/gi,'dnf check  # APTの完全同等ではなく整合性確認'],
    [/\bdpkg -l\b/gi,'rpm -qa'],
    [/\bdpkg -L ([a-z0-9_.+:-]+)/gi,'rpm -ql $1'],
    [/\bdpkg -S ([^\s]+)/gi,'rpm -qf $1'],
    [/sudo dpkg --unpack broken-package\.deb/gi,'sudo rpm -ivh --nodeps broken-package.rpm  # simulation'],
    [/sudo apt-key del DEADBEEF/gi,'sudo rpm -e gpg-pubkey-deadbeef  # simulation'],
    [/sudo flock \/var\/lib\/dpkg\/lock-frontend sleep 60/gi,'sudo flock /var/run/dnf.pid sleep 60  # simulation'],
    [/sudo pkill -f "flock \/var\/lib\/dpkg\/lock-frontend"/gi,'sudo pkill -f "flock /var/run/dnf.pid"  # simulation'],
    [/sudo ufw allow (80|443)\/tcp/gi,'sudo firewall-cmd --permanent --add-port=$1/tcp && sudo firewall-cmd --reload'],
    [/\bufw allow (80|443)\/tcp/gi,'firewall-cmd --permanent --add-port=$1/tcp && firewall-cmd --reload'],
    [/sudo ufw deny (80|443)\/tcp/gi,'sudo firewall-cmd --permanent --remove-port=$1/tcp && sudo firewall-cmd --reload'],
    [/\bufw deny (80|443)\/tcp/gi,'firewall-cmd --permanent --remove-port=$1/tcp && firewall-cmd --reload'],
    [/sudo ufw status verbose\b/gi,'sudo firewall-cmd --list-all'],
    [/sudo ufw status\b/gi,'sudo firewall-cmd --list-all'],
    [/\bufw status verbose\b/gi,'firewall-cmd --list-all'],
    [/\bufw status\b/gi,'firewall-cmd --list-all'],
    [/sudo ufw disable\b/gi,'sudo systemctl stop firewalld'],
    [/\bufw disable\b/gi,'systemctl stop firewalld'],
    [/sudo ufw enable\b/gi,'sudo systemctl start firewalld'],
    [/\bufw enable\b/gi,'systemctl start firewalld']
  ];
  rules.forEach(function(r){s=s.replace(r[0],r[1])});
  return s;
}

function missionText(){var n=document.querySelector('.mobile-learning-task strong');return n?(n.textContent||''):''}
function rhelReverse(input){
  var raw=clean(input).replace(/\s+#.*$/,'').trim();
  var s=raw;
  var m;
  if((m=s.match(/^sudo\s+dnf\s+install\s+(-y\s+)?([a-z0-9_.+:-]+)$/i)))return'sudo apt install '+(m[1]?'-y ':'')+m[2];
  if((m=s.match(/^dnf\s+install\s+(-y\s+)?([a-z0-9_.+:-]+)$/i)))return'apt install '+(m[1]?'-y ':'')+m[2];
  if(/^sudo\s+dnf\s+makecache$/i.test(s))return'sudo apt update';
  if(/^dnf\s+makecache$/i.test(s))return'apt update';
  if(/^dnf\s+check-update$/i.test(s))return'apt list --upgradable';
  if(/^sudo\s+dnf\s+upgrade(?:\s+-y)?$/i.test(s))return'sudo apt upgrade';
  if(/^dnf\s+upgrade(?:\s+-y)?$/i.test(s))return'apt upgrade';
  if((m=s.match(/^(sudo\s+)?dnf\s+remove\s+([a-z0-9_.+:-]+)$/i))){
    var purge=/purge|設定.*削除|設定込み/i.test(missionText());return(m[1]?'sudo ':'')+'apt '+(purge?'purge ':'remove ')+m[2];
  }
  if(/^sudo\s+dnf\s+autoremove$/i.test(s))return'sudo apt autoremove';
  if(/^dnf\s+autoremove$/i.test(s))return'apt autoremove';
  if(/^sudo\s+firewall-cmd\s+--list-all$/i.test(s))return'sudo ufw status verbose';
  if(/^firewall-cmd\s+--list-all$/i.test(s))return'ufw status verbose';
  if(/^sudo\s+systemctl\s+stop\s+firewalld$/i.test(s))return'sudo ufw disable';
  if(/^systemctl\s+stop\s+firewalld$/i.test(s))return'ufw disable';
  if(/^sudo\s+systemctl\s+start\s+firewalld$/i.test(s))return'sudo ufw enable';
  if(/^systemctl\s+start\s+firewalld$/i.test(s))return'ufw enable';
  if((m=s.match(/^sudo\s+firewall-cmd\s+--permanent\s+--add-port=(80|443)\/tcp\s*&&\s*sudo\s+firewall-cmd\s+--reload$/i)))return'sudo ufw allow '+m[1]+'/tcp';
  if((m=s.match(/^firewall-cmd\s+--permanent\s+--add-port=(80|443)\/tcp\s*&&\s*firewall-cmd\s+--reload$/i)))return'ufw allow '+m[1]+'/tcp';
  if((m=s.match(/^sudo\s+firewall-cmd\s+--permanent\s+--remove-port=(80|443)\/tcp\s*&&\s*sudo\s+firewall-cmd\s+--reload$/i)))return'sudo ufw deny '+m[1]+'/tcp';
  if((m=s.match(/^firewall-cmd\s+--permanent\s+--remove-port=(80|443)\/tcp\s*&&\s*firewall-cmd\s+--reload$/i)))return'ufw deny '+m[1]+'/tcp';
  if(/^sudo\s+rpm\s+-ivh\s+--nodeps\s+broken-package\.rpm$/i.test(s))return'sudo dpkg --unpack broken-package.deb';
  if(/^sudo\s+rpm\s+-e\s+gpg-pubkey-deadbeef$/i.test(s))return'sudo apt-key del DEADBEEF';
  if(/^sudo\s+flock\s+\/var\/run\/dnf\.pid\s+sleep\s+60$/i.test(s))return'sudo flock /var/lib/dpkg/lock-frontend sleep 60';
  if(/^sudo\s+pkill\s+-f\s+"flock \/var\/run\/dnf\.pid"$/i.test(s))return'sudo pkill -f "flock /var/lib/dpkg/lock-frontend"';
  if(/^sudo\s+dnf\s+check$/i.test(s))return'sudo apt --fix-broken install';
  return input;
}

function adapt(s){return profile&&profile.id==='rhel'?rhelForward(s):String(s||'')}
function canonicalize(s){return profile&&profile.id==='rhel'?rhelReverse(s):s}
window.LinuxLabDistro={get:function(){return profile},profiles:PROFILES,adaptCommand:adapt,canonicalizeInput:canonicalize};

function openModal(force){
  var old=document.querySelector('.linux-distro-modal');if(old)old.remove();
  var modal=document.createElement('div');modal.className='linux-distro-modal';
  modal.innerHTML='<div class="linux-distro-dialog" role="dialog" aria-modal="true" aria-label="Linux学習環境の選択">'+
    '<h2>🐧 学習するLinux環境を選択</h2><p>同じ目的でも、ディストリビューションによってPackage ManagerやFirewallの操作が変わります。ここで選んだ環境に、演習コマンドと入力判定を合わせます。</p>'+
    '<div class="linux-distro-cards">'+
      '<button class="linux-distro-card debian" data-distro="debian"><strong>🟠 Debian / Ubuntu系</strong><span class="family">Debian family profile</span><div class="linux-distro-stack"><span>Package <code>apt / dpkg</code></span><span>Firewall <code>ufw</code></span><span>Service <code>systemd</code></span></div></button>'+
      '<button class="linux-distro-card rhel" data-distro="rhel"><strong>🔵 RHEL / Rocky / AlmaLinux系</strong><span class="family">RHEL family profile</span><div class="linux-distro-stack"><span>Package <code>dnf / rpm</code></span><span>Firewall <code>firewalld</code></span><span>Service <code>systemd</code></span></div></button>'+
    '</div><div class="linux-distro-help">実機の種類が分からないときは <code>cat /etc/os-release</code> で確認します。<br>※ このサイトはLinux実機ではなく学習シミュレーターです。選択した環境に代表コマンドを合わせます。</div>'+
    (force?'':'<button class="linux-distro-close" type="button">閉じる</button>')+'</div>';
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-distro]').forEach(function(b){b.addEventListener('click',function(){try{localStorage.setItem(KEY,b.dataset.distro)}catch(e){}location.reload()})});
  var close=modal.querySelector('.linux-distro-close');if(close)close.onclick=function(){modal.remove()};
}

function addBar(){
  if(!profile||document.querySelector('.linux-distro-bar'))return;
  var bar=document.createElement('div');bar.className='linux-distro-bar';
  bar.innerHTML='<div class="linux-distro-current"><strong>'+profile.chip+' 学習環境</strong><span>'+esc(profile.label)+' ｜ Package: <code>'+profile.pkg+'</code> / Firewall: <code>'+profile.fw+'</code> / '+profile.init+'</span></div><button type="button" class="linux-distro-change">環境を変更</button>';
  var main=document.querySelector('main');if(main)main.insertAdjacentElement('beforebegin',bar);else document.body.insertBefore(bar,document.body.firstChild);
  bar.querySelector('button').onclick=function(){openModal(false)};
}

function isCommandElement(el){
  return el&&el.matches&&el.matches('code,pre,.terminal,.mini-console,.diag-console,.incident-shell-history,.mobile-live-terminal-body,.mobile-command-choices button,.incident-command-choice,button[data-cmd],button[data-action],button[data-diag]');
}
function transformElement(el){
  if(!profile||profile.id!=='rhel'||!el)return;
  if(el.nodeType===3){var p=el.parentElement;if(!p||!isCommandElement(p))return;var n=adapt(el.nodeValue);if(n!==el.nodeValue)el.nodeValue=n;return}
  if(el.nodeType!==1)return;
  if(!isCommandElement(el))return;
  var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n;
  while((n=w.nextNode())){var t=adapt(n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t}
}
function transformCommands(root){
  if(!profile||profile.id!=='rhel')return;
  if(root&&root.nodeType===1&&isCommandElement(root))transformElement(root);
  (root||document).querySelectorAll&& (root||document).querySelectorAll('code,pre,.terminal,.mini-console,.diag-console,.incident-shell-history,.mobile-live-terminal-body,.mobile-command-choices button,.incident-command-choice,button[data-cmd],button[data-action],button[data-diag]').forEach(transformElement);
}

function scopeFor(cmd){
  var s=clean(cmd).replace(/^sudo\s+/,'').toLowerCase(),first=(s.match(/^([a-z0-9_.+\/-]+)/)||[])[1]||'';
  if(/^(dnf|rpm|firewall-cmd)$/.test(first))return['rhel','🔵 RHEL / Rocky / Alma系'];
  if(/^(apt|apt-get|apt-key|dpkg|ufw)$/.test(first))return['debian','🟠 Debian / Ubuntu系'];
  if(/^(systemctl|journalctl|systemd-analyze|loginctl|timedatectl)$/.test(first))return['systemd','⚙ systemd系'];
  if(first==='nginx')return['nginx','🟣 nginx固有'];
  if(/^(docker|podman|ansible|ansible-playbook|ansible-inventory|promtool|openssl|cloud-init|virsh|aws|ausearch|grub-reboot|nft)$/.test(first))return['special','🟣 ツール / 環境依存'];
  return['common','🟢 Linuxで広く利用'];
}
function chip(cmd){var x=scopeFor(cmd);return'<span class="linux-scope-chip '+x[0]+'">'+x[1]+'</span>'}
function latest(text){var a=String(text||'').split(/\r?\n/);for(var i=a.length-1;i>=0;i--){var m=a[i].trim().match(/^\$\s+(.+)$/);if(m)return m[1]}return''}
function retag(){
  document.querySelectorAll('.mobile-command-choices button').forEach(function(b){var c=b.querySelector('code');if(!c)return;var wrap=b.querySelector('.command-scope-badges');if(!wrap){wrap=document.createElement('span');wrap.className='command-scope-badges';b.appendChild(wrap)}wrap.innerHTML=chip(c.textContent)});
  document.querySelectorAll('.incident-command-choice').forEach(function(b){var c=b.querySelector('code');if(!c)return;var spans=[].slice.call(b.children).filter(function(x){return x.tagName==='SPAN'});if(spans[0])spans[0].innerHTML=chip(c.textContent)});
  document.querySelectorAll('.incident-command-feedback').forEach(function(f){var c=f.querySelector('code'),s=f.querySelector('.linux-scope-chip');if(c&&s){var x=scopeFor(c.textContent);s.className='linux-scope-chip '+x[0];s.textContent=x[1]}});
  var live=document.querySelector('.mobile-live-terminal'),bar=live&&live.querySelector('.mobile-live-command-scope'),body=live&&live.querySelector('.mobile-live-terminal-body');
  if(bar&&body){var cmd=adapt(latest(body.textContent));if(cmd)bar.innerHTML='<div class="mobile-live-command-scope-top"><span class="mobile-live-command-scope-label">このコマンドは</span>'+chip(cmd)+'</div><code>$ '+esc(cmd)+'</code>'}
  var legend=document.querySelector('.linux-scope-legend');if(legend&&profile&&profile.id==='rhel'&&!legend.querySelector('.linux-scope-chip.rhel')){var x=document.createElement('span');x.className='linux-scope-chip rhel';x.textContent='🔵 RHEL / Rocky / Alma系';var strong=legend.querySelector('strong');strong.insertAdjacentElement('afterend',x)}
}

function pageContext(){
  if(!profile)return;
  document.body.classList.add('distro-'+profile.id);
  var m=location.pathname.match(/lab(\d{2})/i),lab=m?Number(m[1]):0;
  if((lab===2||lab===9)&&!document.querySelector('.linux-distro-context')){
    var h=document.querySelector('h1');if(h){var n=document.createElement('div');n.className='linux-distro-context';
      if(profile.id==='rhel')n.innerHTML='<strong>🔵 RHEL系プロファイルで演習中</strong> — 操作問題・Terminal・入力判定は <code>dnf / rpm / firewalld</code> を中心に変換します。APT/UFW固有の内部解説は比較用の参考として残します。<div class="linux-distro-warning">⚠ 障害注入用コマンドはシミュレーション例です。本番環境へコピーしないでください。</div>';
      else n.innerHTML='<strong>🟠 Debian / Ubuntu系プロファイルで演習中</strong> — <code>apt / dpkg / ufw</code> を使う構成で進みます。<div class="linux-distro-warning">⚠ 障害注入用コマンドはシミュレーション例です。本番環境へコピーしないでください。</div>';
      h.insertAdjacentElement('afterend',n)}
  }
  if(profile.id==='rhel'&&lab===9){
    document.title=document.title.replace(/APT \/ Package \/ Repository/i,'DNF / RPM / Repository');
    document.querySelectorAll('h1,.lab-title,.series-nav strong,.series-nav span.current').forEach(function(el){el.textContent=el.textContent.replace(/APT\s*\/\s*Package/gi,'DNF / RPM').replace(/APT\s*\/\s*Package\s*\/\s*Repository/gi,'DNF / RPM / Repository')});
    document.querySelectorAll('h2').forEach(function(h){if(/\bAPT\b|\bdpkg\b|APT Lock|UFW/i.test(h.textContent)&&!h.querySelector('.linux-distro-reference')){var s=document.createElement('span');s.className='linux-distro-reference';s.textContent='Debian系の参考';h.appendChild(s)}});
  }
  if(profile.id==='rhel'&&lab===2){document.querySelectorAll('h2').forEach(function(h){if(/UFW/i.test(h.textContent)&&!h.querySelector('.linux-distro-reference')){var s=document.createElement('span');s.className='linux-distro-reference';s.textContent='Debian系の参考';h.appendChild(s)}})}
}

function rewriteInputBeforeSubmit(target){
  if(!profile||profile.id!=='rhel')return;
  var input=null;
  if(target&&target.matches&&target.matches('.mobile-engineer-prompt input,.incident-shell-prompt input'))input=target;
  else if(target&&target.closest){var p=target.closest('.mobile-engineer-prompt,.incident-shell-prompt');input=p&&p.querySelector('input')}
  if(!input||!input.value.trim())return;
  var canon=canonicalize(input.value);if(canon!==input.value){input.dataset.distroOriginal=input.value;input.value=canon}
}
document.addEventListener('click',function(e){if(e.target.closest('.mobile-engineer-prompt button,.incident-shell-prompt button'))rewriteInputBeforeSubmit(e.target)},true);
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.matches('.mobile-engineer-prompt input,.incident-shell-prompt input'))rewriteInputBeforeSubmit(e.target)},true);

function apply(root){pageContext();transformCommands(root||document);retag()}
if(!profile){openModal(true)}else{addBar();apply(document)}
var queued=false;new MutationObserver(function(ms){if(!profile)return;ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1||n.nodeType===3)transformCommands(n.nodeType===1?n:n.parentElement)});if(m.type==='characterData')transformElement(m.target)});if(!queued){queued=true;requestAnimationFrame(function(){queued=false;retag()})}}).observe(document.body,{subtree:true,childList:true,characterData:true});
})();

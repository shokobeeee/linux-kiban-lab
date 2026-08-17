(function(){
'use strict';
if(!matchMedia('(max-width:820px)').matches)return;
var m=location.pathname.match(/lab(\d{2})/i);if(!m)return;
var lab=Number(m[1]);if(lab<12||lab>20)return;

function P(key,label,cmd,purpose,patterns){return{key:key,label:label,cmd:cmd,purpose:purpose,patterns:patterns||[]}}
var CFG={
12:[
 P('schedule','Schedule','crontab -l','定期実行のSchedule設定を確認',[/\bcrontab\b.*-l/i,/\bsystemctl\b.*\bcron\b/i]),
 P('env','Environment / PATH','env | grep -E "^(PATH|TZ)="','Scheduler実行時のPATH/TZなどEnvironment差を確認',[/\b(printenv|env)\b/i,/echo\s+\$?(path|tz)/i]),
 P('perm','Permission','ls -l /opt/jobs/report.sh','Scriptのowner/modeと実行権限を確認',[/\b(ls|stat|namei)\b.*report\.sh/i,/chmod\s+.*report\.sh/i]),
 P('timer','Timer status','systemctl status report.timer','systemd timerのenable/active状態を確認',[/systemctl.*report\.timer/i,/systemctl.*list-timers/i]),
 P('log','Journal','journalctl -u cron --since today','Scheduler実行ログから失敗理由を確認',[/journalctl.*\bcron\b/i,/journalctl.*report/i]),
 P('process','Process / overlap','pgrep -af report.sh','Jobの多重実行や残存Processを確認',[/\b(pgrep|ps)\b.*report/i,/\bflock\b/i])
],
13:[
 P('job','Backup job','systemctl status backup.service','Backup Job/Serviceの実行状態を確認',[/systemctl.*backup/i,/journalctl.*backup/i]),
 P('age','Age / RPO','stat /backup/latest.tar.gz','最新Backupの更新時刻を見てRPOを確認',[/\bstat\b.*backup/i,/\bfind\b.*backup/i]),
 P('dest','Destination','findmnt /backup','Backup destinationのmount先・到達先を確認',[/\bfindmnt\b.*backup/i,/\bmount\b.*backup/i]),
 P('integrity','Integrity','sha256sum -c /backup/latest.tar.gz.sha256','Backup Fileのchecksum整合性を確認',[/sha(256|512)sum.*-c/i,/\bmd5sum\b.*-c/i]),
 P('restore','Restore test','tar -tzf /backup/latest.tar.gz | head','Archiveを読めるかRestore観点で検証',[/\btar\b.*-[^ ]*t/i,/restore.*test/i]),
 P('capacity','Capacity','df -h /backup','Backup先Filesystemの空き容量を確認',[/\bdf\b.*backup/i,/\bdu\b.*backup/i])
],
14:[
 P('ps','Container status','docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"','Containerの起動状態とPort公開を確認',[/\b(docker|podman)\s+ps\b/i]),
 P('port','Port mapping','docker port web; ss -ltnp','Container PortとHost LISTENを突き合わせる',[/\b(docker|podman)\s+port\b/i,/\bss\b.*-l/i]),
 P('logs','Container logs','docker logs --tail 50 web','Container stdout/stderrからApplication Errorを確認',[/\b(docker|podman)\s+logs\b/i]),
 P('inspect','Inspect','docker inspect web','Container設定・Network・Mount・Restart policyを確認',[/\b(docker|podman)\s+inspect\b/i]),
 P('volume','Volume / permission','docker inspect web --format "{{json .Mounts}}"','Volume mount先とPermissionを確認',[/\b(docker|podman)\s+(inspect|volume)\b.*(mount|volume)?/i,/\b(ls|stat)\b.*volume/i]),
 P('network','Container network / DNS','docker exec web getent hosts db','Container内部の名前解決・Network到達性を確認',[/\b(docker|podman)\s+exec\b.*(getent|ping|curl)/i,/\b(docker|podman)\s+network\b/i])
],
15:[
 P('dns','DNS','dig +short server01.lab.test','Hostnameが期待するIPへ解決されるか確認',[/\b(dig|nslookup|host|getent)\b/i]),
 P('tcp','TCP / 443','curl -vkI https://server01.lab.test','TCP443/TLS接続が成立するか確認',[/\bcurl\b.*https/i,/\b(nc|ncat|telnet)\b.*443/i,/\bss\b.*443/i]),
 P('cert','Certificate dates / SAN','openssl x509 -in /etc/ssl/certs/server.crt -noout -dates -ext subjectAltName','Certificateの期限とSANを確認',[/openssl\s+x509/i]),
 P('chain','Certificate chain','openssl s_client -connect server01.lab.test:443 -servername server01.lab.test -showcerts','Serverが返すCertificate chainを確認',[/openssl\s+s_client/i]),
 P('key','nginx config / key','sudo nginx -t','Certificate/Keyを含むnginx設定の整合性を検証',[/\bnginx\b\s+-t/i]),
 P('clock','System clock','timedatectl status','TLS判定に影響するSystem時刻・Timezoneを確認',[/\btimedatectl\b/i,/\bdate\b/i])
],
16:[
 P('probe','Availability probe','curl -fsS http://localhost/health','利用者視点のHealth endpointを確認',[/\bcurl\b.*health/i,/\bwget\b.*health/i]),
 P('metric','Metrics','curl -s http://localhost:9100/metrics | head','Exporter/Application metricsが取得できるか確認',[/\bcurl\b.*metrics/i]),
 P('exporter','Exporter health','systemctl status node_exporter','Metrics exporter自体の稼働状態を確認',[/systemctl.*exporter/i]),
 P('log','Service log','journalctl -u app.service -n 50 --no-pager','Service logとError時系列を確認',[/journalctl.*app/i,/journalctl.*service/i]),
 P('rule','Alert rule','promtool check rules /etc/prometheus/rules.yml','Alert ruleのSyntax/設定誤りを確認',[/\bpromtool\b.*rules/i]),
 P('slo','SLI / SLO','curl -sG http://localhost:9090/api/v1/query --data-urlencode "query=up"','監視BackendからSLIとなるQuery結果を確認',[/\bcurl\b.*9090.*query/i,/\bpromtool\b.*query/i])
],
17:[
 P('inventory','Inventory','ansible-inventory --graph','対象Host/GroupがInventoryに存在するか確認',[/ansible-inventory.*(--graph|--list)/i]),
 P('ssh','SSH connectivity','ssh -vv app01','SSHの接続・Host key・認証過程を詳細確認',[/\bssh\b.*-v/i]),
 P('syntax','Syntax check','ansible-playbook site.yml --syntax-check','Playbook Syntaxを実行前に検証',[/ansible-playbook.*syntax-check/i]),
 P('become','Become / sudo','ansible app -m command -a id --become','Remote Userのbecome/sudo可否を確認',[/\bansible\b.*--become/i,/ansible-playbook.*--become/i]),
 P('vars','Variables','ansible-inventory --host app01','Host Variablesの解決結果を確認',[/ansible-inventory.*--host/i,/ansible.*debug.*var/i]),
 P('recap','Dry-run / recap','ansible-playbook site.yml --check --diff','Check modeで変更予定とPLAY RECAPを確認',[/ansible-playbook.*--check/i,/ansible-playbook.*--diff/i])
],
18:[
 P('guest','Guest IP / service','ip addr; systemctl --failed','Guest OS内のIPと失敗Serviceを確認',[/\bip\b.*addr/i,/systemctl.*--failed/i]),
 P('sg','Cloud security','aws ec2 describe-security-groups --group-ids sg-web','Cloud Security GroupをProvider CLI/APIで確認（AWS CLIを例示）',[/aws\s+ec2.*security-groups/i,/\bfirewall-cmd\b/i,/\bnft\b.*ruleset/i]),
 P('route','Virtual route','ip route','Guest/Virtual NetworkのRouteを確認',[/\bip\b.*route/i,/\broute\b\s+-n/i]),
 P('disk','Block storage','lsblk -f; df -h','Block device・Filesystem・使用率を確認',[/\blsblk\b/i,/\bdf\b.*-h/i]),
 P('cloudinit','cloud-init','cloud-init status --long','Provisioning/cloud-initの完了・失敗を確認',[/cloud-init.*status/i]),
 P('host','Hypervisor pressure','virsh domstats vm01','Host/Hypervisor側のVM Resource統計を確認',[/\bvirsh\b.*(domstats|dominfo)/i,/\bvmstat\b/i])
],
19:[
 P('ports','Listen ports','ss -ltnp','不要/想定外のListen PortとProcessを確認',[/\bss\b.*-l/i,/\bnetstat\b.*-l/i]),
 P('ssh','sshd config','sshd -T | grep -E "permitrootlogin|passwordauthentication"','実効sshd設定のHardening状態を確認',[/\bsshd\b.*-T/i,/grep.*sshd_config/i]),
 P('perm','Secret permissions','find /etc -xdev -type f -perm /077 -ls | head','過剰権限のFile/Secretを探索',[/\bfind\b.*-perm/i,/\bstat\b.*secret/i]),
 P('patch','Patch / version','apt list --upgradable','Security Patch適用状況を確認（Debian/Ubuntu例）',[/\bapt\b.*(upgradable|policy|list)/i,/\bdpkg\b.*-l/i]),
 P('audit','Audit log','ausearch -ts today | tail -50','Security/Audit Eventを確認',[/\bausearch\b/i,/journalctl.*audit/i]),
 P('change','Change history','journalctl --since "-2 hours" | tail -50','直近Changeと障害発生時刻を時系列で突き合わせる',[/journalctl.*--since/i,/grep.*history/i])
],
20:[
 P('network','Network / route','ip addr; ip route','IP/Routeの基本到達性を確認',[/\bip\b.*(addr|route)/i,/\bping\b/i]),
 P('dns','DNS','dig +short server01.lab.test','名前解決結果を確認',[/\b(dig|nslookup|host|getent)\b/i]),
 P('service','Service / port','systemctl status nginx; ss -ltnp','Service状態とLISTEN Portを確認',[/systemctl.*(nginx|app|worker)/i,/\bss\b.*-l/i]),
 P('security','FW / SG / permission','sudo nft list ruleset','Host Firewallを確認。Cloud SGはProvider CLI/Consoleも併用',[/\bnft\b.*ruleset/i,/\bufw\b.*status/i,/\bfirewall-cmd\b/i,/aws\s+ec2.*security-groups/i,/\bstat\b.*(key|secret)/i]),
 P('resource','CPU / Memory','free -h; ps aux --sort=-%mem | head','Memory/CPU圧迫と主要Processを確認',[/\bfree\b/i,/\b(top|htop|vmstat)\b/i,/ps\s+.*%mem/i]),
 P('storage','Disk / inode','df -h; df -i','容量とinodeを両方確認',[/\bdf\b.*-h/i,/\bdf\b.*-i/i,/\blsblk\b/i]),
 P('log','Logs','journalctl -p warning -n 50 --no-pager','System/Service Errorを時系列で確認',[/\bjournalctl\b/i,/\bdmesg\b/i,/\btail\b.*log/i]),
 P('change','Change history','journalctl --since "-2 hours" | tail -50','障害直前のChangeを時系列で確認',[/journalctl.*--since/i,/grep.*(history|change)/i])
]};
var items=CFG[lab];if(!items)return;

function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function normalize(s){return String(s||'').trim().replace(/^\$\s*/,'').replace(/^sudo\s+/,'').replace(/parrot\.local/gi,'server01.lab.test').replace(/learner@parrot/gi,'learner@server01').replace(/\s+/g,' ').toLowerCase()}
function scope(cmd){var s=normalize(cmd),first=(s.match(/^([a-z0-9_.+\/-]+)/)||[])[1]||'';if(/^(apt|apt-get|apt-key|dpkg|ufw)$/.test(first))return['debian','🟠 Debian / Ubuntu系'];if(/^(systemctl|journalctl|systemd-analyze|loginctl|timedatectl)$/.test(first))return['systemd','⚙ systemd系'];if(first==='nginx')return['nginx','🟣 nginx固有'];if(/^(docker|podman|ansible|ansible-playbook|ansible-inventory|promtool|openssl|cloud-init|virsh|aws|ausearch)$/.test(first))return['special','🟣 ツール / 環境依存'];return['common','🟢 Linuxで広く利用']}
function scopeHTML(cmd){var x=scope(cmd);return'<span class="linux-scope-chip '+x[0]+'">'+x[1]+'</span>'}

var baseContainer,baseButtons,newBtn,consoleEl,anchor;
if(lab===20){
 baseContainer=document.querySelector('.evidence-grid');baseButtons=[].slice.call(document.querySelectorAll('.evidence-grid button[data-ev]'));newBtn=document.getElementById('new');consoleEl=document.getElementById('evidence');anchor=baseContainer;
}else{
 baseContainer=document.getElementById('diagButtons');baseButtons=baseContainer?[].slice.call(baseContainer.querySelectorAll('button')):[];newBtn=document.getElementById('newIncidentBtn');consoleEl=document.getElementById('diagConsole');anchor=baseContainer;
}
if(!baseContainer||!consoleEl||baseButtons.length<items.length)return;
items.forEach(function(it,i){it.button=lab===20?(baseButtons.find(function(b){return b.dataset.ev===it.key})||baseButtons[i]):baseButtons[i]});

var KEY='linux_kiban_incident_mode',mode='guided',ready=lab===20,wrong=0;
try{mode=localStorage.getItem(KEY)||mode}catch(e){}
if(!/^(guided|standard|engineer)$/.test(mode))mode='guided';

var box=document.createElement('div');box.className='incident-mode-box';
box.innerHTML='<div class="incident-mode-head"><strong>🕵 障害対応モード</strong><span></span></div><div class="incident-mode-buttons"></div><div class="incident-mode-note"></div>';
[['guided','🐣 Guided'],['standard','🐧 Standard'],['engineer','🔥 Engineer']].forEach(function(x){var b=document.createElement('button');b.type='button';b.dataset.mode=x[0];b.textContent=x[1];b.onclick=function(){setMode(x[0])};box.querySelector('.incident-mode-buttons').appendChild(b)});
anchor.parentNode.insertBefore(box,anchor);

var zone=document.createElement('div');zone.className='incident-command-zone';
zone.innerHTML='<div class="incident-standard-palette"></div><div class="incident-engineer-shell"><div class="incident-shell-history">$ evidence terminal ready</div><div class="incident-shell-prompt"><span>learner@server01:~$</span><input autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="調査コマンドを入力"><button type="button">実行</button></div></div><div class="incident-command-feedback"></div>';
baseContainer.parentNode.insertBefore(zone,consoleEl);
var palette=zone.querySelector('.incident-standard-palette'),shell=zone.querySelector('.incident-engineer-shell'),history=zone.querySelector('.incident-shell-history'),input=zone.querySelector('input'),runBtn=zone.querySelector('.incident-shell-prompt button'),feedback=zone.querySelector('.incident-command-feedback');

items.forEach(function(it){var b=document.createElement('button');b.type='button';b.className='incident-command-choice';b.innerHTML='<code>'+esc(it.cmd)+'</code><span>'+scopeHTML(it.cmd)+'</span><small>'+esc(it.purpose)+'</small>';b.onclick=function(){execute(it,it.cmd,b)};palette.appendChild(b)});

function findItem(raw){var n=normalize(raw);for(var i=0;i<items.length;i++){var it=items[i];if(normalize(it.cmd)===n)return it;for(var j=0;j<it.patterns.length;j++){if(it.patterns[j].test(raw)||it.patterns[j].test(n))return it}}return null}
function appendHistory(cmd){history.textContent+=(history.textContent?'\n':'')+'$ '+cmd;history.scrollTop=history.scrollHeight}
function execute(it,cmd,button){if(!ready){feedback.className='incident-command-feedback warn';feedback.textContent='⚠ 先に「新しい障害 / New Incident」を開始してください。';return}wrong=0;appendHistory(cmd);feedback.className='incident-command-feedback ok';feedback.innerHTML='✅ '+scopeHTML(cmd)+' <strong>'+esc(it.purpose)+'</strong>';if(button)button.classList.add('used');if(it.button){it.button.click()}setTimeout(function(){if(consoleEl)consoleEl.scrollTop=consoleEl.scrollHeight},30)}
function submit(){var v=input.value.trim();if(!v)return;var it=findItem(v);if(!it){wrong++;appendHistory(v);feedback.className='incident-command-feedback ng';feedback.innerHTML='❌ このシミュレーターでは、そのCommandから証拠を取得できません。<br>「次に何を知りたいか」を決めて調査Commandを選ぼう。'+(wrong>=2?'<br><small>Hint: ip / ss / systemctl / journalctl / df など、観点に対応するCommandを考える。</small>':'');input.select();return}execute(it,v);input.value='';input.focus()}
runBtn.onclick=submit;input.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();submit()}};

items.forEach(function(it){if(!it.button)return;it.button.addEventListener('click',function(){if(mode==='guided'&&ready){appendHistory(it.cmd);feedback.className='incident-command-feedback ok';feedback.innerHTML='💡 この観点をLinuxで確認する代表例: '+scopeHTML(it.cmd)+' <code>'+esc(it.cmd)+'</code>'}},false)});

if(newBtn)newBtn.addEventListener('click',function(){setTimeout(function(){ready=true;wrong=0;history.textContent='$ new incident started';feedback.className='incident-command-feedback';feedback.textContent=mode==='guided'?'観点を選んで証拠を集めます。':mode==='standard'?'実行する調査Commandを選んでください。':'Terminalから調査Commandを入力してください。';palette.querySelectorAll('button').forEach(function(b){b.classList.remove('used')})},0)},false);

function setMode(m){mode=m;try{localStorage.setItem(KEY,m)}catch(e){};box.querySelectorAll('[data-mode]').forEach(function(b){b.classList.toggle('active',b.dataset.mode===m)});var cap=box.querySelector('.incident-mode-head span'),note=box.querySelector('.incident-mode-note');baseContainer.classList.toggle('incident-hide-base',m!=='guided');palette.hidden=m!=='standard';shell.hidden=m!=='engineer';if(m==='guided'){cap.textContent='観点 → 証拠';note.innerHTML='<strong>目的:</strong> まず「どこを見るか」を身につける。押した観点に対応する代表Commandも下に表示。';feedback.textContent='観点を押して証拠を集めます。'}else if(m==='standard'){cap.textContent='Command選択 → 証拠';note.innerHTML='<strong>目的:</strong> 症状から「次に実行するLinux Command」を選ぶ。Commandの適用範囲も確認。';feedback.textContent='実行する調査Commandを選んでください。'}else{cap.textContent='自力調査 → 証拠';note.innerHTML='<strong>目的:</strong> 何を調べるかから自分で決める。ここは安全なSimulatorで、登録済みの調査Command/代表的な同等Commandを解釈します。';feedback.textContent='Terminalから調査Commandを入力してください。';setTimeout(function(){input.focus()},0)}}
setMode(mode);
})();
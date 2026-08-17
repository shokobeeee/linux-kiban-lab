(function(){
'use strict';
if(!matchMedia('(max-width:820px)').matches)return;
var m=location.pathname.match(/lab(\d{2})/i);if(!m)return;
var lab=Number(m[1]);if(lab<12||lab>20)return;

var base=lab===20?document.querySelector('.evidence-grid'):document.getElementById('diagButtons');
var newBtn=lab===20?document.getElementById('new'):document.getElementById('newIncidentBtn');
var answerBtn=lab===20?document.getElementById('answer'):document.getElementById('answerIncidentBtn');
var modeBox=document.querySelector('.incident-mode-box');
var zone=document.querySelector('.incident-command-zone');
if(!base||!newBtn||!answerBtn||!modeBox||!zone)return;

var minEvidence=lab===20?3:2;
var seen={};
var buttons=[].slice.call(base.querySelectorAll('button'));
var feedback=zone.querySelector('.incident-command-feedback');
var history=zone.querySelector('.incident-shell-history');
var input=zone.querySelector('.incident-shell-prompt input');
var runBtn=zone.querySelector('.incident-shell-prompt button');
var palette=zone.querySelector('.incident-standard-palette');

var gate=document.createElement('div');
gate.className='incident-evidence-gate';
gate.innerHTML='<div><span>🧾 Evidence</span><strong>0 / '+minEvidence+'</strong></div><small>原因確定には、異なる観点の証拠が必要です。</small>';
var note=modeBox.querySelector('.incident-mode-note');
if(note)note.insertAdjacentElement('beforebegin',gate);else modeBox.appendChild(gate);

function countSeen(){return Object.keys(seen).length}
function updateGate(){
  var n=countSeen(),ready=n>=minEvidence;
  gate.querySelector('strong').textContent=Math.min(n,minEvidence)+' / '+minEvidence;
  gate.classList.toggle('ready',ready);
  gate.querySelector('small').textContent=ready?'✅ Evidence条件クリア。仮説を原因として確定できます。':'原因確定まであと '+(minEvidence-n)+' 観点。別レイヤーの証拠も確認しよう。';
  answerBtn.disabled=!ready;
  answerBtn.classList.toggle('incident-answer-locked',!ready);
  answerBtn.title=ready?'Causeを確定':'Evidenceを'+minEvidence+'観点集めてからCauseを確定';
}
function resetEvidence(){seen={};updateGate()}
function evidenceKey(btn,i){return btn.dataset.ev||btn.dataset.check||btn.dataset.action||btn.textContent.trim()||String(i)}
buttons.forEach(function(btn,i){
  btn.addEventListener('click',function(){seen[evidenceKey(btn,i)]=1;setTimeout(updateGate,0)},false);
});
newBtn.addEventListener('click',function(){setTimeout(resetEvidence,0)},false);
resetEvidence();

function normalize(s){return String(s||'').trim().replace(/^\$\s*/,'').replace(/^sudo\s+/,'').toLowerCase()}
function oneScope(raw){
  var s=normalize(raw),first=(s.match(/^([a-z0-9_.+\/-]+)/)||[])[1]||'';
  if(/^(apt|apt-get|apt-key|dpkg|ufw)$/.test(first))return['debian','🟠 Debian / Ubuntu系'];
  if(/^(systemctl|journalctl|systemd-analyze|loginctl|timedatectl)$/.test(first))return['systemd','⚙ systemd系'];
  if(first==='nginx')return['nginx','🟣 nginx固有'];
  if(/^(docker|podman|ansible|ansible-playbook|ansible-inventory|promtool|openssl|cloud-init|virsh|aws|ausearch)$/.test(first))return['special','🟣 ツール / 環境依存'];
  return['common','🟢 Linux / Unixで広く利用'];
}
function scopes(raw){
  var parts=String(raw||'').split(/\s*(?:;|&&|\|\||\|)\s*/).filter(Boolean),out=[],seenScope={};
  if(!parts.length)parts=[raw];
  parts.forEach(function(p){var x=oneScope(p);if(!seenScope[x[0]]){seenScope[x[0]]=1;out.push(x)}});
  return out;
}
function chip(x){var s=document.createElement('span');s.className='linux-scope-chip '+x[0];s.textContent=x[1];return s}
function refreshPaletteScopes(){
  if(!palette)return;
  palette.querySelectorAll('.incident-command-choice').forEach(function(btn){
    var code=btn.querySelector('code'),wrap=btn.querySelector(':scope > span');if(!code||!wrap)return;
    wrap.replaceChildren();scopes(code.textContent).forEach(function(x){wrap.appendChild(chip(x))});
  });
}
refreshPaletteScopes();

var lastCommand='';
function refreshFeedbackScopes(){
  if(!feedback||!lastCommand||!feedback.classList.contains('ok'))return;
  var old=feedback.querySelector('.incident-extra-scopes');if(old)old.remove();
  var xs=scopes(lastCommand);if(xs.length<2)return;
  var wrap=document.createElement('span');wrap.className='incident-extra-scopes';
  xs.forEach(function(x){wrap.appendChild(chip(x))});
  feedback.insertBefore(wrap,feedback.firstChild);
}
if(palette)palette.addEventListener('click',function(e){var b=e.target.closest('.incident-command-choice');if(!b)return;var c=b.querySelector('code');lastCommand=c?c.textContent:'';setTimeout(refreshFeedbackScopes,0)},true);

function guardMessage(raw){
  var s=normalize(raw);
  if(lab===12&&/\bsystemctl\s+(?:status|is-active)\s+cron\b/.test(s))return'そのCommandはcron daemonの稼働確認です。Schedule内容を見るなら「crontab -l」。systemd timerを見るなら「systemctl status report.timer」を使います。';
  if(lab===18&&/\b(?:nft|firewall-cmd)\b/.test(s))return'それはHost Firewallの確認で、Cloud Security Groupとは別レイヤーです。このEvidenceではProvider側の設定を見るため、AWS CLI例なら「aws ec2 describe-security-groups --group-ids sg-web」を使います。';
  if(lab===18&&/\bvmstat\b/.test(s))return'vmstatをGuest内で実行するとGuest Resourceの確認になります。Hypervisor側の圧迫を確認するEvidenceとして、このSimulatorでは「virsh domstats vm01」を使います。';
  return'';
}
function showGuard(raw,msg){
  if(history){history.textContent+=(history.textContent?'\n':'')+'$ '+raw+'\n↳ '+msg;history.scrollTop=history.scrollHeight}
  if(feedback){feedback.className='incident-command-feedback warn';feedback.textContent='⚠ '+msg}
}
function guard(ev,raw){var msg=guardMessage(raw);if(!msg)return false;ev.preventDefault();ev.stopImmediatePropagation();showGuard(raw,msg);if(input){input.focus();input.select()}return true}
if(runBtn&&input){
  runBtn.addEventListener('click',function(e){var raw=input.value.trim();if(!raw)return;if(guard(e,raw))return;lastCommand=raw;setTimeout(refreshFeedbackScopes,0)},true);
  input.addEventListener('keydown',function(e){if(e.key!=='Enter')return;var raw=input.value.trim();if(!raw)return;if(guard(e,raw))return;lastCommand=raw;setTimeout(refreshFeedbackScopes,0)},true);
}

})();

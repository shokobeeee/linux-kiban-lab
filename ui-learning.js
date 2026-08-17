(function(){
'use strict';
if(!matchMedia('(max-width:820px)').matches||!/lab01/i.test(location.pathname))return;
var sec=[].slice.call(document.querySelectorAll('section')).find(function(s){var h=s.querySelector(':scope>h2');return h&&h.textContent.indexOf('操作してみる')>=0;});
if(!sec)return;
var slider=sec.querySelector('.mobile-operation-slider');if(!slider)return;
var op=slider.querySelector('.mobile-slide-0');if(!op)return;
var controls=op.querySelector('.mobile-control-scroll')||op;
var live=op.querySelector('.mobile-live-terminal'),liveBody=live&&live.querySelector('.mobile-live-terminal-body');
var desc=sec.querySelector(':scope>p'),tabs=sec.querySelector('.mobile-slider-tabs');
var KEY='linux_kiban_learning_mode',mode='guided';try{mode=localStorage.getItem(KEY)||mode}catch(e){}
var map={
 install:{cmd:'sudo apt install nginx',ok:['sudo apt install nginx','apt install nginx','sudo apt install -y nginx','apt install -y nginx'],purpose:'nginxパッケージをインストール'},
 start:{cmd:'sudo systemctl start nginx',ok:['sudo systemctl start nginx','systemctl start nginx'],purpose:'nginxサービスを起動'},
 browser:{cmd:'curl -I http://localhost',ok:['curl -i http://localhost','curl -i localhost','curl http://localhost','curl localhost'],purpose:'HTTP応答を確認'},
 stop:{cmd:'sudo systemctl stop nginx',ok:['sudo systemctl stop nginx','systemctl stop nginx'],purpose:'nginxサービスを停止'},
 status:{cmd:'systemctl status nginx',ok:['systemctl status nginx','sudo systemctl status nginx'],purpose:'nginxのサービス状態を確認'},
 logs:{cmd:'journalctl -u nginx',ok:['journalctl -u nginx','sudo journalctl -u nginx','journalctl -u nginx --no-pager'],purpose:'nginxのjournalを確認'}
};
function norm(s){return(s||'').trim().replace(/^\$\s*/,'').replace(/^sudo\s+/,'').replace(/\s+/g,' ').toLowerCase()}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function note(t){if(!liveBody)return;var d=document.createElement('div');d.className='mobile-terminal-note';d.textContent=t;liveBody.appendChild(d);liveBody.scrollTop=liveBody.scrollHeight}
var modeBox=document.createElement('div');modeBox.className='mobile-learning-mode';
modeBox.innerHTML='<div class="mobile-learning-mode-head"><strong>🎮 操作モード</strong><span></span></div><div class="mobile-learning-mode-buttons"></div>';
[['guided','🐣 基本'],['choice','🐧 選択'],['input','🔥 入力']].forEach(function(x){var b=document.createElement('button');b.type='button';b.dataset.mode=x[0];b.textContent=x[1];b.onclick=function(){setMode(x[0])};modeBox.lastChild.appendChild(b)});
if(tabs)tabs.parentNode.insertBefore(modeBox,tabs);else sec.insertBefore(modeBox,slider);
var panel=document.createElement('div');panel.className='mobile-learning-panel';panel.hidden=true;if(live)op.insertBefore(panel,live);else op.appendChild(panel);
var bypass=null;
function run(btn,e){bypass=btn;try{btn.click()}finally{bypass=null}setTimeout(function(){note('✓ '+e.purpose)},90)}
function candidates(e){var all=Object.keys(map).map(function(k){return map[k].cmd}).filter(function(x){return x!==e.cmd});return[e.cmd,all[(e.cmd.length+1)%all.length],all[(e.cmd.length+3)%all.length]].sort(function(a,b){return(a.length*7)%11-(b.length*7)%11})}
function showChoice(btn,e){panel.hidden=false;panel.innerHTML='<div class="mobile-learning-task"><b>MISSION</b><strong>'+esc(btn.textContent.trim())+'</strong></div><div class="mobile-learning-q">どのLinuxコマンド？</div><div class="mobile-command-choices"></div><div class="mobile-learning-feedback">正しいコマンドを選んでください。</div>';var w=panel.querySelector('.mobile-command-choices'),fb=panel.querySelector('.mobile-learning-feedback');candidates(e).forEach(function(cmd){var b=document.createElement('button');b.type='button';b.innerHTML='<code>'+esc(cmd)+'</code>';b.onclick=function(){if(cmd===e.cmd){b.classList.add('correct');fb.className='mobile-learning-feedback ok';fb.innerHTML='✅ <strong>正解。</strong> '+esc(e.purpose);run(btn,e)}else{b.classList.add('wrong');fb.className='mobile-learning-feedback ng';fb.textContent='❌ 今回の目的とは違います。何をしたい操作かから考えてみよう。'}};w.appendChild(b)})}
function showInput(btn,e){panel.hidden=false;panel.innerHTML='<div class="mobile-learning-task"><b>MISSION</b><strong>'+esc(btn.textContent.trim())+'</strong></div><div class="mobile-engineer-prompt"><span>learner@parrot:~$</span><input autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Linuxコマンドを入力"><button type="button">実行</button></div><div class="mobile-learning-feedback">コマンドを自分で入力します。</div>';var input=panel.querySelector('input'),go=panel.querySelector('.mobile-engineer-prompt button'),fb=panel.querySelector('.mobile-learning-feedback'),tries=0;function submit(){var v=input.value;if(!v.trim())return;note('$ '+v);if(e.ok.some(function(x){return norm(x)===norm(v)})){fb.className='mobile-learning-feedback ok';fb.innerHTML='✅ <strong>Accepted.</strong> '+esc(e.purpose);run(btn,e);input.value=''}else{tries++;fb.className='mobile-learning-feedback ng';fb.innerHTML='❌ もう一度。'+(tries>1?' <strong>ヒント:</strong> '+esc(e.cmd.split(' ')[0])+' 系のコマンド。':'');input.select()}}go.onclick=submit;input.onkeydown=function(ev){if(ev.key==='Enter'){ev.preventDefault();submit()}};setTimeout(function(){input.focus()},0)}
controls.addEventListener('click',function(ev){var btn=ev.target.closest('button[data-action]');if(!btn||bypass===btn)return;var k=btn.dataset.action,e=map[k];if(k==='reset'||mode==='guided'||!e)return;ev.preventDefault();ev.stopImmediatePropagation();mode==='choice'?showChoice(btn,e):showInput(btn,e)},true);
function setMode(m){mode=m;try{localStorage.setItem(KEY,m)}catch(e){};[].slice.call(modeBox.querySelectorAll('button')).forEach(function(b){b.classList.toggle('active',b.dataset.mode===m)});var cap=modeBox.querySelector('.mobile-learning-mode-head span');if(m==='guided'){cap.textContent='ボタン → LIVE Terminal';panel.hidden=true;if(desc)desc.textContent='操作を押すと、同じ画面のLIVE Terminalが即時更新されます。「結果」「Linux詳細」は横スワイプでも確認できます。'}else if(m==='choice'){cap.textContent='操作 → コマンド3択';panel.hidden=false;panel.innerHTML='<div class="mobile-learning-empty">操作ボタンを押すとコマンド3択が出ます。</div>';if(desc)desc.textContent='やりたい操作を選ぶ → 正しいLinuxコマンドを3択から選ぶ → LIVE Terminalで結果を確認。'}else{cap.textContent='操作 → 自分で入力';panel.hidden=false;panel.innerHTML='<div class="mobile-learning-empty">操作ボタンを押すとTerminal入力MISSIONが始まります。</div>';if(desc)desc.textContent='やりたい操作を選ぶ → Linuxコマンドを自分で入力 → 正しければシミュレーターが実行します。'}}
setMode(mode);
})();
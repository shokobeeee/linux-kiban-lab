(function(){
'use strict';
if(!matchMedia('(max-width:820px)').matches)return;

var m=location.pathname.match(/lab(\d{2})/i);
if(!m)return;
var lab=Number(m[1]);
if(lab<1||lab>11)return;

function E(cmd,purpose,aliases){
  return {cmd:cmd,purpose:purpose,ok:[cmd].concat(aliases||[])};
}

var LABS={
1:{
 install:E('sudo apt install nginx','nginxパッケージをインストール',['apt install nginx','sudo apt install -y nginx','apt install -y nginx']),
 start:E('sudo systemctl start nginx','nginxサービスを起動',['systemctl start nginx']),
 browser:E('curl -I http://localhost','HTTP応答を確認',['curl -I localhost','curl http://localhost','curl localhost']),
 stop:E('sudo systemctl stop nginx','nginxサービスを停止',['systemctl stop nginx']),
 status:E('systemctl status nginx','nginxのサービス状態を確認',['sudo systemctl status nginx']),
 logs:E('journalctl -u nginx','nginxのjournalを確認',['sudo journalctl -u nginx','journalctl -u nginx --no-pager'])
},
2:{
 allow80:E('sudo ufw allow 80/tcp','HTTPの80/TCPをFirewallで許可',['ufw allow 80/tcp']),
 deny80:E('sudo ufw deny 80/tcp','HTTPの80/TCPをFirewallで拒否',['ufw deny 80/tcp']),
 allow443:E('sudo ufw allow 443/tcp','HTTPSの443/TCPをFirewallで許可',['ufw allow 443/tcp']),
 deny443:E('sudo ufw deny 443/tcp','HTTPSの443/TCPをFirewallで拒否',['ufw deny 443/tcp']),
 fwOff:E('sudo ufw disable','Firewallを無効化',['ufw disable']),
 fwOn:E('sudo ufw enable','Firewallを有効化',['ufw enable']),
 http:E('curl -I http://parrot.local','HTTP接続を確認',['curl -I http://localhost','curl http://parrot.local']),
 https:E('curl -Ik https://parrot.local','HTTPS接続を確認',['curl -kI https://parrot.local','curl -k https://parrot.local']),
 ping:E('ping -c 4 192.168.1.20','ICMPでIP到達性を確認',['ping 192.168.1.20']),
 stopNginx:E('sudo systemctl stop nginx','nginxを停止',['systemctl stop nginx']),
 startNginx:E('sudo systemctl start nginx','nginxを起動',['systemctl start nginx']),
 status:E('sudo ufw status verbose','Firewallルールと状態を確認',['ufw status verbose','sudo ufw status','ufw status'])
},
3:{
 pingip:E('ping -c 4 192.168.1.20','IP直打ちで疎通確認',['ping 192.168.1.20']),
 pingname:E('ping -c 4 parrot.local','名前解決込みで疎通確認',['ping parrot.local']),
 curlip:E('curl -I http://192.168.1.20','IP直打ちでHTTP確認',['curl http://192.168.1.20']),
 curlname:E('curl -I http://parrot.local','名前解決込みでHTTP確認',['curl http://parrot.local']),
 dnsbad:E("sudo sh -c 'echo nameserver 203.0.113.53 > /etc/resolv.conf'",'DNS設定を意図的に誤らせる',['echo nameserver 203.0.113.53 > /etc/resolv.conf']),
 dnsfix:E("sudo sh -c 'echo nameserver 192.168.1.53 > /etc/resolv.conf'",'DNS設定を正しいサーバーへ戻す',['echo nameserver 192.168.1.53 > /etc/resolv.conf']),
 gwbad:E('sudo ip route del default','Default Gatewayを削除',['ip route del default']),
 gwfix:E('sudo ip route add default via 192.168.1.1','Default Gatewayを追加',['ip route add default via 192.168.1.1']),
 maskbad:E('sudo ip addr replace 192.168.1.10/28 dev eth0','CIDR Prefixを/28へ変更',['ip addr replace 192.168.1.10/28 dev eth0']),
 maskfix:E('sudo ip addr replace 192.168.1.10/24 dev eth0','CIDR Prefixを/24へ戻す',['ip addr replace 192.168.1.10/24 dev eth0']),
 all:E('ip addr; ip route; getent hosts parrot.local','IP・Route・名前解決をまとめて確認',['ip a; ip r; getent hosts parrot.local'])
},
4:{
 passwordLogin:E('ssh learner@192.168.1.20','Password認証でSSH接続',['ssh learner@parrot.local']),
 keyLogin:E('ssh -i ~/.ssh/id_ed25519 learner@192.168.1.20','公開鍵認証でSSH接続',['ssh -i ~/.ssh/id_ed25519 learner@parrot.local']),
 disconnect:E('exit','SSHセッションからlogout',['logout']),
 stopSshd:E('sudo systemctl stop ssh','SSHサーバーを停止',['systemctl stop ssh','sudo systemctl stop sshd','systemctl stop sshd']),
 startSshd:E('sudo systemctl start ssh','SSHサーバーを起動',['systemctl start ssh','sudo systemctl start sshd','systemctl start sshd']),
 changePort:E("sudo sed -i 's/^Port 22/Port 2222/' /etc/ssh/sshd_config",'sshdの待受ポートを2222へ変更',[]),
 resetPort:E("sudo sed -i 's/^Port 2222/Port 22/' /etc/ssh/sshd_config",'sshdの待受ポートを22へ戻す',[]),
 breakKeyPerm:E('chmod 777 ~/.ssh/id_ed25519','秘密鍵の権限を危険な状態にする',['chmod 666 ~/.ssh/id_ed25519']),
 fixKeyPerm:E('chmod 600 ~/.ssh/id_ed25519','秘密鍵をownerのみ読書き可能へ戻す',['chmod 600 ~/.ssh/id_rsa']),
 showStatus:E('systemctl status ssh; ss -ltnp | grep ssh','sshdの状態と待受ポートを確認',['systemctl status ssh','ss -ltnp | grep :22'])
},
5:{
 read:E('cat report.txt','ファイル内容を読む',[]),
 write:E("echo update >> report.txt",'ファイルへ追記',['echo test >> report.txt']),
 execute:E('./script.sh','実行権限を使ってscriptを実行',['bash script.sh']),
 listdir:E('ls -la project/','Directory内容と権限を一覧',['ls -l project/','ls project/']),
 traverse:E('cd project/','Directory内へ移動',['cd project']),
 removeGroup:E('sudo gpasswd -d learner developers','Userをdevelopers groupから外す',['gpasswd -d learner developers']),
 addGroup:E('sudo usermod -aG developers learner','Userをdevelopers groupへ追加',['usermod -aG developers learner','sudo gpasswd -a learner developers']),
 removeDirX:E('chmod g-x project/','GroupのDirectory実行(x)権限を外す',['chmod g-x project']),
 fixDirX:E('chmod g+x project/','GroupのDirectory実行(x)権限を戻す',['chmod g+x project']),
 sudoRead:E('sudo cat report.txt','sudo権限でファイルを読む',[])
},
6:{
 cpuHog:E('yes > /dev/null &','CPUを消費するProcessを起動',[]),
 memHog:E('stress-ng --vm 1 --vm-bytes 512M --timeout 60s &','Memory負荷を発生',['stress --vm 1 --vm-bytes 512M &']),
 ioWait:E('dd if=/dev/zero of=/tmp/io-test bs=1M count=1024 oflag=direct &','Disk I/O負荷を発生',[]),
 zombie:E("python3 -c 'import os,time; p=os.fork(); os._exit(0) if p==0 else time.sleep(60)' &",'Zombie Processを模擬生成',[]),
 termHog:E('kill -TERM $(pgrep yes | head -1)','SIGTERMで正常終了を要求',['pkill -TERM yes']),
 killHog:E('kill -KILL $(pgrep yes | head -1)','SIGKILLで強制終了',['pkill -KILL yes','pkill -9 yes']),
 niceHog:E('nice -n 5 yes > /dev/null &','低い優先度でProcessを起動',['nice -n 5 yes &']),
 reniceHog:E('renice 10 -p 1234','稼働中Processのnice値を変更',['renice +10 -p 1234']),
 top:E('top','CPU/MemoryとProcessをリアルタイム確認',[]),
 ps:E('ps aux --sort=-%cpu | head','ProcessをCPU使用率順に確認',['ps aux','ps -ef']),
 free:E('free -h','Memory使用量とavailableを確認',[]),
 systemctl:E('systemctl status nginx','systemd Serviceの状態を確認',['sudo systemctl status nginx'])
},
7:{
 partition:E('sudo parted /dev/sdb --script mklabel gpt mkpart primary ext4 0% 100%','DiskへPartitionを作成',[]),
 mkfs:E('sudo mkfs.ext4 /dev/sdb1','Partitionへext4 Filesystemを作成',['mkfs.ext4 /dev/sdb1']),
 mount:E('sudo mount /dev/sdb1 /data','Filesystemを/dataへmount',['mount /dev/sdb1 /data']),
 writeData:E("echo hello | sudo tee /data/hello.txt",'mount先へFileを書き込む',['sudo touch /data/hello.txt','touch /data/hello.txt']),
 unmount:E('sudo umount /data','/dataをunmount',['umount /data']),
 fillRoot:E('fallocate -l 1G /tmp/fill-test','容量逼迫を模擬するFileを作成',['truncate -s 1G /tmp/fill-test']),
 fillInodes:E("for i in $(seq 1 1000); do touch /tmp/inode-test-$i; done",'大量の小Fileでinode消費を模擬',[]),
 readonly:E('sudo mount -o remount,ro /','Filesystemをread-onlyでremount',['mount -o remount,ro /']),
 fixReadonly:E('sudo mount -o remount,rw /','Filesystemをread-writeへremount',['mount -o remount,rw /']),
 lsblk:E('lsblk -f','Block deviceとFilesystemを確認',['lsblk']),
 df:E('df -h','Filesystem容量を確認',[]),
 du:E('du -sh /data','Directory使用量を確認',['du -sh .'])
},
8:{
 nginx500:E('curl -i http://localhost/fail','nginxの500 Errorを再現・確認',['curl http://localhost/fail']),
 sshFail:E('ssh wronguser@localhost','SSH認証失敗を発生',['ssh invalid@localhost']),
 serviceCrash:E('sudo systemctl kill -s SIGSEGV demo.service','Service Crashを模擬',[]),
 kernelError:E("logger -p kern.err 'SIMULATED disk I/O error'",'Kernel Error相当のログを模擬生成',[]),
 clockSkew:E("sudo date -s '-5 minutes'",'時刻ずれを模擬',['date -s "-5 minutes"']),
 logFlood:E("for i in $(seq 1 100); do logger 'SIMULATED flood'; done",'大量ログを模擬生成',[]),
 journal:E('journalctl -xe','systemd journalを確認',['journalctl']),
 kernel:E('dmesg -T | tail -50','Kernel ring bufferを確認',['dmesg','dmesg -T']),
 nginxLog:E('tail -n 50 /var/log/nginx/error.log','nginx error logを確認',['tail /var/log/nginx/error.log']),
 authLog:E('tail -n 50 /var/log/auth.log','SSH等の認証ログを確認',['tail /var/log/auth.log'])
},
9:{
 update:E('sudo apt update','RepositoryからPackage一覧を更新',['apt update']),
 list:E('apt list --upgradable','更新可能Packageを一覧',[]),
 upgrade:E('sudo apt upgrade','Installed Packageを更新',['apt upgrade','sudo apt upgrade -y']),
 install:E('sudo apt install nginx','nginxをinstall',['apt install nginx']),
 remove:E('sudo apt remove nginx','nginxを設定を残してremove',['apt remove nginx']),
 purge:E('sudo apt purge nginx','nginxを設定込みでpurge',['apt purge nginx']),
 autoremove:E('sudo apt autoremove','不要Dependencyを削除',['apt autoremove']),
 breakRepo:E("sudo sed -i 's|deb.debian.org|bad.example.invalid|' /etc/apt/sources.list",'Repository URLを意図的に壊す',[]),
 badSignature:E("sudo apt-key del DEADBEEF",'署名検証失敗を模擬',[]),
 breakDeps:E('sudo dpkg --unpack broken-package.deb','Dependency不整合を模擬',[]),
 lockApt:E('sudo flock /var/lib/dpkg/lock-frontend sleep 60','APT lock競合を模擬',[]),
 unlockApt:E('sudo pkill -f "flock /var/lib/dpkg/lock-frontend"','模擬APT lockを解放',[])
},
10:{
 boot:E('systemctl isolate multi-user.target','通常のmulti-user環境へ遷移',['systemctl default']),
 reboot:E('sudo reboot','Systemを再起動',['reboot']),
 bootOld:E('grub-reboot "Advanced options>old kernel"','次回だけ旧Kernelを選択してBoot',[]),
 badKernel:E('sudo mv /boot/initrd.img /boot/initrd.img.broken','新Kernelのboot image障害を模擬',[]),
 badRootUuid:E("sudo sed -i 's/root=UUID=[^ ]*/root=UUID=BAD-UUID/' /etc/default/grub",'GRUB root UUID誤りを模擬',[]),
 badFstab:E("sudo sh -c 'echo UUID=BAD /data ext4 defaults 0 2 >> /etc/fstab'",'fstab誤りを模擬',[]),
 badService:E('sudo systemctl mask demo-critical.service','必須Service失敗を模擬',[]),
 fixAll:E('sudo systemctl daemon-reload','設定修正後のsystemd再読込を模擬',['systemctl daemon-reload']),
 analyze:E('systemd-analyze','Boot時間を測定',[]),
 failed:E('systemctl --failed','失敗Unitを一覧',[]),
 bootlog:E('journalctl -b','今回Bootのjournalを確認',['journalctl -b -p warning'])
},
11:{
 psgrep:E('ps aux | grep nginx','Process一覧からnginxを絞り込む',['ps -ef | grep nginx']),
 log500:E("grep ' 500 ' /var/log/nginx/access.log | awk '{print $1}'",'500応答だけ抽出してClient IPを見る',[]),
 countip:E("awk '{print $1}' access.log | sort | uniq -c | sort -nr",'IPごとの件数を集計',[]),
 sed:E("sed 's/error/ERROR/g' app.log",'文字列を置換して表示',[]),
 overwrite:E('grep ERROR app.log > errors.txt','stdoutをFileへ上書き',[]),
 append:E('grep WARN app.log >> errors.txt','stdoutをFileへ追記',[]),
 stderr:E('command 2> error.log','stderrだけFileへ保存',[]),
 both:E('command > all.log 2>&1','stdoutとstderrを同じFileへ保存',['command &> all.log']),
 and:E('cmd1 && cmd2','前のCommand成功時だけ次を実行',[]),
 or:E('cmd1 || cmd2','前のCommand失敗時だけ次を実行',[])
}
};

var cfg=LABS[lab];
if(!cfg)return;

var sec=[].slice.call(document.querySelectorAll('section')).find(function(s){
  var h=s.querySelector(':scope>h2');
  return h&&h.textContent.indexOf('操作してみる')>=0;
});
if(!sec)return;

var slider=sec.querySelector('.mobile-operation-slider');
if(!slider)return;
var op=slider.querySelector('.mobile-slide-0');
if(!op)return;
var controls=op.querySelector('.mobile-control-scroll')||op;
var live=op.querySelector('.mobile-live-terminal'),liveBody=live&&live.querySelector('.mobile-live-terminal-body');
var desc=sec.querySelector(':scope>p'),tabs=sec.querySelector('.mobile-slider-tabs');

var KEY='linux_kiban_learning_mode',mode='guided';
try{mode=localStorage.getItem(KEY)||mode}catch(e){}

function norm(s){
  return(s||'').trim().replace(/^\$\s*/,'').replace(/^sudo\s+/,'').replace(/\s+/g,' ').toLowerCase();
}
function esc(s){
  return String(s).replace(/[&<>"']/g,function(c){
    return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function note(t){
  if(!liveBody)return;
  var d=document.createElement('div');
  d.className='mobile-terminal-note';
  d.textContent=t;
  liveBody.appendChild(d);
  liveBody.scrollTop=liveBody.scrollHeight;
}
function actionKey(btn){
  return btn.getAttribute('data-action')||btn.getAttribute('data-act')||'';
}

var modeBox=document.createElement('div');
modeBox.className='mobile-learning-mode';
modeBox.innerHTML='<div class="mobile-learning-mode-head"><strong>🎮 操作モード</strong><span></span></div><div class="mobile-learning-mode-buttons"></div>';
[['guided','🐣 基本'],['choice','🐧 選択'],['input','🔥 入力']].forEach(function(x){
  var b=document.createElement('button');
  b.type='button';b.dataset.mode=x[0];b.textContent=x[1];
  b.onclick=function(){setMode(x[0])};
  modeBox.lastChild.appendChild(b);
});
if(tabs)tabs.parentNode.insertBefore(modeBox,tabs);else sec.insertBefore(modeBox,slider);

var panel=document.createElement('div');
panel.className='mobile-learning-panel';
panel.hidden=true;
if(live)op.insertBefore(panel,live);else op.appendChild(panel);

var bypass=null;
function run(btn,e){
  bypass=btn;
  try{btn.click()}finally{bypass=null}
  setTimeout(function(){note('✓ '+e.purpose)},90);
}
function candidates(e){
  var all=Object.keys(cfg).map(function(k){return cfg[k].cmd}).filter(function(x){return x!==e.cmd});
  var seed=(e.cmd.length+lab*13);
  var a=all[seed%all.length],b=all[(seed*3+5)%all.length];
  if(b===a)b=all[(seed*7+1)%all.length];
  return[e.cmd,a,b].sort(function(x,y){return((x.length+lab)*7)%13-((y.length+lab)*7)%13});
}
function showChoice(btn,e){
  panel.hidden=false;
  panel.innerHTML='<div class="mobile-learning-task"><b>MISSION</b><strong>'+esc(btn.textContent.trim())+'</strong></div><div class="mobile-learning-q">どのLinuxコマンド？</div><div class="mobile-command-choices"></div><div class="mobile-learning-feedback">正しいコマンドを選んでください。</div>';
  var w=panel.querySelector('.mobile-command-choices'),fb=panel.querySelector('.mobile-learning-feedback');
  candidates(e).forEach(function(cmd){
    var b=document.createElement('button');b.type='button';b.innerHTML='<code>'+esc(cmd)+'</code>';
    b.onclick=function(){
      if(cmd===e.cmd){
        b.classList.add('correct');
        fb.className='mobile-learning-feedback ok';
        fb.innerHTML='✅ <strong>正解。</strong> '+esc(e.purpose);
        run(btn,e);
      }else{
        b.classList.add('wrong');
        fb.className='mobile-learning-feedback ng';
        fb.textContent='❌ 今回の目的とは違います。「何を確認・変更したいか」から考えてみよう。';
      }
    };
    w.appendChild(b);
  });
}
function showInput(btn,e){
  panel.hidden=false;
  panel.innerHTML='<div class="mobile-learning-task"><b>MISSION</b><strong>'+esc(btn.textContent.trim())+'</strong></div><div class="mobile-engineer-prompt"><span>learner@parrot:~$</span><input autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Linuxコマンドを入力"><button type="button">実行</button></div><div class="mobile-learning-feedback">コマンドを自分で入力します。</div>';
  var input=panel.querySelector('input'),go=panel.querySelector('.mobile-engineer-prompt button'),fb=panel.querySelector('.mobile-learning-feedback'),tries=0;
  function submit(){
    var v=input.value;if(!v.trim())return;
    note('$ '+v);
    if(e.ok.some(function(x){return norm(x)===norm(v)})){
      fb.className='mobile-learning-feedback ok';
      fb.innerHTML='✅ <strong>Accepted.</strong> '+esc(e.purpose);
      run(btn,e);input.value='';
    }else{
      tries++;
      fb.className='mobile-learning-feedback ng';
      var first=e.cmd.replace(/^sudo\s+/,'').split(' ')[0];
      fb.innerHTML='❌ もう一度。'+(tries>1?' <strong>ヒント:</strong> '+esc(first)+' 系のコマンド。':'');
      input.select();
    }
  }
  go.onclick=submit;
  input.onkeydown=function(ev){if(ev.key==='Enter'){ev.preventDefault();submit()}};
  setTimeout(function(){input.focus()},0);
}

controls.addEventListener('click',function(ev){
  var btn=ev.target.closest('button[data-action],button[data-act]');
  if(!btn||bypass===btn)return;
  var k=actionKey(btn),e=cfg[k];
  if(k==='reset'||mode==='guided'||!e)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  mode==='choice'?showChoice(btn,e):showInput(btn,e);
},true);

function setMode(m){
  mode=m;
  try{localStorage.setItem(KEY,m)}catch(e){}
  [].slice.call(modeBox.querySelectorAll('button')).forEach(function(b){b.classList.toggle('active',b.dataset.mode===m)});
  var cap=modeBox.querySelector('.mobile-learning-mode-head span');
  if(m==='guided'){
    cap.textContent='ボタン → LIVE Terminal';panel.hidden=true;
    if(desc)desc.textContent='操作を押すと、同じ画面のLIVE Terminalが即時更新されます。「結果」「Linux詳細」は横スワイプでも確認できます。';
  }else if(m==='choice'){
    cap.textContent='操作 → コマンド3択';panel.hidden=false;
    panel.innerHTML='<div class="mobile-learning-empty">操作ボタンを押すと、その操作に対応するLinuxコマンド3択が出ます。</div>';
    if(desc)desc.textContent='やりたい操作を選ぶ → 正しいLinuxコマンドを3択から選ぶ → LIVE Terminalで結果を確認。';
  }else{
    cap.textContent='操作 → 自分で入力';panel.hidden=false;
    panel.innerHTML='<div class="mobile-learning-empty">操作ボタンを押すとTerminal入力MISSIONが始まります。</div>';
    if(desc)desc.textContent='やりたい操作を選ぶ → Linuxコマンドを自分で入力 → 正しければシミュレーターが実行します。';
  }
}
setMode(mode);

if(lab===1){
  var lookup=document.getElementById('portLookupResult');
  if(lookup){
    var adding=false;
    function addProtocolLegend(){
      if(adding||lookup.querySelector('.protocol-legend'))return;
      var list=lookup.querySelector('.lookup-service-list');
      if(!list)return;
      adding=true;
      var box=document.createElement('div');
      box.className='protocol-legend';
      box.innerHTML=
        '<div class="protocol-legend-title">🚚 TCP / UDP / SCTP は「同じPort番号を、どう運ぶか」の違い</div>'+
        '<div class="protocol-legend-grid">'+
          '<div><b>TCP</b><span>確実・順番どおりに届ける</span><small>HTTP / HTTPS / SSHなど。今回のnginx HTTPは基本これ。</small></div>'+
          '<div><b>UDP</b><span>軽く・素早く送る</span><small>DNS・音声・ゲームなど。再送や順番保証を基本は行わない。</small></div>'+
          '<div><b>SCTP</b><span>複数ストリーム/経路に強い</span><small>通信基盤などの特殊用途。通常のWeb学習では参考扱いでOK。</small></div>'+
        '</div>'+
        '<p>※ IANAでは同じPort番号に複数Transport Protocolの登録があり得ます。<strong>Port 80の通常HTTP = TCP</strong> とまず覚えればOK。</p>';
      list.parentNode.insertBefore(box,list);
      adding=false;
    }
    addProtocolLegend();
    new MutationObserver(function(){setTimeout(addProtocolLegend,0)}).observe(lookup,{childList:true,subtree:true});
  }
}
})();
const $ = s => document.querySelector(s);
const txt={ar:{secure:'اتصال آمن',eyebrow:'مقياس الشبكة الذكي',title:'اعرف سرعة اتصالك<br><em>بوضوح.</em>',lead:'فحص مباشر بين جهازك وخادم الاختبار. نتائج تعتمد على اتصالك الفعلي الآن.',ready:'جاهز للاختبار',waiting:'بانتظار البدء',start:'بدء الاختبار',notice:'للحصول على أدق نتيجة، أوقف التنزيلات والتطبيقات الأخرى.',ping:'زمن الاستجابة',download:'التنزيل',upload:'الرفع',downloadHint:'من الخادم إلى جهازك',uploadHint:'من جهازك إلى الخادم',connection:'معلومات الاتصال',quality:'تقييم الاتصال',method:'تُحسب النتائج بالبيانات التي تنتقل فعلياً بين متصفحك وخادم الاختبار. قد تختلف حسب ازدحام الشبكة والخادم.',testingPing:'قياس الاستجابة...',testingDown:'قياس سرعة التنزيل...',testingUp:'قياس سرعة الرفع...',complete:'اكتمل الاختبار',again:'إعادة الاختبار',excellent:'ممتاز',good:'جيد',fair:'متوسط'},en:{secure:'Secure connection',eyebrow:'SMART NETWORK METER',title:'Know your connection<br><em>clearly.</em>',lead:'A live check between your device and the test server. Results reflect your connection right now.',ready:'Ready to test',waiting:'Waiting to start',start:'Start test',notice:'For the most accurate result, pause downloads and other apps.',ping:'Latency',download:'Download',upload:'Upload',downloadHint:'Server to your device',uploadHint:'Your device to server',connection:'Connection details',quality:'Connection rating',method:'Results are calculated from data actually transferred between your browser and the test server. They can vary with network and server congestion.',testingPing:'Measuring latency...',testingDown:'Measuring download...',testingUp:'Measuring upload...',complete:'Test complete',again:'Test again',excellent:'Excellent',good:'Good',fair:'Fair'}};
let lang='ar', busy=false; const t=k=>txt[lang][k];
function setText(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.body.classList.toggle('en',lang==='en'); document.querySelectorAll('[data-i]').forEach(el=>el.innerHTML=t(el.dataset.i));$('#langBtn').textContent=lang==='ar'?'EN':'ع';}
$('#langBtn').onclick=()=>{lang=lang==='ar'?'en':'ar';setText()};
function setLive(value){$('#liveSpeed').textContent=value.toFixed(2);const deg=Math.min(126, -126+Math.log10(value+1)*65);$('.needle').style.transform=`rotate(${deg}deg)`}
function fmt(n){return n.toFixed(n>=100?0:2)}
async function getInfo(){try{let x=await fetch('/api/info',{cache:'no-store'}).then(r=>r.json());$('#ip').textContent=x.ip;$('#server').textContent=x.server}catch{}}
async function pingTest(){let samples=[];for(let i=0;i<7;i++){let s=performance.now();await fetch('/api/ping?x='+Math.random(),{cache:'no-store'});samples.push(performance.now()-s);await new Promise(r=>setTimeout(r,90))} samples.sort((a,b)=>a-b);let p=samples.slice(1,-1);let avg=p.reduce((a,b)=>a+b,0)/p.length;let jitter=p.slice(1).reduce((a,b,i)=>a+Math.abs(b-p[i]),0)/(p.length-1);return {avg,jitter}}
async function timedDownload(seconds=8){
  // Small completed transfers are deliberately used here. Some mobile in-app
  // previews buffer a very long streaming response and falsely report 0 Mbps.
  const start=performance.now(); let received=0;
  while(performance.now()-start < seconds*1000){
    try{
      const r=await fetch('/api/download?bytes=262144&x='+Math.random(),{cache:'no-store'});
      if(!r.ok) throw new Error('download failed');
      const data=await r.arrayBuffer(); received+=data.byteLength;
      setLive(received*8/(performance.now()-start)/1000);
    }catch(e){ break; }
  }
  return received*8/(performance.now()-start)/1000;
}
async function timedUpload(seconds=6){let size=2*1024*1024, data=new Uint8Array(size);for(let i=0;i<size;i+=65536)crypto.getRandomValues(data.subarray(i,Math.min(i+65536,size)));let start=performance.now(), sent=0;while(performance.now()-start<seconds*1000){let before=performance.now();try{await fetch('/api/upload?x='+Math.random(),{method:'POST',body:data,cache:'no-store'});sent+=size;setLive(sent*8/(performance.now()-start)/1000)}catch{break}if(performance.now()-before>3000)break}return sent*8/(performance.now()-start)/1000}
function rating(d,p){let r=d>50&&p<40?5:d>20&&p<80?4:d>8?3:2;$('.bars').querySelectorAll('i').forEach((x,i)=>x.classList.toggle('active',i<r));$('#rating').textContent=t(r>=5?'excellent':r>=4?'good':'fair')}
$('#start').onclick=async()=>{if(busy)return;busy=true;let b=$('#start');b.disabled=true;$('#state').className='state running';$('#state').textContent=t('testingPing');$('#phase').textContent=t('testingPing');setLive(0);try{let p=await pingTest();$('#ping').innerHTML=`${fmt(p.avg)} <small>ms</small>`;$('#jitter').textContent=`Jitter ${fmt(p.jitter)} ms`;$('#state').textContent=t('testingDown');$('#phase').textContent=t('testingDown');let d=await timedDownload();$('#download').innerHTML=`${fmt(d)} <small>Mbps</small>`;$('#state').textContent=t('testingUp');$('#phase').textContent=t('testingUp');setLive(0);let u=await timedUpload();$('#upload').innerHTML=`${fmt(u)} <small>Mbps</small>`;setLive(d);rating(d,p.avg);$('#state').className='state done';$('#state').textContent=t('complete');$('#phase').textContent=t('complete');b.querySelector('[data-i]').textContent=t('again')}catch(e){$('#state').textContent='Error — حاول مجدداً'}finally{b.disabled=false;busy=false}};
setText();getInfo();

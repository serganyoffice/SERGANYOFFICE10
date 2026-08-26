const SERVICES = [
['الاستشارات الضريبية','استشارة مهنية لفهم الموقف الضريبي وتحديد الإجراء الأنسب.','01'],
['خبير مثمن','أعمال التقييم والتثمين وإعداد الرأي المهني بحسب طبيعة الحالة.','02'],
['مصفي قضائي','خدمات وأعمال التصفية القضائية وفق متطلبات الحالة والإجراءات ذات الصلة.','03'],
['الفواتير الإلكترونية','مساعدة في التعامل مع منظومة الفاتورة الإلكترونية ومتطلبات الامتثال.','04'],
['مراقب حسابات الشركات المساهمة','مراجعة وإبداء الرأي المهني على حسابات الشركات المساهمة وفق الأطر المهنية المعمول بها.','05'],
['ضريبة الدخل','خدمات متعلقة بضريبة الدخل وفهم الالتزامات والإجراءات المطلوبة.','06'],
['ضريبة القيمة المضافة','مساعدة في ملفات وضوابط ضريبة القيمة المضافة والتعامل مع متطلباتها.','07'],
['الإقرارات الضريبية','إعداد ومراجعة الإقرارات الضريبية ومتابعة المتطلبات المرتبطة بها.','08'],
['تأسيس الشركات','خدمات تأسيس الشركات وتجهيز الإجراءات والمستندات بحسب نوع الشركة.','09'],
['افتتاح فروع الشركات المصرية بالدول العربية','استشارات وإجراءات مرتبطة بافتتاح فروع للشركات المصرية في الدول العربية.','10'],
['دراسات الجدوى الاقتصادية','دراسة الجوانب المالية والاقتصادية للمشروع للمساعدة في تقييم القرار.','11'],
['الميزانيات العمومية','إعداد ومراجعة الميزانيات والقوائم المالية بصورة منظمة وواضحة.','12'],
['سجل المستوردين والمصدرين','خدمات وإجراءات مرتبطة بسجل المستوردين والمصدرين.','13'],
['السجلات التجارية','مساعدة في إجراءات السجلات التجارية والتحديثات ذات الصلة.','14'],
['ترخيص المحال والمنشآت','مساعدة في إجراءات ومتطلبات ترخيص المحال والمنشآت.','15'],
['ترخيص المنشآت الصناعية','مساعدة في إجراءات ومتطلبات ترخيص المنشآت الصناعية.','16']
];

const WA='201006906248';
function card([name,desc,num]){return `<article class="service-card reveal" data-num="${num}"><div class="service-top"><span>${num}</span><i>↗</i></div><h3>${name}</h3><p>${desc}</p><a href="appointment.html?service=${encodeURIComponent(name)}">احجز لهذه الخدمة <b>←</b></a></article>`}
function renderServices(){const grid=document.getElementById('serviceGrid');if(grid)grid.innerHTML=SERVICES.map(card).join(''); const select=document.getElementById('service'); if(select) select.innerHTML='<option value="">اختر الخدمة</option>'+SERVICES.map(x=>`<option>${x[0]}</option>`).join('');}
function reveal(){document.querySelectorAll('.reveal').forEach(el=>{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});io.observe(el)})}
function nav(){const b=document.getElementById('menu'),n=document.getElementById('navLinks');if(b&&n)b.onclick=()=>n.classList.toggle('open');document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>n?.classList.remove('open')))}
function progress(){const p=document.getElementById('progress');if(!p)return;addEventListener('scroll',()=>{const h=document.documentElement.scrollHeight-innerHeight;p.style.width=(scrollY/h*100)+'%'},{passive:true})}
function booking(){const form=document.getElementById('bookingForm');if(!form)return;const params=new URLSearchParams(location.search);const s=params.get('service');if(s){const select=document.getElementById('service');if([...select.options].some(o=>o.value===s))select.value=s}
form.addEventListener('submit',e=>{e.preventDefault();const name=document.getElementById('name').value.trim(),phone=document.getElementById('phone').value.trim(),service=document.getElementById('service').value,details=document.getElementById('details').value.trim();if(!name||!phone||!service||!details)return;fetch('/api/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,service,details})}).then(async r=>{if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'تعذر حفظ الطلب')} const text=`*طلب استشارة جديد – مكتب محمد السرجاني*%0A%0A👤 الاسم: ${encodeURIComponent(name)}%0A📱 الموبايل: ${encodeURIComponent(phone)}%0A🧾 الخدمة: ${encodeURIComponent(service)}%0A📝 التفاصيل: ${encodeURIComponent(details)}%0A%0A*يرجى التواصل مع العميل وتأكيد موعد الاستشارة.*`;window.open(`https://wa.me/${WA}?text=${text}`,'_blank');alert('تم حفظ طلبك وفتح واتساب لإرساله. انتظر الرد لتأكيد الاستشارة.');form.reset()}).catch(err=>alert(err.message))})}
function admin(){
  const box=document.getElementById('requests'); if(!box)return;
  const money=value=>Number(value||0).toLocaleString('ar-EG',{maximumFractionDigits:2});
  const safe=value=>String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const getList=()=>JSON.parse(localStorage.getItem('serganyRequests')||'[]').map(x=>({...x,totalPrice:Number(x.totalPrice||0),paid:Number(x.paid||0),status:x.status||'pending',createdAt:x.createdAt||null}));
  const dateOf=x=>{const d=x.createdAt?new Date(x.createdAt):new Date(Number(x.id)||0);return isNaN(d)?null:d};
  const sameDay=(a,b)=>a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  const statusLabel=x=>({confirmed:'مؤكد',pending:'قيد الانتظار',cancelled:'ملغي'}[x.status]||'قيد الانتظار');
  const paymentState=x=>x.totalPrice>0&&x.paid>=x.totalPrice?'paid':x.paid>0?'partial':'unpaid';
  const paymentLabel=s=>({paid:'مدفوع بالكامل',partial:'مدفوع جزئيًا',unpaid:'غير مدفوع'}[s]);
  const formatDay=d=>d.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'});
  const renderChart=list=>{
    const chart=document.getElementById('monthChart'); if(!chart)return;
    const now=new Date(), days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    const counts=Array.from({length:days},(_,i)=>({day:i+1,count:list.filter(x=>{const d=dateOf(x);return d&&d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===i+1}).length}));
    const max=Math.max(1,...counts.map(x=>x.count));
    document.getElementById('monthLabel').textContent=now.toLocaleDateString('ar-EG',{month:'long',year:'numeric'});
    chart.innerHTML=counts.map(x=>`<div class="chart-col" title="${x.count} عميل يوم ${x.day}"><div class="chart-bar" style="height:${Math.max(4,(x.count/max)*100)}%"></div><span>${x.day}</span></div>`).join('');
  };
  const renderAlerts=list=>{
    const el=document.getElementById('upcomingAlerts');if(!el)return;
    const upcoming=list.filter(x=>x.status!=='cancelled').sort((a,b)=>dateOf(a)-dateOf(b)).slice(0,5);
    if(!upcoming.length){el.innerHTML='<div class="alert-empty">لا توجد حجوزات قادمة حاليًا.</div>';return;}
    el.innerHTML=upcoming.map(x=>`<div class="alert-item"><span class="alert-dot"></span><div><b>${safe(x.name)}</b><small>${safe(x.service)} — ${formatDay(dateOf(x))}</small></div><strong>${safe(x.phone)}</strong></div>`).join('');
  };
  const fillClients=list=>{
    const select=document.getElementById('availabilityClient');if(!select)return;
    const current=select.value;
    select.innerHTML='<option value="">اختر عميلًا</option>'+list.map(x=>`<option value="${safe(x.id)}">${safe(x.name)} — ${safe(x.phone)}</option>`).join('');
    if(list.some(x=>String(x.id)===current))select.value=current;
  };
  const render=()=>{
    const list=getList(); const now=new Date(),yesterday=new Date(now); yesterday.setDate(now.getDate()-1); const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
    document.getElementById('count').textContent=list.length;
    document.getElementById('todayCount').textContent=list.filter(x=>sameDay(dateOf(x),now)).length;
    document.getElementById('yesterdayCount').textContent=list.filter(x=>sameDay(dateOf(x),yesterday)).length;
    document.getElementById('monthCount').textContent=list.filter(x=>{const d=dateOf(x);return d&&d>=monthStart&&d<=now}).length;
    document.getElementById('totalRevenue').textContent=money(list.reduce((a,x)=>a+x.totalPrice,0));
    document.getElementById('totalPaid').textContent=money(list.reduce((a,x)=>a+x.paid,0));
    document.getElementById('totalRemaining').textContent=money(list.reduce((a,x)=>a+Math.max(0,x.totalPrice-x.paid),0));
    renderChart(list);renderAlerts(list);fillClients(list);
    const q=(document.getElementById('adminSearch')?.value||'').trim().toLowerCase(), sf=document.getElementById('statusFilter')?.value||'all', df=document.getElementById('dateFilter')?.value||'all';
    const filtered=list.filter(x=>{const d=dateOf(x), text=`${x.name} ${x.phone} ${x.service}`.toLowerCase(); if(q&&!text.includes(q))return false; const ps=paymentState(x); if(sf!=='all'&&sf!==x.status&&sf!==ps)return false; if(df==='today'&&!sameDay(d,now))return false; if(df==='yesterday'&&!sameDay(d,yesterday))return false; if(df==='month'&&!(d&&d>=monthStart&&d<=now))return false; return true});
    if(!filtered.length){box.innerHTML='<div class="empty">لا توجد حجوزات مطابقة للبحث أو الفلترة.</div>';return;}
    box.innerHTML=filtered.map(x=>{const remaining=Math.max(0,x.totalPrice-x.paid),ps=paymentState(x),d=dateOf(x);return `<article class="request booking-request" data-id="${safe(x.id)}"><div class="request-title"><div><b>${safe(x.name)}</b><span>${safe(x.date||'')}</span></div><div class="status-group"><em class="booking-status ${safe(x.status)}">${statusLabel(x)}</em><em class="payment-status ${ps}">${paymentLabel(ps)}</em></div></div><div class="booking-details"><div><small>📱 الموبايل</small><strong>${safe(x.phone)}</strong></div><div><small>🧾 الخدمة</small><strong>${safe(x.service)}</strong></div><div><small>📅 تاريخ الطلب</small><strong>${d?d.toLocaleDateString('ar-EG'):safe(x.date||'')}</strong></div><div class="full"><small>📝 تفاصيل الحجز</small><strong>${safe(x.details)}</strong></div></div><div class="edit-box"><label>اسم العميل<input class="edit-name" value="${safe(x.name)}"></label><label>الموبايل<input class="edit-phone" value="${safe(x.phone)}"></label><label>الخدمة<input class="edit-service" value="${safe(x.service)}"></label><label class="full-label">التفاصيل<textarea class="edit-details" rows="3">${safe(x.details)}</textarea></label></div><div class="payment-box"><label>السعر الكلي<input class="total-price" type="number" min="0" step="0.01" value="${x.totalPrice}"></label><label>المدفوع<input class="paid-price" type="number" min="0" step="0.01" value="${x.paid}"></label><label>حالة الحجز<select class="booking-status-select"><option value="pending" ${x.status==='pending'?'selected':''}>قيد الانتظار</option><option value="confirmed" ${x.status==='confirmed'?'selected':''}>مؤكد</option><option value="cancelled" ${x.status==='cancelled'?'selected':''}>ملغي</option></select></label><div class="remaining"><span>المتبقي</span><b class="remaining-value">${money(remaining)}</b></div></div><div class="request-actions"><button class="save-request" type="button">حفظ كل التعديلات</button><button class="details-request" type="button">عرض تفاصيل العميل</button><button class="availability-request" type="button">إرسال مواعيد متاحة</button><a class="wa-direct" href="https://wa.me/${String(x.phone).replace(/\D/g,'')}" target="_blank" rel="noopener">واتساب مباشر ↗</a><button class="delete-request" type="button">حذف الحجز</button></div></article>`}).join('');
    $$('.booking-request',box).forEach(card=>{
      const id=Number(card.dataset.id),listNow=getList(),x=listNow.find(r=>Number(r.id)===id);if(!x)return;
      const total=$('.total-price',card),paid=$('.paid-price',card),remaining=$('.remaining-value',card);const update=()=>remaining.textContent=money(Math.max(0,Number(total.value||0)-Number(paid.value||0)));total.addEventListener('input',update);paid.addEventListener('input',update);
      $('.save-request',card).onclick=()=>{const current=getList(),r=current.find(z=>Number(z.id)===id);if(!r)return;r.name=$('.edit-name',card).value.trim();r.phone=$('.edit-phone',card).value.trim();r.service=$('.edit-service',card).value.trim();r.details=$('.edit-details',card).value.trim();r.totalPrice=Math.max(0,Number(total.value||0));r.paid=Math.max(0,Number(paid.value||0));r.status=$('.booking-status-select',card).value;localStorage.setItem('serganyRequests',JSON.stringify(current));render();};
      $('.details-request',card).onclick=()=>showClientDetails(x);
      $('.availability-request',card).onclick=()=>{const sel=document.getElementById('availabilityClient');sel.value=String(x.id);document.getElementById('availableSlots').focus();document.querySelector('.availability-panel')?.scrollIntoView({behavior:'smooth',block:'center'});};
      $('.delete-request',card).onclick=()=>{if(confirm('حذف هذا الحجز؟')){const current=getList().filter(z=>Number(z.id)!==id);localStorage.setItem('serganyRequests',JSON.stringify(current));render();}};
    });
  };
  const showClientDetails=x=>{let modal=document.getElementById('clientModal');if(!modal){modal=document.createElement('div');modal.id='clientModal';modal.className='client-modal';document.body.appendChild(modal);}const remaining=Math.max(0,x.totalPrice-x.paid);modal.innerHTML=`<div class="client-modal-card"><button class="modal-close" type="button">×</button><span class="kicker">ملف العميل</span><h2>${safe(x.name)}</h2><div class="client-modal-grid"><div><small>الهاتف</small><b>${safe(x.phone)}</b></div><div><small>الخدمة</small><b>${safe(x.service)}</b></div><div><small>السعر</small><b>${money(x.totalPrice)}</b></div><div><small>المدفوع</small><b>${money(x.paid)}</b></div><div><small>المتبقي</small><b>${money(remaining)}</b></div><div><small>الحالة</small><b>${statusLabel(x)}</b></div><div class="full"><small>التفاصيل</small><b>${safe(x.details)}</b></div></div></div>`;modal.classList.add('show');$('.modal-close',modal).onclick=()=>modal.classList.remove('show');modal.onclick=e=>{if(e.target===modal)modal.classList.remove('show')}};
  ['adminSearch','statusFilter','dateFilter'].forEach(id=>document.getElementById(id)?.addEventListener(id==='adminSearch'?'input':'change',render));
  document.getElementById('clearRequests')?.addEventListener('click',()=>{if(confirm('مسح كل الحجوزات المحفوظة؟')){localStorage.removeItem('serganyRequests');render()}});
  const slots=document.getElementById('availableSlots'),client=document.getElementById('availabilityClient'),hint=document.getElementById('availabilityHint');
  const saved=localStorage.getItem('serganyAvailableSlots')||'';if(slots)slots.value=saved;
  document.getElementById('saveAvailability')?.addEventListener('click',()=>{localStorage.setItem('serganyAvailableSlots',slots.value.trim());hint.textContent='تم حفظ المواعيد كقالب على هذا الجهاز.';setTimeout(()=>hint.textContent='',2500)});
  document.getElementById('sendAvailability')?.addEventListener('click',()=>{const list=getList(),x=list.find(r=>String(r.id)===String(client.value)),raw=slots.value.trim();if(!x){hint.textContent='اختر العميل أولًا.';return}if(!raw){hint.textContent='اكتب المواعيد المتاحة أولًا.';return}const text=`مرحبًا ${x.name} 👋%0A%0Aالمواعيد المتاحة لحجزك في مكتب Sergany:%0A%0A${encodeURIComponent(raw)}%0A%0Aاختر الموعد المناسب لك وأرسل لي تأكيدك. شكراً لك.`;window.open(`https://wa.me/${String(x.phone).replace(/\D/g,'')}?text=${text}`,'_blank');hint.textContent='تم تجهيز رسالة واتساب بالمواعيد المتاحة.'});
  render();
}
document.addEventListener('DOMContentLoaded',()=>{renderServices();reveal();nav();progress();booking();admin();const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();updateOfficeStatus();setInterval(updateOfficeStatus,30000);});

const $ = (s, scope=document) => scope.querySelector(s);
const $$ = (s, scope=document) => [...scope.querySelectorAll(s)];

function updateOfficeStatus(){
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const windows = {
    0: [[600,840],[1140,1380]],
    1: [[600,840],[1140,1380]],
    2: [[600,840],[1140,1380]],
    3: [[600,840],[1140,1380]],
    4: [[600,840]],
    5: [[1140,1380]],
    6: [[600,840],[1140,1380]]
  };

  const isOpen = (windows[day] || []).some(([start,end]) =>
    minutes >= start && minutes < end
  );

  const status = document.querySelector("#openStatus");
  if(status){
    status.classList.toggle("open", isOpen);
    status.classList.toggle("closed", !isOpen);
    const text = status.querySelector("span");
    if(text) text.textContent = isOpen ? "المكتب مفتوح الآن" : "المكتب مغلق الآن";
  }

  document.querySelectorAll(".schedule-row, .time-item").forEach(row => {
    row.classList.remove("today");
    row.removeAttribute("aria-current");
  });

  const todayRow = document.querySelector(
    `.schedule-row[data-day="${day}"], .time-item[data-day="${day}"]`
  );

  if(todayRow){
    todayRow.classList.add("today");
    todayRow.setAttribute("aria-current","date");
  }
}

updateOfficeStatus();
setInterval(updateOfficeStatus, 30000);


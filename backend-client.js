const API_BASE='';
const api=async(path,options={})=>{
  const headers={'Content-Type':'application/json',...(options.headers||{})};
  const token=sessionStorage.getItem('adminToken'); if(token) headers.Authorization=`Bearer ${token}`;
  const r=await fetch(API_BASE+path,{...options,headers});
  if(r.status===401){sessionStorage.removeItem('adminToken'); location.href='admin.html'; throw new Error('انتهت الجلسة');}
  if(!r.ok){let d={};try{d=await r.json()}catch{};throw new Error(d.error||'حدث خطأ في السيرفر');}
  return r.status===204?null:r.json();
};

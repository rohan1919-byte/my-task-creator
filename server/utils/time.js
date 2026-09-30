const istDate=(d=new Date())=>d.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
exports.istDate=istDate;
exports.toDueAt=(d,t)=>new Date(`${d}T${t}:00+05:30`);
exports.dayStart=(n=0)=>new Date(new Date(`${istDate()}T00:00:00+05:30`).getTime()+n*864e5);
exports.fmtTime=d=>d.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'});

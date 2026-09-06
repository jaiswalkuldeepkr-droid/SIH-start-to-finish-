/* ===================== DATA ===================== */
const STATES = ["Uttar Pradesh","Maharashtra","Karnataka","Tamil Nadu","Bihar","West Bengal","Rajasthan","Gujarat"];
const OWNERS = ["Ramesh Traders","Anita Grocers","Singh Fuel Point","City Water Works","Metro Taxi Co-op","Sharma & Sons Kirana","Patel Weighbridge Services"];
const OFFICERS = ["Insp. K. Verma","Insp. R. Nair","Insp. S. Bano","Insp. A. Chauhan"];

let instruments = [];
let applications = [];
let seq = 1000;

function pad(n){return n.toString().padStart(6,'0');}
function typeCode(t){
  return {"Weighing Scale":"WM","Weighbridge":"WB","Fuel Dispenser":"FD","Water Meter":"WT","Taximeter":"TM","Other":"OT"}[t] || "IN";
}
function todayPlus(days){
  const d = new Date(); d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}
function daysBetween(dateStr){
  return Math.round((new Date(dateStr) - new Date())/86400000);
}

function seedData(){
  const seedInstruments = [
    {id:"WM-2026-004512", type:"Weighing Scale", manufacturer:"Avery India", model:"30kg platform scale", serial:"SN-88213", owner:"Anita Grocers", state:"Uttar Pradesh", location:"Sadar Bazaar, Ghaziabad, Uttar Pradesh", status:"Verified", lastVerified:"2026-03-12", validUntil:todayPlus(180), certId:"CERT-2026-31207"},
    {id:"FD-2025-118820", type:"Fuel Dispenser", manufacturer:"Tokheim", model:"Quantium 510", serial:"SN-51092", owner:"Singh Fuel Point", state:"Rajasthan", location:"NH-48, Ajmer, Rajasthan", status:"Expired", lastVerified:"2025-01-20", validUntil:"2026-01-20", certId:"CERT-2025-08841"},
    {id:"WB-2024-003310", type:"Weighbridge", manufacturer:"Avery Weigh-Tronix", model:"80-tonne pit type", serial:"SN-20044", owner:"Patel Weighbridge Services", state:"Gujarat", location:"GIDC Vatva, Ahmedabad, Gujarat", status:"Verified", lastVerified:"2026-06-02", validUntil:todayPlus(300), certId:"CERT-2026-40120"},
    {id:"WT-2026-000871", type:"Water Meter", manufacturer:"Kirloskar Brothers", model:"DN25 rotary", serial:"SN-77341", owner:"City Water Works", state:"Maharashtra", location:"Ward 14, Pune, Maharashtra", status:"Pending", lastVerified:null, validUntil:null, certId:null},
    {id:"TM-2025-005530", type:"Taximeter", manufacturer:"Digitax", model:"DT-200", serial:"SN-33218", owner:"Metro Taxi Co-op", state:"Karnataka", location:"Koramangala, Bengaluru, Karnataka", status:"Verified", lastVerified:"2026-05-15", validUntil:todayPlus(20), certId:"CERT-2026-38820"},
    {id:"WM-2025-002215", type:"Weighing Scale", manufacturer:"Essae Digitronics", model:"20kg counter scale", serial:"SN-19004", owner:"Sharma & Sons Kirana", state:"Bihar", location:"Boring Road, Patna, Bihar", status:"Rejected", lastVerified:null, validUntil:null, certId:null},
  ];
  instruments = seedInstruments;

  // extra randomly generated instruments for admin-scale numbers & the bar chart
  for(let i=0;i<26;i++){
    const type = ["Weighing Scale","Weighbridge","Fuel Dispenser","Water Meter","Taximeter"][Math.floor(Math.random()*5)];
    const state = STATES[Math.floor(Math.random()*STATES.length)];
    const statusRoll = Math.random();
    const status = statusRoll<0.55?"Verified":statusRoll<0.8?"Pending":statusRoll<0.93?"Expired":"Rejected";
    seq++;
    instruments.push({
      id: `${typeCode(type)}-2026-${pad(seq)}`,
      type, manufacturer:"—", model:"—", serial:`SN-${90000+i}`,
      owner: OWNERS[Math.floor(Math.random()*OWNERS.length)],
      state, location: state,
      status,
      lastVerified: status==="Pending"?null:"2026-0"+(1+Math.floor(Math.random()*8))+"-1"+Math.floor(Math.random()*9),
      validUntil: status==="Verified"?todayPlus(Math.floor(Math.random()*300)+10):null,
      certId: status==="Verified"?`CERT-2026-${20000+i}`:null
    });
  }

  applications = [
    {id:"APP-88031", instrumentId:"WT-2026-000871", appliedOn:"2026-08-20", officer:"Insp. K. Verma", status:"Scheduled"},
    {id:"APP-88032", instrumentId:"WM-2025-002215", appliedOn:"2026-07-02", officer:"Insp. R. Nair", status:"Rejected"},
    {id:"APP-88033", instrumentId:"FD-2025-118820", appliedOn:"2026-09-01", officer:"Insp. S. Bano", status:"Scheduled"},
  ];
}
seedData();

/* ===================== NAV / VIEW SWITCHING ===================== */
document.getElementById('roleNav').addEventListener('click', e=>{
  const btn = e.target.closest('button[data-role]');
  if(!btn) return;
  setView(btn.dataset.role);
});
function setView(role){
  document.querySelectorAll('nav.roles button').forEach(b=>b.classList.toggle('active', b.dataset.role===role));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+role).classList.add('active');
  if(role==='owner') renderOwner();
  if(role==='inspector') renderInspector();
  if(role==='admin') renderAdmin();
}

/* ===================== TOAST ===================== */
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ===================== BADGE HELPER ===================== */
function badge(status){
  const map = {Verified:"verified", Pending:"pending", Scheduled:"pending", Expired:"expired", Rejected:"rejected"};
  const cls = map[status] || "unverified";
  return `<span class="badge ${cls}"><span class="dot"></span>${status}</span>`;
}

/* ===================== PUBLIC LOOKUP ===================== */
function fillSample(id){
  document.getElementById('lookupInput').value = id;
  doLookup();
}
function doLookup(){
  const q = document.getElementById('lookupInput').value.trim();
  const box = document.getElementById('lookupResult');
  if(!q){ box.innerHTML=''; return; }
  const inst = instruments.find(i=>i.id.toLowerCase()===q.toLowerCase() || (i.certId && i.certId.toLowerCase()===q.toLowerCase()));
  if(!inst){
    box.innerHTML = `<div class="panel-card" style="margin-top:18px;border-left:3px solid var(--rejected);"><h3 style="margin-bottom:6px;">No record found</h3><p style="margin:0;">No instrument or certificate matches “${escapeHtml(q)}”. Check the ID and try again, or contact the local Legal Metrology office.</p></div>`;
    return;
  }
  const status = liveStatus(inst);
  box.innerHTML = `
    <div class="panel-card" style="margin-top:18px;">
      <div class="flex-between" style="margin-bottom:14px;">
        <h3 style="margin:0;">${inst.type} · <span class="mono">${inst.id}</span></h3>
        ${badge(status)}
      </div>
      <div class="cert-grid" style="color:var(--text);">
        <div><span style="color:var(--text-dim);">Owner / dealer</span><b style="font-weight:500;">${inst.owner}</b></div>
        <div><span style="color:var(--text-dim);">Location</span><b style="font-weight:500;">${inst.location}</b></div>
        <div><span style="color:var(--text-dim);">Last verified</span><b style="font-weight:500;">${inst.lastVerified || "Not yet verified"}</b></div>
        <div><span style="color:var(--text-dim);">Valid until</span><b style="font-weight:500;">${inst.validUntil || "—"}</b></div>
      </div>
      ${status==="Verified" ? `<button class="btn small" style="margin-top:6px;" onclick="showCertificate('${inst.id}')">View digital certificate</button>` : `<p style="margin:0;font-size:13px;">${status==="Pending"?"This instrument's verification is in progress.":status==="Expired"?"This instrument's verification has lapsed and it is due for re-testing.":"This instrument failed its last inspection and has not been certified."}</p>`}
    </div>`;
}
function liveStatus(inst){
  if(inst.status==="Verified" && inst.validUntil && daysBetween(inst.validUntil) < 0) return "Expired";
  return inst.status;
}
function escapeHtml(s){ return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* animate gauge needle once on load */
window.addEventListener('load', ()=>{
  const needle = document.getElementById('gaugeNeedle');
  needle.style.transition = 'transform 1.1s cubic-bezier(.2,.8,.2,1)';
  requestAnimationFrame(()=> needle.style.transform = 'rotate(78deg)');
});

/* ===================== OWNER DASHBOARD ===================== */
const CURRENT_OWNER = "Anita Grocers"; // demo: the logged-in owner
function renderOwner(){
  const mine = instruments.filter(i=>i.owner===CURRENT_OWNER);
  const verified = mine.filter(i=>liveStatus(i)==="Verified").length;
  const pending = mine.filter(i=>liveStatus(i)==="Pending").length;
  const expiring = mine.filter(i=>i.validUntil && daysBetween(i.validUntil)>=0 && daysBetween(i.validUntil)<=30).length;

  document.getElementById('ownerStats').innerHTML = `
    <div class="stat"><div class="n">${mine.length}</div><div class="l">Registered instruments</div></div>
    <div class="stat"><div class="n verified">${verified}</div><div class="l">Currently verified</div></div>
    <div class="stat"><div class="n pending">${pending}</div><div class="l">Awaiting inspection</div></div>
    <div class="stat"><div class="n expired">${expiring}</div><div class="l">Expiring within 30 days</div></div>
  `;

  const body = document.getElementById('ownerInstrumentsBody');
  body.innerHTML = mine.length ? mine.map(i=>{
    const status = liveStatus(i);
    const canApply = status==="Pending" ? false : (status==="Verified" && daysBetween(i.validUntil)>30 ? false : true);
    return `<tr>
      <td class="idcell">${i.id}</td>
      <td>${i.type}</td>
      <td>${i.model}</td>
      <td>${i.location}</td>
      <td>${badge(status)}</td>
      <td>${i.validUntil || "—"}</td>
      <td>
        ${status==="Verified" ? `<button class="btn small subtle" onclick="showCertificate('${i.id}')">Certificate</button>` : ""}
        ${canApply ? `<button class="btn small" onclick="applyForVerification('${i.id}')">Apply</button>` : ""}
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="empty">No instruments registered yet. Use “Register new instrument” to add one.</td></tr>`;

  const appBody = document.getElementById('ownerApplicationsBody');
  const myApps = applications.filter(a=> mine.some(i=>i.id===a.instrumentId));
  appBody.innerHTML = myApps.length ? myApps.map(a=>`
    <tr>
      <td class="idcell">${a.id}</td>
      <td class="idcell">${a.instrumentId}</td>
      <td>${a.appliedOn}</td>
      <td>${a.officer}</td>
      <td>${badge(a.status)}</td>
    </tr>`).join('') : `<tr><td colspan="5" class="empty">No verification applications yet.</td></tr>`;
}

function openRegisterModal(){ openModal('registerModalBackdrop'); }
function submitRegister(){
  const type = document.getElementById('regType').value;
  const manufacturer = document.getElementById('regManufacturer').value.trim() || "Not specified";
  const model = document.getElementById('regModel').value.trim() || "Not specified";
  const serial = document.getElementById('regSerial').value.trim() || ("SN-"+Math.floor(Math.random()*90000+10000));
  const location = document.getElementById('regLocation').value.trim() || "Not specified";
  seq++;
  const id = `${typeCode(type)}-2026-${pad(seq)}`;
  instruments.unshift({id, type, manufacturer, model, serial, owner:CURRENT_OWNER, state:"Uttar Pradesh", location, status:"Pending", lastVerified:null, validUntil:null, certId:null});
  closeModal('registerModalBackdrop');
  ['regManufacturer','regModel','regSerial','regLocation'].forEach(f=>document.getElementById(f).value='');
  showToast(`Instrument ${id} registered`);
  renderOwner();
}
function applyForVerification(instrumentId){
  const inst = instruments.find(i=>i.id===instrumentId);
  const appId = "APP-"+Math.floor(Math.random()*90000+10000);
  applications.unshift({id:appId, instrumentId, appliedOn:new Date().toISOString().slice(0,10), officer:OFFICERS[Math.floor(Math.random()*OFFICERS.length)], status:"Scheduled"});
  showToast(`Verification requested — ${appId}`);
  renderOwner();
}

/* ===================== INSPECTOR DASHBOARD ===================== */
function renderInspector(){
  const queue = applications.filter(a=>a.status==="Scheduled");
  const doneThisSession = applications.filter(a=>a.status==="Verified"||a.status==="Rejected").length;

  document.getElementById('inspectorStats').innerHTML = `
    <div class="stat"><div class="n pending">${queue.length}</div><div class="l">Pending assignments</div></div>
    <div class="stat"><div class="n">${applications.length}</div><div class="l">Total applications</div></div>
    <div class="stat"><div class="n verified">${doneThisSession}</div><div class="l">Completed</div></div>
  `;

  const body = document.getElementById('inspectorQueueBody');
  body.innerHTML = applications.length ? applications.map(a=>{
    const inst = instruments.find(i=>i.id===a.instrumentId) || {};
    return `<tr>
      <td class="idcell">${a.id}</td>
      <td class="idcell">${a.instrumentId}</td>
      <td>${inst.owner||"—"}</td>
      <td>${inst.type||"—"}</td>
      <td>${a.appliedOn}</td>
      <td>${badge(a.status)}</td>
      <td>${a.status==="Scheduled" ? `<button class="btn small" onclick="openTestModal('${a.id}')">Conduct test</button>` : ""}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="empty">No applications in the queue.</td></tr>`;
}

let activeAppId = null;
function openTestModal(appId){
  activeAppId = appId;
  const app = applications.find(a=>a.id===appId);
  const inst = instruments.find(i=>i.id===app.instrumentId);
  document.getElementById('testModalSub').textContent = `${inst.type} · ${inst.id} · ${inst.owner}, ${inst.location}`;
  document.getElementById('testStandard').value='';
  document.getElementById('testError').value='';
  document.getElementById('testRemarks').value='';
  openModal('testModalBackdrop');
}
function decideTest(approve){
  const app = applications.find(a=>a.id===activeAppId);
  const inst = instruments.find(i=>i.id===app.instrumentId);
  app.status = approve ? "Verified" : "Rejected";
  if(approve){
    inst.status = "Verified";
    inst.lastVerified = new Date().toISOString().slice(0,10);
    inst.validUntil = todayPlus(365);
    inst.certId = "CERT-2026-"+Math.floor(Math.random()*90000+10000);
  } else {
    inst.status = "Rejected";
  }
  closeModal('testModalBackdrop');
  showToast(approve ? `Certificate issued for ${inst.id}` : `${inst.id} marked as failed`);
  renderInspector();
  if(approve){ showCertificate(inst.id); }
}

/* ===================== ADMIN DASHBOARD ===================== */
function renderAdmin(){
  const total = instruments.length;
  const verified = instruments.filter(i=>liveStatus(i)==="Verified").length;
  const pending = instruments.filter(i=>liveStatus(i)==="Pending").length;
  const expired = instruments.filter(i=>liveStatus(i)==="Expired").length;

  document.getElementById('adminStats').innerHTML = `
    <div class="stat"><div class="n">${total}</div><div class="l">Instruments registered</div></div>
    <div class="stat"><div class="n verified">${verified}</div><div class="l">Currently verified</div></div>
    <div class="stat"><div class="n pending">${pending}</div><div class="l">Pending inspection</div></div>
    <div class="stat"><div class="n expired">${expired}</div><div class="l">Overdue for re-verification</div></div>
  `;

  // simple bar chart by state, hand-rolled with divs
  const byState = {};
  STATES.forEach(s=>byState[s]=0);
  instruments.forEach(i=>{ byState[i.state] = (byState[i.state]||0)+1; });
  const max = Math.max(...Object.values(byState), 1);
  document.getElementById('adminBarChart').innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:14px;height:160px;padding-top:10px;">
      ${STATES.map(s=>{
        const v = byState[s]||0;
        const h = Math.round((v/max)*130)+6;
        return `<div style="flex:1;text-align:center;">
          <div style="height:${h}px;background:linear-gradient(180deg,var(--brass-light),var(--brass));border-radius:2px 2px 0 0;"></div>
          <div class="mono" style="font-size:11px;color:var(--text-dim);margin-top:8px;">${v}</div>
          <div style="font-size:10.6px;color:var(--text-dim);margin-top:2px;line-height:1.2;">${s}</div>
        </div>`;
      }).join('')}
    </div>`;

  const filter = document.getElementById('adminFilter').value;
  const rows = instruments.filter(i => filter==="all" || liveStatus(i)===filter).slice(0,40);
  document.getElementById('adminInstrumentsBody').innerHTML = rows.length ? rows.map(i=>`
    <tr>
      <td class="idcell">${i.id}</td>
      <td>${i.type}</td>
      <td>${i.owner}</td>
      <td>${i.state}</td>
      <td>${badge(liveStatus(i))}</td>
      <td>${i.lastVerified || "—"}</td>
    </tr>`).join('') : `<tr><td colspan="6" class="empty">No instruments match this filter.</td></tr>`;
}

/* ===================== CERTIFICATE ===================== */
function showCertificate(instrumentId){
  const inst = instruments.find(i=>i.id===instrumentId);
  const area = document.getElementById('certificateArea');
  area.innerHTML = `
    <div class="certificate">
      <div class="cert-head">
        <div>
          <h3>Certificate of Verification</h3>
          <div class="cert-sub">Issued under the Legal Metrology Act, 2009</div>
        </div>
        <div class="cert-sub" style="text-align:right;">Certificate no.<br><b class="mono" style="color:var(--ink-on-paper);">${inst.certId}</b></div>
      </div>
      <div class="cert-grid">
        <div><span>Instrument</span><b>${inst.type}</b></div>
        <div><span>Instrument ID</span><b>${inst.id}</b></div>
        <div><span>Owner / dealer</span><b style="font-family:'IBM Plex Sans';">${inst.owner}</b></div>
        <div><span>Location</span><b style="font-family:'IBM Plex Sans';">${inst.location}</b></div>
        <div><span>Verified on</span><b>${inst.lastVerified}</b></div>
        <div><span>Valid until</span><b>${inst.validUntil}</b></div>
      </div>
      <div class="cert-foot">
        <div class="cert-status-line">This certificate is issued electronically and is valid without a physical signature. Scan the code to confirm its current status on the public portal.</div>
        <div class="qr-box" id="qrHolder"></div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn subtle" onclick="closeModal('certModalBackdrop')">Close</button>
    </div>
  `;
  openModal('certModalBackdrop');
  const qrHolder = document.getElementById('qrHolder');
  qrHolder.innerHTML = '';
  try{
    new QRCode(qrHolder, {
      text: `VERIFY:${inst.certId}:${inst.id}`,
      width: 88, height: 88,
      colorDark: "#14181C", colorLight: "#ffffff"
    });
  }catch(e){
    qrHolder.innerHTML = `<div class="mono" style="font-size:10px;width:88px;height:88px;display:flex;align-items:center;justify-content:center;text-align:center;">${inst.certId}</div>`;
  }
}

/* ===================== MODAL HELPERS ===================== */
function openModal(id){ document.getElementById(id).classList.add('active'); }
function closeModal(id){ document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-backdrop').forEach(bd=>{
  bd.addEventListener('click', e=>{ if(e.target===bd) bd.classList.remove('active'); });
});
document.getElementById('lookupInput').addEventListener('keydown', e=>{ if(e.key==='Enter') doLookup(); });

/* init */
renderOwner(); renderInspector(); renderAdmin();
import { useState, useReducer, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Navigation, Package, Fuel, BarChart2, User,
  Sun, Moon, Plus, Check, Trash2, MapPin, Zap, BookOpen,
  Lightbulb, ChevronDown, ChevronUp, Camera, TrendingUp, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import './App.css';

// ── CONSTANTS ─────────────────────────────────────────────────────
const LOCATION_COORDS = {
  'Bhayandar East Market':   [19.3008, 72.8697],
  'Dahisar Check Naka':      [19.2493, 72.8594],
  'Mira Road Station':       [19.2812, 72.8697],
  'Kashimira Junction':      [19.2697, 72.8549],
  'Uttan Road':              [19.3394, 72.8197],
  'Mira Bhayander ST Depot': [19.2935, 72.8618],
  'Golden Nest Junction':    [19.2755, 72.8695],
  'Naigaon Market':          [19.3649, 72.8509],
};

const CHECKPOINTS = [
  { name: 'Dahisar Check Naka',  coords: [19.2493, 72.8594], color: '#ef4444' },
  { name: 'Kashimira Junction',  coords: [19.2697, 72.8549], color: '#f97316' },
  { name: 'Mira Road Station',   coords: [19.2812, 72.8697], color: '#3b82f6' },
  { name: 'Bhayandar East',      coords: [19.3008, 72.8697], color: '#22c55e' },
];

const ROUTE_PATHS = {
  'Bhayandar East Market-Dahisar Check Naka': {
    old: [[19.3008,72.8697],[19.3008,72.889],[19.274,72.889],[19.2493,72.8594]],
    new: [[19.3008,72.8697],[19.28,72.865],[19.2493,72.8594]],
    oldKm:14,newKm:11,oldMin:35,newMin:22,fuelSaved:0.8,cost:60,
  },
  'Dahisar Check Naka-Mira Road Station': {
    old: [[19.2493,72.8594],[19.2493,72.89],[19.2812,72.89],[19.2812,72.8697]],
    new: [[19.2493,72.8594],[19.265,72.864],[19.2812,72.8697]],
    oldKm:10,newKm:8,oldMin:28,newMin:20,fuelSaved:0.5,cost:40,
  },
  'Kashimira Junction-Bhayandar East Market': {
    old: [[19.2697,72.8549],[19.2697,72.88],[19.32,72.88],[19.3008,72.8697]],
    new: [[19.2697,72.8549],[19.285,72.86],[19.3008,72.8697]],
    oldKm:7,newKm:5,oldMin:20,newMin:14,fuelSaved:0.4,cost:30,
  },
  'Mira Bhayander ST Depot-Dahisar Check Naka': {
    old: [[19.2935,72.8618],[19.2935,72.89],[19.255,72.89],[19.2493,72.8594]],
    new: [[19.2935,72.8618],[19.272,72.8606],[19.2493,72.8594]],
    oldKm:18,newKm:14,oldMin:45,newMin:30,fuelSaved:1.0,cost:75,
  },
};

const TRAINING_MODULES = [
  { id:'gps', icon:<MapPin size={18}/>, title:'GPS Navigation Guide',
    tips:['Download Google Maps offline for Mira Bhayandar area.','Speak destination in Hindi — tap 🎤 and say "Dahisar Check Naka".','Enable "Avoid Tolls" to save ₹40–₹80 per NH48 trip.','Share live location with consignees to reduce calls while driving.'],
  },
  { id:'fuel', icon:<Fuel size={18}/>, title:'Fuel Saving Techniques',
    tips:['Smooth acceleration saves up to 15% fuel vs. sudden bursts.','Speed above 70 km/h wastes 25–30% extra fuel.','Turn off engine if waiting more than 60 seconds.','Use engine braking on downhill roads instead of brakes.'],
  },
  { id:'app', icon:<BookOpen size={18}/>, title:'Delivery App Basics',
    tips:['Use Vyapar or OkCredit to create GST bills on your phone.','Send invoices via WhatsApp PDF — saves ₹200/month in printing.','Store delivery receipt photos in WhatsApp Saved Messages.','Digital invoices = faster payments from most customers.'],
  },
];

const VEHICLE_TYPES = ['Truck', 'Tempo', 'Mini Truck'];

// ── STATE ──────────────────────────────────────────────────────────
const INIT = {
  profile: { name:'Ramesh Kumar', phone:'9876543210', vehicleType:'Truck', license:'MH04-20250001', photo:null },
  deliveries: [
    { id:1, pickup:'Bhayandar East Market', drop:'Kashimira Junction',   note:'5 cartons electronics', status:'pending',   date:'2026-03-12' },
    { id:2, pickup:'Mira Road Station',     drop:'Dahisar Check Naka',   note:'200 kg cement bags',   status:'completed', date:'2026-03-12' },
    { id:3, pickup:'Golden Nest Junction',  drop:'Naigaon Market',       note:'50 kg vegetables',     status:'pending',   date:'2026-03-12' },
  ],
  trips: [
    { id:1, from:'Bhayandar East', to:'Dahisar Check Naka',  km:14, fuel:1.2, date:'2026-03-12', earnings:450 },
    { id:2, from:'Mira Road',      to:'Kashimira Junction',  km:8,  fuel:0.7, date:'2026-03-11', earnings:280 },
    { id:3, from:'Uttan Road',     to:'Naigaon Market',      km:12, fuel:1.0, date:'2026-03-10', earnings:385 },
    { id:4, from:'Bhayandar East', to:'Mira Road Station',   km:6,  fuel:0.5, date:'2026-03-09', earnings:200 },
    { id:5, from:'Golden Nest',    to:'Dahisar Check Naka',  km:10, fuel:0.8, date:'2026-03-08', earnings:320 },
  ],
  fuelLogs:[
    { day:'Mon', mileage:12.4 },{ day:'Tue', mileage:10.8 },
    { day:'Wed', mileage:13.1 },{ day:'Thu', mileage:11.5 },
    { day:'Fri', mileage:12.9 },{ day:'Sat', mileage:9.6  },
  ],
};

function reducer(state, a) {
  switch(a.type) {
    case 'SET_PROFILE':    return { ...state, profile:{ ...state.profile, ...a.p } };
    case 'ADD_DELIVERY':   return { ...state, deliveries:[a.d, ...state.deliveries] };
    case 'TOGGLE_DEL':     return { ...state, deliveries: state.deliveries.map(d=> d.id===a.id ? {...d, status: d.status==='completed'?'pending':'completed'} : d) };
    case 'DELETE_DEL':     return { ...state, deliveries: state.deliveries.filter(d=>d.id!==a.id) };
    case 'ADD_TRIP':       return { ...state, trips:[a.t, ...state.trips] };
    case 'ADD_FUEL_LOG':   return { ...state, fuelLogs:[...state.fuelLogs.slice(1), a.log] };
    default: return state;
  }
}

// ── HELPERS ────────────────────────────────────────────────────────
function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords?.length) map.fitBounds(coords, { padding:[40,40] }); }, [coords, map]);
  return null;
}

const ChartTooltip = ({ active, payload, label }) =>
  active && payload?.length
    ? <div style={{background:'#1e293b',border:'1px solid #f97316',borderRadius:8,padding:'7px 12px',color:'#fff',fontSize:12}}>
        <strong style={{color:'#f97316'}}>{label}</strong><br/>{payload[0].value.toFixed(1)} km/L
      </div>
    : null;

function getRoute(from, to) {
  const k1=`${from}-${to}`, k2=`${to}-${from}`;
  return ROUTE_PATHS[k1] || ROUTE_PATHS[k2] || null;
}

// ── APP ────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [dark, setDark]   = useState(false);
  const [tab,  setTab]    = useState(0);

  const tabs = [
    { icon:<LayoutDashboard size={20}/>, label:'Home' },
    { icon:<Navigation size={20}/>,      label:'Route' },
    { icon:<Package size={20}/>,         label:'Deliveries' },
    { icon:<Fuel size={20}/>,            label:'Fuel' },
    { icon:<BarChart2 size={20}/>,       label:'Analytics' },
    { icon:<User size={20}/>,            label:'Profile' },
  ];

  return (
    <div className={`app${dark?' dark':''}`}>
      <header className="header">
        <div className="header-inner">
          <div className="logo-block">
            <div className="logo-icon">🚗</div>
            <div className="logo-text">
              <h1>DriveSmart</h1>
              <small>Digital Driver Assistance Platform</small>
            </div>
          </div>
          <button className="icon-btn" onClick={()=>setDark(d=>!d)} title="Toggle dark mode">
            {dark ? <Sun size={17}/> : <Moon size={17}/>}
          </button>
        </div>
        <div className="header-stripe"/>
      </header>

      <main className="main-content">
        <div key={tab} className="page-fade">
          {tab===0 && <DashboardTab state={state} go={setTab}/>}
          {tab===1 && <RouteTab dark={dark}/>}
          {tab===2 && <DeliveriesTab state={state} dispatch={dispatch}/>}
          {tab===3 && <FuelTab state={state} dispatch={dispatch}/>}
          {tab===4 && <AnalyticsTab state={state}/>}
          {tab===5 && <ProfileTab state={state} dispatch={dispatch}/>}
        </div>
      </main>

      <nav className="tab-bar">
        {tabs.map((t,i)=>(
          <button key={i} className={`tab-btn${tab===i?' active':''}`} onClick={()=>setTab(i)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────
function DashboardTab({ state, go }) {
  const { profile, deliveries, trips } = state;
  const totalKm   = trips.reduce((s,t)=>s+t.km, 0);
  const totalFuel = trips.reduce((s,t)=>s+t.fuel, 0);
  const completed = deliveries.filter(d=>d.status==='completed').length;
  const pending   = deliveries.filter(d=>d.status==='pending').length;
  const [openMod, setOpenMod] = useState(null);
  const tip = ['Plan return trips with loads — avoid empty runs.','Check tyre pressure weekly at Bhayandar East.','Maintain 40–60 km/h on Ghodbunder Road for best mileage.'][new Date().getDay()%3];

  return (
    <>
      {/* Profile mini */}
      <div className="card profile-mini slide-up">
        <div className="profile-avatar">
          {profile.photo
            ? <img src={profile.photo} alt="dp" className="avatar-img"/>
            : <span className="avatar-initials">{profile.name?.[0]?.toUpperCase()||'?'}</span>}
        </div>
        <div className="profile-info">
          <div className="profile-name">{profile.name||'Add your name'}</div>
          <div className="profile-meta">{profile.vehicleType} · {profile.license||'No license added'}</div>
          <div className="profile-phone">📞 {profile.phone||'Add phone number'}</div>
        </div>
        <button className="icon-pill" onClick={()=>go(5)}>Edit</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon:'🚀', val:trips.length, lbl:'Total Trips' },
          { icon:'📍', val:totalKm+' km', lbl:'Distance' },
          { icon:'⛽', val:totalFuel.toFixed(1)+'L', lbl:'Fuel Used' },
          { icon:'✅', val:completed, lbl:'Delivered' },
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{animationDelay:`${i*0.07}s`}}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Tip banner */}
      <div style={{background:'linear-gradient(135deg,#f97316,#c2410c)',borderRadius:12,padding:'13px 15px',display:'flex',gap:11,marginBottom:12,color:'white',boxShadow:'0 4px 14px rgba(249,115,22,.35)',animation:'su .35s ease .25s both'}}>
        <span style={{fontSize:'1.3rem',flexShrink:0}}>💡</span>
        <div>
          <div style={{fontSize:'.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',opacity:.85,fontFamily:'Oswald,sans-serif'}}>⭐ Fuel Tip of the Day</div>
          <p style={{fontSize:'.88rem',marginTop:3,lineHeight:1.5}}>{tip}</p>
        </div>
      </div>

      {/* Today's Deliveries */}
      <div className="card slide-up">
        <div className="card-header">
          <Package size={15}/> Today's Deliveries
          <span className="header-chip">{pending} pending</span>
        </div>
        <div className="card-body p0">
          {deliveries.slice(0,3).map(d=>(
            <div key={d.id} className="delivery-row">
              <div className={`delivery-dot ${d.status}`}/>
              <div className="delivery-info">
                <div className="delivery-route">{d.pickup} → {d.drop}</div>
                <div className="delivery-note">{d.note}</div>
              </div>
              <div className={`status-pill ${d.status}`}>{d.status}</div>
            </div>
          ))}
          <button className="card-link-btn" onClick={()=>go(2)}>View all deliveries →</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="qa-btn primary" onClick={()=>go(1)}><Navigation size={18}/>Plan Route</button>
        <button className="qa-btn secondary" onClick={()=>go(3)}><Fuel size={18}/>Fuel Calc</button>
        <button className="qa-btn secondary" onClick={()=>go(4)}><BarChart2 size={18}/>Analytics</button>
      </div>

      {/* Training */}
      <div className="section-header">
        <div className="section-title"><Lightbulb size={18} color="#f97316"/> Driver Training</div>
        <div className="section-sub">Quick guides to earn more & save fuel</div>
      </div>
      {TRAINING_MODULES.map((mod,i)=>(
        <div key={mod.id} className="module-card" style={{animationDelay:`${i*.1}s`}}
          onClick={()=>setOpenMod(openMod===mod.id?null:mod.id)}>
          <div className="module-header">
            <div className="module-icon">{mod.icon}</div>
            <div className="module-title">{mod.title}</div>
            {openMod===mod.id ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
          </div>
          {openMod===mod.id && (
            <div className="module-tips">
              {mod.tips.map((tip,j)=>(
                <div key={j} className="tip-item">
                  <span className="tip-num">{j+1}</span><p>{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// ── ROUTE TAB ──────────────────────────────────────────────────────
function RouteTab({ dark }) {
  const LOCS = Object.keys(LOCATION_COORDS);
  const [from, setFrom] = useState(LOCS[0]);
  const [to,   setTo]   = useState(LOCS[1]);
  const [result, setResult] = useState(null);

  const handleRoute = () => {
    if (from===to) return;
    const data = getRoute(from, to);
    if (data) {
      setResult({ ...data, from, to, hasPath:true });
    } else {
      const ok = Math.floor(Math.random()*12)+8;
      const nk = ok-Math.floor(Math.random()*4)-2;
      setResult({ from, to, oldKm:ok, newKm:nk, oldMin:Math.round(ok*2.8), newMin:Math.round(nk*2.2), fuelSaved:+(Math.random()*.8+.4).toFixed(1), cost:Math.floor(Math.random()*50)+30, hasPath:false });
    }
  };

  const paths      = result?.hasPath ? getRoute(result.from, result.to) : null;
  const allCoords  = paths ? [...paths.old, ...paths.new] : [];
  const tileUrl    = dark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttr   = dark ? '&copy; CARTO' : '&copy; OpenStreetMap contributors';

  return (
    <>
      <div className="section-header">
        <div className="section-title"><Navigation size={18} color="#f97316"/> Smart Route Planner</div>
        <div className="section-sub">Find the shortest path, save fuel & time</div>
      </div>

      <div className="card slide-up">
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">📍 Starting Location</label>
            <select className="form-select" value={from} onChange={e=>setFrom(e.target.value)}>
              {LOCS.map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
          <div style={{textAlign:'center',fontSize:22,color:'var(--accent)',margin:'4px 0'}}>↓</div>
          <div className="form-group">
            <label className="form-label">🏁 Destination</label>
            <select className="form-select" value={to} onChange={e=>setTo(e.target.value)}>
              {LOCS.map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
          {from===to && <p style={{color:'var(--red)',fontSize:13,marginBottom:8}}>Please select different locations.</p>}
          <button className="btn-primary" onClick={handleRoute} style={{width:'100%',marginTop:4}}>
            <Navigation size={16}/> Generate Best Route
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="card slide-up">
        <div className="card-header"><MapPin size={15}/> Live Route Map — Mira Bhayandar</div>
        <div className="map-wrap">
          <MapContainer center={[19.28, 72.865]} zoom={13} style={{width:'100%',height:'100%'}} scrollWheelZoom={false}>
            <TileLayer attribution={tileAttr} url={tileUrl}/>
            {/* Logistics checkpoints */}
            {CHECKPOINTS.map(cp=>(
              <CircleMarker key={cp.name} center={cp.coords} radius={8}
                pathOptions={{color:'white',fillColor:cp.color,fillOpacity:1,weight:2.5}}>
                <Popup><strong>{cp.name}</strong><br/><small>Logistics Checkpoint</small></Popup>
              </CircleMarker>
            ))}
            {/* All location markers */}
            {Object.entries(LOCATION_COORDS).map(([name,coords])=>(
              <CircleMarker key={name} center={coords} radius={5}
                pathOptions={{color:'var(--accent)',fillColor:'#f97316',fillOpacity:0.7,weight:1.5}}>
                <Popup>{name}</Popup>
              </CircleMarker>
            ))}
            {/* Route lines */}
            {result && paths?.old && <Polyline positions={paths.old} pathOptions={{color:'#ef4444',weight:4,opacity:.65,dashArray:'8,8'}}/>}
            {result && paths?.new && <Polyline positions={paths.new} pathOptions={{color:'#22c55e',weight:6,opacity:.95}}/>}
            {/* Start/end markers */}
            {result && LOCATION_COORDS[result.from] && (
              <CircleMarker center={LOCATION_COORDS[result.from]} radius={11}
                pathOptions={{color:'white',fillColor:'#3b82f6',fillOpacity:1,weight:2.5}}>
                <Popup>🚛 Start: {result.from}</Popup>
              </CircleMarker>
            )}
            {result && LOCATION_COORDS[result.to] && (
              <CircleMarker center={LOCATION_COORDS[result.to]} radius={11}
                pathOptions={{color:'white',fillColor:'#f97316',fillOpacity:1,weight:2.5}}>
                <Popup>🏁 End: {result.to}</Popup>
              </CircleMarker>
            )}
            {allCoords.length>0 && <FitBounds coords={allCoords}/>}
          </MapContainer>
          <div className="map-legend">
            <span className="leg-item"><span className="leg-line green"></span>Optimal</span>
            <span className="leg-item"><span className="leg-line red"></span>Current</span>
          </div>
        </div>
      </div>

      {/* Route result */}
      {result && (
        <div className="card page-fade">
          <div className="card-header"><TrendingUp size={15}/> Route Details</div>
          <div className="card-body">
            <div style={{fontSize:'.78rem',color:'var(--text-muted)',marginBottom:10,textAlign:'center'}}>
              📍 {result.from} → 🏁 {result.to}
            </div>
            <div className="route-compare">
              <div className="route-box old">
                <div className="rb-label">❌ Current</div>
                <div className="rb-km">{result.oldKm} km</div>
                <div className="rb-time">⏱ {result.oldMin} min</div>
              </div>
              <div className="route-vs">VS</div>
              <div className="route-box new">
                <div className="rb-label">✅ Optimal</div>
                <div className="rb-km">{result.newKm} km</div>
                <div className="rb-time">⏱ {result.newMin} min</div>
              </div>
            </div>
            <div className="savings-card">
              <div className="sav-title">Total Savings Today</div>
              <div className="sav-amount">₹{result.cost}</div>
              <div className="sav-details">
                <span>⛽ {result.fuelSaved}L fuel</span>
                <span>⏱ {result.oldMin-result.newMin} min faster</span>
                <span>📍 {result.oldKm-result.newKm} km shorter</span>
              </div>
            </div>
            <p style={{fontSize:11,color:'var(--text-muted)',textAlign:'center',marginTop:10}}>ℹ️ Based on live traffic & distance optimization</p>
          </div>
        </div>
      )}
    </>
  );
}

// ── DELIVERIES TAB ─────────────────────────────────────────────────
function DeliveriesTab({ state, dispatch }) {
  const { deliveries } = state;
  const [form, setForm] = useState({ pickup:'', drop:'', note:'' });
  const completed = deliveries.filter(d=>d.status==='completed').length;
  const pct = deliveries.length ? Math.round(completed/deliveries.length*100) : 0;

  const add = () => {
    if (!form.pickup||!form.drop) return;
    dispatch({ type:'ADD_DELIVERY', d:{ id:Date.now(), ...form, status:'pending', date:new Date().toISOString().slice(0,10) }});
    setForm({ pickup:'', drop:'', note:'' });
  };

  return (
    <>
      <div className="section-header">
        <div className="section-title"><Package size={18} color="#f97316"/> Delivery Management</div>
        <div className="section-sub">Track and manage all your deliveries</div>
      </div>

      <div className="card slide-up">
        <div className="card-body">
          <div className="progress-header">
            <span>Today's Progress</span>
            <span><strong>{completed}</strong>/{deliveries.length} completed</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{width:`${pct}%`}}/>
          </div>
          <div className="progress-percent">{pct}% complete</div>
        </div>
      </div>

      <div className="card slide-up">
        <div className="card-header"><Plus size={14}/> Add Delivery Task</div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pickup Point</label>
              <input className="form-input" placeholder="e.g. Bhayandar East" value={form.pickup}
                onChange={e=>setForm(f=>({...f,pickup:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Drop Point</label>
              <input className="form-input" placeholder="e.g. Dahisar" value={form.drop}
                onChange={e=>setForm(f=>({...f,drop:e.target.value}))}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Cargo / Notes</label>
            <input className="form-input" placeholder="e.g. 5 cartons, fragile" value={form.note}
              onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
          </div>
          <button className="btn-primary" onClick={add} style={{width:'100%'}}>
            <Plus size={14}/> Add Delivery
          </button>
        </div>
      </div>

      <div className="section-header" style={{marginTop:4}}>
        <div className="section-title" style={{fontSize:'1rem'}}>All Deliveries ({deliveries.length})</div>
      </div>

      {deliveries.length===0
        ? <div className="empty-state">📦 No deliveries yet. Add your first task above!</div>
        : deliveries.map(d=>(
          <div key={d.id} className={`delivery-card ${d.status}`}>
            <div className="dc-header">
              <div className="dc-status">{d.status==='completed'?'✅':'🚚'}</div>
              <div className="dc-route">{d.pickup} → {d.drop}</div>
              <div className="dc-date">{d.date}</div>
            </div>
            {d.note && <div className="dc-note">{d.note}</div>}
            <div className="dc-actions">
              <button className={`dc-btn ${d.status==='completed'?'undo':'complete'}`}
                onClick={()=>dispatch({type:'TOGGLE_DEL',id:d.id})}>
                <Check size={12}/> {d.status==='completed'?'Mark Pending':'Mark Complete'}
              </button>
              <button className="dc-btn delete" onClick={()=>dispatch({type:'DELETE_DEL',id:d.id})}>
                <Trash2 size={12}/> Remove
              </button>
            </div>
          </div>
        ))
      }
    </>
  );
}

// ── FUEL TAB ───────────────────────────────────────────────────────
function FuelTab({ state, dispatch }) {
  const { trips, fuelLogs } = state;
  const [calc, setCalc]     = useState({ distance:'', mileage:'12', price:'92' });
  const [calcRes, setCalcRes] = useState(null);
  const [track, setTrack]   = useState({ litres:'', km:'' });
  const [mileage, setMileage] = useState(null);

  const doCalc = () => {
    const d=parseFloat(calc.distance), m=parseFloat(calc.mileage), p=parseFloat(calc.price);
    if (!d||!m||!p) return;
    setCalcRes({ fuel:(d/m).toFixed(2), cost:Math.round((d/m)*p) });
  };

  const doTrack = () => {
    const l=parseFloat(track.litres), k=parseFloat(track.km);
    if (!l||!k) return;
    const mg=(k/l).toFixed(2);
    setMileage(mg);
    dispatch({ type:'ADD_FUEL_LOG', log:{ day:'Today', mileage:parseFloat(mg) }});
    setTrack({ litres:'', km:'' });
  };

  const maxMil = Math.max(...fuelLogs.map(d=>d.mileage));

  return (
    <>
      <div className="section-header">
        <div className="section-title"><Fuel size={18} color="#f97316"/> Fuel Tools</div>
        <div className="section-sub">Calculate costs & track your mileage</div>
      </div>

      {/* Cost Calculator */}
      <div className="card slide-up">
        <div className="card-header"><Zap size={14}/> Fuel Cost Calculator</div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Trip Distance (km)</label>
            <input className="form-input" type="number" placeholder="e.g. 25km" value={calc.distance}
              onChange={e=>setCalc(c=>({...c,distance:e.target.value}))}/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mileage (km/L)</label>
              <input className="form-input" type="number" placeholder="12" value={calc.mileage}
                onChange={e=>setCalc(c=>({...c,mileage:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Fuel Price (₹/L)</label>
              <input className="form-input" type="number" placeholder="92" value={calc.price}
                onChange={e=>setCalc(c=>({...c,price:e.target.value}))}/>
            </div>
          </div>
          <button className="btn-primary" onClick={doCalc} style={{width:'100%'}}>
            <Zap size={14}/> Calculate Cost
          </button>
          {calcRes && (
            <div className="calc-result page-fade">
              <div className="cr-item"><span>⛽ Fuel Required</span><strong>{calcRes.fuel} Litres</strong></div>
              <div className="cr-item"><span>💰 Total Fuel Cost</span><strong style={{color:'var(--accent)',fontSize:'1.05rem'}}>₹{calcRes.cost}</strong></div>
            </div>
          )}
        </div>
      </div>

      {/* Mileage Tracker */}
      <div className="card slide-up">
        <div className="card-header"><BarChart2 size={14}/> Daily Mileage Tracker</div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fuel Filled (L)</label>
              <input className="form-input" type="number" placeholder="e.g. 10" value={track.litres}
                onChange={e=>setTrack(t=>({...t,litres:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">KM Driven</label>
              <input className="form-input" type="number" placeholder="e.g. 120" value={track.km}
                onChange={e=>setTrack(t=>({...t,km:e.target.value}))}/>
            </div>
          </div>
          <button className="btn-primary" onClick={doTrack} style={{width:'100%'}}>
            <BarChart2 size={14}/> Log Today's Mileage
          </button>
          {mileage && (
            <div className="mileage-display page-fade">
              <span className="mileage-num">{mileage}</span>
              <span className="mileage-lbl">km / litre today</span>
              <div style={{fontSize:13,fontWeight:600,marginTop:6,color:mileage>=12?'#22c55e':mileage>=9?'#f97316':'#ef4444'}}>
                {mileage>=14?'🌟 Excellent performance!'
                 :mileage>=12?'✅ Good mileage — keep it up!'
                 :mileage>=9 ?'⚠️ Average — try smoother acceleration'
                             :'🔴 Low — check tyre pressure!'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="card slide-up">
        <div className="card-header"><BarChart2 size={14}/> Weekly Mileage Chart</div>
        <div className="card-body">
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelLogs} margin={{top:5,right:5,left:-20,bottom:5}} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="day" tick={{fill:'var(--text-muted)',fontSize:11,fontFamily:'Inter'}}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:11,fontFamily:'Inter'}}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="mileage" radius={[6,6,0,0]} isAnimationActive animationDuration={800}>
                  {fuelLogs.map((e,i)=>(
                    <Cell key={i} fill={e.mileage===maxMil?'#f97316':'#334155'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{fontSize:11,color:'var(--text-muted)',textAlign:'center',marginTop:4}}>🟠 = Best day this week</p>
        </div>
      </div>

      {/* Trip History */}
      <div className="section-header">
        <div className="section-title" style={{fontSize:'1.1rem'}}><Clock size={16} color="#f97316"/> Trip History</div>
      </div>
      {trips.map(t=>(
        <div key={t.id} className="trip-card">
          <div className="tc-route">{t.from} → {t.to}</div>
          <div className="tc-meta">
            <span>📍 {t.km} km</span>
            <span>⛽ {t.fuel} L</span>
            <span>💰 ₹{t.earnings}</span>
            <span>📅 {t.date}</span>
          </div>
        </div>
      ))}
    </>
  );
}

// ── ANALYTICS TAB ──────────────────────────────────────────────────
function AnalyticsTab({ state }) {
  const { trips, deliveries, fuelLogs } = state;
  const totalKm      = trips.reduce((s,t)=>s+t.km, 0);
  const totalFuel    = trips.reduce((s,t)=>s+t.fuel, 0);
  const totalEarn    = trips.reduce((s,t)=>s+t.earnings, 0);
  const avgMileage   = totalFuel ? (totalKm/totalFuel).toFixed(1) : '—';
  const compRate     = deliveries.length ? Math.round(deliveries.filter(d=>d.status==='completed').length/deliveries.length*100) : 0;
  const perfScore    = Math.min(100, Math.round((parseFloat(avgMileage)||10)/15*80 + compRate*0.2));
  const perfColor    = perfScore>=75?'#22c55e':perfScore>=50?'#f97316':'#ef4444';
  const perfLabel    = perfScore>=75?'Excellent Driver':perfScore>=50?'Good Performance':'Needs Improvement';

  const earningsData = trips.slice().reverse().map(t=>({ day:t.date.slice(5), earn:t.earnings }));

  return (
    <>
      <div className="section-header">
        <div className="section-title"><BarChart2 size={18} color="#f97316"/> Driver Analytics</div>
        <div className="section-sub">Your performance at a glance</div>
      </div>

      <div className="analytics-grid">
        <div className="a-card slide-up" style={{animationDelay:'.04s'}}>
          <div className="a-val">{trips.length}</div><div className="a-lbl">Total Trips</div>
        </div>
        <div className="a-card green slide-up" style={{animationDelay:'.08s'}}>
          <div className="a-val">{totalKm}</div><div className="a-lbl">Total KM</div>
        </div>
        <div className="a-card blue slide-up" style={{animationDelay:'.12s'}}>
          <div className="a-val">{totalFuel.toFixed(1)}L</div><div className="a-lbl">Fuel Used</div>
        </div>
        <div className="a-card purple slide-up" style={{animationDelay:'.16s'}}>
          <div className="a-val">₹{totalEarn}</div><div className="a-lbl">Est. Earnings</div>
        </div>
      </div>

      {/* Performance Score */}
      <div className="card slide-up">
        <div className="card-header"><TrendingUp size={14}/> Performance Score</div>
        <div className="card-body">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:'.82rem',color:'var(--text-muted)'}}>Overall Score</span>
            <strong style={{color:perfColor}}>{perfLabel}</strong>
          </div>
          <div className="perf-bar-wrap">
            <div className="perf-bar-fill" style={{width:`${perfScore}%`,background:`linear-gradient(90deg,${perfColor},${perfColor}88)`}}/>
          </div>
          <div style={{textAlign:'right',fontSize:'.75rem',color:perfColor,marginTop:4,fontWeight:700}}>{perfScore}/100</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
            <div style={{background:'var(--surface2)',borderRadius:8,padding:'10px 12px'}}>
              <div style={{fontSize:'.68rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.04em'}}>Avg Mileage</div>
              <div style={{fontFamily:'Oswald,sans-serif',fontSize:'1.3rem',color:'var(--accent)',marginTop:2}}>{avgMileage} km/L</div>
            </div>
            <div style={{background:'var(--surface2)',borderRadius:8,padding:'10px 12px'}}>
              <div style={{fontSize:'.68rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.04em'}}>Delivery Rate</div>
              <div style={{fontFamily:'Oswald,sans-serif',fontSize:'1.3rem',color:'#22c55e',marginTop:2}}>{compRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings chart */}
      <div className="card slide-up">
        <div className="card-header"><BarChart2 size={14}/> Trip Earnings History</div>
        <div className="card-body">
          <div style={{height:180}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData} margin={{top:5,right:5,left:-20,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="day" tick={{fill:'var(--text-muted)',fontSize:10}}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:10}}/>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #f97316',borderRadius:8,color:'#fff',fontSize:12}}/>
                <Line type="monotone" dataKey="earn" stroke="#f97316" strokeWidth={3} dot={{fill:'#f97316',r:4}} activeDot={{r:6}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{fontSize:11,color:'var(--text-muted)',textAlign:'center',marginTop:4}}>Earnings per trip (₹)</p>
        </div>
      </div>

      {/* Fuel logs bar chart */}
      <div className="card slide-up">
        <div className="card-header"><Fuel size={14}/> Fuel Consumption Trend</div>
        <div className="card-body">
          <div style={{height:170}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelLogs} margin={{top:5,right:5,left:-20,bottom:5}} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="day" tick={{fill:'var(--text-muted)',fontSize:11}}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:11}}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="mileage" fill="#3b82f6" radius={[5,5,0,0]} isAnimationActive animationDuration={900}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

// ── PROFILE TAB ────────────────────────────────────────────────────
function ProfileTab({ state, dispatch }) {
  const { profile } = state;
  const [form, setForm]   = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f=>({...f, photo:ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    dispatch({ type:'SET_PROFILE', p:form });
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  return (
    <>
      <div className="section-header">
        <div className="section-title"><User size={18} color="#f97316"/> Driver Profile</div>
        <div className="section-sub">Your identity on DriveSmart</div>
      </div>

      <div className="card slide-up">
        <div className="profile-photo-box">
          <div className="profile-photo-circle" onClick={()=>fileRef.current?.click()}>
            {form.photo
              ? <img src={form.photo} alt="profile"/>
              : <span className="photo-initials">{form.name?.[0]?.toUpperCase()||'?'}</span>}
            <div className="photo-overlay"><Camera size={22}/></div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}}/>
          <div style={{fontSize:'.78rem',color:'var(--text-muted)'}}>Tap photo to change</div>
        </div>
        <div className="card-body" style={{paddingTop:0}}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="e.g. Ramesh Kumar" value={form.name}
              onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" type="tel" placeholder="e.g. 9876543210" value={form.phone}
              onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">License Number</label>
            <input className="form-input" placeholder="e.g. MH04-20250001" value={form.license}
              onChange={e=>setForm(f=>({...f,license:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <div className="vehicle-grid">
              {VEHICLE_TYPES.map(v=>(
                <button key={v} className={`vehicle-btn${form.vehicleType===v?' active':''}`}
                  onClick={()=>setForm(f=>({...f,vehicleType:v}))}>
                  {v==='Truck'?'🚛':v==='Tempo'?'🚐':'🚚'} {v}
                </button>
              ))}
            </div>
          </div>
          <button className="save-btn" onClick={handleSave}>
            <Check size={18}/> Save Profile
          </button>
          {saved && (
            <div className="saved-badge">
              <Check size={16}/> Profile saved successfully!
            </div>
          )}
        </div>
      </div>

      {/* Profile preview */}
      {profile.name && (
        <div className="card slide-up" style={{animationDelay:'.1s'}}>
          <div className="card-header"><User size={14}/> Profile Preview</div>
          <div className="card-body">
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div className="profile-avatar" style={{width:60,height:60,border:'3px solid var(--accent)'}}>
                {profile.photo
                  ? <img src={profile.photo} alt="dp" className="avatar-img"/>
                  : <span className="avatar-initials" style={{fontSize:'1.6rem'}}>{profile.name[0].toUpperCase()}</span>}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:'1rem',color:'var(--text)'}}>{profile.name}</div>
                <div style={{fontSize:'.78rem',color:'var(--text-muted)',marginTop:2}}>
                  {profile.vehicleType} Driver · {profile.license}
                </div>
                <div style={{fontSize:'.78rem',color:'var(--text-muted)',marginTop:1}}>📞 {profile.phone}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

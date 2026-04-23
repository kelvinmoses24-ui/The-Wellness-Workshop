import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, Legend, BarChart, Bar
} from "recharts";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fl);

// ─── Brand Colours (4 Quadrants) ─────────────────────────────────────────────
const Q = {
  fitness:   { color: "#E8006F", light: "#E8006F18", name: "Fitness" },
  nutrition: { color: "#1B5E3B", light: "#1B5E3B18", name: "Nutrition" },
  stress:    { color: "#F5C400", light: "#F5C40018", name: "Stress Management" },
  lifestyle: { color: "#E85D00", light: "#E85D0018", name: "Lifestyle" },
};

// ─── Metric → Quadrant mapping ────────────────────────────────────────────────
const METRIC_Q = {
  weight: Q.fitness, bodyFat: Q.fitness, chest: Q.fitness,
  waist: Q.nutrition, hips: Q.lifestyle, arms: Q.fitness, thighs: Q.fitness,
};
const METRIC_LABELS = {
  weight:"Weight (kg)", bodyFat:"Body Fat (%)", chest:"Chest (cm)",
  waist:"Waist (cm)", hips:"Hips (cm)", arms:"Arms (cm)", thighs:"Thighs (cm)"
};

// ─── Demo Users ───────────────────────────────────────────────────────────────
const USERS = [
  { id: "c1", role: "coach", name: "Dr. Ananya Rao",     email: "coach@twwi.in",   password: "coach123",  avatar: "AR" },
  { id: "c2", role: "coach", name: "Rahul Verma",        email: "rahul@twwi.in",   password: "rahul123",  avatar: "RV" },
  { id: "p1", role: "client",name: "Priya Sharma",       email: "priya@email.com", password: "priya123",  avatar: "PS", clientId: 1 },
  { id: "p2", role: "client",name: "Arjun Mehta",        email: "arjun@email.com", password: "arjun123",  avatar: "AM", clientId: 2 },
];

const SEED_CLIENTS = [
  { id:1, name:"Priya Sharma", age:28, gender:"Female", goal:"Fat Loss", avatar:"PS",
    phone:"+91 98000 11111", email:"priya@email.com", coachId:"c1",
    measurements:[
      {date:"2024-10-01",weight:72,bodyFat:29,chest:92,waist:80,hips:100,arms:30,thighs:58},
      {date:"2024-11-01",weight:70,bodyFat:27,chest:91,waist:77,hips:98,arms:30,thighs:56},
      {date:"2024-12-01",weight:68,bodyFat:25,chest:90,waist:74,hips:96,arms:31,thighs:55},
      {date:"2025-01-01",weight:65,bodyFat:23,chest:88,waist:71,hips:94,arms:31,thighs:53},
    ],
    photos:[], notes:[{date:"2025-01-01",text:"Excellent consistency — down 7kg in 3 months!"}],
    dietPlans:[], workoutPlans:[], reminders:[] },
  { id:2, name:"Arjun Mehta", age:34, gender:"Male", goal:"Muscle Gain", avatar:"AM",
    phone:"+91 98000 22222", email:"arjun@email.com", coachId:"c1",
    measurements:[
      {date:"2024-10-01",weight:65,bodyFat:18,chest:94,waist:78,hips:90,arms:32,thighs:54},
      {date:"2024-11-01",weight:67,bodyFat:17,chest:96,waist:78,hips:91,arms:33,thighs:55},
      {date:"2024-12-01",weight:69,bodyFat:16,chest:98,waist:77,hips:92,arms:34,thighs:56},
      {date:"2025-01-01",weight:71,bodyFat:15,chest:100,waist:77,hips:93,arms:35,thighs:58},
    ],
    photos:[], notes:[], dietPlans:[], workoutPlans:[], reminders:[] },
  { id:3, name:"Meera Nair", age:31, gender:"Female", goal:"Maintenance", avatar:"MN",
    phone:"+91 98000 33333", email:"meera@email.com", coachId:"c2",
    measurements:[
      {date:"2024-11-01",weight:60,bodyFat:22,chest:85,waist:70,hips:92,arms:27,thighs:50},
      {date:"2025-01-01",weight:59,bodyFat:21,chest:85,waist:69,hips:91,arms:28,thighs:50},
    ],
    photos:[], notes:[], dietPlans:[], workoutPlans:[], reminders:[] },
];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Biceps","Triceps","Legs","Core","Cardio"];
const GOAL_Q = { "Fat Loss": Q.fitness, "Muscle Gain": Q.fitness, "Maintenance": Q.nutrition, "Athletic Performance": Q.lifestyle };

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState(SEED_CLIENTS);
  const [view, setView] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientTab, setClientTab] = useState("progress");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  const closeModal = () => setModal(null);

  const updateClient = useCallback((id, updater) => {
    setClients(prev => prev.map(c => c.id===id ? updater(c) : c));
  }, []);

  useEffect(() => {
    if (selectedClient) {
      const fresh = clients.find(c => c.id===selectedClient.id);
      if (fresh) setSelectedClient(fresh);
    }
  }, [clients]);

  const logout = () => { setUser(null); setView("dashboard"); setSelectedClient(null); };

  // Client's own data
  const myClientData = user?.role==="client"
    ? clients.find(c => c.id === user.clientId)
    : null;

  // Coach sees only their clients
  const visibleClients = user?.role==="coach"
    ? clients.filter(c => c.coachId === user.id)
    : [];

  if (!user) return <LoginScreen onLogin={setUser} showToast={showToast} toast={toast} />;

  if (user.role === "client") {
    return (
      <div style={S.app}>
        <style>{CSS}</style>
        {toast && <Toast {...toast} />}
        <ClientAppShell user={user} onLogout={logout}
          client={myClientData}
          updateClient={updateClient}
          showToast={showToast} />
      </div>
    );
  }

  // Coach view
  const openClient = (c) => { setSelectedClient(c); setView("client"); setClientTab("progress"); };

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      {toast && <Toast {...toast} />}
      <Sidebar view={view} setView={v=>{setView(v); if(v!=="client") setSelectedClient(null);}} user={user} onLogout={logout} />
      <main style={S.main}>
        {view==="dashboard" && <Dashboard clients={visibleClients} user={user} openClient={openClient} onAdd={()=>setModal("addClient")} />}
        {view==="clients"   && <ClientList clients={visibleClients} openClient={openClient} onAdd={()=>setModal("addClient")} />}
        {view==="client" && selectedClient &&
          <CoachClientView client={selectedClient} tab={clientTab} setTab={setClientTab}
            goBack={()=>setView("dashboard")} openModal={setModal} />}
      </main>

      {modal==="addClient" && <Modal onClose={closeModal}>
        <AddClientForm coachId={user.id} onAdd={c=>{
          const nc={...c, id:Date.now(), measurements:[], photos:[], notes:[], dietPlans:[], workoutPlans:[], reminders:[],
            avatar:c.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)};
          setClients(p=>[...p,nc]); showToast(`${c.name} added!`); closeModal();
        }} onClose={closeModal} />
      </Modal>}
      {modal==="addMeasure" && selectedClient && <Modal onClose={closeModal}>
        <AddMeasurementForm client={selectedClient} onAdd={m=>{
          updateClient(selectedClient.id, c=>({...c, measurements:[...c.measurements,m].sort((a,b)=>a.date.localeCompare(b.date))}));
          showToast("Measurement saved!"); closeModal();
        }} onClose={closeModal} />
      </Modal>}
      {modal==="photo" && selectedClient && <Modal onClose={closeModal}>
        <PhotoUpload client={selectedClient} onAdd={p=>{
          updateClient(selectedClient.id, c=>({...c, photos:[...c.photos,p]}));
          showToast("Photo saved!"); closeModal();
        }} onClose={closeModal} />
      </Modal>}
      {modal==="diet" && selectedClient && <Modal wide onClose={closeModal}>
        <DietPlanBuilder client={selectedClient} onSave={p=>{
          updateClient(selectedClient.id, c=>({...c, dietPlans:[...c.dietPlans,p]}));
          showToast("Diet plan saved!"); closeModal();
        }} onClose={closeModal} />
      </Modal>}
      {modal==="aiMeal" && selectedClient && <Modal wide onClose={closeModal}>
        <AIMealPlan client={selectedClient} onSave={p=>{
          updateClient(selectedClient.id, c=>({...c, dietPlans:[...c.dietPlans,p]}));
          showToast("AI meal plan saved!"); closeModal();
        }} onClose={closeModal} showToast={showToast} />
      </Modal>}
      {modal==="workout" && selectedClient && <Modal wide onClose={closeModal}>
        <WorkoutBuilder client={selectedClient} onSave={w=>{
          updateClient(selectedClient.id, c=>({...c, workoutPlans:[...c.workoutPlans,w]}));
          showToast("Workout plan saved!"); closeModal();
        }} onClose={closeModal} />
      </Modal>}
      {modal==="reminder" && selectedClient && <Modal onClose={closeModal}>
        <ReminderForm client={selectedClient} onSave={r=>{
          updateClient(selectedClient.id, c=>({...c, reminders:[...c.reminders,r]}));
          showToast("Reminder set!"); closeModal();
        }} onClose={closeModal} />
      </Modal>}
      {modal==="export" && selectedClient && <Modal wide onClose={closeModal}>
        <ExportReport client={selectedClient} onClose={closeModal} showToast={showToast} />
      </Modal>}
      {modal==="note" && selectedClient && <Modal onClose={closeModal}>
        <AddNoteForm client={selectedClient} onSave={n=>{
          updateClient(selectedClient.id, c=>({...c, notes:[...c.notes, n]}));
          showToast("Note saved!"); closeModal();
        }} onClose={closeModal} />
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin, showToast, toast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab] = useState("coach"); // "coach" | "client"

  const handle = () => {
    setLoading(true);
    setTimeout(() => {
      const u = USERS.find(u => u.email===email.trim() && u.password===password && u.role===tab);
      if (u) { onLogin(u); }
      else { showToast("Invalid credentials — please try again", "error"); }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={LS.wrap}>
      <style>{CSS}</style>
      {toast && <Toast {...toast} />}

      {/* Quadrant background decoration */}
      <div style={LS.quadBg}>
        <div style={{...LS.quad, background: Q.fitness.color,   top:0,    left:0   }} />
        <div style={{...LS.quad, background: Q.nutrition.color, top:0,    right:0  }} />
        <div style={{...LS.quad, background: Q.stress.color,    bottom:0, left:0   }} />
        <div style={{...LS.quad, background: Q.lifestyle.color, bottom:0, right:0  }} />
      </div>

      <div style={LS.card}>
        {/* Logo area */}
        <div style={LS.logoWrap}>
          <div style={LS.logoPlaceholder}>
            <div style={LS.logoGrid}>
              <div style={{background:Q.fitness.color}} />
              <div style={{background:Q.nutrition.color}} />
              <div style={{background:Q.stress.color}} />
              <div style={{background:Q.lifestyle.color}} />
            </div>
          </div>
          <div style={LS.brandName}>The Wellness Workshop</div>
          <div style={LS.brandSub}>INDIA</div>
        </div>

        {/* Role tabs */}
        <div style={LS.roleTabs}>
          <button style={{...LS.roleTab, ...(tab==="coach"?{...LS.roleTabActive, borderColor:Q.fitness.color, color:Q.fitness.color}:{})}} onClick={()=>{setTab("coach"); setEmail(""); setPassword("");}}>
            Coach Login
          </button>
          <button style={{...LS.roleTab, ...(tab==="client"?{...LS.roleTabActive, borderColor:Q.nutrition.color, color:Q.nutrition.color}:{})}} onClick={()=>{setTab("client"); setEmail(""); setPassword("");}}>
            Client Login
          </button>
        </div>

        {/* Demo hint */}
        <div style={LS.hint}>
          {tab==="coach"
            ? <>Demo: <span style={{color:Q.fitness.color}}>coach@twwi.in</span> / coach123</>
            : <>Demo: <span style={{color:Q.nutrition.color}}>priya@email.com</span> / priya123</>}
        </div>

        <div style={LS.field}>
          <div style={LS.lbl}>Email Address</div>
          <input style={LS.input} type="email" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
        </div>
        <div style={LS.field}>
          <div style={LS.lbl}>Password</div>
          <div style={{position:"relative"}}>
            <input style={{...LS.input, paddingRight:44}} type={showPass?"text":"password"} placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
            <button style={LS.eyeBtn} onClick={()=>setShowPass(p=>!p)}>{showPass?"🙈":"👁"}</button>
          </div>
        </div>

        <button style={{...LS.loginBtn, background: tab==="coach"? Q.fitness.color : Q.nutrition.color}} onClick={handle} disabled={loading}>
          {loading ? <span style={LS.spinner} /> : `Sign In as ${tab==="coach"?"Coach":"Client"}`}
        </button>

        <div style={LS.footer}>Secure access · The Wellness Workshop India</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT APP SHELL (client-facing view)
// ═══════════════════════════════════════════════════════════════════════════════
function ClientAppShell({ user, client, onLogout, updateClient, showToast }) {
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(null);

  if (!client) return (
    <div style={{...S.app, alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16}}>
      <div style={{fontSize:48}}>🌿</div>
      <div style={{fontFamily:"'Playfair Display',serif", fontSize:22, color:"#111"}}>Welcome, {user.name}</div>
      <div style={{fontSize:13, color:"#888"}}>Your profile is being set up by your coach.</div>
      <button style={{...S.ghostBtn, marginTop:8}} onClick={onLogout}>Sign Out</button>
    </div>
  );

  const l = client.measurements[client.measurements.length-1];
  const f = client.measurements[0];
  const TABS = ["overview","measurements","diet","workout","photos"];

  return (
    <div style={CS.wrap}>
      {/* Client Header */}
      <header style={CS.header}>
        <div style={CS.headerLeft}>
          <div style={CS.headerLogo}>
            <div style={CS.logoGrid2}>
              <div style={{background:Q.fitness.color}} /><div style={{background:Q.nutrition.color}} />
              <div style={{background:Q.stress.color}} /><div style={{background:Q.lifestyle.color}} />
            </div>
          </div>
          <div>
            <div style={CS.headerBrand}>The Wellness Workshop India</div>
            <div style={CS.headerSub}>Client Portal</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={CS.userChip}>
            <div style={{...CS.av, background:Q.nutrition.color}}>{user.avatar}</div>
            <span style={{fontSize:12,color:"#333",fontWeight:500}}>{user.name.split(" ")[0]}</span>
          </div>
          <button style={CS.logoutBtn} onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      <div style={CS.body}>
        {/* Welcome banner */}
        <div style={CS.banner}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.12em",color:"#888",marginBottom:4}}>WELCOME BACK</div>
            <div style={{fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"#111"}}>{client.name}</div>
            <div style={{fontSize:12,color:"#888",marginTop:2}}>{client.goal} Program</div>
          </div>
          <div style={CS.quadStrip}>
            {[Q.fitness,Q.nutrition,Q.stress,Q.lifestyle].map((q,i)=>(
              <div key={i} style={{width:8, height:48, background:q.color, borderRadius:4}} />
            ))}
          </div>
        </div>

        {/* Quick stats */}
        {l && <div style={CS.statsRow}>
          {[
            {label:"Current Weight", value:`${l.weight}kg`, q:Q.fitness},
            {label:"Body Fat",        value:`${l.bodyFat}%`,  q:Q.lifestyle},
            {label:"Waist",           value:`${l.waist}cm`,   q:Q.nutrition},
            {label:"Check-ins",       value:client.measurements.length, q:Q.stress},
          ].map(s=>(
            <div key={s.label} style={{...CS.statCard, borderTop:`3px solid ${s.q.color}`}}>
              <div style={{fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:500, color:s.q.color}}>{s.value}</div>
              <div style={{fontSize:10,color:"#999",letterSpacing:"0.08em",marginTop:4}}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>}

        {/* Tabs */}
        <div style={CS.tabs}>
          {TABS.map(t=><button key={t} style={{...CS.tab,...(tab===t?{...CS.tabA,borderColor:Q.fitness.color,color:Q.fitness.color}:{})}} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>)}
        </div>

        {tab==="overview"     && <ClientOverview client={client} />}
        {tab==="measurements" && <ClientMeasurementsView client={client} onAdd={()=>setModal("addMeasure")} />}
        {tab==="diet"         && <ClientDietView client={client} />}
        {tab==="workout"      && <ClientWorkoutView client={client} />}
        {tab==="photos"       && <ClientPhotosView client={client} onAdd={()=>setModal("addPhoto")} />}
      </div>

      {modal==="addMeasure" && <Modal onClose={()=>setModal(null)}>
        <AddMeasurementForm client={client} onAdd={m=>{
          updateClient(client.id, c=>({...c, measurements:[...c.measurements,m].sort((a,b)=>a.date.localeCompare(b.date))}));
          showToast("Measurement logged!"); setModal(null);
        }} onClose={()=>setModal(null)} accentColor={Q.fitness.color} />
      </Modal>}
      {modal==="addPhoto" && <Modal onClose={()=>setModal(null)}>
        <PhotoUpload client={client} onAdd={p=>{
          updateClient(client.id, c=>({...c, photos:[...c.photos,p]}));
          showToast("Photo saved!"); setModal(null);
        }} onClose={()=>setModal(null)} />
      </Modal>}
    </div>
  );
}

function ClientOverview({ client }) {
  const data = client.measurements.map(m=>({...m, date:m.date.slice(0,7)}));
  if (data.length < 2) return <Empty text="Your coach will add your first measurements. Check back soon!" />;
  const f=client.measurements[0], l=client.measurements[client.measurements.length-1];
  const wChange = +(l.weight-f.weight).toFixed(1);
  return (
    <div>
      <div style={CS.progressBanner}>
        <div style={{fontSize:11,letterSpacing:"0.12em",color:"#888",marginBottom:6}}>YOUR JOURNEY SO FAR</div>
        <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
          {[
            {label:"Weight Change", val:`${wChange>0?"+":""}${wChange}kg`, positive:wChange<0, q:Q.fitness},
            {label:"Body Fat Change", val:`${+(l.bodyFat-f.bodyFat).toFixed(1)}%`, positive:(l.bodyFat-f.bodyFat)<0, q:Q.lifestyle},
            {label:"Waist Change", val:`${+(l.waist-f.waist).toFixed(1)}cm`, positive:(l.waist-f.waist)<0, q:Q.nutrition},
          ].map(s=>(
            <div key={s.label}>
              <div style={{fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:s.positive?"#1B5E3B":"#E8006F"}}>{s.val}</div>
              <div style={{fontSize:10,color:"#999",letterSpacing:"0.08em"}}>{s.label.toUpperCase()}</div>
 

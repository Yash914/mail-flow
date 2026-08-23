'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Bell, Check, ChevronDown, ChevronRight, CircleAlert,
  FileText, Filter, LayoutDashboard, Loader2, Mail, Menu,
  MoreHorizontal, Plus, Search, Send, Settings, Sparkles, Upload,
  Users, X, Zap,
} from 'lucide-react'

type PageKey = 'Dashboard' | 'Recipients' | 'Campaigns' | 'History' | 'Settings'
type Status = 'New' | 'Updated' | 'Delivered' | 'Pending' | 'Failed' | 'Invalid'

type Team = {
  registration_id: string
  team_name: string
  ps_id: string
  ps_title: string
  leader_name: string
  leader_email: string
  status: Status
  last_contacted: string
  added_at: string
}

type Campaign = {
  id: number
  name: string
  subject: string
  recipients: number
  sent: number
  failed: number
  status: string
  created_at: string
}

type HistoryItem = {
  id: number
  team_name: string
  leader_name: string
  leader_email: string
  campaign: string
  status: Status
  sent_at: string
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const SUBJECT = 'NMIET SIH 2026 Internal Hackathon Registration Confirmed'
const BODY = `Dear {team_leader_name},

Congratulations!

Your registration for the NMIET SIH 2026 Internal Hackathon has been successfully received.


Registration Details:

Team Name:
{team_name}

Problem Statement:
{PS_NUMBER} - {Problem Title}

Team Leader:
{name}

Registration ID:
{registration_id}


IMPORTANT DEADLINES:

📅 Internal Hackathon Date:
4th September 2026


📌 Registration Deadline:
2nd September 2026

PPT Template:
{sih_official_ppt_template}`

function StatusPill({ status }: { status: string }) {
  const tone = status === 'Delivered' || status === 'New' || status === 'Completed'
    ? 'success' : status === 'Failed' || status === 'Invalid' ? 'danger' : 'neutral'
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{status}</span>
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return <div className="empty-state"><Icon size={22} /><strong>{title}</strong><span>{description}</span></div>
}

function Topbar({ title, onMenu, onCreate }: { title: string; onMenu: () => void; onCreate: () => void }) {
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu}><Menu size={20} /></button>
    <div><p className="breadcrumb">Workspace <ChevronRight size={13} /> {title}</p><h1>{title}</h1></div>
    <div className="top-actions"><button className="icon-button"><Bell size={18} /></button><button className="avatar">Y</button><button className="primary-button" onClick={onCreate}><Plus size={17}/> Create campaign</button></div>
  </header>
}

function Dashboard({ teams, campaigns, history, onCreate }: { teams: Team[]; campaigns: Campaign[]; history: HistoryItem[]; onCreate: () => void }) {
  const sent = history.filter(x => x.status === 'Delivered').length
  const failed = history.filter(x => x.status === 'Failed').length
  const fresh = teams.filter(x => x.status === 'New').length
  return <>
    <div className="welcome-row"><div><p className="muted">NMIET SIH 2026 Internal Hackathon</p><h2>Welcome to MailFlow, Yash</h2><p className="muted">Manage registrations, send confirmation emails, and track delivery.</p></div><button className="secondary-button" onClick={onCreate}><Sparkles size={16}/> Start a campaign</button></div>
    <div className="stats-grid">
      <Stat icon={Users} label="Registered teams" value={teams.length} detail="From registration Excel" tone="blue" />
      <Stat icon={Zap} label="New teams" value={fresh} detail="Detected from uploads" tone="violet" />
      <Stat icon={Send} label="Emails sent" value={sent} detail="Successfully delivered" tone="green" />
      <Stat icon={CircleAlert} label="Failed" value={failed} detail="Delivery failures" tone="orange" />
    </div>
    <div className="content-grid">
      <section className="panel campaign-panel"><div className="panel-heading"><div><h3>Recent campaigns</h3><p>Latest email sends.</p></div></div>{campaigns.length ? <div className="campaign-list">{campaigns.slice(0,5).map(c=><div className="campaign-row" key={c.id}><div className="campaign-mark"><Mail size={18}/></div><div className="campaign-info"><strong>{c.name}</strong><span>{c.subject}</span></div><div className="campaign-metric"><b>{c.recipients}</b><span>Teams</span></div><div className="campaign-metric hide-mobile"><b>{c.sent}</b><span>Sent</span></div><StatusPill status={c.status}/><span className="row-date">{c.created_at}</span><MoreHorizontal size={18} className="more"/></div>)}</div> : <EmptyState icon={Mail} title="No campaigns yet" description="Create a campaign after uploading registrations."/>}</section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Latest email activity.</p></div><Activity size={18} className="muted-icon"/></div>{history.length ? <div className="activity-list">{history.slice(0,5).map(x=><div className="activity-item" key={x.id}><div className={`activity-icon ${x.status === 'Failed' ? 'orange' : 'green'}`}><Check size={15}/></div><div><strong>{x.team_name}</strong><span>{x.leader_name} · {x.status} · {x.sent_at}</span></div></div>)}</div> : <EmptyState icon={Activity} title="No activity yet" description="Sent and failed emails will appear here."/>}</section>
    </div>
  </>
}

function Stat({ icon: Icon, label, value, detail, tone }: { icon:any; label:string; value:number; detail:string; tone:string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><div><p className="eyebrow">{label}</p><p className="stat-value">{value}</p><p className="stat-detail">{detail}</p></div></div>
}

function RecipientsPage({ onRefresh }: { onRefresh: () => void }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('Upload the latest registration Excel.')
  const input = useRef<HTMLInputElement>(null)

  const load = async () => { try { const r=await fetch(`${API}/api/teams`); if(r.ok) setTeams(await r.json()) } catch {} }
  useEffect(()=>{load()},[])

  const rows = useMemo(()=>teams.filter(t=>`${t.registration_id} ${t.team_name} ${t.ps_id} ${t.ps_title} ${t.leader_name} ${t.leader_email}`.toLowerCase().includes(query.toLowerCase()) && (filter==='All'||t.status===filter)),[teams,query,filter])

  async function process() {
    if(!file) return
    setProcessing(true); setMessage('Uploading and processing Excel...')
    try {
      const form=new FormData(); form.append('file',file)
      const r=await fetch(`${API}/api/teams/upload`,{method:'POST',body:form})
      const data=await r.json()
      if(!r.ok) throw new Error(typeof data.detail==='string'?data.detail:(data.detail?.message||'Excel processing failed'))
      setMessage(`${data.new_count} new, ${data.updated_count} updated, ${data.invalid_count} invalid rows.`)
      setFile(null); if(input.current) input.current.value=''; await load(); onRefresh()
    } catch(e:any) { setMessage(e.message||'Excel processing failed.') }
    finally { setProcessing(false) }
  }

  return <>
    <div className="page-intro"><div><h2>Registered Teams</h2><p className="muted">Upload the continuously updated NMIET SIH registration Excel.</p></div><div className="button-row"><input ref={input} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e=>setFile(e.target.files?.[0]||null)}/><button className="secondary-button" onClick={()=>input.current?.click()}><Upload size={16}/> Upload Excel</button><button className="primary-button" disabled={!file||processing} onClick={process}>{processing?<Loader2 className="spin" size={16}/>:<Zap size={16}/>} {processing?'Processing...':'Process registrations'}</button></div></div>
    <div className="sync-note"><Check size={15}/><span>{message}</span>{file&&<><span>·</span><b>{file.name}</b><button className="icon-button" onClick={()=>{setFile(null);if(input.current)input.current.value=''}}><X size={14}/></button></>}</div>
    <div className="mini-stats"><div><span>Total teams</span><b>{teams.length}</b></div><div><span>New</span><b className="blue-text">{teams.filter(x=>x.status==='New').length}</b></div><div><span>Updated</span><b>{teams.filter(x=>x.status==='Updated').length}</b></div><div><span>Invalid</span><b className="orange-text">{teams.filter(x=>x.status==='Invalid').length}</b></div></div>
    <section className="panel table-panel"><div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search teams, leaders, PS..."/></div><select className="select-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>New</option><option>Updated</option><option>Delivered</option><option>Invalid</option></select><button className="filter-button"><Filter size={15}/> Filter</button></div><div className="table-wrap">{rows.length?<table><thead><tr><th>Team Name</th><th>Team Leader</th><th>Problem Statement</th><th>Registration ID</th><th>Status</th></tr></thead><tbody>{rows.map(t=><tr key={t.registration_id}><td><strong>{t.team_name}</strong></td><td><strong>{t.leader_name}</strong><div style={{fontSize:11,color:'#667085',marginTop:3}}>{t.leader_email}</div></td><td><strong>{t.ps_id}</strong><div style={{fontSize:11,color:'#667085',marginTop:3}}>{t.ps_title}</div></td><td>{t.registration_id}</td><td><StatusPill status={t.status}/></td></tr>)}</tbody></table>:<EmptyState icon={Upload} title="No registrations yet" description="Upload the SIH registration Excel file to add teams."/>}</div><div className="table-footer">Showing {rows.length} of {teams.length} teams</div></section>
  </>
}

function CampaignsPage({ onCreate }: { onCreate:()=>void }) {
  const [items,setItems]=useState<Campaign[]>([])
  useEffect(()=>{fetch(`${API}/api/campaigns`).then(r=>r.json()).then(setItems).catch(()=>{})},[])
  return <><div className="page-intro"><div><h2>Campaigns</h2><p className="muted">Create and send the approved SIH registration confirmation.</p></div><button className="primary-button" onClick={onCreate}><Plus size={17}/> Create campaign</button></div><section className="panel table-panel"><div className="table-toolbar"><div><h3>All campaigns</h3><p className="muted">{items.length} campaigns</p></div></div><div className="table-wrap">{items.length?<table><thead><tr><th>Name</th><th>Subject</th><th>Teams</th><th>Sent</th><th>Failed</th><th>Status</th></tr></thead><tbody>{items.map(c=><tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.subject}</td><td>{c.recipients}</td><td>{c.sent}</td><td>{c.failed}</td><td><StatusPill status={c.status}/></td></tr>)}</tbody></table>:<EmptyState icon={Mail} title="No campaigns yet" description="Create your first campaign."/>}</div></section></>
}

function HistoryPage() {
  const [items,setItems]=useState<HistoryItem[]>([]); const [q,setQ]=useState('')
  useEffect(()=>{fetch(`${API}/api/history`).then(r=>r.json()).then(setItems).catch(()=>{})},[])
  const rows=items.filter(x=>`${x.team_name} ${x.leader_name} ${x.leader_email} ${x.campaign}`.toLowerCase().includes(q.toLowerCase()))
  return <><div className="page-intro"><div><h2>Email History</h2><p className="muted">Track emails sent to team leaders.</p></div></div><section className="panel table-panel"><div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search team, leader..."/></div></div><div className="table-wrap">{rows.length?<table><thead><tr><th>Team</th><th>Leader</th><th>Email</th><th>Campaign</th><th>Status</th><th>Sent at</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><strong>{x.team_name}</strong></td><td>{x.leader_name}</td><td>{x.leader_email}</td><td>{x.campaign}</td><td><StatusPill status={x.status}/></td><td>{x.sent_at}</td></tr>)}</tbody></table>:<EmptyState icon={Send} title="No email history yet" description="Email delivery records will appear here."/>}</div></section></>
}

function SettingsPage() {
  const [template,setTemplate]=useState<any>(null); const [file,setFile]=useState<File|null>(null); const [saving,setSaving]=useState(false); const [message,setMessage]=useState(''); const input=useRef<HTMLInputElement>(null)
  async function load(){try{const r=await fetch(`${API}/api/settings/template`);if(r.ok)setTemplate(await r.json())}catch{}}
  useEffect(()=>{load()},[])
  async function save(){if(!file)return;setSaving(true);setMessage('Uploading template...');try{const form=new FormData();form.append('file',file);const r=await fetch(`${API}/api/settings/template`,{method:'POST',body:form});const d=await r.json();if(!r.ok)throw new Error(d.detail||'Upload failed');setMessage('Official PPT template saved.');setFile(null);if(input.current)input.current.value='';await load()}catch(e:any){setMessage(e.message||'Upload failed')}finally{setSaving(false)}}
  return <><div className="page-intro"><div><h2>Settings</h2><p className="muted">Upload the official SIH PowerPoint template used by every campaign.</p></div></div><div className="content-grid"><section className="panel"><div className="panel-heading"><div><h3>SIH PPT Template</h3><p>The actual PowerPoint file is attached to every confirmation email.</p></div></div><div style={{padding:'0 20px 22px'}}><input ref={input} type="file" accept=".ppt,.pptx" hidden onChange={e=>setFile(e.target.files?.[0]||null)}/><div className="button-row"><button className="secondary-button" onClick={()=>input.current?.click()}><Upload size={16}/> Choose template</button><button className="primary-button" disabled={!file||saving} onClick={save}>{saving?<Loader2 className="spin" size={16}/>:<Check size={16}/>} Save template</button></div>{file&&<div className="sync-note" style={{marginTop:12}}><FileText size={15}/><b>{file.name}</b></div>}{template?.exists&&<div className="sync-note" style={{marginTop:12}}><Check size={15}/> Current template: <b>{template.filename}</b></div>}{message&&<p className="field-hint">{message}</p>}</div></section><section className="panel"><div className="panel-heading"><div><h3>Email Template</h3><p>This is the fixed approved message used by MailFlow.</p></div></div><div style={{padding:'0 20px 22px'}}><pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:12,lineHeight:1.6,margin:0}}>{BODY}</pre></div></section></div></>
}

function CampaignModal({ close, onSent }: { close:()=>void; onSent:()=>void }) {
  const [teams,setTeams]=useState<Team[]>([]); const [name,setName]=useState('NMIET SIH 2026 Registration Confirmation'); const [subject,setSubject]=useState(SUBJECT); const [body,setBody]=useState(BODY); const [sending,setSending]=useState(false); const [result,setResult]=useState<any>(null)
  useEffect(()=>{fetch(`${API}/api/teams`).then(r=>r.json()).then(setTeams).catch(()=>{})},[])
  async function send(){setSending(true);try{const r=await fetch(`${API}/api/campaigns/send`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,subject,body})});const d=await r.json();if(!r.ok)throw new Error(typeof d.detail==='string'?d.detail:'Campaign failed');setResult(d);onSent()}catch(e:any){setResult({error:e.message})}finally{setSending(false)}}
  const preview=body.replace('{team_leader_name}','Team Leader').replace('{team_name}','Example Team').replace('{PS_NUMBER}','PS001').replace('{Problem Title}','Example Problem Title').replace('{name}','Team Leader').replace('{registration_id}','NMIET-SIH-001').replace('{sih_official_ppt_template}','Attached official PPT template')
  return <div className="modal-backdrop"><div className="campaign-modal"><div className="modal-head"><div><p className="eyebrow">New campaign</p><h2>{result?'Campaign result':'Create campaign'}</h2></div><button className="icon-button" onClick={close}><X size={19}/></button></div>{result?<div className="send-success">{result.error?<><div className="success-check"><CircleAlert size={28}/></div><h3>Campaign could not be sent</h3><p>{result.error}</p></>:<><div className="success-check"><Check size={28}/></div><h3>Campaign completed</h3><p>{result.sent_count} sent · {result.failed_count} failed</p></>}<button className="primary-button" onClick={close}>Done</button></div>:<><div className="modal-body"><div className="form-column"><label>Campaign name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Recipients<select disabled><option>All registered team leaders ({teams.length})</option></select><span className="field-hint">Only Leader Email is used as the recipient.</span></label><label>Email subject<input value={subject} onChange={e=>setSubject(e.target.value)}/></label><label>Message<textarea value={body} onChange={e=>setBody(e.target.value)} rows={20}/></label></div><div className="preview-column"><p className="eyebrow">Live preview</p><div className="email-preview"><div className="email-brand"><span className="brand-glyph"><Mail size={15}/></span>MailFlow</div><div className="email-content">{preview.split('\n').map((line,i)=><p key={i}>{line||' '}</p>)}</div></div></div></div><div className="modal-foot"><button className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={!teams.length||sending} onClick={send}>{sending?<Loader2 className="spin" size={16}/>:<Send size={16}/>} {sending?'Sending...':'Send campaign'}</button></div></>}</div></div>
}

export default function Page(){
  const [page,setPage]=useState<PageKey>('Dashboard'); const [mobile,setMobile]=useState(false); const [create,setCreate]=useState(false); const [refresh,setRefresh]=useState(0); const [teams,setTeams]=useState<Team[]>([]); const [campaigns,setCampaigns]=useState<Campaign[]>([]); const [history,setHistory]=useState<HistoryItem[]>([])
  async function load(){try{const [a,b,c]=await Promise.all([fetch(`${API}/api/teams`).then(r=>r.json()),fetch(`${API}/api/campaigns`).then(r=>r.json()),fetch(`${API}/api/history`).then(r=>r.json())]);setTeams(a);setCampaigns(b);setHistory(c)}catch{}}
  useEffect(()=>{load()},[refresh])
  const nav=[['Dashboard',LayoutDashboard],['Recipients',Users],['Campaigns',Mail],['History',Send]] as const
  function content(){if(page==='Recipients')return <RecipientsPage onRefresh={()=>setRefresh(x=>x+1)}/>;if(page==='Campaigns')return <CampaignsPage onCreate={()=>setCreate(true)}/>;if(page==='History')return <HistoryPage/>;if(page==='Settings')return <SettingsPage/>;return <Dashboard teams={teams} campaigns={campaigns} history={history} onCreate={()=>setCreate(true)}/>}
  return <div className="app-shell"><aside className={`sidebar ${mobile?'open':''}`}><div className="brand"><span className="brand-glyph"><Mail size={20}/></span><strong>MailFlow</strong></div><div className="workspace-switch"><div className="workspace-avatar">Y</div><div><b>Yash's workspace</b><small>NMIET SIH 2026</small></div><ChevronDown size={16}/></div><p className="nav-label">WORKSPACE</p><nav>{nav.map(([label,Icon])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{setPage(label);setMobile(false)}}><Icon size={18}/><span>{label}</span>{label==='Recipients'&&teams.length>0&&<span className="nav-count">{teams.length}</span>}</button>)}</nav><div className="sidebar-bottom"><button className={`nav-item ${page==='Settings'?'active':''}`} onClick={()=>{setPage('Settings');setMobile(false)}}><Settings size={18}/><span>Settings</span></button></div><div className="user-row"><div className="workspace-avatar">Y</div><div><b>Yash</b><small>MailFlow account</small></div><MoreHorizontal size={18} className="more"/></div></aside><main className="main-area"><Topbar title={page} onMenu={()=>setMobile(!mobile)} onCreate={()=>setCreate(true)}/><div className="page-content">{content()}</div></main>{create&&<CampaignModal close={()=>setCreate(false)} onSent={()=>setRefresh(x=>x+1)}/>}</div>
}

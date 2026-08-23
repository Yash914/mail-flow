'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Activity,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileText,
  Filter,
  LayoutDashboard,
  Loader2,
  Mail,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react'

type PageKey =
  | 'Dashboard'
  | 'Recipients'
  | 'Campaigns'
  | 'History'
  | 'Settings'

type Status =
  | 'New'
  | 'Updated'
  | 'Delivered'
  | 'Pending'
  | 'Failed'
  | 'Invalid'

/*
 * These are the ONLY Excel fields currently required
 * for the email-sending workflow.
 *
 * Excel:
 * Registration ID
 * Team Name
 * PS ID
 * PS Title
 * Leader Name
 * Leader Email
 */
type Team = {
  registrationId: string
  teamName: string
  psId: string
  psTitle: string
  leaderName: string
  leaderEmail: string
  status: Status
  contacted: string
  added: string
}

type Campaign = {
  name: string
  subject: string
  recipients: number
  sent: number
  failed: number
  status: string
  date: string
}

type HistoryItem = {
  teamName: string
  leaderName: string
  leaderEmail: string
  campaign: string
  status: Status
  at: string
}

/*
 * Start with no fake/demo data.
 *
 * These will eventually come from the backend.
 */
const teams: Team[] = []

const campaigns: Campaign[] = []

const history: HistoryItem[] = []

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'Delivered' || status === 'New'
      ? 'success'
      : status === 'Failed' || status === 'Invalid'
        ? 'danger'
        : 'neutral'

  return (
    <span className={`status-pill ${tone}`}>
      <span className="status-dot" />
      {status}
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = '',
}: {
  icon: any
  label: string
  value: string | number
  detail: string
  tone?: string
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={18} />
      </div>

      <div>
        <p className="eyebrow">{label}</p>
        <p className="stat-value">{value}</p>
        <p className="stat-detail">{detail}</p>
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any
  title: string
  description: string
}) {
  return (
    <div className="empty-state">
      <Icon size={22} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  )
}

function Topbar({
  title,
  onMenu,
  onCreate,
}: {
  title: string
  onMenu: () => void
  onCreate: () => void
}) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div>
        <p className="breadcrumb">
          Workspace
          <ChevronRight size={13} />
          {title}
        </p>

        <h1>{title}</h1>
      </div>

      <div className="top-actions">
        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <button className="avatar" aria-label="Yash account">
          Y
        </button>

        <button className="primary-button" onClick={onCreate}>
          <Plus size={17} />
          Create campaign
        </button>
      </div>
    </header>
  )
}

function Dashboard({ onCreate }: { onCreate: () => void }) {
  const totalTeams = teams.length

  const newTeams = teams.filter(
    (team) => team.status === 'New',
  ).length

  const emailsSent = history.filter(
    (item) => item.status === 'Delivered',
  ).length

  const failedEmails = history.filter(
    (item) => item.status === 'Failed',
  ).length

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="muted">
            NMIET SIH 2026 Internal Hackathon
          </p>

          <h2>Welcome to MailFlow, Yash</h2>

          <p className="muted">
            Manage registrations, send confirmation emails,
            and track delivery.
          </p>
        </div>

        <button className="secondary-button" onClick={onCreate}>
          <Sparkles size={16} />
          Start a campaign
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="Registered teams"
          value={totalTeams}
          detail={
            totalTeams === 0
              ? 'Upload the registration Excel'
              : 'Current registered teams'
          }
          tone="blue"
        />

        <StatCard
          icon={Zap}
          label="New teams"
          value={newTeams}
          detail={
            newTeams === 0
              ? 'No new teams yet'
              : 'Detected from latest upload'
          }
          tone="violet"
        />

        <StatCard
          icon={Send}
          label="Emails sent"
          value={emailsSent}
          detail={
            emailsSent === 0
              ? 'No emails sent yet'
              : 'Successfully delivered'
          }
          tone="green"
        />

        <StatCard
          icon={CircleAlert}
          label="Failed"
          value={failedEmails}
          detail={
            failedEmails === 0
              ? 'No failed emails'
              : 'Delivery failures'
          }
          tone="orange"
        />
      </div>

      <div className="content-grid">
        <section className="panel campaign-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent campaigns</h3>
              <p>Keep an eye on your latest email sends.</p>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No campaigns yet"
              description="Create your first email campaign to get started."
            />
          ) : (
            <div className="campaign-list">
              {campaigns.map((campaign) => (
                <div className="campaign-row" key={campaign.name}>
                  <div className="campaign-mark">
                    <Mail size={18} />
                  </div>

                  <div className="campaign-info">
                    <strong>{campaign.name}</strong>
                    <span>{campaign.subject}</span>
                  </div>

                  <div className="campaign-metric">
                    <b>{campaign.recipients}</b>
                    <span>Teams</span>
                  </div>

                  <div className="campaign-metric hide-mobile">
                    <b>{campaign.sent}</b>
                    <span>Sent</span>
                  </div>

                  <StatusPill status={campaign.status} />

                  <span className="row-date">{campaign.date}</span>

                  <MoreHorizontal size={18} className="more" />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent activity</h3>
              <p>Latest updates from your workspace.</p>
            </div>

            <Activity size={18} className="muted-icon" />
          </div>

          {history.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Email activity will appear here."
            />
          ) : (
            <div className="activity-list">
              {history.slice(0, 5).map((item, index) => (
                <div
                  className="activity-item"
                  key={`${item.leaderEmail}-${item.at}-${index}`}
                >
                  <div className="activity-icon green">
                    <Check size={15} />
                  </div>

                  <div>
                    <strong>{item.campaign}</strong>
                    <span>
                      {item.teamName} · {item.leaderName} · {item.at}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function RecipientsPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [processing, setProcessing] = useState(false)
  const [processed, setProcessed] = useState('Never')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const rows = useMemo(() => {
    return teams.filter((team) => {
      const searchableText = [
        team.registrationId,
        team.teamName,
        team.psId,
        team.psTitle,
        team.leaderName,
        team.leaderEmail,
      ]
        .join(' ')
        .toLowerCase()

      return (
        searchableText.includes(query.toLowerCase()) &&
        (filter === 'All' || team.status === filter)
      )
    })
  }, [query, filter])

  function handleFileSelect(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    const allowedExtensions = ['.xlsx', '.xls', '.csv']

    const extension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      alert(
        'Please select an Excel (.xlsx/.xls) or CSV file.',
      )

      event.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  function clearSelectedFile() {
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function processFile() {
    if (!selectedFile) return

    setProcessing(true)

    /*
     * Temporary frontend behavior.
     *
     * The real implementation will send selectedFile
     * to the FastAPI backend.
     */
    setTimeout(() => {
      setProcessing(false)
      setProcessed('just now')
    }, 1000)
  }

  const newCount = teams.filter(
    (team) => team.status === 'New',
  ).length

  const updatedCount = teams.filter(
    (team) => team.status === 'Updated',
  ).length

  const invalidCount = teams.filter(
    (team) => team.status === 'Invalid',
  ).length

  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Registered Teams</h2>

          <p className="muted">
            Manage NMIET SIH 2026 internal hackathon registrations.
          </p>
        </div>

        <div className="button-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <button
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Upload Excel
          </button>

          <button
            className="primary-button"
            onClick={processFile}
            disabled={processing || !selectedFile}
          >
            {processing ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Zap size={16} />
            )}

            {processing ? 'Processing...' : 'Process registrations'}
          </button>
        </div>
      </div>

      {selectedFile && (
        <div className="sync-note">
          <Check size={15} />

          <span>Selected file:</span>

          <b>{selectedFile.name}</b>

          <span>
            ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>

          <button
            onClick={clearSelectedFile}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              marginLeft: 'auto',
            }}
            aria-label="Remove selected file"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="sync-note">
        <Check size={15} />

        Last processed {processed}

        <span>·</span>

        <b>
          {newCount === 0
            ? 'No new teams'
            : `${newCount} new teams found`}
        </b>
      </div>

      <div className="mini-stats">
        <div>
          <span>Total teams</span>
          <b>{teams.length}</b>
        </div>

        <div>
          <span>New</span>
          <b className="blue-text">{newCount}</b>
        </div>

        <div>
          <span>Updated</span>
          <b>{updatedCount}</b>
        </div>

        <div>
          <span>Invalid</span>
          <b className="orange-text">{invalidCount}</b>
        </div>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search teams, leaders, PS..."
            />
          </div>

          <button className="filter-button">
            <Filter size={15} />
            Filter
            <ChevronDown size={14} />
          </button>

          <select
            className="select-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All</option>
            <option>New</option>
            <option>Updated</option>
            <option>Delivered</option>
            <option>Invalid</option>
          </select>
        </div>

        <div className="table-wrap">
          {rows.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="No registrations yet"
              description="Upload the SIH registration Excel file to add teams."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Team Leader</th>
                  <th>Problem Statement</th>
                  <th>Registration ID</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {rows.map((team) => (
                  <tr key={team.registrationId}>
                    <td>
                      <strong>{team.teamName}</strong>
                    </td>

                    <td>
                      <div>
                        <strong>{team.leaderName}</strong>

                        <div
                          style={{
                            fontSize: '11px',
                            marginTop: '3px',
                            color: '#667085',
                          }}
                        >
                          {team.leaderEmail}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>{team.psId}</strong>

                        <div
                          style={{
                            maxWidth: '250px',
                            fontSize: '11px',
                            marginTop: '3px',
                            color: '#667085',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {team.psTitle}
                        </div>
                      </div>
                    </td>

                    <td>{team.registrationId}</td>

                    <td>
                      <StatusPill status={team.status} />
                    </td>

                    <td>
                      <MoreHorizontal size={17} className="more" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-footer">
          Showing {rows.length} of {teams.length} teams
        </div>
      </section>
    </>
  )
}

function CampaignsPage({
  onCreate,
}: {
  onCreate: () => void
}) {
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Campaigns</h2>

          <p className="muted">
            Create and send personalized SIH registration emails.
          </p>
        </div>

        <button className="primary-button" onClick={onCreate}>
          <Plus size={17} />
          Create campaign
        </button>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>All campaigns</h3>

            <p className="muted">
              {campaigns.length}{' '}
              {campaigns.length === 1 ? 'campaign' : 'campaigns'} in
              your workspace
            </p>
          </div>
        </div>

        <div className="table-wrap">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No campaigns yet"
              description="Create your first SIH email campaign."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Campaign name</th>
                  <th>Subject</th>
                  <th>Teams</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.name}>
                    <td>
                      <div className="table-campaign">
                        <span className="campaign-mark small">
                          <Mail size={15} />
                        </span>

                        <strong>{campaign.name}</strong>
                      </div>
                    </td>

                    <td>{campaign.subject}</td>
                    <td>{campaign.recipients}</td>
                    <td>{campaign.sent}</td>
                    <td>{campaign.failed}</td>

                    <td>
                      <StatusPill status={campaign.status} />
                    </td>

                    <td>{campaign.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  )
}

function HistoryPage() {
  const [query, setQuery] = useState('')

  const filtered = history.filter((item) =>
    `${item.teamLeaderName} ${item.teamLeaderEmail} ${item.teamName} ${item.campaign}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Email History</h2>

          <p className="muted">
            Track emails sent to NMIET SIH team leaders.
          </p>
        </div>

        <button
          className="secondary-button"
          disabled={history.length === 0}
        >
          <FileText size={16} />
          Export history
        </button>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team, leader..."
            />
          </div>

          <button className="filter-button">
            <Filter size={15} />
            Status
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No email history yet"
              description="Emails sent to team leaders will appear here."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Team Leader</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Sent at</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map((item, index) => (
                  <tr
                    key={`${item.teamLeaderEmail}-${item.at}-${index}`}
                  >
                    <td>
                      <strong>{item.teamName}</strong>
                    </td>

                    <td>
                      <div>
                        <strong>{item.teamLeaderName}</strong>

                        <div
                          style={{
                            fontSize: '11px',
                            color: '#667085',
                            marginTop: '3px',
                          }}
                        >
                          {item.teamLeaderEmail}
                        </div>
                      </div>
                    </td>

                    <td>{item.campaign}</td>

                    <td>
                      <StatusPill status={item.status} />
                    </td>

                    <td>{item.at}</td>

                    <td>
                      <MoreHorizontal size={17} className="more" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  )
}

function SettingsPage() {
  const [name, setName] = useState('Yash')
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  const [pptTemplate, setPptTemplate] =
    useState<File | null>(null)

  const pptInputRef = useRef<HTMLInputElement>(null)

  function handlePptSelect(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    const extension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase()

    if (extension !== '.pptx' && extension !== '.ppt') {
      alert('Please select a PowerPoint template (.pptx or .ppt).')

      event.target.value = ''
      return
    }

    setPptTemplate(file)
  }

  function removePptTemplate() {
    setPptTemplate(null)

    if (pptInputRef.current) {
      pptInputRef.current.value = ''
    }
  }

  function saveSettings() {
    setSaved(true)

    setTimeout(() => {
      setSaved(false)
    }, 2500)
  }

  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Settings</h2>

          <p className="muted">
            Manage your MailFlow account and SIH email settings.
          </p>
        </div>
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Account</h3>

              <p>Your MailFlow account information.</p>
            </div>
          </div>

          <div
            className="form-column"
            style={{
              padding: '0 20px 22px',
            }}
          >
            <label>
              Name

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
              />
            </label>

            <label>
              Email address

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>SIH PPT Template</h3>

              <p>
                Upload the official PowerPoint template once. It can
                then be included with every SIH confirmation email.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '0 20px 22px',
            }}
          >
            <input
              ref={pptInputRef}
              type="file"
              accept=".ppt,.pptx"
              onChange={handlePptSelect}
              style={{ display: 'none' }}
            />

            {!pptTemplate ? (
              <button
                className="secondary-button"
                onClick={() => pptInputRef.current?.click()}
              >
                <Upload size={16} />
                Upload PPT template
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  border: '1px solid #e4e7ec',
                  borderRadius: '10px',
                  background: '#fafafa',
                }}
              >
                <div className="campaign-mark">
                  <FileText size={18} />
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pptTemplate.name}
                  </strong>

                  <span
                    style={{
                      color: '#667085',
                      fontSize: '11px',
                    }}
                  >
                    {(
                      pptTemplate.size / 1024 / 1024
                    ).toFixed(2)}{' '}
                    MB
                  </span>
                </div>

                <button
                  className="icon-button"
                  onClick={removePptTemplate}
                  aria-label="Remove PPT template"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <p
              className="field-hint"
              style={{
                marginTop: '10px',
              }}
            >
              Supported files: .ppt and .pptx
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Email Template</h3>

              <p>
                MailFlow uses the approved NMIET SIH registration
                confirmation template.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '0 20px 22px',
            }}
          >
            <div
              style={{
                padding: '14px',
                border: '1px solid #e4e7ec',
                borderRadius: '10px',
                background: '#fafafa',
                fontSize: '12px',
                lineHeight: 1.6,
              }}
            >
              <strong>
                NMIET SIH 2026 Internal Hackathon Registration
                Confirmed
              </strong>

              <p
                style={{
                  margin: '10px 0 0',
                  color: '#667085',
                }}
              >
                The email is sent only to the Team Leader using
                Leader Email from the registration Excel.
              </p>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Save Settings</h3>

              <p>Save your MailFlow configuration.</p>
            </div>
          </div>

          <div
            style={{
              padding: '0 20px 22px',
            }}
          >
            <button
              className="primary-button"
              onClick={saveSettings}
            >
              {saved ? (
                <>
                  <Check size={16} />
                  Settings saved
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </section>
      </div>
    </>
  )
}

function CreateCampaign({
  close,
}: {
  close: () => void
}) {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const [message, setMessage] = useState(
    `Dear {team_leader_name},

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
2nd September 2026`,
  )

  function send() {
    if (teams.length === 0) return

    setSending(true)

    setTimeout(() => {
      setSending(false)
      setSent(true)
    }, 1400)
  }

  return (
    <div className="modal-backdrop">
      <div className="campaign-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">New campaign</p>

            <h2>
              {sent ? 'Campaign sent' : 'Create campaign'}
            </h2>
          </div>

          <button
            className="icon-button"
            onClick={close}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {sent ? (
          <div className="send-success">
            <div className="success-check">
              <Check size={28} />
            </div>

            <h3>Your campaign is on its way</h3>

            <p>
              Emails will be sent only to Team Leader email
              addresses.
            </p>

            <button className="primary-button" onClick={close}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="form-column">
                <label>
                  Campaign name

                  <input
                    defaultValue="NMIET SIH 2026 Registration Confirmation"
                  />
                </label>

                <label>
                  Recipients

                  <select disabled={teams.length === 0}>
                    {teams.length === 0 ? (
                      <option>
                        No registered teams available
                      </option>
                    ) : (
                      <option>
                        All registered teams ({teams.length})
                      </option>
                    )}
                  </select>

                  <span className="field-hint">
                    Emails will be sent only to Leader Email.
                  </span>
                </label>

                <label>
                  Email subject

                  <input
                    defaultValue="NMIET SIH 2026 Internal Hackathon Registration Confirmed"
                  />
                </label>

                <label>
                  Message

                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    rows={20}
                  />

                  <span className="field-hint">
                    Available fields:{' '}
                    {'{team_leader_name}'},{' '}
                    {'{team_name}'},{' '}
                    {'{PS_NUMBER}'},{' '}
                    {'{Problem Title}'},{' '}
                    {'{name}'},{' '}
                    {'{registration_id}'}
                  </span>
                </label>

                <button
                  className="secondary-button test-button"
                  disabled={teams.length === 0}
                >
                  <Send size={15} />
                  Send test email
                </button>

                {teams.length === 0 && (
                  <span className="field-hint">
                    Upload and process the registration Excel
                    before sending a campaign.
                  </span>
                )}
              </div>

              <div className="preview-column">
                <p className="eyebrow">Live preview</p>

                <div className="email-preview">
                  <div className="email-brand">
                    <span className="brand-glyph">
                      <Mail size={15} />
                    </span>

                    MailFlow
                  </div>

                  <div className="email-content">
                    {message
                      .replace(
                        '{team_leader_name}',
                        'Team Leader',
                      )
                      .replace('{team_name}', 'Example Team')
                      .replace('{PS_NUMBER}', 'PS001')
                      .replace(
                        '{Problem Title}',
                        'Example Problem Statement',
                      )
                      .replace('{name}', 'Team Leader')
                      .replace(
                        '{registration_id}',
                        'NMIET-SIH-001',
                      )
                      .split('\n')
                      .map((line, index) => (
                        <p key={index}>{line || ' '}</p>
                      ))}
                  </div>

                  <div className="email-footer">
                    Sent with MailFlow
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="secondary-button" onClick={close}>
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={send}
                disabled={sending || teams.length === 0}
              >
                {sending ? (
                  <Loader2 className="spin" size={16} />
                ) : (
                  <Send size={16} />
                )}

                {sending ? 'Sending...' : 'Send campaign'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  const [page, setPage] =
    useState<PageKey>('Dashboard')

  const [mobile, setMobile] = useState(false)

  const [create, setCreate] = useState(false)

  const nav = [
    {
      label: 'Dashboard' as PageKey,
      icon: LayoutDashboard,
    },
    {
      label: 'Recipients' as PageKey,
      icon: Users,
    },
    {
      label: 'Campaigns' as PageKey,
      icon: Mail,
    },
    {
      label: 'History' as PageKey,
      icon: Send,
    },
  ]

  function navigate(nextPage: PageKey) {
    setPage(nextPage)
    setMobile(false)
  }

  function renderPage() {
    switch (page) {
      case 'Recipients':
        return <RecipientsPage />

      case 'Campaigns':
        return (
          <CampaignsPage
            onCreate={() => setCreate(true)}
          />
        )

      case 'History':
        return <HistoryPage />

      case 'Settings':
        return <SettingsPage />

      case 'Dashboard':
      default:
        return (
          <Dashboard
            onCreate={() => setCreate(true)}
          />
        )
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-glyph">
            <Mail size={20} />
          </span>

          <strong>MailFlow</strong>
        </div>

        <div className="workspace-switch">
          <div className="workspace-avatar">Y</div>

          <div>
            <b>Yash's workspace</b>
            <small>NMIET SIH 2026</small>
          </div>

          <ChevronDown size={16} />
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {nav.map((item) => {
            const Icon = item.icon
            const active = page === item.label

            return (
              <button
                key={item.label}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(item.label)}
              >
                <Icon size={18} />

                <span>{item.label}</span>

                {item.label === 'Recipients' &&
                  teams.length > 0 && (
                    <span className="nav-count">
                      {teams.length}
                    </span>
                  )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${
              page === 'Settings' ? 'active' : ''
            }`}
            onClick={() => navigate('Settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>

        <div className="user-row">
          <div className="workspace-avatar">Y</div>

          <div>
            <b>Yash</b>
            <small>MailFlow account</small>
          </div>

          <MoreHorizontal size={18} className="more" />
        </div>
      </aside>

      <main className="main-area">
        <Topbar
          title={page}
          onMenu={() => setMobile(!mobile)}
          onCreate={() => setCreate(true)}
        />

        <div className="page-content">
          {renderPage()}
        </div>
      </main>

      {create && (
        <CreateCampaign
          close={() => setCreate(false)}
        />
      )}
    </div>
  )
}
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '../components/PageHeader'
import { SecurityTable } from '../components/SecurityTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  usePasswordPolicy, useUpdatePasswordPolicy,
  useSystemHealth, useApiKeys, useBackups, useDataRetention, useSystemConfig,
  useMfaStatus, useMfaSetup, useMfaVerify, useCreateApiKey, useRevokeApiKey,
  useSchedulerJobs, useToggleSchedulerJob, useTrustedDevices, useRemoveTrustedDevice,
  useNotifications, useSendEmailOtp, useVerifyEmailOtp,
} from '../hooks/useSecurity'
import { useState } from 'react'

export function PasswordPolicyPage() {
  const { data: policy } = usePasswordPolicy()
  const update = useUpdatePasswordPolicy()

  if (!policy) return <p className="text-sm text-muted-foreground">Memuat...</p>

  const fields = [
    { key: 'minLength', label: 'Minimal Length', type: 'number' },
    { key: 'expirationDays', label: 'Password Expiration (days)', type: 'number' },
    { key: 'historyCount', label: 'Password History', type: 'number' },
    { key: 'lockoutAttempts', label: 'Lockout Attempts', type: 'number' },
    { key: 'sessionTimeoutMinutes', label: 'Session Timeout (min)', type: 'number' },
  ]

  return (
    <div>
      <PageHeader title="Password Policy" subtitle="Enterprise password & session policy" />
      <div className="glass-panel max-w-lg space-y-3 rounded-lg border border-border p-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs text-muted-foreground">{f.label}</label>
            <Input
              type={f.type}
              className="h-8 text-xs"
              defaultValue={policy[f.key]}
              onBlur={(e) => update.mutate({ [f.key]: Number(e.target.value) })}
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-3 pt-2">
          {['requireUppercase', 'requireLowercase', 'requireNumber', 'requireSymbol'].map((k) => (
            <label key={k} className="flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked={policy[k]} onChange={(e) => update.mutate({ [k]: e.target.checked })} />
              {k.replace('require', 'Require ')}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MfaPage() {
  const { data: status } = useMfaStatus()
  const setup = useMfaSetup()
  const verify = useMfaVerify()
  const [emailCode, setEmailCode] = useState('')
  const sendEmail = useSendEmailOtp()
  const verifyEmail = useVerifyEmailOtp()
  const [token, setToken] = useState('')
  const [setupData, setSetupData] = useState<{ secret?: string; otpauth?: string } | null>(null)

  const handleSetup = async () => {
    const res = await setup.mutateAsync()
    setSetupData(res)
  }

  return (
    <div>
      <PageHeader title="MFA Management" subtitle="Authenticator TOTP + Email OTP" />
      <div className="glass-panel mb-4 rounded-lg border border-border p-4 text-xs">
        <p>Status: {status?.enabled ? 'Aktif' : 'Nonaktif'}</p>
        <p>Methods: {(status?.methods ?? []).join(', ') || '-'}</p>
      </div>
      {!setupData ? (
        <Button size="sm" className="h-8 text-xs" onClick={handleSetup} disabled={setup.isPending}>
          Setup Authenticator
        </Button>
      ) : (
        <div className="glass-panel max-w-md space-y-2 rounded-lg border border-border p-4 text-xs">
          <p className="font-medium">Scan QR / masukkan secret:</p>
          <p className="break-all font-mono">{setupData.secret}</p>
          <Input className="h-8 text-xs" placeholder="6-digit OTP" value={token} onChange={(e) => setToken(e.target.value)} />
          <Button size="sm" className="h-8 text-xs" onClick={() => verify.mutate(token)} disabled={verify.isPending}>
            Verify & Enable
          </Button>
        </div>
      )}
      <div className="mt-4 glass-panel max-w-md space-y-2 rounded-lg border border-border p-4 text-xs">
        <p className="font-medium">Email OTP</p>
        <Button size="sm" className="h-8 text-xs" disabled={sendEmail.isPending} onClick={async () => {
          const res = await sendEmail.mutateAsync()
          if (res.devCode) alert(`Dev OTP: ${res.devCode}`)
        }}>Kirim OTP ke Email</Button>
        <>
          <Input className="h-8 text-xs" placeholder="Kode email OTP" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} />
          <Button size="sm" className="h-8 text-xs" disabled={verifyEmail.isPending} onClick={() => verifyEmail.mutate(emailCode)}>
            Verify Email OTP
          </Button>
        </>
      </div>
    </div>
  )
}

export function TrustedDevicesPage() {
  const { data = [] } = useTrustedDevices()
  const remove = useRemoveTrustedDevice()

  return (
    <div>
      <PageHeader title="Trusted Devices" subtitle="Perangkat terdaftar otomatis saat login" />
      <SecurityTable rows={data} emptyText="Belum ada perangkat" columns={[
        { key: 'deviceName', label: 'Device' },
        { key: 'deviceType', label: 'Type' },
        { key: 'lastUsedAt', label: 'Last Used', render: (r) => new Date(String(r.lastUsedAt)).toLocaleString('id-ID') },
        {
          key: 'actions',
          label: 'Actions',
          render: (r) => (
            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => remove.mutate(String(r.id))}>
              Remove
            </Button>
          ),
        },
      ]} />
    </div>
  )
}

export function SystemHealthPage() {
  const { data } = useSystemHealth()

  const gauges = [
    { label: 'CPU', value: data?.cpu ?? 0 },
    { label: 'RAM', value: data?.ram ?? 0 },
    { label: 'Storage', value: data?.storage ?? 0 },
  ]

  return (
    <div>
      <PageHeader title="System Health" subtitle="CPU, RAM, Storage, Database, API, Supabase" />
      <div className="grid gap-4 sm:grid-cols-3">
        {gauges.map((g) => (
          <Card key={g.label}>
            <CardHeader><CardTitle>{g.label}</CardTitle></CardHeader>
            <CardContent>
              <ReactECharts option={{
                series: [{ type: 'gauge', min: 0, max: 100, data: [{ value: g.value }] }],
              }} style={{ height: 160 }} />
            </CardContent>
          </Card>
        ))}
      </div>
      <SecurityTable
        rows={[
          { service: 'Database', status: data?.database },
          { service: 'API', status: data?.api },
          { service: 'Supabase', status: data?.supabase },
          { service: 'Realtime', status: data?.realtime },
          { service: 'Scheduler', status: data?.scheduler },
        ]}
        columns={[
          { key: 'service', label: 'Service' },
          { key: 'status', label: 'Status' },
        ]}
      />
    </div>
  )
}

export function ApiManagementPage() {
  const { data = [] } = useApiKeys()
  const createKey = useCreateApiKey()
  const revoke = useRevokeApiKey()
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) return
    const res = await createKey.mutateAsync({ name: name.trim() })
    setNewKey(res.key)
    setName('')
  }

  return (
    <div>
      <PageHeader title="API Management" subtitle="API Keys, Rate Limit, Tokens" />
      <div className="mb-3 flex gap-2">
        <Input className="h-8 w-48 text-xs" placeholder="Nama API key" value={name} onChange={(e) => setName(e.target.value)} />
        <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={createKey.isPending}>Generate</Button>
      </div>
      {newKey && (
        <div className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <p className="font-medium">Simpan key ini (hanya tampil sekali):</p>
          <p className="break-all font-mono">{newKey}</p>
        </div>
      )}
      <SecurityTable rows={data} emptyText="Belum ada API key" columns={[
        { key: 'name', label: 'Name' },
        { key: 'keyPrefix', label: 'Prefix' },
        { key: 'rateLimit', label: 'Rate Limit' },
        { key: 'expiresAt', label: 'Expiration', render: (r) => r.expiresAt ? new Date(String(r.expiresAt)).toLocaleDateString('id-ID') : '-' },
        {
          key: 'actions',
          label: 'Actions',
          render: (r) => (
            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => revoke.mutate(String(r.id))}>
              Revoke
            </Button>
          ),
        },
      ]} />
    </div>
  )
}

export function BackupPage() {
  const { data = [] } = useBackups()
  return (
    <div>
      <PageHeader title="Backup & Restore" subtitle="Daily, Weekly, Monthly, Manual" />
      <SecurityTable rows={data} columns={[
        { key: 'backupType', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'sizeKb', label: 'Size (KB)' },
        { key: 'createdAt', label: 'Created', render: (r) => new Date(String(r.createdAt)).toLocaleString('id-ID') },
      ]} />
    </div>
  )
}

export function ConfigPage() {
  const { data } = useSystemConfig()
  return (
    <div>
      <PageHeader title="Configuration" subtitle="General, Email, SMTP, Theme, Brand" />
      <pre className="glass-panel overflow-auto rounded-lg border border-border p-4 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export function DataRetentionPage() {
  const { data = [] } = useDataRetention()
  return (
    <div>
      <PageHeader title="Data Retention" subtitle="Audit log, login history, deleted data" />
      <SecurityTable rows={data} columns={[
        { key: 'resource', label: 'Resource' },
        { key: 'retentionDays', label: 'Retention (days)', render: (r) => `${r.retentionDays} hari` },
      ]} />
    </div>
  )
}

export function ConsentPage() {
  return (
    <div>
      <PageHeader title="Consent Log" subtitle="Privacy agreement, terms, consent timestamp & version" />
      <p className="text-xs text-muted-foreground">Consent log akan tercatat saat user menerima kebijakan privasi.</p>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div>
      <PageHeader title="Privacy" subtitle="Data privacy & masking policy" />
      <div className="glass-panel rounded-lg border border-border p-4 text-xs">
        <p className="mb-2 font-medium">Data Masking</p>
        <p>Nama: A********* | NIK: 3273********* | HP: 0812******55</p>
        <p className="mt-2 text-muted-foreground">Klik Reveal jika memiliki izin column-level security.</p>
      </div>
    </div>
  )
}

export function SchedulerPage() {
  const { data = [] } = useSchedulerJobs()
  const toggle = useToggleSchedulerJob()

  return (
    <div>
      <PageHeader title="Scheduler" subtitle="Session cleanup, retention, backup check, security digest" />
      <SecurityTable rows={data} columns={[
        { key: 'name', label: 'Job' },
        { key: 'jobType', label: 'Type' },
        { key: 'intervalMinutes', label: 'Interval (min)' },
        { key: 'enabled', label: 'Enabled', render: (r) => (r.enabled ? 'Yes' : 'No') },
        { key: 'lastRunAt', label: 'Last Run', render: (r) => r.lastRunAt ? new Date(String(r.lastRunAt)).toLocaleString('id-ID') : '-' },
        {
          key: 'actions',
          label: 'Actions',
          render: (r) => (
            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
              onClick={() => toggle.mutate({ id: String(r.id), enabled: !r.enabled })}>
              {r.enabled ? 'Disable' : 'Enable'}
            </Button>
          ),
        },
      ]} />
    </div>
  )
}

export function NotificationsPage() {
  const { data: items = [] } = useNotifications()

  return (
    <div>
      <PageHeader title="Notification Center" subtitle="Login, new device, backup, security alerts" />
      <SecurityTable rows={items} columns={[
        { key: 'title', label: 'Title' },
        { key: 'message', label: 'Message' },
        { key: 'category', label: 'Category' },
        { key: 'read', label: 'Read', render: (r) => (r.read ? 'Yes' : 'No') },
        { key: 'createdAt', label: 'Time', render: (r) => new Date(String(r.createdAt)).toLocaleString('id-ID') },
      ]} />
    </div>
  )
}

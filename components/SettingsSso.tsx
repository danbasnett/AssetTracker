'use client'

import { useState, useActionState } from 'react'
import { upsertOAuthProvider, deleteOAuthProvider } from '../app/actions'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type Provider = {
  name: string
  label: string
  clientId: string
  clientSecret: string
  enabled: boolean
  defaultRole: string
  authUrl?: string | null
  tokenUrl?: string | null
  userinfoUrl?: string | null
  scope?: string | null
  appleTeamId?: string | null
  appleKeyId?: string | null
  applePrivKey?: string | null
}

const PRESETS = [
  { name: 'google', label: 'Google' },
  { name: 'apple',  label: 'Apple' },
  { name: 'custom', label: 'Custom / Other' },
]

const ROLES = ['VIEW_ONLY', 'ASSET_CONTROL', 'MANAGEMENT', 'ADMIN']

function isBuiltin(name: string) { return name === 'google' || name === 'apple' }

function ProviderForm({ existing, onCancel }: { existing?: Provider; onCancel?: () => void }) {
  const isNew = !existing
  const [preset, setPreset] = useState('google')
  const [customName, setCustomName] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [state, action, pending] = useActionState(upsertOAuthProvider, null)

  const providerName = existing?.name ?? (preset === 'custom' ? customName : preset)
  const providerLabel = existing?.label ?? (preset === 'custom' ? customLabel : PRESETS.find(p => p.name === preset)?.label ?? preset)
  const isApple = providerName === 'apple'
  const isCustom = isNew ? preset === 'custom' : !isBuiltin(existing!.name)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="name" value={providerName} />
      <input type="hidden" name="label" value={providerLabel} />

      {isNew && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Provider type</label>
          <select value={preset} onChange={e => setPreset(e.target.value)}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500">
            {PRESETS.map(p => <option key={p.name} value={p.name}>{p.label}</option>)}
          </select>
        </div>
      )}

      {isNew && preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Internal name <span className="text-zinc-600">(no spaces)</span></label>
            <input value={customName} onChange={e => setCustomName(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="e.g. okta"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Display name</label>
            <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
              placeholder="e.g. Okta"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Client ID</label>
          <input name="clientId" defaultValue={existing?.clientId} required
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Client Secret</label>
          <input name="clientSecret" defaultValue={existing?.clientSecret} required
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
        </div>
      </div>

      {isCustom && (
        <div className="space-y-3 border-t border-zinc-700 pt-3">
          <p className="text-xs text-zinc-500">Enter your provider's OAuth 2.0 endpoints. These are usually found in the provider's developer docs or OIDC discovery document.</p>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Authorization URL</label>
            <input name="authUrl" defaultValue={existing?.authUrl ?? ''} placeholder="https://provider.example.com/oauth2/authorize"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Token URL</label>
            <input name="tokenUrl" defaultValue={existing?.tokenUrl ?? ''} placeholder="https://provider.example.com/oauth2/token"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Userinfo URL <span className="text-zinc-600">(optional if provider returns id_token)</span></label>
            <input name="userinfoUrl" defaultValue={existing?.userinfoUrl ?? ''} placeholder="https://provider.example.com/oauth2/userinfo"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Scope <span className="text-zinc-600">(default: openid email profile)</span></label>
            <input name="scope" defaultValue={existing?.scope ?? ''} placeholder="openid email profile"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
        </div>
      )}

      {isApple && (
        <div className="space-y-3 border-t border-zinc-700 pt-3">
          <p className="text-xs text-zinc-500">Apple requires additional credentials from your Apple Developer account.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Team ID</label>
              <input name="appleTeamId" defaultValue={existing?.appleTeamId ?? ''} placeholder="XXXXXXXXXX"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Key ID</label>
              <input name="appleKeyId" defaultValue={existing?.appleKeyId ?? ''} placeholder="XXXXXXXXXX"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Private Key (.p8 contents)</label>
            <textarea name="applePrivKey" defaultValue={existing?.applePrivKey ?? ''} rows={4}
              placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 resize-none" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Default role for new users</label>
          <select name="defaultRole" defaultValue={existing?.defaultRole ?? 'VIEW_ONLY'}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500">
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Status</label>
          <select name="enabled" defaultValue={existing?.enabled !== false ? 'true' : 'false'}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500">
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      {(state as any)?.error && <p className="text-red-400 text-xs">{(state as any).error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-white text-black text-sm font-medium px-4 py-1.5 hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {isNew ? 'Add provider' : 'Save'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-zinc-700 text-zinc-400 text-sm px-4 py-1.5 hover:text-white transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function ProviderRow({ provider }: { provider: Provider }) {
  const [open, setOpen] = useState(false)
  const [, deleteAction] = useActionState(deleteOAuthProvider, null)

  return (
    <div className="rounded-xl border border-zinc-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{provider.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${provider.enabled ? 'bg-green-950 text-green-300' : 'bg-zinc-700 text-zinc-400'}`}>
            {provider.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(o => !o)} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="name" value={provider.name} />
            <button type="submit" className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
              onClick={e => { if (!confirm(`Remove ${provider.label}?`)) e.preventDefault() }}>
              <Trash2 size={16} />
            </button>
          </form>
        </div>
      </div>
      {open && (
        <div className="p-4 border-t border-zinc-700">
          <ProviderForm existing={provider} onCancel={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

export default function SettingsSso({ providers }: { providers: Provider[] }) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-3">
      {providers.map(p => <ProviderRow key={p.name} provider={p} />)}

      {adding ? (
        <div className="rounded-xl border border-zinc-700 p-4">
          <ProviderForm onCancel={() => setAdding(false)} />
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
          <Plus size={16} /> Add provider
        </button>
      )}

      <p className="text-xs text-zinc-500">
        Callback URL to register with your provider:{' '}
        <span className="font-mono text-zinc-400">https://your-domain/api/auth/[provider-name]/callback</span>
      </p>
    </div>
  )
}

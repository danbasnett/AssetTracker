import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/session'
import SettingsStatusList from '../../components/SettingsStatusList'
import SettingsUserList from '../../components/SettingsUserList'
import SettingsLogoUpload from '../../components/SettingsLogoUpload'
import SettingsDeleteAll from '../../components/SettingsDeleteAll'
import SettingsImport from '../../components/SettingsImport'
import SettingsExport from '../../components/SettingsExport'
import SettingsSso from '../../components/SettingsSso'

export default async function SettingsPage() {
  const session = await requireRole('ADMIN')

  const [statuses, users, logoSetting, ssoProviders] = await Promise.all([
    prisma.status.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { username: 'asc' } }),
    prisma.setting.findUnique({ where: { key: 'logoPath' } }),
    (prisma as any).oAuthProvider.findMany({ orderBy: { createdAt: 'asc' } }),
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-zinc-400">Configure your asset tracker</p>

        <div className="mt-8">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Logo</h2>
          <SettingsLogoUpload currentLogoUrl={logoSetting?.value} />
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Single Sign-On (OAuth)</h2>
          <SettingsSso providers={ssoProviders} />
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Import Data</h2>
          <SettingsImport />
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Export Data</h2>
          <SettingsExport />
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Asset Statuses</h2>
          <SettingsStatusList statuses={statuses} />
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Users</h2>
          <SettingsUserList users={users} currentUserId={session.userId} />
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Danger Zone</h2>
          <SettingsDeleteAll />
        </div>
      </div>
    </main>
  )
}

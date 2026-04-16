import { prisma } from '../../lib/prisma'
import { getSession } from '../../lib/session'
import { redirect } from 'next/navigation'
import LoginForm from '../../components/LoginForm'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await getSession()
  if (session.isLoggedIn) redirect('/')

  const { from } = await searchParams
  const [userCount, logoSetting] = await Promise.all([
    prisma.user.count(),
    prisma.setting.findUnique({ where: { key: 'logoPath' } }).catch(() => null),
  ])

  return <LoginForm isFirstTime={userCount === 0} from={from ?? '/'} logoUrl={logoSetting?.value ?? undefined} />
}

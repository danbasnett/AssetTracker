import { prisma } from '../../lib/prisma'
import { getSession } from '../../lib/session'
import { redirect } from 'next/navigation'
import LoginForm from '../../components/LoginForm'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await getSession()
  if (session.isLoggedIn) redirect('/')

  const { from } = await searchParams
  const userCount = await prisma.user.count()

  return <LoginForm isFirstTime={userCount === 0} from={from ?? '/'} />
}

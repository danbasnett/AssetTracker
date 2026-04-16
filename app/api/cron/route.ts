import { NextResponse } from 'next/server'
import { spawnDueRepeats } from '../../../lib/spawnRepeats'

export async function GET() {
  const spawned = await spawnDueRepeats()
  console.log(`[cron] Daily maintenance job: ${spawned} record(s) spawned`)
  return NextResponse.json({ ok: true, spawned })
}

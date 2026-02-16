import LandingPage from '@/app/LandingPage'
import { getLandingData } from '@/lib/landing-data'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const data = await getLandingData()

  return <LandingPage data={data} />
}

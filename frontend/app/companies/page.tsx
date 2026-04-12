import { getCompaniesData } from '@/lib/companies-data'
import CompaniesPage from './CompaniesPage'

export default async function Companies() {
  const data = await getCompaniesData()

  return <CompaniesPage data={data} />
}

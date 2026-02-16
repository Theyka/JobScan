export type VacancyPageParams = {
  source: string
  slug: string
}

export type VacancyPageProps = {
  params: VacancyPageParams | Promise<VacancyPageParams>
}

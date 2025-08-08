export const getCompanyLogoPath = (empresa: string): string => {
  if (!empresa) return '/logos/icono-default.svg'
  const normalizedCompany = empresa
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const logoMap: Record<string, string> = {
    ypf: 'icono-ypf.png',
    shell: 'icono-shell.png',
    axion: 'icono-axion.png',
    petrobras: 'icono-petrobras.png',
    gulf: 'icono-gulf.png',
    oil: 'icono-oil.png',
    blanca: 'icono-blanca.png',
    puma: 'icono-puma.png',
    dapsa: 'icono-dapsa.png',
  }

  // Try exact match
  const exactMatch = logoMap[normalizedCompany]
  if (exactMatch) {
    return `/logos/${exactMatch}`
  }

  // Try partial matches
  for (const [key, logo] of Object.entries(logoMap)) {
    if (normalizedCompany.includes(key) || key.includes(normalizedCompany)) {
      return `/logos/${logo}`
    }
  }

  return ''
}

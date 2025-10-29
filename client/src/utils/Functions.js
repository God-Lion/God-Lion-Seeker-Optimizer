import zone from './zone'

export function isMatch(member, query) {
  let find = false
  if (member !== 'undefined' && query !== 'undefined') {
    for (let i = 0; i < query.length; i++) {
      const value = query[i]
      const property = value.property
      const content = value.value
      if (
        member[property].toLowerCase().match(content.toLowerCase())?.index === 0
      )
        find = true
    }
  }
  return find
}

export function isPropertyDefined(object, property) {
  const properties = Object.getOwnPropertyNames(object)
  for (let i = 0; i < properties.length; i++)
    if (properties[i] === property) return true
  return false
}

export function converTimestampToDate(date) {
  return new Date(date.seconds * 1000)
}

export function getDepartements() {
  const departements = zone
    ?.map((el) => el['Departement'.toUpperCase()])
    ?.filter((value, index, self) => self.indexOf(value) === index)
    ?.map((el) => {
      if (typeof el === 'string') el?.trim()
      return el
    })
    ?.filter((value, index, self) => value !== 'NULL')
    ?.map((el) => {
      const row = zone?.filter(
        (value, index, self) => value['Departement'.toUpperCase()] === el,
      )[0]
      return {
        code: row['CODE_DEP'],
        codePostal: row['CODE_POSTAL'],
        departement: el,
      }
    })
    ?.map((departement) => {
      const arrondissements = zone
        ?.filter((value) => value['CODE_DEP'] === departement.code)
        ?.map((el) => el['Arrondissement'.toUpperCase()])
        ?.filter((value, index, self) => self.indexOf(value) === index)
        ?.map((el) => {
          if (typeof el === 'string') el?.trim()
          return el
        })
        ?.filter((value, index, self) => value !== 'NULL')
        ?.map((el) => {
          const row = zone?.filter(
            (value, index, self) =>
              value['Arrondissement'.toUpperCase()] === el,
          )[0]
          return {
            codeDep: row['CODE_DEP'],
            code: row['CODE_ARR'],
            codePostal: row['CODE_POSTAL'],
            arrondissement: el,
          }
        })
        ?.map((arrondissement) => {
          const communes = zone
            ?.filter((value) => value['CODE_ARR'] === arrondissement.code)
            ?.map((el) => el['Commune'.toUpperCase()])
            ?.filter((value, index, self) => self.indexOf(value) === index)
            ?.map((el) => {
              if (typeof el === 'string') el?.trim()
              return el
            })
            ?.filter((value, index, self) => value !== 'NULL')
            ?.map((el) => {
              const row = zone?.filter(
                (value, index, self) => value['Commune'.toUpperCase()] === el,
              )[0]
              return {
                codePostal: row['CODE_POSTAL'],
                commune: el,
              }
            })
            ?.map((commune) => {
              const localites = zone
                ?.filter((value) => value['COMMUNE'] === commune.commune)
                ?.map((el) => el['Localite'.toUpperCase()])
                ?.filter((value, index, self) => self.indexOf(value) === index)
                ?.map((el) => {
                  if (typeof el === 'string') el?.trim()
                  return el
                })
                ?.filter((value, index, self) => value !== 'NULL')
              return { ...commune, localite: localites }
            })
          return { ...arrondissement, commune: communes }
        })
      return { ...departement, arrondissement: arrondissements }
    })
  return departements
}

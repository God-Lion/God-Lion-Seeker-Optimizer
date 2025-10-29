import { differenceInYears, parseISO } from 'date-fns'
import departements from 'src/utils/departement_state.json'

export const isObjectEmpty = (objectName: object) => {
  return (
    objectName &&
    Object.keys(objectName).length === 0 &&
    objectName.constructor === Object
  )
}

export const isKeyIn = (obj: object, key: string) => {
  let find = false
  for (const o in obj) if (o === key) find = true
  return find
}

export const removeAttr = (obj: object, keys: Array<string>) => {
  // @ts-ignore
  for (const key of keys) if (isKeyIn(obj, key)) delete obj[key]
  return obj
}

export const showPermissions = (userTypeID: number) => {
  switch (userTypeID) {
    case 1:
      return 'System '
    case 2:
      return 'Admin'
    case 3:
      return 'Supervisor'
    case 4:
      return 'Judge'
    case 5:
      return 'Participant'
    default:
      return 'unknown'
  }
}

export function category(dateBirth: string | object): number {
  const birthDate = typeof dateBirth === 'string' ? parseISO(dateBirth) : new Date(dateBirth as Date)
  const age = differenceInYears(new Date(), birthDate)
  if (age >= 7 && age <= 12) return 1
  if (age >= 13 && age <= 17) return 2
  if (age >= 10) return 3
  return -1
}

export function getCommunes(): Array<string> {
  const communes: Array<string> = []
  for (const departement of departements)
    for (const arrondissement of departement.arrondissement)
      for (const commune of arrondissement.commune)
        communes.push(commune.commune)
  return communes
}

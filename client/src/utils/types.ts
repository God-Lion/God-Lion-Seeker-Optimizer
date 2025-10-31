/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { IUserReponse } from 'src/types'

export enum Roles {
  USER = 1,
  PARTICIPANT = 2,
  JUDGE = 3,
  PROVIDEREMPLOYEE = 4,
  PROVIDERADMIN = 5,
  ADMIN = 6,
  SUPERADMINEMPLOYEE = 7,
  SUPERADMIN = 8,
}

export const RoleWeights = [
  Roles.USER,
  Roles.PARTICIPANT,
  Roles.JUDGE,
  Roles.PROVIDEREMPLOYEE,
  Roles.PROVIDERADMIN,
  Roles.ADMIN,
  Roles.SUPERADMINEMPLOYEE,
  Roles.SUPERADMIN,
]
export interface IGlobalState {
  user: IUserReponse
  contests: Array<any>
  editions: Array<any>
  current_contest_id: number
  current_edition_id: number
  setCurrentContestId: Function
  setCurrentEditionId: Function
  error: any
  laoding: boolean
  messageAlert: any
  signin: Function
  signOut: Function
  set: Function
}

export interface ITab {
  key: string
  label: string
  icon?: React.JSX.Element
  component: React.JSX.Element
}

export interface ISubMenu {
  name: string
  icon: React.JSX.Element
  link: string
}

export interface IMenu {
  name: string
  icon: React.JSX.Element
  link: string
  menu?: Array<ISubMenu>
}

export interface IStatus {
  open: boolean
  type: string
  state: string
  msg: string
}

export interface ICustomizedLabel {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  name: string
  index: number
}

export interface IDepartement {
  code: string
  codePostal: string
  departement: string
  arrondissement: Array<IArrondissement>
}
export interface IArrondissement {
  codeDep: string
  code: string
  codePostal: string
  arrondissement: string
  commune: Array<ICommune>
}
export interface ICommune {
  codePostal: string
  commune: string
  localite?: Array<string>
}

export interface Member {
  id?: number
  email: string
}
export interface ISongData {
  result: string | ArrayBuffer | null | undefined
  file: File
}

export type ISubcriberPersonalInfo = {
  category_id?: number
  holderLastname?: string
  holderFirstname?: string
  relationship?: string
  lastname?: string
  firstname?: string
  email?: string
  sexe?: string
  dateBirth?: any
  country?: string
  communeBirth?: string
  address?: string
  phone?: string
}

export type IFormDrawingContest = ISubcriberPersonalInfo & {
  user_id?: number | string
  participationType?: string
  groupMember?: string
  whatsapp?: string
  instagram?: string
  twitter?: string
  facebook?: string
  presentation?: string
  subject?: string
  drawing?: string
  imageDrawing?: {
    result: string | ArrayBuffer | undefined
    file: File
  }
  presentationDrawing?: string
  terms?: boolean
}
export type IMusicSubcribe = ISubcriberPersonalInfo & {
  id?: number
  edition_id?: number
  user_id?: number | string
  isInGroup?: boolean
  group_name?: string
  number_group_member?: number
  member?: Array<Member>
  songTitle?: string
  songArtistName?: string
  songGenre?: string
  songImageCover?: File
  songImageCoverData?: {
    result: string | ArrayBuffer | undefined
    file: File
  }
  song?: File
  songData?: ISongData
  terms?: boolean
}

export interface IUpdateNames {
  lastname?: string
  firstname?: string
  firstName?: string
  lastName?: string
}

export type IFormContest = IFormDrawingContest & IMusicSubcribe

export type ICategory = {
  id: number
  parentId?: number
  name: 'MUSIC' | 'DRAWER'
  image: string
  position?: number
  description?: string
  isActive: boolean
  isFeatured: boolean
  createdAt?: string
  updatedAt?: string
  eddition?: Array<IEddition>
}

export type IEddition = {
  id: number
  categoryId?: number
  name: String
  start: string
  end: string
  theme: string
  subject: string
  isActive: boolean
  isFeatured: boolean
  created_at?: string
  updated_at?: string
  meta?: IMeta
  phase?: Array<IPhase>
  participant?: Array<IParticipant>
}

export type IPhase = {
  id?: number
  name: 'Phase1' | 'Phase2' | 'Phase3'
  createdAt?: string
  updatedAt?: string
}

export type IProvider = {
  id: number
  userId: number
  logo: string
  name: string
  phone: string
  address: string
  email: string
  contactPersonName: string
  contactPersonPhone: string
  contactPersonEmail: string
  isActive: number
  isApproved: number
  isSuspended: number
  createdAt: string
  updatedAt: string
  owner_provider: IUser
  category?: ICategory
}

export type IUser = {
  id: number
  roleId: number
  role?: number | string
  firstname: string
  lastname: string
  phone: string
  sexe?: any
  email: string
  rememberMeToken?: any
  avatarUrl: string
  emailVerified?: any
  emailVerifiedAt?: any
  isEnabledProfile: number
  isEnabledMiniPlayer: number
  isEnabledAutoplayNext: number
  isEnabledMentions: number
  isActive: number
  isTermsSign: number
  createByUserId: number
  createdAt: string
  updatedAt: string
  avatar: string
  avatarLarge: string
  isAdmin: boolean
  isParticipant: boolean
  isEmailVerified: boolean
  meta?: IMeta
}

export type IMeta = {
  delete_at?: any
}

export type IParticipant = {
  user: IUser
}

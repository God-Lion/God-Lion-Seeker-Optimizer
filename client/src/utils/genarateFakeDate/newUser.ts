import { Roles } from '../types'
import type { IUser } from 'src/Views/type'

const newUser = ({
  id = Math.floor(Math.random() * 1000),
  roleId = Roles.USER,
}: {
  id?: number
  roleId?: number
}): IUser => {
  const email = `user${Math.floor(Math.random() * 100)}@example.com`
  return {
    id: id,
    roleId: roleId,
    firstname: `User${Math.floor(Math.random() * 100)}`,
    lastname: `Last${Math.floor(Math.random() * 100)}`,
    phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    sexe: ['male', 'female'][Math.floor(Math.random() * 2)]!,
    email: email,
    rememberMeToken: undefined,
    avatarUrl: 'https://via.placeholder.com/300x300',
    emailVerified: email,
    emailVerifiedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    isEnabledProfile: Math.random() > 0.5 ? 1 : 0,
    isEnabledMiniPlayer: Math.random() > 0.5 ? 1 : 0,
    isEnabledAutoplayNext: Math.random() > 0.5 ? 1 : 0,
    isEnabledMentions: Math.random() > 0.5 ? 1 : 0,
    isActive: Math.random() > 0.5 ? 1 : 0,
    isTermsSign: Math.random() > 0.5 ? 1 : 0,
    createByUserId: 1,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toString(),
    updatedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toString(),
    avatar: 'https://via.placeholder.com/150',
    avatarLarge: 'https://via.placeholder.com/300x300',
    isAdmin: Math.random() > 0.5,
    isParticipant: Math.random() > 0.5,
    isEmailVerified: Math.random() > 0.5,
  }
}

export default newUser
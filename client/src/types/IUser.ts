/* eslint-disable no-unused-vars */

export interface IParticipant {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  category?: string
  contestId?: string
  submissionDate?: string
  status?: string
  createdAt: string
  updatedAt: string
}

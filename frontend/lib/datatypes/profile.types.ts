export type ProfileActionState = {
  status: 'idle' | 'error' | 'success'
  message: string
}

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {
  status: 'idle',
  message: '',
}

export type UserProfile = {
  firstName: string
  lastName: string
  username: string
  email: string
  techStack: string[]
}

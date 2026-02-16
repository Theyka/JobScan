'use client'

import { useActionState } from 'react'

import { INITIAL_PROFILE_ACTION_STATE } from '@/lib/datatypes/profile.types'

import { updateProfileAction } from './actions'

type ProfileFormProps = {
  email: string
  initialFirstName: string
  initialLastName: string
  initialUsername: string
}

export default function ProfileForm({
  email,
  initialFirstName,
  initialLastName,
  initialUsername,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, INITIAL_PROFILE_ACTION_STATE)

  return (
    <section className="mx-auto w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update your personal account details.</p>

      {state.status !== 'idle' ? (
        <p
          className={
            state.status === 'success'
              ? 'mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300'
              : 'mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300'
          }
        >
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          />
        </div>

        <div>
          <label htmlFor="first_name" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            First name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            defaultValue={initialFirstName}
            required
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Last name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            defaultValue={initialLastName}
            required
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={initialUsername}
            required
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}

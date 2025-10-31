import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Backdrop, CircularProgress } from '@mui/material'
import { isObjectEmpty } from 'src/utils'
import { useAuth } from 'src/store'
import { IUserReponse } from 'src/types'
// import { Roles } from '@shared/Roles'
import { Roles } from 'src/utils/types'

const access = (pathname: string, user: IUserReponse) => {
  if (!isObjectEmpty(user)) {
    const roleId = user.role
    const all = [`/settings`, '/drawingcontest', '/account', '/profile']
    // const routesParticipantAccess = [...all]
    // const routesJudgeAccess = ['/admin/juges', '/admin/', ...all]
    // const routesSuperVisorAccess = [
    //   'dashboard',
    //   '/admin/juges/details',
    //   `Users`,
    //   ...all,
    // ]
    const routesSuperAdminAccess = [
      '/admin/',
      '/admin/logs',
      '/admin/juges/details',
      '/admin/drawingcontest',
      '/admin/users',
      ...all,
    ]
    switch (roleId) {
      case Roles.USER:
        return routesSuperAdminAccess.some((value) => value === pathname)
      case Roles.PROVIDERADMIN:
        return routesSuperAdminAccess.some((value) => value === pathname)
      default:
        return false
    }

    // if (userTypeID === 1)
    //   return routesSuperAdminAccess.some((value) => value === pathname)
    // else if (userTypeID === 2)
    //   return routesSuperAdminAccess.some((value) => value === pathname)
    // else if (userTypeID === 3)
    //   return routesSuperVisorAccess.some((value) => value === pathname)
    // else if (userTypeID === 4)
    //   return routesJudgeAccess.some((value) => value === pathname)
    // else if (userTypeID === 5)
    //   return routesParticipantAccess.some((value) => value === pathname)
    // else return false
  }
  return false
}

export default function PrivateRoute({
  element,
}: {
  element: React.ReactNode
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { user } = useAuth()
  if (typeof user == 'string' || isObjectEmpty(user)) navigate('/')

  React.useEffect(() => {
    if (!access(pathname, user)) {
      const roleId = user.role
      if (
        [
          Roles.JUDGE,
          Roles.PROVIDEREMPLOYEE,
          Roles.PROVIDERADMIN,
          Roles.ADMIN,
          Roles.SUPERADMINEMPLOYEE,
          Roles.SUPERADMIN,
        ].includes(roleId)
      )
        navigate('/admin/')

      if ([Roles.USER, Roles.PARTICIPANT].includes(roleId)) navigate('/')

      // if (
      //   ![
      //     Roles.USER,
      //     Roles.PARTICIPANT,
      //     Roles.JUDGE,
      //     Roles.PROVIDEREMPLOYEE,
      //     Roles.PROVIDERADMIN,
      //     Roles.ADMIN,
      //     Roles.SUPERADMINEMPLOYEE,
      //     Roles.SUPERADMIN,
      //   ].includes(roleId)
      // )
      //   navigate('/')
      // switch (roleId) {
      //   case Roles.USER:
      //     navigate('/')
      //     break
      //   case Roles.ADMIN:
      //     navigate('/admin/')
      //     break
      //   default:
      //     navigate('/')
      //     break
      // }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user])

  return (
    <React.Suspense
      fallback={
        <Backdrop open style={{ background: '#fff' }}>
          <CircularProgress color='inherit' />
        </Backdrop>
      }
    >
      {/* <Await
        resolve={element}
        errorElement={<div>Could not load reviews 😬</div>}
        children={element}
      /> */}
      {element}
    </React.Suspense>
  )
}

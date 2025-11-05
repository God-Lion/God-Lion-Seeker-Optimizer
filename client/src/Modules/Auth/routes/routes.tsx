import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import SignIn from '../screens/SignIn'
import SignUp from '../screens/SignUp'
import SignInV2 from '../screens/SignInSide'
import SignOut from '../screens/SignOut'
import ForgetPassword from '../screens/ForgetPassword'
import VerificationEmail from '../screens/VerificationEmail'
import EmailVerification from '../screens/EmailVerification'
import ResetPassword from '../screens/ResetPassword'

const AuthRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Sign In Route - /auth/signin */}
      <Route path='signin' element={<SignIn />} />
      
      {/* Sign Up Route - /auth/signup */}
      <Route path='signup' element={<SignUp />} />
      
      {/* Sign In V2 Route - /auth/signin2 */}
      <Route path='signin2' element={<SignInV2 />} />
      
      {/* Sign Out Route - /auth/signout */}
      <Route path='signout' element={<SignOut />} />
      
      {/* Forget Password Route - /auth/forgetpassword */}
      <Route path='forgetpassword' element={<ForgetPassword />} />
      
      {/* Email Verification Routes - /auth/verification/email and /auth/verification/email/:email */}
      <Route path='verification-email' element={<EmailVerification />} />
      <Route path='verification/email' element={<VerificationEmail />} />
      <Route path='verification/email/:email' element={<VerificationEmail />} />
      
      {/* Reset Password Routes - /auth/reset-password and /auth/reset-password/:email */}
      <Route path='reset-password' element={<ResetPassword />} />
      <Route path='reset-password/:email' element={<ResetPassword />} />
      
      {/* Additional Routes (Uncomment as needed) */}
      {/* <Route path='validate' element={<Validate />} /> */}
      {/* <Route path='validate/:id/:token/:location' element={<Validate />} /> */}
      {/* <Route path='register'>
        <Route
          path='musiccontest'
          element={
            <PublicLayout>
              <FormMusicContest />
            </PublicLayout>
          }
        />
        <Route
          path='drawingcontest'
          element={
            <PublicLayout>
              <FormDrawingContest />
            </PublicLayout>
          }
        />
      </Route> */}
      {/* {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))} */}
      {/* Optionally, you can add a default route for unmatched paths */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  )
}
export default AuthRoutes

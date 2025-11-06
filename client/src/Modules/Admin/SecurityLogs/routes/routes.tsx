import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import SignIn from '../screens/SignIn'
import SignUp from '../screens/SignUp'
import SignInV2 from '../screens/SignInSide'
import SignOut from '../screens/SignOut'
import ForgetPassword from '../screens/ForgetPassword'
import VerificationEmail from '../screens/VerificationEmail'
import EmailVerification from '../screens/EmailVerification'
import AccountVerification from '../screens/AccountVerification'
import OtpVerification from '../screens/OtpVerification'
import SetNewPassword from '../screens/SetNewPassword'
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
      <Route path='account-verification' element={<AccountVerification />} />
      <Route path='otp-verification' element={<OtpVerification />} />
      <Route path='set-new-password' element={<SetNewPassword />} />
      <Route path='verification/email' element={<VerificationEmail />} />
      <Route path='verification/email/:email' element={<VerificationEmail />} />
      
      {/* Reset Password Routes - /auth/reset-password and /auth/reset-password/:email */}
      <Route path='reset-password' element={<ResetPassword />} />
      <Route path='reset-password/:email' element={<ResetPassword />} />
      
    </Routes>
  )
}
export default AuthRoutes

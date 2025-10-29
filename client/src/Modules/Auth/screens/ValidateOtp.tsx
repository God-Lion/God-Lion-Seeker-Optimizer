/* eslint-disable prettier/prettier */
import React from 'react'
import OtpInput from 'react-otp-input'

export default function App() {
  const [otp, setOtp] = React.useState('')

  return (
    <OtpInput
      value={otp}
      onChange={setOtp}
      numInputs={4}
      renderSeparator={<span>-</span>}
      renderInput={(props: any) => {
        return <input {...props} />
      }}
    />
  )
}

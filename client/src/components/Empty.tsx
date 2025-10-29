import React from 'react'
import empty from '../assets/Images/empty.png'

export default function Empty({ text, width, height, showText }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
      }}
    >
      {showText === true ? (
        <h4> {text} </h4>
      ) : (
        <img
          src={empty}
          alt='images'
          style={{
            width: width,
            height: height,
          }}
        />
      )}
    </div>
  )
}

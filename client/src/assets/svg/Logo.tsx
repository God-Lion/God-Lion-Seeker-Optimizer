import React from 'react'

const Logo = (props: React.SVGAttributes<SVGElement>) => {
  return (
    <img 
      src="/godlion_seeker_logo.svg" 
      alt="God Lion Seeker" 
      style={{
        width: '2.5em',
        height: 'auto',
        ...props.style
      }}
    />
  )
}

export default Logo

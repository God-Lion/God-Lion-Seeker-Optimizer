import React from 'react'
import { Link, LinkProps } from 'react-router-dom'
import type { ChildrenType } from '../types'

type RouterLinkProps = LinkProps &
  Partial<ChildrenType> & {
    className?: string
  }

export const RouterLink = React.forwardRef(
  (props: RouterLinkProps, ref: any) => {
    const { to, className, ...other } = props

    return (
      <Link ref={ref} to={to} className={className} {...other}>
        {props.children}
      </Link>
    )
  },
)
export default RouterLink

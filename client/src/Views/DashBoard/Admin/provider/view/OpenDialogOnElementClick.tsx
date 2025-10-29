import React from 'react'

type OpenDialogOnElementClickProps = {
  element: React.ComponentType<any>
  dialog: React.ComponentType<any>
  elementProps?: any
  dialogProps?: any
}

const OpenDialogOnElementClick = (props: OpenDialogOnElementClickProps) => {
  const { element: Element, dialog: Dialog, elementProps, dialogProps } = props
  const [open, setOpen] = React.useState(false)
  const { onClick: elementOnClick, ...restElementProps } = elementProps
  const handleOnClick = (e: MouseEvent) => {
    elementOnClick && elementOnClick(e)
    setOpen(true)
  }

  return (
    <>
      {/* Receive element component as prop and we will pass onclick event which changes state to open */}
      <Element onClick={handleOnClick} {...restElementProps} />
      {/* Receive dialog component as prop and we will pass open and setOpen props to that component */}
      <Dialog open={open} setOpen={setOpen} {...dialogProps} />
    </>
  )
}

export default OpenDialogOnElementClick

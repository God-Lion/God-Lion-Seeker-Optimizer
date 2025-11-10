import { createRoot } from 'react-dom/client'

import 'src/index.css'
import 'src/globals.css'
import 'src/style.css'

import App from 'src/App'
import Providers from 'src/Providers'
import Layout from 'src/layout'

const root = createRoot(document.getElementById('root')!)
const direction = 'ltr'

// document.addEventListener('contextmenu', (e) => e.preventDefault())

// interface CtrlShiftKeyEvent extends KeyboardEvent {}

// function ctrlShiftKey(e: CtrlShiftKeyEvent, keyCode: string): boolean {
//   return e.ctrlKey && e.shiftKey && e.keyCode === keyCode.charCodeAt(0)
// }

// document.onkeydown = (e) => {
//   // Disable F12, Ctrl + Shift + I, Ctrl + Shift + J, Ctrl + U
//   if (
//     e.keyCode === 123 ||
//     ctrlShiftKey(e, 'I') ||
//     ctrlShiftKey(e, 'J') ||
//     ctrlShiftKey(e, 'C') ||
//     (e.ctrlKey && e.keyCode === 'U'.charCodeAt(0))
//   )
//     return false
// }

if (import.meta.env.PROD) {
  // Disable console in production
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
  
  // Detect DevTools (better method)
  const devtools: any = { opened: false }
  const detectDevTools = /./
  detectDevTools.toString = function(): string {
    devtools.opened = true
    return ''
  }
  
  setInterval(() => {
    console.log('%c', detectDevTools)
    if (devtools.opened) {
      // Alert or log security event
      window.location.href = '/security-warning'
      devtools.opened = false
    }
  }, 1000)
}

root.render(
  <Providers direction={direction}>
    <Layout>
      <App />
    </Layout>
  </Providers>
)
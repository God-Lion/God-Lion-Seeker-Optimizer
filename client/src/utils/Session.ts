import Encrypt from './Encrypt'
export function in_array(key: string | number, array: Array<any>) {
  let find = false
  array.forEach((element) => {
    if (key === element) {
      find = true
    }
  })
  return find
}

export function getIndice(array: Array<any>, key: string | number) {
  for (let i = 0; i < array.length; i++) {
    const e = array[i]
    if (in_array(key, Object.getOwnPropertyNames(e))) return i
  }
  return -1
}

interface IFlash {
  type: string
  message: string
}
export default class Session {
  private SESSION_KEY: string = 'mascayiti_session'
  private session: Array<any> = []
  private encrypt: Encrypt = new Encrypt()
  private static findData: boolean

  constructor() {
    this.fetch()
  }

  /**
   * It takes a message and a type, and pushes it to the session.
   * @param message - The message you want to display
   * @param [type=success] - The type of flash message. This can be 'success', 'error', 'warning', or
   * 'info'.
   */
  setFlash(message: string, type: string = 'success') {
    this.session.push({
      flash: {
        message: message,
        type: type,
      },
    })
    this.save(this.session)
  }

  /**
   * It fetches the session, loops through it, and if it finds a flash message, it returns the flash
   * message.
   * @returns The HTML for the flash message.
   */
  flash(): string {
    let session = this.fetch()
    let html = ''
    session.forEach((e: { flash: IFlash }) => {
      if (e.flash)
        html = `<div class="alert alert-${e.flash.type}" role="alert"><p>${e.flash.message}</p></div>`
    })
    return html
  }

  /**
   * It takes a key and a value, fetches the session, gets the index of the key, if the index is
   * greater than or equal to 0, it replaces the key with the value, otherwise it pushes the key and
   * value to the session.
   * @param key - The key of the session you want to write to.
   * @param value - The value to be stored in the session.
   */
  write(key: string, value: {}) {
    this.session = this.fetch()
    const i = getIndice(this.session, key)
    if (i >= 0) this.session[i] = { [key]: value }
    else this.session.push({ [key]: value })
    this.save(this.session)
  }

  /**
   * If the key is not null, then return the value of the key, otherwise return the entire session.
   * @param [key=null] - The key to be read from the session. If no key is provided, the entire
   * session is returned.
   * @returns The session object.
   */
  read(key: string = '') {
    this.session = this.fetch()
    if (key) {
      const i: number = getIndice(this.session, key)
      return i >= 0 ? this.session[i][key] : ''
    } else return this.session
  }

  // /**
  //  * If the sessionStorage object has a key called SESSION_KEY, then parse the JSON string and return
  //  * the data. If the sessionStorage object does not have a key called SESSION_KEY, then create an
  //  * empty array and return it.
  //  * @returns The data is being returned.
  //  */
  // fetch () {
  //     let data = JSON.parse(sessionStorage.getItem( this.SESSION_KEY) || '[]')
  //     if (  data.toString().length > 1 ) Session.findData = true
  //     else this.save([])
  //     return data
  // }

  // /**
  //  * It saves the data to the session storage
  //  * @param data - The data to be saved.
  //  */
  // save ( data ) { sessionStorage.setItem( this.SESSION_KEY, JSON.stringify( data ))}

  /**
   * If the sessionStorage object has a key called SESSION_KEY, then parse the JSON string and return
   * the data. If the sessionStorage object does not have a key called SESSION_KEY, then create an
   * empty array and return it.
   * @returns The data is being returned.
   */
  fetch() {
    const data_session: string | null = sessionStorage.getItem(this.SESSION_KEY)
    if (data_session !== '') {
      try {
        const data = this.encrypt.decrypt(data_session)
        if (data.toString().length > 1) Session.findData = true
        return data
      } catch (error) {
        this.save([])
      }
    } else this.save([])
  }

  /**
   * It saves the data to the session storage
   * @param data - The data to be saved.
   */
  save(data: Array<any>) {
    sessionStorage.setItem(this.SESSION_KEY, this.encrypt.encrypt(data))
  }
}

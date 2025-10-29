import CryptoJS from 'crypto-js'

const date = new Date()

export default class Encrypt {
  dynamicValue = `${date.getDay()}/${date.getMonth()}/${date.getUTCFullYear()}`
  privateKey = `${this.dynamicValue}_mascayiti`

  encrypt(data) {
    return encodeURIComponent(
      CryptoJS.AES.encrypt(JSON.stringify(data), this.privateKey).toString(),
    )
  }

  decrypt(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(
      decodeURIComponent(encryptedData),
      this.privateKey,
    )
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    return decryptedData
  }
}

import md5 from 'md5'
import { IAccount } from 'src/guard/interface/account.interface'
import slugify from 'slugify'
export const formatDate = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`
}

const getRandomNonce = (num: number) => {
  return Math.floor((Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, num - 1))
}

export function genSignEndPoint() {
  const keyToken = process.env.KEY_TOKEN
  const versionToken = 'v1'
  const headers: any = {}
  const stime = Date.now()
  const nonce = getRandomNonce(20).toString()

  headers.stime = stime
  headers.nonce = nonce

  const sortKeys: string[] = []
  for (const key in headers) {
    if (key !== 'sign') {
      sortKeys.push(key)
    }
  }
  sortKeys.sort()
  let headersString = ''
  sortKeys.forEach((key) => {
    headersString += key + headers[key]
  })

  const sign = md5(headersString + keyToken + versionToken).toString()

  return {
    sign: sign,
    version: versionToken,
    nonce: nonce,
    stime: stime.toString()
  }
}

export const buidByAccount = (account: IAccount) => {
  return JSON.stringify({
    email: account.account_email,
    id: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
  })
}


export const generateOtp = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000)
  return otp.toString()
}
export const generateSlug = (input: string): string => {
  // Chuyển chuỗi thành chữ thường và loại bỏ dấu tiếng Việt
  const slug = slugify(input, {
    replacement: '-', // replace spaces with replacement character, defaults to `-`
    remove: undefined, // remove characters that match regex, defaults to `undefined`
    lower: false, // convert to lower case, defaults to `false`
    strict: false, // strip special characters except replacement, defaults to `false`
    locale: 'vi', // language code of the locale to use
    trim: true // trim leading and trailing replacement chars, defaults to `true`
  })

  const uuid = generateOtp()

  return `${slug}-${uuid}.html`
}
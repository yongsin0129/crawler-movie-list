import * as puppeteer from 'puppeteer'
import * as dotenv from 'dotenv'
import axios from 'axios'
import FormData from 'form-data'

dotenv.config()

/********************************************************************************
*
          主程式
*
*********************************************************************************/
const webSiteURL = 'https://www.star-clicks.com/default'
;(async () => {
  const id = process.env.USER_ID as string
  const pwd = process.env.USER_PASSWORD as string

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 250,
    args: [`--window-size=1920,1080`]
    // devtools: true
  })
  const page: puppeteer.Page = await browser.newPage()
  let currentScreen = await page.evaluate(() => {
    return {
      width: window.screen.availWidth,
      height: window.screen.availHeight
    }
  })
  //設定預設網頁頁面大小
  console.log(currentScreen)
  await page.setViewport(currentScreen)

  /********************************************************************************
*
          // 正式進入目標網頁
*
*********************************************************************************/
  await page.goto(webSiteURL)

  // 等待主頁面並點擊登入
  await page.waitForSelector('a[href=login]')
  await page.click('a[href=login]')
  // await page.evaluate(() => {
  //   ;(document.querySelector('a[href=login]') as HTMLElement).click()
  // }) 這兩種都可以達到 click 的目的

  // 等待登入頁面並輸入登入資訊
  await delay(5000)
  await page.waitForSelector('[id=Password]')

  await page.evaluate(() => {
    ;(document.querySelector('[id=Email]')! as HTMLInputElement).value =
      'yongsin0129@gmail.com'
  })
  await page.type('input[id=Password]', pwd) // 因為開 window 後，吃不到 .env 的 pwd , 所以改用 page.type 來打

  // 抓取 captcha img 的 URL 呼叫 API 辨識數字後自動輸入
  const captchaURL = await page.evaluate(() => {
    return (document.querySelector('.imageclass')! as HTMLImageElement).src
  })
  const captchaValue: string = await getCaptchaValue(captchaURL)
  await page.type('input[maxlength="4"]', captchaValue)

  // await delay(5000) // 等待五秒時間，讓人手動輸入數字辨識
  await page.click('input[id=Button1_input]') // 點擊登入
  console.log('成功點擊登入')

  // 等待後台顯示並點擊廣告頁面
  await page.waitForSelector('a[href=ads]')
  await page.click('a[href=ads]')

  // 等待廣告頁面並點擊待點廣告
  // 這邊待優化，需要知道有多少廣告，點擊後需等待一段時間後關掉
  await page.waitForSelector('.panel-blue')
  await page.click('.panel-blue')
  console.log('成功進入後台點擊頁面')

  await delay(10000)

  await browser.close()
})()

/********************************************************************************
*
          helper
*
*********************************************************************************/
function delay (time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

// 以下兩種方式都可以做到等待
// console.log(new Date())
// await new Promise(r => setTimeout(r, 5000))
// console.log(new Date())
// await delay(5000)
// console.log(new Date())

async function getCaptchaValue (captchaURL: string): Promise<string> {
  const bodyFormData = new FormData()
  bodyFormData.append('image_url', captchaURL)

  const response = await axios.post(
    'http://172.105.214.31:8000/get_captcha',
    bodyFormData,
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    }
  )
  const captchaValue: string = response.data
  return captchaValue
}

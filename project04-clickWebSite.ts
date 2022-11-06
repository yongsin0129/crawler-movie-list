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
;(async () => {
  // ---------------- 需在同一個工作目錄下建立一個 .env 檔，載入自已的 ID ，PASSWORD
  const webSiteURL = process.env.WEBSITE_URL as string
  const id = process.env.USER_ID as string
  const pwd = process.env.USER_PASSWORD as string

  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=1920,1080`]
  })
  const page: puppeteer.Page = await browser.newPage()
  let currentScreen = await page.evaluate(() => {
    return {
      width: window.screen.availWidth,
      height: window.screen.availHeight
    }
  })
  //設定預設網頁頁面大小
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

  // 等待登入頁面並輸入登入資訊，因為載入頁面完成後會刷新 id 的 input , 所以先等五秒
  await delay(5000)
  await page.waitForSelector('[id=Password]')

  await page.evaluate(id => {
    ;(document.querySelector('[id=Email]')! as HTMLInputElement).value = id
  }, id)

  // 抓取 captcha img 的 URL 呼叫 API 辨識數字後自動輸入
  let isAiCorrect: boolean = false
  while (isAiCorrect === false) {
    // await page.type('input[id=Password]', pwd) // 因為開 window 後，吃不到 .env 的 pwd , 所以改用 page.type 來打
    await page.evaluate(pwd => {
      ;(document.querySelector(
        '[id=Password]'
      )! as HTMLInputElement).value = pwd
    }, pwd)

    const captchaURL = await page.evaluate(() => {
      return (document.querySelector('.imageclass')! as HTMLImageElement)?.src
    })
    console.log('發送數字辨識 API')
    const captchaValue: string = await getCaptchaValue(captchaURL)
    await page.type('input[maxlength="4"]', captchaValue)
    await page.click('input[id=Button1_input]') // 點擊登入
    console.log('成功點擊登入')
    await delay(8000)
    isAiCorrect = await isCaptchaValueRight(page)
    console.log(isAiCorrect)
  }

  // 等待後台顯示並點擊廣告頁面
  await page.waitForSelector('a[href=ads]')
  await page.click('a[href=ads]')
  console.log('成功點擊 a[href=ads]')

  // 等待廣告頁面並確認現有廣告數量 ， 接著點擊待點廣告
  await delay(5000)
  let numberOfAds = await page.evaluate(() => {
    return document.querySelectorAll('.panel-blue').length
  })
  console.log("numberOfAds : ", numberOfAds)

  while (numberOfAds !== 0) {
    await page.waitForSelector('.panel-blue')
    await page.click('.panel-blue')
    console.log(
      '成功進入後台點擊一個廣告頁面，需等待廣告加載後再確認剩餘廣告數...'
    )
    await delay(15000)
    numberOfAds = await page.evaluate(() => {
      return document.querySelectorAll('.panel-blue').length
    })
    console.log('還剩下 ', numberOfAds, ' 個廣告')
  }
  console.log('所有廣告已經點擊完畢，打完收工')

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

async function isCaptchaValueRight (page: puppeteer.Page): Promise<boolean> {
  const adHrefDOM = await page.evaluate(() => {
    return document.querySelector('a[href=ads]')
  })
  // 如果 廣告頁面的 [href=ads] 有值，代表 ai 輸入正確
  return adHrefDOM !== null

  // await page.evaluate(() => {
  //   const visibilityProperty = (document.querySelector(
  //     '[data-val-errormessage]'
  //   )! as HTMLElement)?.style?.visibility

  //   return visibilityProperty === 'hidden'
  // })
}

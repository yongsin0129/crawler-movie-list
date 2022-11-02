import puppeteer, { Page } from 'puppeteer'
import * as dotenv from 'dotenv'
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
  const page: Page = await browser.newPage()
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

  await page.waitForSelector('[id=Password]') // 等待登入頁面並輸入登入資訊
  // await page.waitForNetworkIdle({ idleTime: 1000}) 
  // 因為載入需要時間，本來想用 idle 等
  // 但後來有些 idle 造成的bug , 改用 pwd 用 page.type 來打
  await page.evaluate(() => {
    ;(document.querySelector('[id=Email]')! as HTMLInputElement).value =
      'yongsin0129@gmail.com'
  })
  await page.type('input[id=Password]', pwd)

  await page.waitForNetworkIdle({ idleTime: 3000 }) // 等待 三秒 讓人手動 key 數字辨識

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

  await page.waitForNetworkIdle({ idleTime: 10000 })

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

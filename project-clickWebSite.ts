import puppeteer, { Page } from 'puppeteer'

/********************************************************************************
*
          主程式
*
*********************************************************************************/
const webSiteURL = 'https://www.star-clicks.com/default'
;(async () => {
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

  await page.goto(webSiteURL)
  await page.waitForSelector('a[href=login]')

  await page.evaluate(() => {
    // 使用可以使用 browser 的方法
    (document.querySelector('a[href=login]') as HTMLElement).click()
  })

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

const puppeteer = require('puppeteer')

;(async () => {
  const config = {
    // 使用自訂的 Chrome
    executablePath:
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    headless: false // 無外殼的 Chrome，有更佳的效能
  }
  const browser = await puppeteer.launch(config)

  // const page = await browser.newPage()
  // await page.goto('https://example.com')
  // await page.screenshot({ path: 'example.png' })

  // await browser.close()

  const page = await browser.newPage() // 開啟新分頁
  await page.goto('https://www.google.com.tw') // 進入指定頁面
  // await page.waitFor(10000) // 等待十秒鐘
  await page.type('input[title="Google 搜尋"]', 'flex') // Google 搜尋特定項目
  await (await page.$('input[title="Google 搜尋"]')).press('Enter') // 特定元素上按下 Enter
  await page.waitFor(1000) // 等待一秒
  await page.waitForSelector('#gsr') // 確定網頁的元素出現
  await page.click(
    // 點擊網址中包含以下的連結...
    'a[href*="https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/flex"]'
  )

  // 接下來也可插入 await browser.close(); 關閉瀏覽器
})()

import { Category } from './class'
import { Page } from 'puppeteer'
// const puppeteer = require('puppeteer') 無法讀到 type
import puppeteer from 'puppeteer'
// const cheerio = require('cheerio') 無法讀到 type
import cheerio from 'cheerio'

/********************************************************************************
*
          主程式
*
*********************************************************************************/
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 250,
    args: [`--window-size=1920,1080`],
    devtools: true
  })

  const page: Page = await browser.newPage()
  console.log('成功啟動系統，開始進入網站...')

  await page.goto('https://www.cna.com.tw/')
  await page.waitForSelector('footer')
  console.log('成功進入網站，開始進行搜尋新聞分類...')

  let body: string = await page.content()
  let data: Array<Category> = await getCategory(body)
  saveToFile(data, '分類')
  console.log('成功搜尋新聞分類，開始進行各分類新聞收集...')
  await getCategorySubPost(data, page)

  await browser.close()
})()

/********************************************************************************
*
          自定義 fn
*
*********************************************************************************/
async function getCategory (body: string): Promise<Array<Category>> {
  let $ = await cheerio.load(body)
  let data: Array<Category> = []
  // 先將主要 menu 抓出來，再用 each 整理

  await $('ul.main-menu > li').each((i: number, el) => {
    //抓取類別，這裡其實抓的到子類別的名子和網址。但我們先把他忽略
    let name: string = $(el)
      .find('a.first-level')
      .text()
    let href: string = $(el)
      .find('a.first-level')
      .attr('href') as string
    if (name === '' && href === undefined) return
    let tmp = new Category(name, href)
    data.push(tmp)
  })
  return data
}

async function getCategorySubPost (data: Array<Category>, page: Page) {
  // 跳過 0 , 因為 0 是最新主題的頁面，content 的 html 邏輯跟大家不一樣
  // 如果是在 dev mode : data.length 會先用 2 取代
  for (let index = 1; index < data.length; index++) {
    const element = data[index]
    await page.goto(element.href)
    await page.waitForSelector('footer')

    let end = true
    while (end) {
      await autoScroll(page)
      // 等待幾秒不要一次抓太快，雖然這裡是已經預先載入了，不會增加server負擔 ，但能增加每頁切換的速度
      // 如果沒有上面的 scroll ，則需要另外等待秒數讓
      // await page.waitForTimeout(5000) or await new Promise(r => setTimeout(r, 5000))
      try {
        // 因為 cna 分類 "疫情" 的 lazy load 按鈕跟其他頁做的不一樣，所以用 if 分開
        if (element.name === '疫情') {
          await page.click('a.myCMoreNews.moreContent')
        } else {
          await page.click('.viewBtn.view-more-button.myViewMoreBtn')
          console.log(`點擊 ${element.name} 一次`)
        }
      } catch (error) {
        // 這邊有兩種處理法
        // 第一種，使用 puppeteer page.content() 爬取頁面全部資料，丟入 cheerio 處理
        let body: string = await page.content()
        await getPostContent(body, element.name)

        // 第二種，使用 puppeteer 的 eval 方法，進入 browser 內用 vanilla 的 dom 操作
        // const list = await evaluateTest(page)
        // console.log('getCategorySubPost ~ list', list)

        // 停止 while loop
        end = false
      }
    }
  }
}

async function getPostContent (body: any, categoryName: string) {
  let $ = await cheerio.load(body)
  let postContent: any[] = []

  const getHtml = await $('#jsMainList li').text()

  await $('#jsMainList li').each((i: number, el: any) => {
    const title: string = $(el)
      .find('div.listInfo h2 span')
      .text()

    const href: string = $(el)
      .find('a')
      .attr('href') as string

    const date: string = $(el)
      .find('div.date')
      .text()

    // 過濾廣告 : 檢查 href ，帶有 ww.cna 開頭的才是真正的新聞
    const isNotAdvertisement = href.toLowerCase().includes('www.cna')

    if (isNotAdvertisement) {
      postContent.push({ title, href, date })
    }
  })
  saveToFile(postContent, categoryName)
}

/********************************************************************************
*
          helper
*
*********************************************************************************/
function saveToFile (data: Array<Object>, fileName: string) {
  const fs = require('fs')
  const content = JSON.stringify(data) //轉換成json格式
  fs.writeFile(`${fileName}.json`, content, 'utf8', function (err: Error) {
    if (err) {
      return console.log(err)
    }
    console.log(`The file ${fileName} was saved!`)
  })
}

async function autoScroll (page: any) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0
      const distance = 1000
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer)
          resolve(null)
        }
      }, 100)
    })
  })
}

/********************************************************************************
*
          以下是測試寫法，不用在主程式中
*
*********************************************************************************/
async function evaluateTest (page: Page) {
  return page.evaluate(() => {
    let _array: Object[] = []
    let _array2: Object[] = []

    // debugger

    /********************************************************************************
    *
              node_list 才有 forEach , HTMLCollection 沒有

              註 執行迴圈時 ，item 類型為 Element 時，才有 querySelector 方法，如果是
              child_node 類型就不會有些方法。

              結論，要做迴圈整理時，要用 node_list !!不要用 htmlCollection or htmlElement.children 
    *
    *********************************************************************************/
    const mainList = document.querySelectorAll('#jsMainList > li')
    mainList.forEach(item => {
      const href = item.querySelector('a')?.href
      const title = item.querySelector('div.listInfo h2 span')?.innerHTML
      const date = item.querySelector('div.date')?.innerHTML
      _array.push({ href, title, date })
    })
    /********************************************************************************
    *
              將 node_list 丟入 array.from 使用
    *
    *********************************************************************************/
    // const mainList2 = Array.from(document.querySelectorAll('#jsMainList > li'))
    // mainList2.forEach(item => {
    //   const href = item.querySelector('a')?.href
    //   const title = item.querySelector('div.listInfo h2 span')?.innerHTML
    //   _array2.push({ href, title })
    // })

    return _array
  })
}

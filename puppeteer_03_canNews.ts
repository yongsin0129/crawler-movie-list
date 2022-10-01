import { Category } from './class'
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

/********************************************************************************
*
          主程式
*
*********************************************************************************/
;(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })

  const page = await browser.newPage()

  await page.goto('https://www.cna.com.tw/')
  await page.waitForSelector('footer')
  let body: string = await page.content()
  let data: Array<Category> = await getCategory(body)
  saveToFile(data, '分類')
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

  await $('ul.main-menu > li').each((i: number, el: any) => {
    //抓取類別，這裡其實抓的到子類別的名子和網址。但我們先把他忽略
    let name: string = $(el)
      .find('a.first-level')
      .text()
    let href: string = $(el)
      .find('a.first-level')
      .attr('href')
    if (name === '' && href === undefined) return
    let tmp = new Category(name, href)
    data.push(tmp)
  })
  return data
}

async function getCategorySubPost (data: Array<Category>, page: any) {
  // 跳過 0 , 因為 0 是'疫情'頁面，content 的 html 邏輯跟大家不一樣
  // dev mode data.length 先用 2 取代
  for (let index = 1; index < data.length; index++) {
    const element = data[index]
    await page.goto(element.href)
    await page.waitForSelector('footer')

    let end = true
    while (end) {
      await autoScroll(page)
      //等待幾秒不要一次抓太快，雖然這裡是已經預先載入了，不會增加server負擔 ，但能增加每頁切換的速度
      // 如果沒有上面的 scroll ，則需要另外等待秒數讓
      // await page.waitForTimeout(300)
      try {
        // 因為 cna 第一個分類 "疫情" 的 lazy load 按鈕跟其他頁做的不一樣，所以用 if 分開
        if (element.name === '疫情') {
          await page.click('a.myCMoreNews.moreContent')
        } else {
          await page.click('.viewBtn.view-more-button.myViewMoreBtn')
          console.log(`點擊 ${element.name} 一次`)
        }
      } catch (error) {
        let body: string = await page.content()
        await getPostContent(body, element.name)
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
    const title = $(el)
      .find('div.listInfo h2 span')
      .text()

    const href = $(el)
      .find('a')
      .attr('href')

    const date = $(el)
      .find('div.date')
      .text()

    postContent.push({ title, href, date })
  })
  saveToFile(postContent, categoryName)
}

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

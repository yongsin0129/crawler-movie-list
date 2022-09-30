const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
;(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })

  const page = await browser.newPage()
  await page.goto('https://www.cna.com.tw/')
  await page.waitForSelector('footer')
  let body: string = await page.content()
  let data: Array<Category> = await getCategory(body)
  await getCategorySubPost(data, page)

  saveToFile(data)

  await browser.close()
})()

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

function saveToFile (data: Array<Object>) {
  const fs = require('fs')
  const content = JSON.stringify(data) //轉換成json格式
  fs.writeFile('news.json', content, 'utf8', function (err: Error) {
    if (err) {
      return console.log(err)
    }
    console.log('The file was saved!')
  })
}

class Category {
  name: string
  href: string
  constructor (name: string, href: string) {
    this.name = name
    this.href = href
  }
}

async function getCategorySubPost (data: Array<Category>, page: any) {
  for (let index = 0; index < data.length; index++) {
    const element = data[index]
    await page.goto(element.href)
    await page.waitForSelector('footer')

    let end = true
    while (end) {
      try {
        //等待幾秒不要一次抓太快，雖然這裡是已經預先載入了，不會增加server負擔 ，但能增加每頁切換的速度
        await page.waitForTimeout(2000)
        // 因為 cna 第一個分類 "疫情" 的 lazy load 按鈕跟其他頁做的不一樣，所以用 if 分開
        if (index === 0) {
          await page.click('.myCMoreNews.moreContent')
        }
        await page.click('.viewBtn.view-more-button.myViewMoreBtn')
      } catch (error) {
        end = false
      }
    }
  }
}

const axios = require('axios').default
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

/********************************************************************************
*
          axios 
          
          類似 Request 一樣可做各種 HTML method 
*
*********************************************************************************/
// 取得 特定網站 的 response ，html 資料會放在 response.data
const response = await axios.get(URL)

/********************************************************************************
*
          cheerio 
          
          node.js 用的 jquery ，邏輯一模       
          官網　: https://cheerio.js.org/index.html   
*
*********************************************************************************/
// 將 html 格式丟入 load method ，再使用 $ 的各種方法
const $ = cheerio.load(response.data)

// 1. 用選擇器  ex : '.class' , '#id' , 'div' , 'div[boo="foo"]'
$('CSS Selector')

// 2. 對已經存在的 DOM 操作 , 記得不用在 字串符號 ！！ (時常忘記就加上了　！！！)
$(dom)

/*
  step1 : 
  $()選擇者不分 querySelector or SelectorAll 
  所以選擇完 可用 $().html() , .text() , length 確認選到的 dom

  step2 :
  如果 length 為 1 ，其他內容都在 dom 下一層，可用 children() 

  如果是 length 為 n 的 arrayLike ，可直接用 each((i,el)=>{ foo })

  實用方法 :
  $().find('selector'):DOM
  $().hasClass('class'):boolean
  DOM.attr('') 取得屬性
*/

/********************************************************************************
*
          puppeteer 
          
          邏輯與　selenium 很像，都是打開一個 browser ，模擬使用者對 browser 操作
          官網 : https://zhaoqize.github.io/puppeteer-api-zh_CN/#/
*
*********************************************************************************/
const config = {
  // 給指定的路徑　，　用於使用自訂的 Chrome
  executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  //false 會讓瀏覽器實際開啟  //true 會再後台開啟
  headless: false,
  // 慢動作 設定成 100 在 chrome 的 dev 中看不到 script , 用 250 才能看到
  slowMo: 250,
  // 設定 browser size
  args: [`--window-size=1920,1080`],
  // 打開 dev
  devtools: true
}

const browser = await puppeteer.launch(config)
const page = await browser.newPage()
await page.goto(url) // example :'https://www.cna.com.tw/' 
await page.waitForSelector('footer') // 可以觀察此網站最後的元素，確保所有元素都加載完畢

// 加載完畢後，有多種方式可爬資料
// 1. 使用 cheerio
let body = await page.content()
const $ = await cheerio.load(body)

// 2. 使用　puppeteer 的　evaluate 方法，這種方法會在 browser 端將程式碼帶入後再 return 回來
page.evaluate(()=>{
  // 使用可以使用 browser 的方法
})

page.$eval('CSS Selector',(dom)=>{
  // 可以使用 browser 的方法 
  // 另外也可以對 selector 選到的 dom 做操作
})
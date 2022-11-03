import puppeteer from 'puppeteer'
// const request = require('request')
import fs from 'fs'

const url: string = 'http://www.atmovies.com.tw/movie/new/'

  // 爬所有圖片網址
;(async () => {
  const config = {
    // 使用自訂的 Chrome
    // executablePath:
    //   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    headless: true, //false 會讓瀏覽器實際開啟  //true 會再後台開啟
    slowMo: 100
    // devtools: true
  }

  const browser = await puppeteer.launch(config)
  const page = await browser.newPage()
  console.log('成功啟動系統，開始進入網站...')
  // URL here
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  console.log('成功進入網站，開始搜尋本周新片...')

  /********************************************************************************
  *
            page.$$eval(selector, pageFunction[, ...args])
            使用 selector 抓到所有 movie 的資料 < nodeList >
            再使用 pageFunction 將參數帶入後用 vanilla JS 的 DOM 操作方法整理後 push 到 array 內
            最後再 return 這個 array 
  *
  *********************************************************************************/
  let movieListsDOM = await page.$$eval('.filmList', lists => {
    debugger

    let _array: Array<{ title: string; imgLink: string }> = []

    lists.forEach(item => {
      const title = item.querySelector('div a')!.innerHTML
      const imgLink = (item.querySelector('a img')! as HTMLImageElement).src
      _array.push({
        title,
        imgLink
      })
    })

    return _array
  })

  console.log('本周電影列表 : ', movieListsDOM)

  await browser.close()
})()


/********************************************************************************
*
          舊寫法筆記
*
*********************************************************************************/
// // 找所有圖片的 src
// let imageLink = await page.evaluate(() => {
//   const images = Array.from(document.querySelectorAll('img.filmListPoster'))
//   return images.map(img => img.src)
//   // .filter(img => img.includes('https:'))
// })

// console.log(imageLink)

// 找所有電影的 title
// let movieTitles = await page.evaluate(() => {
//   const tiles = Array.from(document.querySelectorAll('div.filmTitle a'))
//   return tiles.map(text => text.innerText)
// })

// console.log(movieTitles)

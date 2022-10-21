const axios = require('axios').default
import cheerio from 'cheerio'
// const cheerio = require('cheerio') 原寫法讀不到 type
// 注意 不使用 es6 的 import 無法自動帶出type - $: cheerio.Root
// 實驗 : 在 js 下用 require 可以讀到 type , 在 ts 下需用 import 
/********************************************************************************
*
          基礎參數
*
*********************************************************************************/
// 銀行匯率比較·匯率查詢·匯率換算 FindRate.TW
const url = 'https://www.findrate.tw/currency.php#.Y1DbLPzispQ'

/********************************************************************************
*
          main function  
*
*********************************************************************************/
main()

async function main () {
  const response = await axios.get(url)
  const $ = cheerio.load(response.data)

  // table 的欄位名稱
  const columnName: string[] = []
  // table 的內容 ， 用一個 array 包住所有幣別資料，每一種幣別資料都用一個 array 包住
  const columnContent: string[][] = []

  $('table tbody tr').each((i: number, el: cheerio.Element) => {
    // $().each 為一個 長度 20 的 arrayLike

    // i = 0 表示 table 第一行，欄位名稱
    if (i === 0) {
      $(el)
        .find('th')
        .each((i: number, el: cheerio.Element) => {
          columnName.push($(el).text())
        })
    }
    // i /= 0 為幣種匯率資料
    else {
      const tempArray: string[] = []
      // $(el).find('td) 是一個長度為 5 的 arrayLike
      $(el)
        .find('td')
        .each((i: number, el: cheerio.Element) => {
          // class =flag 為幣種名稱
          if ($(el).hasClass('flag')) {
            tempArray.push(
              $(el)
                .find('a')
                .text()
            )
          }
          // class = bank 為匯率最佳銀行
          else if ($(el).hasClass('bank')) {
            tempArray.push(
              $(el)
                .find('a')
                .text()
            )
          }
          // 其他沒有分類是分別是 : '現金買入', '現金賣出', '更新時間'
          else {
            tempArray.push($(el).text())
          }
        })
      columnContent.push(tempArray)
    }
  })
  console.log(columnName)
  console.log(columnContent)
}

/********************************************************************************
*

$('table tbody tr').length // 20個 tr 第一個為 title

<tr>
  <th width="15%">外幣</th>
  <th width="15%">最佳銀行</th>
  <th width="13%">現金買入</th>
  <th width="13%">現金賣出</th>
  <th width="15%">更新時間</th>
</tr>

<tr>
  <td class="flag">
    <img src="https://www.findrate.tw/img/USD.png" width="30" height="25" /><a href="/USD/">美 金</a>
  </td>
  <td class="bank"><a href="/bank/37/">高雄銀行</a></td>
  <td class="WordB">31.94500</td>
  <td class="WordB">32.34500</td>
  <td class="WordB">2022-10-20 01:40</td>
</tr>
.
.
.

*
*********************************************************************************/

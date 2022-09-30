const axios = require('axios').default
const cheerio = require('cheerio')

async function getHTML () {
  /********************************************************************************
  *
            自定義屬性 URL
  *
  *********************************************************************************/
  const URL = 'http://www.atmovies.com.tw/movie/new/'

  /********************************************************************************
  *
            執行方法
  *
  *********************************************************************************/

  try {
    const response = await axios.get(URL) // response.data 為網站 HTML 的全部資料
    const $ = cheerio.load(response.data)

    const movieList = []

    // 因為 nodeJs 沒有 document ，所以不能使用 querySector ，需使用 cheerio 的 method
    $('.filmList').each((i, el) => {
      // 這邊的 $(el) 不需要再寫成 $('el')
      const movieTile = $(el)
        .find('div a')
        .text()

      const movieImage = $(el)
        .find('a img')
        .attr('src')

      const moiveDescription = $(el)
        .find('p')
        .text()

      movieList.push({ movieTile, movieImage, moiveDescription })
    })

    console.log(movieList)
  } catch (error) {
    console.error(error)
  }
}

/********************************************************************************
  *
            執行區塊
  *
  *********************************************************************************/
getHTML()

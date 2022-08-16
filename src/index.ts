'use strict'
// HTTP server
import puppeteer from "puppeteer"
const app = require("express")()

// exposing API endpoint
// response sends back a short json
app.get("/", (req, res) => {
  //res.json({ message: "testing docker" })

  (async () => {
    try {
      const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: [ '--disable-extensions' ], ignoreHTTPSErrors: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()
      await page.goto('https://www.sreality.cz/en/search/for-sale/houses')
      /*page.on("dialog", async dialog => {
        console.log(dialog.message())
        console.log("DIALOG")
        await dialog.dismiss()
      })*/
  
      /*const result = await page.evaluate(() => {
        const ads = Array.from(document.querySelectorAll("div.dir-property-list div.property.ng-scope"))
        return ads.map((ad, i) => {
          return {
            index: i,
            title: ad.querySelector("span.locality.ng-binding").innerHTML,
            imgUrl: ad.querySelector("a._2vc3VMce92XEJFrv8_jaeN img").getAttribute("src")
          }
        })
      })*/
  
      let currentPage: number = 1
      let lastPage: number = 25
      let data: any = []
  
      //console.log("CLICK I AGREE")
  
  
      /*await page.waitForSelector(".scmp-btn")[1]
      await page.click(".scmp-btn")[1]*/
  
      /*const input = await $(page, `szn-cmp-dialog-container::class(scmp-btn)`);
      if (input) await input.click()*/
  
      /*await page.waitForSelector("shadow/.scmp-btn")
      const btn = await page.$("shadow/.scmp-btn")
      await btn.click()*/
  
      const results = await page.evaluate(() => {
        let ads = []
        let adsDiv = document.querySelectorAll("div.dir-property-list div.property.ng-scope")
        adsDiv.forEach((ad, i) => {
          ads.push({
            //page: 1,
            index: i,
            title: ad.querySelector("span.locality.ng-binding").innerHTML,
            imgUrl: ad.querySelector("a._2vc3VMce92XEJFrv8_jaeN img").getAttribute("src")
          })
        })
        return ads
      })
      data = data.concat(results)

      // go through pages 2-25 and scrape all ads on each page
      for (let i = 2; i <= 25; i++) {
        await page.goto('https://www.sreality.cz/en/search/for-sale/houses?page=' + i)
  
        await page.waitForSelector("div.dir-property-list div.property.ng-scope")
  
        const results = await page.evaluate(() => {
          let ads = []
          let adsDiv = document.querySelectorAll("div.dir-property-list div.property.ng-scope")
          adsDiv.forEach((ad, i) => {
            ads.push({
              index: i,
              title: ad.querySelector("span.locality.ng-binding").innerHTML,
              imgUrl: ad.querySelector("a._2vc3VMce92XEJFrv8_jaeN img").getAttribute("src")
            })
          })
          return ads
        })
        data = data.concat(results)
      }
      console.table(data)
      res.json({ scraped: data })
  
      //await browser.close()
    } catch (err) {
      console.error(err)
    }
  })();
  //res.json({ message: "testing docker" })
})

// exposing app using the port environment variable
const PORT = process.env.PORT || 8080

app.listen(PORT, () => console.log(`app listening on http://localhost:${PORT}`))




/*
import axios from 'axios'
import cheerio from 'cheerio'

const url = 'https://www.sreality.cz/en/search/for-sale/houses'; // URL we're scraping
const AxiosInstance = axios.create();

// ad data structure
interface AdData {
    title: string;
    imageUrl: string;
}
  
// Send an async HTTP Get request to the url
AxiosInstance.get(url)
    .then( // Once we have data returned ...
      async response => {
        const html = await response.data; // Get the HTML from the HTTP request
        const $ = cheerio.load(html); // Load the HTML string into cheerio
        const adsDiv: cheerio.Cheerio = $('div'); // Parse the HTML and extract just whatever code contains .statsTableContainer and has tr inside
        const ads: AdData[] = [];

        console.log(html)

        //console.log(html)

        adsDiv.each((i, ad) => {
            let title: string = $(ad).find('locality.ng-binding > span').text();
            console.log(title)
            let imageUrl: string = $(ad).find('img').text();
            ads.push({
                title,
                imageUrl
            })
        })

        console.log(ads)
      }
    )
    .catch(console.error); // Error handling


/*

import axios from 'axios';
import cheerio from 'cheerio';

const url = 'https://www.premierleague.com/stats/top/players/goals?se=-1&cl=-1&iso=-1&po=-1?se=-1'; // URL we're scraping
const AxiosInstance = axios.create(); // Create a new Axios Instance

// This is the structure of the player data we recieve
interface PlayerData {
  rank: number; // 1 - 20 rank
  name: string;
  nationality: string;
  goals: number;
}

// Send an async HTTP Get request to the url
AxiosInstance.get(url)
  .then( // Once we have data returned ...
    response => {
      const html = response.data; // Get the HTML from the HTTP request
      const $ = cheerio.load(html); // Load the HTML string into cheerio
      const statsTable = $('.statsTableContainer > tr'); // Parse the HTML and extract just whatever code contains .statsTableContainer and has tr inside
      const topScorers: PlayerData[] = [];

      statsTable.each((i, elem) => {
        const rank: number = parseInt($(elem).find('.rank > strong').text()); // Parse the rank
        const name: string = $(elem).find('.playerName > strong').text(); // Parse the name
        const nationality: string = $(elem).find('.playerCountry').text(); // Parse the country
        const goals: number = parseInt($(elem).find('.mainStat').text()); // Parse the number of goals
        topScorers.push({
          rank,
          name,
          nationality,
          goals
        })
      })

      console.log(topScorers);
    }
  )
  .catch(console.error); // Error handling
*/

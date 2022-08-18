'use strict'

import puppeteer from "puppeteer"   // for web scraping dynamic pages
const app = require("express")()    // for implementing HTTP server
import { Pool, Client } from "pg"   // for connecting to the Postgres database

// database config object
const pool = new Pool({
  user: "myuser",
  password: "mypassword",
  host: "db",
  database: "mydb",
  port: 5432
})

// CSS for displayed ads
const styling = "<head><style>" + 
".ads, .pagination { padding: 10px; text-align: center; }" +
".pagination { border: 5px solid #00A6FF; border-radius: 35px; background-color: #AAE1FF; }" +
".ad { display: inline-block; border: 5px solid #5BC5FF; border-radius: 10px; margin: 10px; background-color: #AAE1FF; transition: all 0.3s ease 0s; }" + 
".ad:hover { transform: scale(1.07); }" +
"h2, img { margin: auto; padding: 10px; }" + 
".pagination a { color: black; padding: 10px; text-decoration: none; font-size: 30px; font-weight: bold; }" +
".pagination a:hover { background-color: #00A6FF; }" + 
".pagination a.prev-next { padding-left: 20px; padding-right: 20px; font-size: 20px; }" +
"</style></head>"


// exposing API endpoint
// response sends back html page
app.get("/", (req: any, res: { send: (arg0: string) => void }) => {

  (async () => {
    try {
      // directing to the page we want to scrape
      const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: [ '--disable-extensions' ], ignoreHTTPSErrors: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()
      await page.goto('https://www.sreality.cz/en/search/for-sale/houses')

      // scraped ads will get stored in here
      let data: any = []
  
      // get ads by their html div selectors
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
      // concatenate results
      data = data.concat(results)

      // go through next 4 pages and scrape all ads
      for (let i = 2; i <= 5; i++) {
        await page.goto('https://www.sreality.cz/en/search/for-sale/houses?page=' + i)
  
        // wait until all ads on the page have been loaded
        await page.waitForSelector("div.dir-property-list div.property.ng-scope")
  
        // get ads by selectors again
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

      // display all scraped results in a table
      console.table(data)



      // create table structure
      console.log("CREATING TABLE...")
      pool.query("CREATE TABLE IF NOT EXISTS ads ( id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, img_url VARCHAR(255) NOT NULL );").catch(err => console.log(err))
      
      // clean up database before further work
      console.log("DELETING DATA...")
      pool.query("DELETE FROM ads;").catch(err => console.log(err))

      // insert scraped ads
      console.log("INSERTING DATA...")
      data.forEach((ad: { index: string; title: string; imgUrl: string }) => {
        pool.query("INSERT INTO ads (title, img_url) VALUES ('" + ad.title + "', '" + ad.imgUrl + "');").catch(err => console.log(err))
      })

      // fetch all saved ads
      console.log("FETCHING DATA...")
      pool.query("SELECT * FROM ads ORDER BY id ASC;", (err, res) => {
        if (!err) {
          console.log(res.rows)
          console.log("\nNUMBER OF ROWS:")
          console.log(res.rows.length)
        }
        else {
          console.log(err.message)
        }
      })


      // displaying HTML
      let htmlPage = styling
      htmlPage += '<body><div class="ads">'
      data.forEach((ad: { title: string; imgUrl: string}, i: number) => {
        htmlPage += `<div class="ad"><h2>${i} - ${ad.title}</h2><img src="${ad.imgUrl}"></div>`
      })
      htmlPage += '</div><div class="pagination"> <a class="prev-next">PREVIOUS</a> <a href="/">1</a> <a href="/page=2">2</a> <a href="/page=3">3</a> <a href="/page=4">4</a> <a href="/page=5">5</a> <a class="prev-next" href="/page=2">NEXT</a> </div>'

      // send response
      res.send(htmlPage)
  
      //await browser.close()
    } catch (err) {
      console.error(err)
    }
  })();
})

app.get("/page=2", (req: any, res: { send: (arg0: string) => void }) => {
  (async () => {
    try {
      const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: [ '--disable-extensions' ], ignoreHTTPSErrors: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()

      let data: any = []
  
      // go through pages 2-25 and scrape all ads on each page
      for (let i = 6; i <= 10; i++) {
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

      

      // create table structure
      console.log("CREATING TABLE...")
      pool.query("CREATE TABLE IF NOT EXISTS ads ( id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, img_url VARCHAR(255) NOT NULL );").catch(err => console.log(err))
      
      // clean up database before further work
      console.log("DELETING DATA...")
      pool.query("DELETE FROM ads;").catch(err => console.log(err))

      // insert scraped ads
      console.log("INSERTING DATA...")
      data.forEach((ad: { index: string; title: string; imgUrl: string }) => {
        pool.query("INSERT INTO ads (title, img_url) VALUES ('" + ad.title + "', '" + ad.imgUrl + "');").catch(err => console.log(err))
      })

      // fetch all saved ads
      console.log("FETCHING DATA...")
      pool.query("SELECT * FROM ads ORDER BY id ASC;", (err, res) => {
        if (!err) {
          console.log(res.rows)
          console.log("\nNUMBER OF ROWS:")
          console.log(res.rows.length)
        }
        else {
          console.log(err.message)
        }
      })


      // displaying HTML
      let htmlPage = styling
      htmlPage += '<body><div class="ads">'
      data.forEach((ad: { title: string; imgUrl: string}, i: number) => {
        htmlPage += `<div class="ad"><h2>${i} - ${ad.title}</h2><img src="${ad.imgUrl}"></div>`
      })      
      htmlPage += '</div><div class="pagination"> <a class="prev-next" href="/">PREVIOUS</a> <a href="/">1</a> <a href="/page=2">2</a> <a href="/page=3">3</a> <a href="/page=4">4</a> <a href="/page=5">5</a> <a class="prev-next" href="/page=3">NEXT</a> </div>'
      
      res.send(htmlPage)

    } catch (err) {
      console.error(err)
    }
  })();
})

app.get("/page=3", (req: any, res: { send: (arg0: string) => void }) => {
  (async () => {
    try {
      const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: [ '--disable-extensions' ], ignoreHTTPSErrors: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()

      let data: any = []
  
      // go through pages 2-25 and scrape all ads on each page
      for (let i = 11; i <= 15; i++) {
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



      // create table structure
      console.log("CREATING TABLE...")
      pool.query("CREATE TABLE IF NOT EXISTS ads ( id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, img_url VARCHAR(255) NOT NULL );").catch(err => console.log(err))
      
      // clean up database before further work
      console.log("DELETING DATA...")
      pool.query("DELETE FROM ads;").catch(err => console.log(err))

      // insert scraped ads
      console.log("INSERTING DATA...")
      data.forEach((ad: { index: string; title: string; imgUrl: string }) => {
        pool.query("INSERT INTO ads (title, img_url) VALUES ('" + ad.title + "', '" + ad.imgUrl + "');").catch(err => console.log(err))
      })

      // fetch all saved ads
      console.log("FETCHING DATA...")
      pool.query("SELECT * FROM ads ORDER BY id ASC;", (err, res) => {
        if (!err) {
          console.log(res.rows)
          console.log("\nNUMBER OF ROWS:")
          console.log(res.rows.length)
        }
        else {
          console.log(err.message)
        }
      })


      // displaying HTML
      let htmlPage = styling
      htmlPage += '<body><div class="ads">'
      data.forEach((ad: { title: string; imgUrl: string}, i: number) => {
        htmlPage += `<div class="ad"><h2>${i} - ${ad.title}</h2><img src="${ad.imgUrl}"></div>`
      })
      htmlPage += '</div><div class="pagination"> <a class="prev-next" href="/page=2">PREVIOUS</a> <a href="/">1</a> <a href="/page=2">2</a> <a href="/page=3">3</a> <a href="/page=4">4</a> <a href="/page=5">5</a> <a class="prev-next" href="/page=4">NEXT</a> </div>'
      
      res.send(htmlPage)

    } catch (err) {
      console.error(err)
    }
  })();
})

app.get("/page=4", (req: any, res: { send: (arg0: string) => void }) => {
  (async () => {
    try {
      const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: [ '--disable-extensions' ], ignoreHTTPSErrors: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()

      let data: any = []
  
      // go through pages 2-25 and scrape all ads on each page
      for (let i = 16; i <= 20; i++) {
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



      // create table structure
      console.log("CREATING TABLE...")
      pool.query("CREATE TABLE IF NOT EXISTS ads ( id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, img_url VARCHAR(255) NOT NULL );").catch(err => console.log(err))
      
      // clean up database before further work
      console.log("DELETING DATA...")
      pool.query("DELETE FROM ads;").catch(err => console.log(err))

      // insert scraped ads
      console.log("INSERTING DATA...")
      data.forEach((ad: { index: string; title: string; imgUrl: string }) => {
        pool.query("INSERT INTO ads (title, img_url) VALUES ('" + ad.title + "', '" + ad.imgUrl + "');").catch(err => console.log(err))
      })

      // fetch all saved ads
      console.log("FETCHING DATA...")
      pool.query("SELECT * FROM ads ORDER BY id ASC;", (err, res) => {
        if (!err) {
          console.log(res.rows)
          console.log("\nNUMBER OF ROWS:")
          console.log(res.rows.length)
        }
        else {
          console.log(err.message)
        }
      })


      // displaying HTML
      let htmlPage = styling
      htmlPage += '<body><div class="ads">'
      data.forEach((ad: { title: string; imgUrl: string}, i: number) => {
        htmlPage += `<div class="ad"><h2>${i} - ${ad.title}</h2><img src="${ad.imgUrl}"></div>`
      })
      htmlPage += '</div><div class="pagination"> <a class="prev-next" href="/page=3">PREVIOUS</a> <a href="/">1</a> <a href="/page=2">2</a> <a href="/page=3">3</a> <a href="/page=4">4</a> <a href="/page=5">5</a> <a class="prev-next" href="/page=5">NEXT</a> </div>'
      
      res.send(htmlPage)

    } catch (err) {
      console.error(err)
    }
  })();
})

app.get("/page=5", (req: any, res: { send: (arg0: string) => void }) => {
  (async () => {
    try {
      const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: [ '--disable-extensions' ], ignoreHTTPSErrors: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()

      let data: any = []
  
      // go through pages 2-25 and scrape all ads on each page
      for (let i = 21; i <= 25; i++) {
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



      // create table structure
      console.log("CREATING TABLE...")
      pool.query("CREATE TABLE IF NOT EXISTS ads ( id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, img_url VARCHAR(255) NOT NULL );").catch(err => console.log(err))
      
      // clean up database before further work
      console.log("DELETING DATA...")
      pool.query("DELETE FROM ads;").catch(err => console.log(err))

      // insert scraped ads
      console.log("INSERTING DATA...")
      data.forEach((ad: { index: string; title: string; imgUrl: string }) => {
        pool.query("INSERT INTO ads (title, img_url) VALUES ('" + ad.title + "', '" + ad.imgUrl + "');").catch(err => console.log(err))
      })

      // fetch all saved ads
      console.log("FETCHING DATA...")
      pool.query("SELECT * FROM ads ORDER BY id ASC;", (err, res) => {
        if (!err) {
          console.log(res.rows)
          console.log("\nNUMBER OF ROWS:")
          console.log(res.rows.length)
        }
        else {
          console.log(err.message)
        }
      })
      

      // displaying HTML
      let htmlPage = styling
      htmlPage += '<body><div class="ads">'
      data.forEach((ad: { title: string; imgUrl: string}, i: number) => {
        htmlPage += `<div class="ad"><h2>${i} - ${ad.title}</h2><img src="${ad.imgUrl}"></div>`
      })
      htmlPage += '</div><div class="pagination"> <a class="prev-next" href="/page=4">PREVIOUS</a> <a href="/">1</a> <a href="/page=2">2</a> <a href="/page=3">3</a> <a href="/page=4">4</a> <a href="/page=5">5</a> <a class="prev-next">NEXT</a> </div>'
      
      res.send(htmlPage)

    } catch (err) {
      console.error(err)
    }
  })();
})


// exposing app using the port environment variable
const PORT = process.env.PORT || 8080

app.listen(PORT, () => console.log(`app listening on http://localhost:${PORT}`))
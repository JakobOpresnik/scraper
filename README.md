# DYNAMIC WEB SCRAPER

This web scraper scrapes first 500 ads from [this link](https://www.sreality.cz/en/search/for-sale/houses), saves them to a Postgres database and then displays them on an HTML page with pagination.

The entire project is bound to a single docker compose command for your convenience.

## Technologies used
- Typescript
- NodeJS
- Express
- Puppeteer
- Postgres database
- Docker

## Prerequisites
- Docker installed (Linux containers)
- WSL enabled

## How to get it running

Simply clone the repository, then run `docker-compose up -d` to create 2 images (Postgres & scraper). Within the `docker-compose.yml` file are specified the credentials for the database and the port for the scraper (8080). The file automatically builds 2 images - Postgres is a prebuild and officially maintained Docker image, while the scraper image is built using the current working directory.

The Dockerfile automatically runs `npm install` command which should generate `node_modules` directory with all necessary node packages.

The file `src/index.ts` includes a simple HTTP server implemented using NodeJS and Express, which exposes 5 endpoints on 5 different localhost URLS in order to accomplish pagination.

After the command finishes setting up the images and containers, you can view the scraped ads [here](http://localhost:8080).

<b>DISCLAIMER</b>: it may take up to 10 seconds to load the HTML page as the scraper has to scrape 100 ads for every page (my pagination provides 5 pages), which takes a bit as it is iterating through 5 pages from the original website and waiting for all ads to load before scraping and moving on to the next page.

This project was implemented using a WSL (Windows Subsystem for Linux - Ubuntu version 22.04) and should also be run on that same platform, otherwise some commands in the Dockerfile will not run.
import { Page } from "puppeteer"

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const getPage = ({ pages, url }: { pages: Page[]; url: string }) => {
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index]

    if (page.url() === url) {
      return page
    }
  }

  return false
}

const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export { sleep, getPage, randomNumber }

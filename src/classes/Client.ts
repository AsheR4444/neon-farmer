import puppeteer, { Browser } from "puppeteer"

import { Wallet } from "./Wallet"
import { Client as ChainClient } from "../eth-async/client"

import { PHATOM_PATH, RABBY_PATH } from "../helpers/const"
import { Networks } from "../eth-async/data/models"

type AccountType = {
  name: string
  solPk: string
  evmPk: string
  proxy: string
}

class Client {
  name: string
  solPk: string
  evmPk: string
  proxy: string
  wallet: Wallet
  chainClient: ChainClient

  constructor({ proxy, name, evmPk, solPk }: AccountType) {
    this.name = name
    this.solPk = solPk
    this.evmPk = evmPk
    this.proxy = proxy
    this.wallet = new Wallet(this)
    this.chainClient = new ChainClient(evmPk, Networks.Neon, proxy, false)
  }

  getProxyData() {
    const proxyWithoutType = this.proxy.split("://")[1]
    const credentials = proxyWithoutType.split("@")[0]
    const proxyBase = proxyWithoutType.split("@")[1]
    const protocol = this.proxy.split("://")[0]
    const host = proxyBase.split(":")[0]
    const port = proxyBase.split(":")[1]
    const username = credentials.split(":")[0]
    const password = credentials.split(":")[1]

    return { protocol, host, port, username, password }
  }

  async registerNeonCampaign(browser: Browser) {
    const defaultPages = await browser.pages()

    const page = defaultPages[0]

    await page.setViewport(null)

    await page.goto("https://points.absinthe.network/neon/start")

    const termsCheckbox = page.locator("text/I have read and agree to the Terms & Conditions.")

    if (!!termsCheckbox) {
      await page.click('input[type="checkbox"]')

      await page.click("text/Continue")
      await page.waitForSelector("text/Connect Wallet")
      await page.click("text/Connect Wallet")
      await page.waitForSelector("text/EVM Wallet")
      await page.click("text/EVM Wallets")
    }
  }

  async startBrowser(): Promise<Browser> {
    const { protocol, host, port, username, password } = this.getProxyData()

    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--proxy-server=${protocol}://${host}:${port}`,
        `--disable-extensions-except=${PHATOM_PATH},${RABBY_PATH}`,
        `--load-extension=${PHATOM_PATH}, ${RABBY_PATH}`,
      ],
    })

    const page = (await browser.pages())[0]
    await page.authenticate({
      username,
      password,
    })

    return browser
  }
}

export { Client }

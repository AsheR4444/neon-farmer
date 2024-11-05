import { Browser, Page } from "puppeteer"
import { Client } from "./Client"

import { sleep } from "../helpers"
import { RetryDecorator } from "../decorators"
import { Token } from "../helpers/tokens"
import { Network } from "ethers"
import { Networks } from "../eth-async/data/models"

const DEFAULT_PASSWORD = "Qwerty123!"

class Wallet {
  client: Client

  constructor(client: Client) {
    this.client = client
  }

  @RetryDecorator()
  async phantomLogin(browser: Browser) {
    const page = (await browser.pages())[0]
    await page.bringToFront()
    await page.goto("chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/onboarding.html")

    await page.waitForSelector("text/У меня уже есть кошелек")
    await page.click("text/У меня уже есть кошелек")

    await page.waitForSelector("text/Импортировать приватный ключ")
    await page.click("text/Импортировать приватный ключ")

    await page.waitForSelector('input[name="name"]')
    await page.type('input[name="name"]', "Test")

    await page.type('textarea[name="privateKey"]', this.client.solPk)
    await page.click("text/Импортировать")

    await page.waitForSelector('input[name="password"]')
    await page.type('input[name="password"]', DEFAULT_PASSWORD)
    await page.type('input[name="confirmPassword"]', DEFAULT_PASSWORD)

    await page.click('input[data-testid="onboarding-form-terms-of-service-checkbox"]')

    await page.click("text/Продолжить")

    try {
      await page.waitForSelector("text/Всё готово!")
      await page.goto("about:blank")
    } catch (e) {
      console.log(e)
    }
  }

  @RetryDecorator()
  async rabbyLogin(browser: Browser) {
    const page = (await browser.pages())[0]
    await page.bringToFront()

    await page.goto("chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/popup.html#/welcome")

    await page.waitForSelector("text/Next")
    await page.click("text/Next")

    await page.waitForSelector("text/Get Started")
    await page.click("text/Get Started")

    await page.waitForSelector("text/Import Private Key")
    await page.click("text/Import Private Key")

    await page.waitForSelector("input[id='password']")
    await page.type("input[id='password']", DEFAULT_PASSWORD)
    await page.type("input[id='confirmPassword']", DEFAULT_PASSWORD)

    await page.click("text/Next")

    await page.waitForSelector("input[id='key']", { timeout: 4000 })
    await page.type("input[id='key']", this.client.evmPk)
    await page.click("text/Confirm")

    await page.waitForSelector("text/Done")
    await page.click("text/Done")

    await this.addNeonNetwork(browser)
  }

  @RetryDecorator()
  static async flipRabby(browser: Browser) {
    const page = await browser.newPage()
    await page.setViewport(null)
    await page.goto("chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/popup.html#/dashboard")
    let flip

    while (!flip) {
      try {
        flip = await page.waitForSelector("text/Flip", { timeout: 2000 })
      } catch (e) {
        console.log("не нашли флип")
      }
      await sleep(2000)
      try {
        flip = await page.waitForSelector("text/Flip", { timeout: 2000 })
      } catch (e) {
        console.log("не нашли флип")
      }
      await page.reload()
    }

    let isRabbyDefault

    try {
      await page.waitForSelector(".rabby-default-wallet-setting.is-metamask", { timeout: 1000 })
      isRabbyDefault = false
    } catch (e) {
      isRabbyDefault = true
    }

    while (!isRabbyDefault) {
      await page.click("a[href='#']")
      await sleep(1000)

      try {
        await page.waitForSelector(".rabby-default-wallet-setting.is-metamask", { timeout: 1000 })
        isRabbyDefault = false
      } catch (e) {
        isRabbyDefault = true
      }
    }

    await page.close()
  }

  @RetryDecorator()
  private async addNeonNetwork(browser: Browser) {
    const page = (await browser.pages())[0]

    await page.goto("chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/popup.html#/custom-testnet")

    await page.waitForSelector("text/Add Custom Network")
    await page.click("text/Add Custom Network")
    await page.waitForSelector("input[id='id']")
    await page.type("input[id='id']", Networks.Neon.chainId.toString())
    await page.type("input[id='name']", Networks.Neon.name)
    await page.type("input[id='rpcUrl']", Networks.Neon.rpc)
    await page.type("input[id='nativeTokenSymbol']", Networks.Neon.coinSymbol)
    await page.type("input[id='scanLink']", Networks.Neon.explorer)
    await page.click("text/Confirm")
  }

  static async unlockPhantom(page: Page) {
    await page.waitForSelector("input[data-testid='unlock-form-password-input']")
    await page.type("input[data-testid='unlock-form-password-input']", DEFAULT_PASSWORD)
    await sleep(1000)
    await page.click("text/Разблокировать")
    await page.waitForSelector("text/Подключить")
    await sleep(5000)
  }

  static async connectPhantom(browser: Browser) {
    // 'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/popup.html'
    const target = await browser.waitForTarget((target) => target.url().endsWith("notification.html"), {
      timeout: 3000,
    })
    const page = await target.asPage()

    const isUnlockPage = async () => {
      return await page.evaluate(() => !!document.querySelector("input[data-testid='unlock-form-password-input"))
    }

    if (await isUnlockPage()) {
      await Wallet.unlockPhantom(page)
    }

    await page.evaluate(() => {
      let connectButtonFound = false

      document.querySelectorAll("button").forEach((button) => {
        if (button.innerText === "Подключить") {
          console.log("нашли кнопку подключить")
          button.click()
          connectButtonFound = true
        }
      })

      if (!connectButtonFound) {
        window.close()
        throw new Error("Не удалось разблокировать или подтвердить кошелёк")
      }
    })
  }

  static async confirmTransactionPhantom(browser: Browser) {
    const target = await browser.waitForTarget((target) => target.url().endsWith("notification.html"))
    const page = await target.asPage()

    const isUnlockPage = async () => {
      return await page.evaluate(() => !!document.querySelector("input[data-testid='unlock-form-password-input"))
    }

    if (await isUnlockPage()) {
      await Wallet.unlockPhantom(page)
    }

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"))
      let buttonFound = false

      buttons.forEach((button) => {
        if (button.innerText === "Подтвердить" && !button.disabled) {
          button.click()
          buttonFound = true
        }
      })

      if (!buttonFound) {
        window.close()
        throw new Error("Button 'Подтвердить' not found")
      }
    })
  }

  async getBalance(token?: Token) {
    if (!token) {
      const balance = Number((await this.client.chainClient.wallet.balance()).Wei)

      return balance / 10 ** 18
    }

    const balance = Number((await this.client.chainClient.wallet.balance(token.contract)).Wei)

    return balance / 10 ** token.decimals
  }
}

export { Wallet }

import { randomNumber } from "."
import { getWallet } from "./wallet"

const addRandomHours = (): Date => {
  const hoursToAdd = randomNumber(8, 12)
  const now = new Date()
  now.setHours(now.getHours() + hoursToAdd)

  return now
}

const updateNextActionTime = async (privateKey: string) => {
  const wallet = await getWallet(privateKey)

  if (wallet) {
    wallet.nextActionDate = addRandomHours()
    await wallet.save()
  }
}

export default updateNextActionTime

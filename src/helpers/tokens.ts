class Token {
  name: string
  contract: string
  decimals: number

  constructor({ name, contract, decimals }) {
    this.name = name
    this.contract = contract
    this.decimals = decimals
  }
}

class Tokens {
  static UsdtNeon = new Token({ name: "USDT", contract: "0xc0E49f8C615d3d4c245970F6Dc528E4A47d69a44", decimals: 18 })
  static UsdcNeon = new Token({ name: "USDC", contract: "0xEA6B04272f9f62F997F666F07D3a974134f7FFb9", decimals: 6 })
  static SolNeon = new Token({ name: "SOL", contract: "0x5f38248f339Bf4e84A2caf4e4c0552862dC9F82a", decimals: 9 })
  static WrappedNeon = new Token({
    name: "WNEON",
    contract: "0x202C35e517Fa803B537565c40F0a6965D7204609",
    decimals: 18,
  })
  static IceNeon = new Token({
    name: "ICE",
    contract: "0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f",
    decimals: 18,
  })
  static Neon = new Token({
    name: "Neon",
    contract: "neon",
    decimals: 18,
  })

  static allTokens = Object.values(Tokens).filter((token) => token instanceof Token)
}

export { Tokens, Token }

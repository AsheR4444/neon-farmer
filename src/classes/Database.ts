import {
  Sequelize,
  QueryTypes,
  Transaction,
  WhereOptions,
  Model,
  ModelStatic,
  ModelAttributes,
  FindOptions,
  Attributes,
} from "sequelize"
import { DB_PATH } from "../helpers/const"
import { Wallet } from "../helpers/wallet"

class DB {
  sequelize: Sequelize
  models = {}

  private transaction: Transaction | null = null

  constructor(dbUrl) {
    this.sequelize = new Sequelize(dbUrl, {
      dialect: "sqlite",
      storage: DB_PATH,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        sqliteOptions: { checkSameThread: false },
      },
    })
  }

  async createTables() {
    await this.sequelize.sync()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defineModel(name: string, attributes: ModelAttributes<Model<any, any>>): ModelStatic<Model> {
    this.models[name] = this.sequelize.define(name, attributes, {
      freezeTableName: true,
      updatedAt: false,
      createdAt: false,
    })

    return this.models[name]
  }

  async all(modelName, criteria: FindOptions<Attributes<Wallet>> = {}) {
    return await this.models[modelName].findAll({ where: criteria })
  }

  async one(modelName, criteria: WhereOptions<Wallet> = {}, fromTheEnd = false): Promise<Wallet> {
    const order = fromTheEnd ? [["id", "DESC"]] : []
    return await this.models[modelName].findOne({ where: criteria, order })
  }

  async insert(modelName, row) {
    if (Array.isArray(row)) {
      await this.models[modelName].bulkCreate(row)
    } else {
      await this.models[modelName].create(row)
    }
  }

  async commit(): Promise<void> {
    if (this.transaction) {
      await this.transaction.commit()
    }
  }

  async execute(query, replacements = {}) {
    return await this.sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    })
  }
}
export { DB }

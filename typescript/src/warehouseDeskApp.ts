type OrderStatus = "BACKORDER" | "SHIPPED" | "CANCELLED" | "CANCELLED_AFTER_SHIP"

type StockReport = {
  shipped: number
  backorder: number
  cancelled: number
  lowStock: string[]
}

export class WarehouseDeskApp {
  private stockBySku = new Map<string, number>()
  private reservedBySku = new Map<string, number>()
  private priceBySku = new Map<string, number>()
  private orderStatus = new Map<string, OrderStatus>()
  private orderSku = new Map<string, string>()
  private orderQty = new Map<string, number>()
  private eventLog: string[] = []
  private cashBalance = 0
  private nextOrderNumber = 1001

  seedData = (): void => {
    this.stockBySku = new Map([
      ["PEN-BLACK", 40],
      ["PEN-BLUE", 25],
      ["NOTE-A5", 15],
      ["STAPLER", 4]
    ])
    this.reservedBySku = new Map([
      ["PEN-BLACK", 0],
      ["PEN-BLUE", 0],
      ["NOTE-A5", 0],
      ["STAPLER", 0]
    ])
    this.priceBySku = new Map([
      ["PEN-BLACK", 1.5],
      ["PEN-BLUE", 1.6],
      ["NOTE-A5", 4.0],
      ["STAPLER", 12.0]
    ])
    this.cashBalance = 300.0
    this.nextOrderNumber = 1001
  }

  runDemoDay = (): void => {
    const commands = [
      "RECV;NOTE-A5;5;2.20",
      "SELL;alice;PEN-BLACK;10",
      "SELL;bob;STAPLER;5",
      "CANCEL;O1002",
      "COUNT;STAPLER",
      "SELL;carol;STAPLER;2",
      "SELL;dan;NOTE-A5;14",
      "COUNT;NOTE-A5",
      "DUMP"
    ]

    commands.forEach((command) => this.processLine(command))
    this.printEndOfDayReport()
  }

  processLine = (line: string): void => {
    const parts = line.split(";")
    const command = parts[0]

    if (command === "RECV") {
      this.receiveStock(parts)
      return
    }

    if (command === "SELL") {
      this.sellStock(parts)
      return
    }

    if (command === "CANCEL") {
      this.cancelOrder(parts[1])
      return
    }

    if (command === "COUNT") {
      this.countStock(parts[1])
      return
    }

    if (command === "DUMP") {
      this.dumpState()
      return
    }

    this.eventLog.push(`unknown command: ${line}`)
  }

  printEndOfDayReport = (): void => {
    const report = this.buildStockReport()

    console.log()
    console.log("==== end of day ====")
    console.log(`orders shipped: ${report.shipped}`)
    console.log(`orders backordered: ${report.backorder}`)
    console.log(`orders cancelled: ${report.cancelled}`)
    console.log(`cash balance: ${this.cashBalance.toFixed(2)}`)
    console.log(`low stock skus: ${this.formatList(report.lowStock)}`)
    console.log()
    console.log("events:")
    this.eventLog.forEach((event) => console.log(` - ${event}`))
  }

  private receiveStock = (parts: string[]): void => {
    const sku = parts[1]
    const qty = this.parseInteger(parts[2])
    const unitCost = this.parseNumber(parts[3])
    const current = this.getStock(sku)

    this.stockBySku.set(sku, current + qty)
    this.cashBalance -= qty * unitCost
    this.eventLog.push(`received ${qty} of ${sku} at ${unitCost}`)
  }

  private sellStock = (parts: string[]): void => {
    const customer = parts[1]
    const sku = parts[2]
    const qty = this.parseInteger(parts[3])
    const orderId = this.createOrder(sku, qty)
    const onHand = this.getStock(sku)
    const available = onHand - this.getReserved(sku)

    if (available < qty) {
      this.orderStatus.set(orderId, "BACKORDER")
      this.eventLog.push(`order ${orderId} backordered for ${customer} sku=${sku} qty=${qty}`)
      return
    }

    this.stockBySku.set(sku, onHand - qty)
    const orderTotal = this.getPrice(sku) * qty
    this.cashBalance += orderTotal
    this.orderStatus.set(orderId, "SHIPPED")
    this.eventLog.push(`order ${orderId} shipped to ${customer} amount=${orderTotal}`)
  }

  private cancelOrder = (orderId: string): void => {
    const status = this.orderStatus.get(orderId)

    if (status === undefined) {
      this.eventLog.push(`cannot cancel ${orderId} because it does not exist`)
      return
    }

    if (status === "BACKORDER") {
      this.orderStatus.set(orderId, "CANCELLED")
      this.eventLog.push(`cancelled backorder ${orderId}`)
      return
    }

    if (status === "SHIPPED") {
      this.cancelShippedOrder(orderId)
      return
    }

    this.eventLog.push(`order ${orderId} could not be cancelled from state ${status}`)
  }

  private cancelShippedOrder = (orderId: string): void => {
    const sku = this.orderSku.get(orderId)
    const qty = this.orderQty.get(orderId) ?? 0

    if (sku === undefined) {
      this.eventLog.push(`order ${orderId} could not be cancelled because sku is missing`)
      return
    }

    this.stockBySku.set(sku, this.getStock(sku) + qty)
    this.cashBalance -= this.getPrice(sku) * qty
    this.orderStatus.set(orderId, "CANCELLED_AFTER_SHIP")
    this.eventLog.push(`cancelled shipped order ${orderId} with restock`)
  }

  private countStock = (sku: string): void => {
    const onHand = this.getStock(sku)
    const reserved = this.getReserved(sku)
    const available = onHand - reserved

    this.eventLog.push(`count ${sku} onHand=${onHand} reserved=${reserved} available=${available}`)
  }

  private dumpState = (): void => {
    console.log("---- dump ----")
    console.log(`stock=${this.formatMap(this.stockBySku)}`)
    console.log(`reserved=${this.formatMap(this.reservedBySku)}`)
    console.log(`orders=${this.formatMap(this.orderStatus)}`)
    console.log(`cashBalance=${this.cashBalance}`)
  }

  private createOrder = (sku: string, qty: number): string => {
    const orderId = `O${this.nextOrderNumber}`
    this.nextOrderNumber += 1
    this.orderSku.set(orderId, sku)
    this.orderQty.set(orderId, qty)

    return orderId
  }

  private buildStockReport = (): StockReport => {
    const statuses = Array.from(this.orderStatus.values())
    const lowStock = Array.from(this.stockBySku.entries())
      .filter(([, qty]) => qty < 5)
      .map(([sku]) => sku)

    return {
      shipped: statuses.filter((status) => status === "SHIPPED").length,
      backorder: statuses.filter((status) => status === "BACKORDER").length,
      cancelled: statuses.filter((status) => status.startsWith("CANCELLED")).length,
      lowStock
    }
  }

  private getStock = (sku: string): number => this.stockBySku.get(sku) ?? 0

  private getReserved = (sku: string): number => this.reservedBySku.get(sku) ?? 0

  private getPrice = (sku: string): number => this.priceBySku.get(sku) ?? 0

  private parseInteger = (value: string): number => Number.parseInt(value.trim(), 10)

  private parseNumber = (value: string): number => Number.parseFloat(value.trim())

  private formatMap = <T>(map: Map<string, T>): string => {
    const entries = Array.from(map.entries()).map(([key, value]) => `${key}=${value}`)

    return `{${entries.join(", ")}}`
  }

  private formatList = (values: string[]): string => `[${values.join(", ")}]`
}

class Transaction {
  constructor(props = {}) {
    this.collection = props.collection
    this.id = props.id
    this.entity = props.entity
    this.signature = props.signature
    this.action = props.action
    this.data = props.data
    this.permissions = props.permissions

    const nonce = new Int8Array(256)
    crypto.getRandomValues(nonce)
    const _hash = `
      ${nonce}
      ${this.collection}
      ${this.id}
      ${this.entity}
      ${this.signature}
      ${this.action}
      ${JSON.stringify(this.data)}
      ${JSON.stringify(this.permissions)}
    `
    this.hash = sha256(_hash)
  }
}

class Item {
  constructor(init) {
    this.transactions = [ init ]
  }

  toJSON() {
    const hash = this.transactions[0].hash
    const data = this.transactions.find(i => i.action === 'UPDATE' || i.action === 'CREATE').data
    const permissions = this.transactions.find(i => i.action === 'PERMIT' || i.action === 'CREATE').permissions
    return {
      hash,
      data,
      permissions,
    }
  }

  toString() {
    return JSON.stringify(this.toJSON())
  }

  push(transaction) {
    this.transactions.unshift(transaction)
  }

  verifySignature(transaction) {
    const {
      entity,
      signature,
    } = transaction
    
    const key = new JSEncrypt()
    key.setKey(entity)

    if (!key.verify(this.transactions[0].hash, signature, sha256)) {
      throw new Error('Invalid signature')
    }
    
    return true
  }

  verifyPermissions(transaction) {
    const {
      action,
      entity,
    } = transaction

    const permit = this.transactions.find(i => i.action === 'PERMIT' || i.action === 'CREATE')
    if (!permit.permissions[action].find(i => i === entity)) {
      throw new Error('Invalid permissions')
    }
    
    return true
  }
}

class DB {
  constructor(chain) {
    if (!chain.length)
      throw new Error('DB initialisation requires genesis transaction')

    this.data = {}
    this.genesis = new Item(chain.shift())

    chain.forEach(this.addTransaction.bind(this))
  }

  addTransaction(transaction) {
    try {
      this.verify(transaction)
      this.process(transaction)
    }
    catch(err) {
      return err
    }
    return true
  }

  verify(transaction) {
    const {
      action,
      collection,
      id,
    } = transaction

    if (action === 'CREATE') {
      return this.genesis.verifySignature(transaction)
    } else {
      if (!this.data[collection]) throw new Error('Collection does not exist')
      if (!this.data[collection][id]) throw new Error('Id does not exist')

      this.data[collection][id].verifySignature(transaction)
      this.data[collection][id].verifyPermissions(transaction)
    }
  }

  process(transaction) {
    const { action } = transaction

    switch(action) {
      case 'CREATE': return this.create(transaction)
      case 'UPDATE': return this.update(transaction)
      case 'DELETE': return this.delete(transaction)
      case 'PERMIT': return this.permit(transaction)
      default: throw Error('Invalid action')
    }
  }

  create(transaction) {
    const {
      collection,
      id,
    } = transaction
    if (!this.data[collection]) this.data[collection] = {}
    if (this.data[collection][id] !== undefined) throw new Error('Id not unique')

    this.data[collection][id] = new Item(transaction)

    return true
  }

  update(transaction) {
    const {
      collection,
      id,
    } = transaction

    this.data[collection][id].push(transaction)

    return true
  }

  delete(transaction) {
    const {
      collection,
      id,
    } = transaction

    delete this.data[collection][id]

    return true
  }

  permit(transaction) {
    const {
      collection,
      id,
    } = transaction

    this.data[collection][id].push(transaction)
    
    return true
  }
}

function newTransaction() {
  const entity = document.getElementById('entity').value
  const signature = document.getElementById('signature').value
  const collection = document.getElementById('collection').value
  const action = document.getElementById('action').value
  const id = document.getElementById('id').value
  const data = document.getElementById('data').value
  const permissions = JSON.parse(document.getElementById('permissions').value)
  const transaction = new Transaction({
    entity,
    signature,
    collection,
    action,
    id,
    permissions,
    data,
  })

  const success = db.addTransaction(transaction)

  printDB()
  console.log(success, transaction)
}

function printDB() {
  const div = document.getElementById('list')
  let content = `${db.genesis}`
  for (let collection in db.data) {
    content += `<div class="item-header">${collection}</div>`
    for (let id in db.data[collection]) {
      content += `<div class="item">${id} ${db.data[collection][id]}</div>`
    }
  }
  div.innerHTML = content
}

(() => {
  const genesis = new Transaction({
    action: 'CREATE',
    collection: '',
    id: '',
  })
  window.db = new DB([ genesis ])

  printDB()
})()
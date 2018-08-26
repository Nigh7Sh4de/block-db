let INDEX = 0

class Transaction {
  constructor(props = {}) {
    this.proof = parseInt(props.proof)
    this.publicKey = parseInt(props.publicKey)
    this.signature = parseInt(props.signature)
    this.collection = props.collection
    this.action = props.action
    this.id = props.id
    this.data = props.data
    this.permissions = props.permissions || {}
    this.hash = INDEX++//Math.random(INDEX++).toString().substring(2)
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

  verify(transaction) {
    const {
      publicKey,
      signature,
      action,
    } = transaction
    
    if (this.transactions[0].hash + publicKey !== signature)
      throw new Error('Invalid signature')
    const permit = this.transactions.find(i => i.action === 'PERMIT' || i.action === 'CREATE')
    if (!permit.permissions[action].find(i => i === publicKey))
      throw new Error('Invalid permissions')

    return true
  }
}

class DB {
  constructor(chain, hash) {
    if (!chain.length)
      throw new Error('DB initialisation requires genesis transaction')

    this.data = {}
    this.genesis = hash

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
      proof,
      hash,
      collection,
      id,
    } = transaction

    if (hash === this.genesis)
      return true
    else if (action === 'CREATE' && proof === this.genesis)
      return true
    else {
      if (!this.data[collection]) throw new Error('Collection does not exist')
      if (!this.data[collection][id]) throw new Error('Id does not exist')
      return this.data[collection][id].verify(transaction)
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
  const proof = document.getElementById('proof').value
  const publicKey = document.getElementById('publicKey').value
  const signature = document.getElementById('signature').value
  const collection = document.getElementById('collection').value
  const action = document.getElementById('action').value
  const id = document.getElementById('id').value
  const data = document.getElementById('data').value
  const permissions = JSON.parse(document.getElementById('permissions').value)
  const transaction = new Transaction({
    proof,
    publicKey,
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
  let content = ''
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
    permissions: {
      CREATE: [ 2 ],
    },
  })
  window.db = new DB([ genesis ], genesis.hash)

  printDB()
})()
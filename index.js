let INDEX = 0

class Transaction {
  constructor(props = {}) {
    this.proof = parseInt(props.proof)
    this.publicKey = parseInt(props.publicKey)
    this.signature = parseInt(props.signature)
    this.collection = props.collection
    this.action = props.action
    this.id = props.id
    this.body = props.body || { permissions: {} }
    this.hash = INDEX++//Math.random(INDEX++).toString().substring(2)
  }

  verify(signature, publicKey, action) {
    const permission = this.body.permissions[action]
    return (
      permission &&
      permission.indexOf(publicKey) >= 0 &&
      this.hash + publicKey === signature
    )
  }
}

class DB {
  constructor(transactions) {
    this.transactions = transactions || {}
    this.data = {}

    Object.values(this.transactions).forEach(transaction => this.addTransaction(transaction, true))
  }

  addTransaction(transaction, force) {
    const {
      proof,
      signature,
      publicKey,
      collection,
      action,
      id,
      body,
      hash,
    } = transaction
    const prevBlock = this.transactions[proof]
    if (!force && (!prevBlock || !prevBlock.verify(signature, publicKey, action))) {
      return 0
    }
    
    this.transactions[hash] = transaction

    switch(action) {
      case 'CREATE': return this.create(collection, id, body.data)
      case 'UPDATE': return this.update(collection, id, body.data)
      default: return 1
    }
  }

  create(collection, id, data) {
    if (!this.data[collection]) this.data[collection] = {}
    this.data[collection][id] = data
    return true
  }

  update(collection, id, data) {
    if (!this.data[collection]) return 2
    if (!this.data[collection][id]) return 3
    this.data[collection][id].data = data
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
    body: {
      permissions,
      data,
    },
  })

  const success = db.addTransaction(transaction)

  printDB()
  console.log(success, transaction)
}

function printDB() {
  const list = Object.values(db.data)
  // const list = Object.values(db.transactions)
  const div = document.getElementById('list')
  let content = ''
  list.forEach(item => content += `<div class="item">${JSON.stringify(item)}</div>`)
  div.innerHTML = content
}

(() => {
  const genesis = new Transaction({
    action: 'CREATE',
    collection: 'Cars',
    id: 'mine',
    body: {
      permissions: {
        UPDATE: [ 2 ],
      },
      data: {},
    }
  })
  window.db = new DB({ [genesis.hash]: genesis })

  printDB()
})()
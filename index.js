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
  constructor(chain, hash) {
    this.transactions = chain || {}
    this.data = {}
    this.genesis = hash

    for (hash in chain) {
      const transaction = chain[hash]
      this.addTransaction(transaction)
    }
  }

  addTransaction(transaction) {
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

    if (transaction.hash !== this.genesis) {
      const prevBlock = this.transactions[proof]
      if (!prevBlock || !prevBlock.verify(signature, publicKey, action)) {
        return 0
      }
    }
    
    const result = this.process(transaction)
    if (result === true) 
      this.transactions[hash] = transaction
    return result
  }

  process(transaction) {
    const {
      action,
      collection,
      id,
      body,
    } = transaction
    switch(action) {
      case 'CREATE': return this.create(collection, id, body.data)
      case 'UPDATE': return this.update(collection, id, body.data)
      case 'DELETE': return this.delete(collection, id)
      default: return 1
    }
  }

  create(collection, id, data) {
    if (!this.data[collection]) this.data[collection] = {}
    if (this.data[collection][id] !== undefined) return 7
    this.data[collection][id] = data
    return true
  }

  update(collection, id, data) {
    if (!this.data[collection]) return 2
    if (!this.data[collection][id]) return 3
    this.data[collection][id].data = data
    return true
  }

  delete(collectino, id) {
    if (!this.data[collection]) return 4
    if (!this.data[collection][id]) return 5
    delete this.data[collection][id]
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
  for (collection in db.data) {
    const data = db.data[collection]
    content += `<div class="item-header">${collection}</div>`
    for (id in data) {
      content += `<div class="item">${id} ${JSON.stringify(data[id])}</div>`
    }
  }
  div.innerHTML = content
}

(() => {
  const genesis = new Transaction({
    action: '',
    collection: '',
    id: '',
    body: {
      permissions: {
        CREATE: [ 2 ],
      },
      data: {},
    }
  })
  window.db = new DB({ [genesis.hash]: genesis }, genesis.hash)

  printDB()
})()
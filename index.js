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
    const { hash } = transaction

    try {
      this.verify(transaction)
      this.process(transaction)
      this.transactions[hash] = transaction
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
      publicKey,
      signature,
      hash,
    } = transaction

    if (hash === this.genesis)
      return true

    const prevBlock = this.transactions[proof]
    if (!prevBlock)
      throw new Error('No previous block found')
    if (!prevBlock.verify(signature, publicKey, action))
      throw new Error('Invalid signature')

    return true
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
      default: throw Error('Invalid action')
    }
  }

  create(collection, id, data) {
    if (!this.data[collection]) this.data[collection] = {}
    if (this.data[collection][id] !== undefined) throw new Error('Id not unique')
    this.data[collection][id] = data
    return true
  }

  update(collection, id, data) {
    if (!this.data[collection]) throw new Error('Collection does not exist')
    if (!this.data[collection][id]) throw new Error('Id does not exist')
    this.data[collection][id].data = data
    return true
  }

  delete(collection, id) {
    if (!this.data[collection]) throw new Error('Collection does not exist')
    if (!this.data[collection][id]) throw new Error('Id does not exist')
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
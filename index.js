class Transaction {
  constructor(props) {
    this.proof = props.proof
    this.signature = props.signature
    this.collection = props.collection
    this.action = props.action
    this.id = props.id
    this.body = props.body
  }

  valid() {
    return false
  }
}

class Block {
  constructor(props = {}) {
    this.transactions = props.transactions || []
    this.previousHash = props.previousHash
  }

  toString() {
    return JSON.stringify(this)
  }
}

function newTransaction() {
  const signature = document.getElementById('signature').value
  const collection = document.getElementById('collection').value
  const action = document.getElementById('action').value
  const id = document.getElementById('id').value
  const body = document.getElementById('body').value
  const transaction = new Transaction({
    signature,
    collection,
    action,
    id,
    body,
  })

  const success = transaction.valid()

  console.log(success, transaction)
}

function displayList(list) {
  const div = document.getElementById('list')
  list.forEach(item => div.innerHTML += `<span class="item">${item.toString()}</span>`)
}

(() => {
  const genesis = new Block()
  const db = [ genesis ]

  displayList(db)
})()
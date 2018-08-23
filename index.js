class Transaction {
  constructor(props) {
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
    this.signature = props.signature
  }
}

const genesis = new Block()
const db = [ genesis ]

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


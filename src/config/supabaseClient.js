import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  query as firestoreQuery,
  where,
  orderBy as orderByFn,
  limit as limitFn,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const formatError = (error) => {
  if (!error) return null
  return {
    message: error.message || String(error),
    code: error.code || 'unknown',
    details: error
  }
}

const normalizeText = (value) => String(value ?? '').toLowerCase()

const createOrPredicate = (orString) => {
  const conditions = orString
    .split(',')
    .map((condition) => condition.trim())
    .filter(Boolean)
    .map((condition) => {
      const [field, op, rawValue] = condition.split('.')
      const value = rawValue ? rawValue.replace(/^%|%$/g, '') : ''
      return { field, op, value }
    })

  return (item) =>
    conditions.some(({ field, op, value }) => {
      const itemValue = item[field]
      if (itemValue === undefined || itemValue === null) return false

      const left = normalizeText(itemValue)
      const right = normalizeText(value)

      if (op === 'ilike') {
        return left.includes(right)
      }

      if (op === 'eq') {
        return left === right
      }

      return false
    })
}

const compareValues = (a, b) => {
  if (a === b) return 0
  if (a === undefined || a === null) return -1
  if (b === undefined || b === null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

const applyOrdering = (items, orderings) => {
  if (!orderings.length) return items
  return [...items].sort((left, right) => {
    for (const { field, direction } of orderings) {
      const result = compareValues(left[field], right[field])
      if (result !== 0) {
        return direction === 'desc' ? -result : result
      }
    }
    return 0
  })
}

class SupabaseQuery {
  constructor(table) {
    this.table = table
    this.filters = []
    this.orderings = []
    this.limitCount = null
    this.singleResult = false
    this.orPredicate = null
  }

  select() {
    return this
  }

  order(field, options = {}) {
    this.orderings.push({
      field,
      direction: options.ascending === false ? 'desc' : 'asc'
    })
    return this
  }

  eq(field, value) {
    this.filters.push({ field, op: '==', value })
    return this
  }

  gte(field, value) {
    this.filters.push({ field, op: '>=', value })
    return this
  }

  lte(field, value) {
    this.filters.push({ field, op: '<=', value })
    return this
  }

  or(filterString) {
    this.orPredicate = createOrPredicate(filterString)
    return this
  }

  limit(count) {
    this.limitCount = count
    return this
  }

  single() {
    this.singleResult = true
    return this
  }

  insert(records) {
    return new SupabaseModify(this.table).insert(records)
  }

  update(payload) {
    return new SupabaseModify(this.table).update(payload)
  }

  delete() {
    return new SupabaseModify(this.table).delete()
  }

  async _fetchAllDocs() {
    const coll = collection(db, this.table)
    const snapshot = await getDocs(coll)
    return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
  }

  async _applyLocalFilters(items) {
    return items.filter((item) => {
      return this.filters.every((filter) => {
        const itemValue = filter.field === 'id' ? item.id : item[filter.field]
        if (itemValue === undefined || itemValue === null) return false

        switch (filter.op) {
          case '==':
            return itemValue === filter.value
          case '>=':
            return itemValue >= filter.value
          case '<=':
            return itemValue <= filter.value
          default:
            return false
        }
      })
    })
  }

  async _executeFirestoreQuery() {
    const coll = collection(db, this.table)
    const hasIdFilter = this.filters.some((filter) => filter.field === 'id')
    const hasUnsupportedFilter = this.filters.some((filter) => filter.field === 'id')

    if (hasIdFilter) {
      let rows = await this._fetchAllDocs()
      rows = await this._applyLocalFilters(rows)
      rows = applyOrdering(rows, this.orderings)
      if (this.limitCount != null) {
        rows = rows.slice(0, this.limitCount)
      }
      return rows
    }

    const constraints = []
    for (const filter of this.filters) {
      if (filter.field && filter.op) {
        constraints.push(where(filter.field, filter.op, filter.value))
      }
    }

    for (const order of this.orderings) {
      constraints.push(orderByFn(order.field, order.direction))
    }

    if (this.limitCount != null) {
      constraints.push(limitFn(this.limitCount))
    }

    const queryRef = constraints.length ? firestoreQuery(coll, ...constraints) : coll
    const snapshot = await getDocs(queryRef)
    return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
  }

  async execute() {
    try {
      let rows = []

      if (this.orPredicate) {
        rows = await this._fetchAllDocs()
        rows = rows.filter(this.orPredicate)
        rows = applyOrdering(rows, this.orderings)
        if (this.limitCount != null) {
          rows = rows.slice(0, this.limitCount)
        }
      } else {
        rows = await this._executeFirestoreQuery()
      }

      const data = this.singleResult ? (rows.length > 0 ? rows[0] : null) : rows
      return { data, error: null }
    } catch (error) {
      return { data: null, error: formatError(error) }
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }
}

class SupabaseModify {
  constructor(table) {
    this.table = table
    this.filters = []
  }

  eq(field, value) {
    this.filters.push({ field, op: '==', value })
    return this
  }

  async insert(records) {
    try {
      const items = Array.isArray(records) ? records : [records]
      const inserted = []

      for (const record of items) {
        const payload = {
          ...record,
          created_at: record.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const docRef = await addDoc(collection(db, this.table), payload)
        await updateDoc(docRef, { id: docRef.id })
        const saved = await getDoc(docRef)
        inserted.push({ id: docRef.id, ...saved.data() })
      }

      return { data: inserted, error: null }
    } catch (error) {
      return { data: null, error: formatError(error) }
    }
  }

  async update(payload) {
    try {
      if (!this.filters.length) {
        throw new Error('Missing filter condition for update()')
      }

      let snapshotDocs
      const hasIdFilter = this.filters.some((filter) => filter.field === 'id')

      if (hasIdFilter) {
        const allDocs = await this._fetchAllDocs()
        const matched = allDocs.filter((item) =>
          this.filters.every((filter) => {
            if (filter.field === 'id') {
              return item.id === filter.value
            }
            return item[filter.field] === filter.value
          })
        )
        snapshotDocs = matched.map((item) => ({ id: item.id }))
      } else {
        const coll = collection(db, this.table)
        const constraints = this.filters.map((filter) => where(filter.field, filter.op, filter.value))
        const queryRef = firestoreQuery(coll, ...constraints)
        const snapshot = await getDocs(queryRef)
        snapshotDocs = snapshot.docs
      }

      const updated = []
      for (const docItem of snapshotDocs) {
        const targetDoc = doc(db, this.table, docItem.id)
        await updateDoc(targetDoc, {
          ...payload,
          updated_at: new Date().toISOString()
        })
        const refreshed = await getDoc(targetDoc)
        updated.push({ id: docItem.id, ...refreshed.data() })
      }

      return { data: updated, error: null }
    } catch (error) {
      return { data: null, error: formatError(error) }
    }
  }

  async delete() {
    try {
      if (!this.filters.length) {
        throw new Error('Missing filter condition for delete()')
      }

      let snapshotDocs
      const hasIdFilter = this.filters.some((filter) => filter.field === 'id')

      if (hasIdFilter) {
        const allDocs = await this._fetchAllDocs()
        const matched = allDocs.filter((item) =>
          this.filters.every((filter) => {
            if (filter.field === 'id') {
              return item.id === filter.value
            }
            return item[filter.field] === filter.value
          })
        )
        snapshotDocs = matched.map((item) => ({ id: item.id }))
      } else {
        const coll = collection(db, this.table)
        const constraints = this.filters.map((filter) => where(filter.field, filter.op, filter.value))
        const queryRef = firestoreQuery(coll, ...constraints)
        const snapshot = await getDocs(queryRef)
        snapshotDocs = snapshot.docs
      }

      for (const docItem of snapshotDocs) {
        await deleteDoc(doc(db, this.table, docItem.id))
      }

      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: formatError(error) }
    }
  }
}

const createSubscriptionChannel = (table) => {
  let changeCallback = null
  const channel = {
    on: (_event, _opts, callback) => {
      changeCallback = callback
      return channel
    },
    subscribe: () => {
      const collectionRef = collection(db, table)
      const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        if (typeof changeCallback === 'function') {
          changeCallback(snapshot)
        }
      })
      return { unsubscribe }
    }
  }

  return channel
}

const getCurrentSession = () => {
  const user = auth.currentUser
  return user ? { user: {
    id: user.uid,
    email: user.email,
    display_name: user.displayName,
    phone: user.phoneNumber,
    email_verified: user.emailVerified
  } } : null
}

export const supabase = {
  from: (table) => new SupabaseQuery(table),
  auth: {
    getSession: async () => {
      return { data: { session: getCurrentSession() }, error: null }
    },
    onAuthStateChange: (callback) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        const event = user ? 'SIGNED_IN' : 'SIGNED_OUT'
        callback(event, user ? { user: {
          id: user.uid,
          email: user.email,
          display_name: user.displayName,
          phone: user.phoneNumber,
          email_verified: user.emailVerified
        } } : null)
      })
      return { data: { subscription: { unsubscribe } } }
    },
    signInWithPassword: async ({ email, password }) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return { data: { user: {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          display_name: userCredential.user.displayName,
          phone: userCredential.user.phoneNumber,
          email_verified: userCredential.user.emailVerified
        } }, error: null }
      } catch (error) {
        return { data: null, error: formatError(error) }
      }
    },
    signOut: async () => {
      try {
        await firebaseSignOut(auth)
        return { error: null }
      } catch (error) {
        return { error: formatError(error) }
      }
    }
  },
  channel: (name) => createSubscriptionChannel(name),
  removeChannel: (subscription) => {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe()
    }
  }
}

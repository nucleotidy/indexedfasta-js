import readline from 'readline'
import LocalFile from './localFile'
import BgzipIndexedFasta from './bgzipIndexedFasta'
import IndexedFasta from './indexedFasta'

// memoized
class UnindexedFasta extends IndexedFasta {
  constructor({ fasta, path }) {
    super({ fasta, path })
    if (fasta) {
      this.fasta = fasta
    } else if (path) {
      this.fasta = new LocalFile(path)
    }
  }
  async _getIndexes() {
    if (!this.indexes) this.indexes = await this._generateFAI()
    return this.indexes
  }

  _generateFAI() {
    return this.fasta.createReadStream().then(stream => {
      const lines = readline.createInterface({
        input: stream,
      })
      let offset = 0
      let found = false
      const indexByName = {}
      const indexById = {}
      let seqname = null
      let id = 0
      let length = 0

      return new Promise((resolve, reject) => {
        lines.on('line', line => {
          if (line.match(/^>/)) {
            const trim = line.replace(/^>/, '')
            const [name, ...description] = trim.split(' ')
            if (seqname) {
              indexByName[seqname].length = length
            }
            if (id) {
              indexById[id - 1].length = length
            }
            length = 0
            seqname = name
            indexById[id] = { description: description.join(' '), name, id }
            indexByName[seqname] = {
              description: description.join(' '),
              name,
              id,
              start: 0,
            }
            found = true
            offset += line.length + 1
          } else {
            if (found) {
              indexById[id].offset = offset
              indexById[id].lineLength = line.length
              indexById[id].lineBytes = line.length + 1
              indexByName[seqname].offset = offset
              indexByName[seqname].lineLength = line.length
              indexByName[seqname].lineBytes = line.length + 1
              id += 1
              found = false
            }
            length += line.length
            offset += line.length
          }
        })
        lines.on('close', () => {
          indexById[id - 1].length = length
          indexByName[seqname].length = length
          resolve({ id: indexById, name: indexByName })
        })
      })
    })
  }
}

export { UnindexedFasta, IndexedFasta, BgzipIndexedFasta }

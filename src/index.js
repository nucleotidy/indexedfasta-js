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
    console.log(this.fasta)
    return this.fasta.createReadStream().then(stream => {
      const lines = readline.createInterface({
        input: stream,
      })
      let offset = 0
      let found = false
      let indexByName = {}
      let indexById = {}
      let seqname = null
      let id = 0
      let length = 0

      return new Promise((resolve, reject) => {
        lines.on('line', line => {
          if (line.match(/^>/)) {
            const trim = line.replace(/^>/, '')
            const [name, ...description] = trim.split(' ')
            if(seqname) {
              ByName[seqname].length = length
            }
            if(id) {
              indexById[id-1].length = length
            }
            length = 0
            seqname = name
            console.log(seqname)
            indexById[id] = { description: description.join(' '), name, id }
            indexByName[seqname] = { description: description.join(' '), name, id, start: 0 }
            found = true
            offset += line.length
          } else {
            if (found) {
              indexById[id].offset = offset
              indexById[id].linelength = line.length
              indexById[id].linebytes = line.length + 1
              indexByName[seqname].offset = offset
              indexByName[seqname].linelength = line.length
              indexByName[seqname].linebytes = line.length + 1
              id += 1
              found = false
            }
            length += line.length
            offset += line.length
          }
        })
        lines.on('close', () => {
          indexById[id-1].length = length
          indexByName[seqname].length = length
          console.log('end', JSON.stringify(indexByName, null, 4))
          resolve({ id: indexById, name: indexByName })
        })
      })
    })
  }

  // async fetch(id, start, end) {
  //   const data = await this.data
  //   const entry = data.find(iter => iter.id === id)
  //   const length = end - start
  //   if (!entry) throw new Error(`no sequence with id ${id} exists`)
  //   return entry.sequence.substr(start, length)
  // }

  // async getSequenceList() {
  //   const data = await this.data
  //   return data.map(entry => entry.id)
  // }
}

export { UnindexedFasta, IndexedFasta, BgzipIndexedFasta }

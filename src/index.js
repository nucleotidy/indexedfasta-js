import readline from 'readline'
import LocalFile from './localFile'
import BgzipIndexedFasta from './bgzipIndexedFasta'
import IndexedFasta from './indexedFasta'


// memoized
class FetchableSmallFasta {
  constructor({ fasta, path }) {
    if (fasta) {
      this.fasta = fasta
    } else if (path) {
      this.fasta = new LocalFile(path)
    }

    this.indexByName = {}
    this.indexById = {}
    let seqname = null
    let id = 0
    let length = 0
    this.fasta.createReadStream().then(stream => {
      const lines = readline.createInterface({
        input: stream,
      })
      let offset = 0
      let found = false

      lines.on('line', line => {
        if (line.match(/^>/)) {
          const trim = line.replace(/^>/, '')
          const [name, ...description] = trim.split(' ')
          if(seqname) {
            this.indexByName[seqname].length = length
          }
          if(id) {
            this.indexById[id-1].length = length
          }
          length = 0
          seqname = name
          console.log(seqname)
          this.indexById[id] = { description: description.join(' '), name, id }
          this.indexByName[seqname] = { description: description.join(' '), name, id, start: 0 }
          found = true
          offset += line.length
        } else {
          if (found) {
            this.indexById[id].offset = offset
            this.indexById[id].linelength = line.length
            this.indexById[id].linebytes = line.length + 1
            this.indexByName[seqname].offset = offset
            this.indexByName[seqname].linelength = line.length
            this.indexByName[seqname].linebytes = line.length + 1
            id += 1
            found = false
          }
          length += line.length
          offset += line.length
        }
      })
      lines.on('close', () => {
        console.log(id)
        console.log(seqname)
        this.indexById[id-1].length = length
        this.indexByName[seqname].length = length
        console.log('end', JSON.stringify(this.indexByName, null, 4))
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

export { FetchableSmallFasta, IndexedFasta, BgzipIndexedFasta }

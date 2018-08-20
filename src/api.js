import Parser from './parse'
import { formatItem, formatSequence } from './util'

const { Transform } = require('stream')
const Decoder = require('string_decoder').StringDecoder

// don't load fs native module if running in webpacked code
const fs = typeof __webpack_require__ !== 'function' ? require('fs') : null

// call a callback on the next process tick if running in
// an environment that supports it
function _callback(callback) {
  if (process && process.nextTick) process.nextTick(callback)
  else callback()
}

// shared arg processing for the parse routines
function _processParseOptions(options, additionalDefaults = {}) {
  const out = Object.assign(
    {
      /* no known initial options */
    },
    additionalDefaults,
    options,
  )

  return out
}

class FASTATransform extends Transform {
  constructor(inputOptions = {}) {
    const options = _processParseOptions(inputOptions)
    super({ objectMode: true })

    this.encoding = inputOptions.encoding || 'utf8'

    this.decoder = new Decoder()
    this.textBuffer = ''

    const push = this.push.bind(this)
    this.parser = new Parser({
      commentCallback: options.parseComments ? push : null,
      sequenceCallback: options.parseSequences ? push : null,
      errorCallback: err => this.emit('error', err),
      bufferSize: options.bufferSize,
    })
  }

  _addLine(data) {
    const line = data.toString('utf8')
    if (line) {
      this.parser.addLine(line)
    }
  }

  _nextText(buffer) {
    const pieces = (this.textBuffer + buffer).split(/\r?\n/)
    this.textBuffer = pieces.pop()

    if (this.maxLineLength && this.textBuffer.length > this.maxLineLength) {
      this.emit('error', new Error('maximum line size exceeded'))
      return
    }

    pieces.forEach(piece => this._addLine(piece))
  }

  _transform(chunk, encoding, callback) {
    this._nextText(this.decoder.write(chunk))
    _callback(callback)
  }

  _flush(callback) {
    if (this.decoder.end) this._nextText(this.decoder.end())
    if (this.textBuffer != null) this._addLine(this.textBuffer)
    this.parser.finish()
    _callback(callback)
  }
}

/**
 * Parse a stream of text data into a stream of feature,
 * directive, and comment objects.
 *
 * @param {Object} options optional options object
 * @param {string} options.encoding text encoding of the input GFF3. default 'utf8'
 * @param {Number} options.bufferSize maximum number of GFF3 lines to buffer. defaults to 1000
 * @returns {ReadableStream} stream (in objectMode) of parsed items
 */
export function parseStream(options = {}) {
  const newOptions = Object.assign({ bufferSize: 1000 }, options)
  return new FASTATransform(newOptions)
}

/**
 * Read and parse a FASTA file from the filesystem.
 *
 * @param {string} filename the filename of the file to parse
 * @param {Object} options optional options object
 * @param {string} options.encoding the file's string encoding, defaults to 'utf8'
 * @param {Number} options.bufferSize maximum number of GFF3 lines to buffer. defaults to 1000
 * @returns {ReadableStream} stream (in objectMode) of parsed items
 */
export function parseFile(filename, options) {
  return fs.createReadStream(filename).pipe(parseStream(options))
}

/**
 * Synchronously parse a string containing FASTA and return
 * an arrayref of the parsed items.
 *
 * @param {string} str
 * @param {Object} inputOptions optional options object
 * @returns {Array} array of parsed features, directives, and/or comments
 */
export function parseStringSync(str, inputOptions = {}) {
  if (!str) return []

  const options = _processParseOptions(inputOptions)

  const items = []
  const push = items.push.bind(items)

  const parser = new Parser({
    sequenceCallback: push,
    bufferSize: Infinity,
    errorCallback: err => {
      throw err
    },
  })

  str.split(/\r?\n/).forEach(parser.addLine.bind(parser))
  parser.finish()

  return items
}

/**
 * Format an array of FASTA items (features) into string of FASTA.
 *
 * @param {Array[Object]} items
 * @returns {String} the formatted FASTA
 */
export function formatSync(items) {
  // sort items into seq and other
  const other = []
  const sequences = []
  items.forEach(i => {
    if (i.sequence) sequences.push(i)
    else other.push(i)
  })
  let str = other.map(formatItem).join('')
  if (sequences.length) {
    str += sequences.map(formatSequence).join('')
  }
  return str
}

class FormattingTransform extends Transform {
  constructor(options = {}) {
    super(Object.assign(options, { objectMode: true }))
    this.haveWeEmittedData = false
  }

  _transform(chunk, encoding, callback) {
    // if we have not emitted anything yet, and this first
    // chunk is not a gff-version directive, emit one
    let str

    if (Array.isArray(chunk)) str = chunk.map(formatItem).join('')
    else str = formatItem(chunk)

    this.push(str)

    // count the number of newlines in this chunk
    let count = 0
    for (let i = 0; i < str.length; i += 1) {
      if (str[i] === '\n') count += 1
    }

    this.haveWeEmittedData = true
    _callback(callback)
  }
}

/**
 * Format a stream of items (of the type produced
 * by this script) into a stream of GFF3 text.
 *
 * Inserts synchronization (###) marks automatically.
 *
 * @param {Object} options
 * @param {Object} options.minSyncLines minimum number of lines between ### marks. default 100
 * @param {Boolean} options.insertVersionDirective
 *  if the first item in the stream is not a ##gff-version directive, insert one.
 *  default false
 */
export function formatStream(options) {
  return new FormattingTransform(options)
}

/**
 * Format a stream of items (of the type produced
 * by this script) into a GFF3 file and write it to the filesystem.

 * Inserts synchronization (###) marks and a ##gff-version
 * directive automatically (if one is not already present).
 *
 * @param {ReadableStream} stream the stream to write to the file
 * @param {String} filename the file path to write to
 * @param {Object} options
 * @param {String} options.encoding default 'utf8'. encoding for the written file
 * @param {Number} options.minSyncLines
 *  minimum number of lines between sync (###) marks. default 100
 * @param {Boolean} options.insertVersionDirective
 *  if the first item in the stream is not a ##gff-version directive, insert one.
 *  default true
 * @returns {Promise} promise for the written filename
 */
export function formatFile(stream, filename, options = {}) {
  const newOptions = Object.assign(
    {
      insertVersionDirective: true,
    },
    options,
  )

  return new Promise((resolve, reject) => {
    stream
      .pipe(new FormattingTransform(newOptions))
      .on('end', () => resolve(filename))
      .on('error', reject)
      .pipe(
        fs.createWriteStream(filename, {
          encoding: newOptions.encoding || 'utf8',
        }),
      )
  })
}

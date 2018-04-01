# @gmod/gff

[![Generated with nod](https://img.shields.io/badge/generator-nod-2196F3.svg?style=flat-square)](https://github.com/diegohaz/nod)
[![NPM version](https://img.shields.io/npm/v/@gmod/gff.svg?style=flat-square)](https://npmjs.org/package/@gmod/gff)
[![Build Status](https://img.shields.io/travis/GMOD/gff-js/master.svg?style=flat-square)](https://travis-ci.org/GMOD/gff-js) [![Coverage Status](https://img.shields.io/codecov/c/github/GMOD/gff-js/master.svg?style=flat-square)](https://codecov.io/gh/GMOD/gff-js/branch/master)

read and write GFF3 data as streams

## Install

    $ npm install --save @gmod/gff

## Usage

```js
const fs = require('fs')

import * as gff from '@gmod/gff'

// parse a file from a file name
gff.parseFile('path/to/my/file.gff3')
.on('data',function(data) {
  if (data.directive) {
    // its a directive
    console.log('got directive',data)
  }
  else if (data.comment) {
    console.log('got comment',data)
  }
  else {
    console.log('got feature',data)
  }
})

// parse a stream of data
fs.createReadStream('path/to/my/file.gff3')
.pipe(gff.parseStream())
.pipe(es.mapSync(data => {
  console.log(data)
  return data
}))

// parse a string of gff3 synchronously
let arrayOfThings = gff.parseStringSync(stringOfGFF3)

// format an array to a string
let stringOfGFF3 = gff.formatSync(arrayOfThings)
// (inserts sync marks automatically)

// format a stream of things to a stream of text
myStreamOfObjects
.pipe(gff.formatStream())
.pipe(myFileWriteStream)
// (inserts sync marks automatically)
```

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

-   [Parser](#parser)
    -   [constructor](#constructor)
    -   [\_emitAllUnderConstructionFeatures](#_emitallunderconstructionfeatures)
-   [parseStream](#parsestream)
-   [parseFile](#parsefile)
-   [parseStringSync](#parsestringsync)
-   [formatSync](#formatsync)
-   [formatStream](#formatstream)
-   [typical](#typical)
-   [unescape](#unescape)
-   [escape](#escape)
-   [parseAttributes](#parseattributes)
-   [parseFeature](#parsefeature)
-   [parseDirective](#parsedirective)
-   [formatAttributes](#formatattributes)
-   [formatFeature](#formatfeature)
-   [formatDirective](#formatdirective)
-   [formatComment](#formatcomment)
-   [formatItem](#formatitem)

### Parser

provides a nice modern streaming API over the old-style parse.js

#### constructor

**Parameters**

-   `args` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `args.featureCallback` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** 
    -   `args.endCallback` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** 
    -   `args.commentCallback` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** 
    -   `args.errorCallback` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** 
    -   `args.directiveCallback` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** 

#### \_emitAllUnderConstructionFeatures

return all under-construction features, called when we know
there will be no additional data to attach to them

### parseStream

Parse a stream of text data into a stream of feature,
directive, and comment objects.

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** optional options object (optional, default `{}`)
    -   `options.encoding` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** text encoding of the input GFF3. default 'utf8'
    -   `options.parseFeatures` **bool** default true
    -   `options.parseDirectives` **bool** default false
    -   `options.parseComments` **bool** default false

Returns **ReadableStream** stream (in objectMode) of parsed items

### parseFile

Read and parse a GFF3 file from the filesystem.

**Parameters**

-   `filename` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the filename of the file to parse
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** optional options object
    -   `options.encoding` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the file's string encoding, defaults to 'utf8'
    -   `options.parseFeatures` **bool** default true
    -   `options.parseDirectives` **bool** default false
    -   `options.parseComments` **bool** default false

Returns **ReadableStream** stream (in objectMode) of parsed items

### parseStringSync

Synchronously parse a string containing GFF3 and return
an arrayref of the parsed items.

**Parameters**

-   `str` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `inputOptions` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** optional options object (optional, default `{}`)
    -   `inputOptions.parseFeatures` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** default true
    -   `inputOptions.parseDirectives` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** default false
    -   `inputOptions.parseComments` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** default false

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)** array of parsed features, directives, and/or comments

### formatSync

Format an array of GFF3 items (features,directives,comments) into string of GFF3.
Does not insert synchronization (###) marks.

**Parameters**

-   `items`  

Returns **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the formatted GFF3

### formatStream

Format a stream of items (of the type produced
by this script) into a stream of GFF3 text.

Inserts synchronization (###) marks automatically.

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `options.parseFeatures` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** default true
    -   `options.parseComments` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** default false
    -   `options.parseDirectives` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** default false

### typical

Fast, low-level functions for parsing and formatting GFF3.
JavaScript port of Robert Buels's Bio::GFF3::LowLevel Perl module.

### unescape

Unescape a string value used in a GFF3 attribute.

**Parameters**

-   `s` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### escape

Escape a value for use in a GFF3 attribute value.

**Parameters**

-   `s` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### parseAttributes

Parse the 9th column (attributes) of a GFF3 feature line.

**Parameters**

-   `attrString` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### parseFeature

Parse a GFF3 feature line

**Parameters**

-   `line` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### parseDirective

Parse a GFF3 directive line.

**Parameters**

-   `line` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** the information in the directive

### formatAttributes

Format an attributes object into a string suitable for the 9th column of GFF3.

**Parameters**

-   `attrs` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### formatFeature

Format a feature object or array of
feature objects into one or more lines of GFF3.

**Parameters**

-   `featureOrFeatures`  

### formatDirective

Format a directive into a line of GFF3.

**Parameters**

-   `directive` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

Returns **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### formatComment

Format a comment into a GFF3 comment.
Yes I know this is just adding a # and a newline.

**Parameters**

-   `comment` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

Returns **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### formatItem

Format a directive, comment, or feature,
or array of such items, into one or more lines of GFF3.

**Parameters**

-   `itemOrItems` **([Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array))** 

## License

MIT © [Robert Buels](https://github.com/rbuels)

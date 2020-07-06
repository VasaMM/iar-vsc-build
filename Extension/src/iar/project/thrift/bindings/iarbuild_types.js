//
// Autogenerated by Thrift Compiler (0.14.0)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//
"use strict";

var thrift = require('thrift');
var Thrift = thrift.Thrift;
var Q = thrift.Q;
var Int64 = require('node-int64');

var shared_ttypes = require('./shared_types');


var ttypes = module.exports = {};
ttypes.NodeType = {
  '1' : 'Group',
  'Group' : 1,
  '2' : 'File',
  'File' : 2
};
ttypes.ContextType = {
  '1' : 'Configuration',
  'Configuration' : 1,
  '2' : 'Group',
  'Group' : 2,
  '3' : 'File',
  'File' : 3
};
ttypes.BuildResult = {
  '0' : 'BuildOk',
  'BuildOk' : 0,
  '1' : 'BuildWarning',
  'BuildWarning' : 1,
  '2' : 'BuildError',
  'BuildError' : 2,
  '3' : 'BuildCancelled',
  'BuildCancelled' : 3
};
ttypes.LogSeverity = {
  '-1' : 'kDebug',
  'kDebug' : -1,
  '0' : 'kUser',
  'kUser' : 0,
  '1' : 'kMinorInfo',
  'kMinorInfo' : 1,
  '2' : 'kInfo',
  'kInfo' : 2,
  '3' : 'kWarning',
  'kWarning' : 3,
  '4' : 'kError',
  'kError' : 4,
  '5' : 'kAlert',
  'kAlert' : 5,
  '6' : 'kSuper',
  'kSuper' : 6
};
var Node = module.exports.Node = function(args) {
  this.name = null;
  this.children = null;
  this.type = null;
  this.path = null;
  if (args) {
    if (args.name !== undefined && args.name !== null) {
      this.name = args.name;
    }
    if (args.children !== undefined && args.children !== null) {
      this.children = Thrift.copyList(args.children, [null]);
    }
    if (args.type !== undefined && args.type !== null) {
      this.type = args.type;
    }
    if (args.path !== undefined && args.path !== null) {
      this.path = args.path;
    }
  }
};
Node.prototype = {};
Node.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.name = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.LIST) {
        this.children = [];
        var _rtmp31 = input.readListBegin();
        var _size0 = _rtmp31.size || 0;
        for (var _i2 = 0; _i2 < _size0; ++_i2) {
          var elem3 = null;
          elem3 = new ttypes.Node();
          elem3.read(input);
          this.children.push(elem3);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.I32) {
        this.type = input.readI32();
      } else {
        input.skip(ftype);
      }
      break;
      case 4:
      if (ftype == Thrift.Type.STRING) {
        this.path = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Node.prototype.write = function(output) {
  output.writeStructBegin('Node');
  if (this.name !== null && this.name !== undefined) {
    output.writeFieldBegin('name', Thrift.Type.STRING, 1);
    output.writeString(this.name);
    output.writeFieldEnd();
  }
  if (this.children !== null && this.children !== undefined) {
    output.writeFieldBegin('children', Thrift.Type.LIST, 2);
    output.writeListBegin(Thrift.Type.STRUCT, this.children.length);
    for (var iter4 in this.children) {
      if (this.children.hasOwnProperty(iter4)) {
        iter4 = this.children[iter4];
        iter4.write(output);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  if (this.type !== null && this.type !== undefined) {
    output.writeFieldBegin('type', Thrift.Type.I32, 3);
    output.writeI32(this.type);
    output.writeFieldEnd();
  }
  if (this.path !== null && this.path !== undefined) {
    output.writeFieldBegin('path', Thrift.Type.STRING, 4);
    output.writeString(this.path);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

var Context = module.exports.Context = function(args) {
  this.type = null;
  this.data = null;
  if (args) {
    if (args.type !== undefined && args.type !== null) {
      this.type = args.type;
    }
    if (args.data !== undefined && args.data !== null) {
      this.data = args.data;
    }
  }
};
Context.prototype = {};
Context.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.I32) {
        this.type = input.readI32();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRING) {
        this.data = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Context.prototype.write = function(output) {
  output.writeStructBegin('Context');
  if (this.type !== null && this.type !== undefined) {
    output.writeFieldBegin('type', Thrift.Type.I32, 1);
    output.writeI32(this.type);
    output.writeFieldEnd();
  }
  if (this.data !== null && this.data !== undefined) {
    output.writeFieldBegin('data', Thrift.Type.STRING, 2);
    output.writeString(this.data);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

var LogEntry = module.exports.LogEntry = function(args) {
  this.category = null;
  this.sender = null;
  this.text = null;
  this.severity = null;
  this.path = null;
  this.srcRow = null;
  this.srcCol = null;
  this.timeStamp = null;
  this.entryId = null;
  this.sourceLocation = null;
  this.sourceRange = null;
  if (args) {
    if (args.category !== undefined && args.category !== null) {
      this.category = args.category;
    }
    if (args.sender !== undefined && args.sender !== null) {
      this.sender = args.sender;
    }
    if (args.text !== undefined && args.text !== null) {
      this.text = Thrift.copyList(args.text, [null]);
    }
    if (args.severity !== undefined && args.severity !== null) {
      this.severity = args.severity;
    }
    if (args.path !== undefined && args.path !== null) {
      this.path = args.path;
    }
    if (args.srcRow !== undefined && args.srcRow !== null) {
      this.srcRow = args.srcRow;
    }
    if (args.srcCol !== undefined && args.srcCol !== null) {
      this.srcCol = args.srcCol;
    }
    if (args.timeStamp !== undefined && args.timeStamp !== null) {
      this.timeStamp = args.timeStamp;
    }
    if (args.entryId !== undefined && args.entryId !== null) {
      this.entryId = args.entryId;
    }
    if (args.sourceLocation !== undefined && args.sourceLocation !== null) {
      this.sourceLocation = new shared_ttypes.SourceLocation(args.sourceLocation);
    }
    if (args.sourceRange !== undefined && args.sourceRange !== null) {
      this.sourceRange = new shared_ttypes.SourceRange(args.sourceRange);
    }
  }
};
LogEntry.prototype = {};
LogEntry.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.category = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRING) {
        this.sender = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.LIST) {
        this.text = [];
        var _rtmp36 = input.readListBegin();
        var _size5 = _rtmp36.size || 0;
        for (var _i7 = 0; _i7 < _size5; ++_i7) {
          var elem8 = null;
          elem8 = input.readString();
          this.text.push(elem8);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 4:
      if (ftype == Thrift.Type.I32) {
        this.severity = input.readI32();
      } else {
        input.skip(ftype);
      }
      break;
      case 5:
      if (ftype == Thrift.Type.STRING) {
        this.path = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      case 6:
      if (ftype == Thrift.Type.I32) {
        this.srcRow = input.readI32();
      } else {
        input.skip(ftype);
      }
      break;
      case 7:
      if (ftype == Thrift.Type.I32) {
        this.srcCol = input.readI32();
      } else {
        input.skip(ftype);
      }
      break;
      case 8:
      if (ftype == Thrift.Type.I64) {
        this.timeStamp = input.readI64();
      } else {
        input.skip(ftype);
      }
      break;
      case 9:
      if (ftype == Thrift.Type.I64) {
        this.entryId = input.readI64();
      } else {
        input.skip(ftype);
      }
      break;
      case 10:
      if (ftype == Thrift.Type.STRUCT) {
        this.sourceLocation = new shared_ttypes.SourceLocation();
        this.sourceLocation.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 11:
      if (ftype == Thrift.Type.STRUCT) {
        this.sourceRange = new shared_ttypes.SourceRange();
        this.sourceRange.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

LogEntry.prototype.write = function(output) {
  output.writeStructBegin('LogEntry');
  if (this.category !== null && this.category !== undefined) {
    output.writeFieldBegin('category', Thrift.Type.STRING, 1);
    output.writeString(this.category);
    output.writeFieldEnd();
  }
  if (this.sender !== null && this.sender !== undefined) {
    output.writeFieldBegin('sender', Thrift.Type.STRING, 2);
    output.writeString(this.sender);
    output.writeFieldEnd();
  }
  if (this.text !== null && this.text !== undefined) {
    output.writeFieldBegin('text', Thrift.Type.LIST, 3);
    output.writeListBegin(Thrift.Type.STRING, this.text.length);
    for (var iter9 in this.text) {
      if (this.text.hasOwnProperty(iter9)) {
        iter9 = this.text[iter9];
        output.writeString(iter9);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  if (this.severity !== null && this.severity !== undefined) {
    output.writeFieldBegin('severity', Thrift.Type.I32, 4);
    output.writeI32(this.severity);
    output.writeFieldEnd();
  }
  if (this.path !== null && this.path !== undefined) {
    output.writeFieldBegin('path', Thrift.Type.STRING, 5);
    output.writeString(this.path);
    output.writeFieldEnd();
  }
  if (this.srcRow !== null && this.srcRow !== undefined) {
    output.writeFieldBegin('srcRow', Thrift.Type.I32, 6);
    output.writeI32(this.srcRow);
    output.writeFieldEnd();
  }
  if (this.srcCol !== null && this.srcCol !== undefined) {
    output.writeFieldBegin('srcCol', Thrift.Type.I32, 7);
    output.writeI32(this.srcCol);
    output.writeFieldEnd();
  }
  if (this.timeStamp !== null && this.timeStamp !== undefined) {
    output.writeFieldBegin('timeStamp', Thrift.Type.I64, 8);
    output.writeI64(this.timeStamp);
    output.writeFieldEnd();
  }
  if (this.entryId !== null && this.entryId !== undefined) {
    output.writeFieldBegin('entryId', Thrift.Type.I64, 9);
    output.writeI64(this.entryId);
    output.writeFieldEnd();
  }
  if (this.sourceLocation !== null && this.sourceLocation !== undefined) {
    output.writeFieldBegin('sourceLocation', Thrift.Type.STRUCT, 10);
    this.sourceLocation.write(output);
    output.writeFieldEnd();
  }
  if (this.sourceRange !== null && this.sourceRange !== undefined) {
    output.writeFieldBegin('sourceRange', Thrift.Type.STRUCT, 11);
    this.sourceRange.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

var PreprocessorMacro = module.exports.PreprocessorMacro = function(args) {
  this.name = null;
  this.value = null;
  if (args) {
    if (args.name !== undefined && args.name !== null) {
      this.name = args.name;
    }
    if (args.value !== undefined && args.value !== null) {
      this.value = args.value;
    }
  }
};
PreprocessorMacro.prototype = {};
PreprocessorMacro.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.name = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRING) {
        this.value = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

PreprocessorMacro.prototype.write = function(output) {
  output.writeStructBegin('PreprocessorMacro');
  if (this.name !== null && this.name !== undefined) {
    output.writeFieldBegin('name', Thrift.Type.STRING, 1);
    output.writeString(this.name);
    output.writeFieldEnd();
  }
  if (this.value !== null && this.value !== undefined) {
    output.writeFieldBegin('value', Thrift.Type.STRING, 2);
    output.writeString(this.value);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

var ScannerInfo = module.exports.ScannerInfo = function(args) {
  this.filename = null;
  this.includePaths = null;
  this.defines = null;
  if (args) {
    if (args.filename !== undefined && args.filename !== null) {
      this.filename = args.filename;
    }
    if (args.includePaths !== undefined && args.includePaths !== null) {
      this.includePaths = Thrift.copyList(args.includePaths, [null]);
    }
    if (args.defines !== undefined && args.defines !== null) {
      this.defines = Thrift.copyList(args.defines, [ttypes.PreprocessorMacro]);
    }
  }
};
ScannerInfo.prototype = {};
ScannerInfo.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.filename = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.LIST) {
        this.includePaths = [];
        var _rtmp311 = input.readListBegin();
        var _size10 = _rtmp311.size || 0;
        for (var _i12 = 0; _i12 < _size10; ++_i12) {
          var elem13 = null;
          elem13 = input.readString();
          this.includePaths.push(elem13);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.LIST) {
        this.defines = [];
        var _rtmp315 = input.readListBegin();
        var _size14 = _rtmp315.size || 0;
        for (var _i16 = 0; _i16 < _size14; ++_i16) {
          var elem17 = null;
          elem17 = new ttypes.PreprocessorMacro();
          elem17.read(input);
          this.defines.push(elem17);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ScannerInfo.prototype.write = function(output) {
  output.writeStructBegin('ScannerInfo');
  if (this.filename !== null && this.filename !== undefined) {
    output.writeFieldBegin('filename', Thrift.Type.STRING, 1);
    output.writeString(this.filename);
    output.writeFieldEnd();
  }
  if (this.includePaths !== null && this.includePaths !== undefined) {
    output.writeFieldBegin('includePaths', Thrift.Type.LIST, 2);
    output.writeListBegin(Thrift.Type.STRING, this.includePaths.length);
    for (var iter18 in this.includePaths) {
      if (this.includePaths.hasOwnProperty(iter18)) {
        iter18 = this.includePaths[iter18];
        output.writeString(iter18);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  if (this.defines !== null && this.defines !== undefined) {
    output.writeFieldBegin('defines', Thrift.Type.LIST, 3);
    output.writeListBegin(Thrift.Type.STRUCT, this.defines.length);
    for (var iter19 in this.defines) {
      if (this.defines.hasOwnProperty(iter19)) {
        iter19 = this.defines[iter19];
        iter19.write(output);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ttypes.IARBUILD_SERVICE_NAME = 'IarBuild';
ttypes.IARBUILD_EVENTLISTENER_SERVICE_NAME = 'IarBuild.EventListener';
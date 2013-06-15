// Generated by CoffeeScript 1.6.2
(function() {
  var Char, Discard, Iterable, Keyword, List, Map, Pair, Prim, Set, StringObj, Symbol, Tag, Tagged, Vector, char, encode, encodeHandlers, encodeJson, escapeChar, fs, handleToken, kw, lex, parenTypes, parens, parse, read, specialChars, sym, tagActions, tokenHandlers, type, typeClasses, _ref, _ref1, _ref2, _ref3, _ref4,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  type = require("./type");

  _ref = require("./atoms"), Prim = _ref.Prim, Symbol = _ref.Symbol, Keyword = _ref.Keyword, StringObj = _ref.StringObj, Char = _ref.Char, Discard = _ref.Discard, char = _ref.char, kw = _ref.kw, sym = _ref.sym;

  _ref1 = require("./collections"), Iterable = _ref1.Iterable, List = _ref1.List, Vector = _ref1.Vector, Set = _ref1.Set, Pair = _ref1.Pair, Map = _ref1.Map;

  _ref2 = require("./tags"), Tag = _ref2.Tag, Tagged = _ref2.Tagged, tagActions = _ref2.tagActions;

  _ref3 = require("./encode"), encodeHandlers = _ref3.encodeHandlers, encode = _ref3.encode, encodeJson = _ref3.encodeJson;

  _ref4 = require("./tokens"), handleToken = _ref4.handleToken, tokenHandlers = _ref4.tokenHandlers;

  typeClasses = {
    Map: Map,
    List: List,
    Vector: Vector,
    Set: Set,
    Discard: Discard,
    Tag: Tag,
    Tagged: Tagged,
    StringObj: StringObj
  };

  parens = '()[]{}';

  specialChars = parens + ' \t\n\r,';

  escapeChar = '\\';

  parenTypes = {
    '(': {
      closing: ')',
      "class": "List"
    },
    '[': {
      closing: ']',
      "class": "Vector"
    },
    '{': {
      closing: '}',
      "class": "Map"
    }
  };

  lex = function(string) {
    var c, escaping, in_comment, in_string, list, token, _i, _len;

    list = [];
    token = '';
    for (_i = 0, _len = string.length; _i < _len; _i++) {
      c = string[_i];
      if ((typeof in_string === "undefined" || in_string === null) && c === ";" && (typeof escaping === "undefined" || escaping === null)) {
        in_comment = true;
      }
      if (in_comment) {
        if (c === "\n") {
          in_comment = void 0;
          if (token) {
            list.push(token);
            token = '';
          }
        }
        continue;
      }
      if (c === '"' && (typeof escaping === "undefined" || escaping === null)) {
        if (typeof in_string !== "undefined" && in_string !== null) {
          list.push(new StringObj(in_string));
          in_string = void 0;
        } else {
          in_string = '';
        }
        continue;
      }
      if (in_string != null) {
        if (c === escapeChar && (typeof escaping === "undefined" || escaping === null)) {
          escaping = true;
          continue;
        }
        if (escaping != null) {
          escaping = void 0;
        }
        in_string += c;
      } else if (__indexOf.call(specialChars, c) >= 0 && (escaping == null)) {
        if (token) {
          list.push(token);
          token = '';
        }
        if (__indexOf.call(parens, c) >= 0) {
          list.push(c);
        }
      } else {
        if (escaping) {
          escaping = void 0;
        } else if (c === escapeChar) {
          escaping = true;
        }
        if (token === "#_") {
          list.push(token);
          token = '';
        }
        token += c;
      }
    }
    if (token) {
      list.push(token);
    }
    return list;
  };

  read = function(tokens) {
    var read_ahead, result, token1;

    read_ahead = function(token) {
      var L, closeParen, handledToken, paren, tagged;

      if (token === void 0) {
        return;
      }
      if (paren = parenTypes[token]) {
        closeParen = paren.closing;
        L = [];
        while (true) {
          token = tokens.shift();
          if (token === void 0) {
            throw 'unexpected end of list';
          }
          if (token === paren.closing) {
            return new typeClasses[paren["class"]](L);
          } else {
            L.push(read_ahead(token));
          }
        }
      } else if (__indexOf.call(")]}", token) >= 0) {
        throw "unexpected " + token;
      } else {
        handledToken = handleToken(token);
        if (handledToken instanceof Tag) {
          token = tokens.shift();
          if (token === void 0) {
            throw 'was expecting something to follow a tag';
          }
          tagged = new typeClasses.Tagged(handledToken, read_ahead(token));
          if (tagged.tag().dn() === "") {
            if (tagged.obj() instanceof typeClasses.Map) {
              return new typeClasses.Set(tagged.obj().value());
            }
          }
          if (tagged.tag().dn() === "_") {
            return new typeClasses.Discard;
          }
          if (tagActions[tagged.tag().dn()] != null) {
            return tagActions[tagged.tag().dn()].action(tagged.obj());
          }
          return tagged;
        } else {
          return handledToken;
        }
      }
    };
    token1 = tokens.shift();
    if (token1 === void 0) {
      return void 0;
    } else {
      result = read_ahead(token1);
      if (result instanceof typeClasses.Discard) {
        return "";
      }
      return result;
    }
  };

  parse = function(string) {
    return read(lex(string));
  };

  module.exports = {
    Char: Char,
    char: char,
    Iterable: Iterable,
    Symbol: Symbol,
    sym: sym,
    Keyword: Keyword,
    kw: kw,
    List: List,
    Vector: Vector,
    Pair: Pair,
    Map: Map,
    Set: Set,
    Tag: Tag,
    Tagged: Tagged,
    setTypeClass: function(typeName, klass) {
      if (typeClasses[typeName] != null) {
        module.exports[typeName] = klass;
        return typeClasses[typeName] = klass;
      }
    },
    setTagAction: function(tag, action) {
      return tagActions[tag.dn()] = {
        tag: tag,
        action: action
      };
    },
    setTokenHandler: function(handler, pattern, action) {
      return tokenHandlers[handler] = {
        pattern: pattern,
        action: action
      };
    },
    setTokenPattern: function(handler, pattern) {
      return tokenHandlers[handler].pattern = pattern;
    },
    setTokenAction: function(handler, action) {
      return tokenHandlers[handler].action = action;
    },
    setEncodeHandler: function(handler, test, action) {
      return encodeHandlers[handler] = {
        test: test,
        action: action
      };
    },
    setEncodeTest: function(type, test) {
      return encodeHandlers[type].test = test;
    },
    setEncodeAction: function(type, action) {
      return encodeHandlers[type].action = action;
    },
    parse: parse,
    encode: encode,
    encodeJson: encodeJson,
    toJS: function(obj) {
      if ((obj != null ? obj.jsEncode : void 0) != null) {
        return obj.jsEncode();
      } else {
        return obj;
      }
    },
    atPath: require("./atPath"),
    unify: require("./unify")(parse),
    compile: require("./compile")
  };

  if (typeof window === "undefined") {
    fs = require("fs");
    module.exports.readFile = function(file, cb) {
      return fs.readFile(file, "utf-8", function(err, data) {
        if (err) {
          throw err;
        }
        return cb(parse(data));
      });
    };
    module.exports.readFileSync = function(file) {
      return parse(fs.readFileSync(file, "utf-8"));
    };
  }

}).call(this);
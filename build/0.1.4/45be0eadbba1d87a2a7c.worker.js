/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 28);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

/**
 *  Copyright (c) 2014-2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

(function (global, factory) {
	 true ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Immutable = global.Immutable || {})));
}(this, (function (exports) { 'use strict';

// Used for setting prototype methods that IE8 chokes on.
var DELETE = 'delete';

// Constants describing the size of trie nodes.
var SHIFT = 5; // Resulted in best performance after ______?
var SIZE = 1 << SHIFT;
var MASK = SIZE - 1;

// A consistent shared value representing "not set" which equals nothing other
// than itself, and nothing that could be provided externally.
var NOT_SET = {};

// Boolean references, Rough equivalent of `bool &`.
var CHANGE_LENGTH = { value: false };
var DID_ALTER = { value: false };

function MakeRef(ref) {
  ref.value = false;
  return ref;
}

function SetRef(ref) {
  ref && (ref.value = true);
}

// A function which returns a value representing an "owner" for transient writes
// to tries. The return value will only ever equal itself, and will not equal
// the return of any subsequent call of this function.
function OwnerID() {}

// http://jsperf.com/copy-array-inline
function arrCopy(arr, offset) {
  offset = offset || 0;
  var len = Math.max(0, arr.length - offset);
  var newArr = new Array(len);
  for (var ii = 0; ii < len; ii++) {
    newArr[ii] = arr[ii + offset];
  }
  return newArr;
}

function ensureSize(iter) {
  if (iter.size === undefined) {
    iter.size = iter.__iterate(returnTrue);
  }
  return iter.size;
}

function wrapIndex(iter, index) {
  // This implements "is array index" which the ECMAString spec defines as:
  //
  //     A String property name P is an array index if and only if
  //     ToString(ToUint32(P)) is equal to P and ToUint32(P) is not equal
  //     to 2^32−1.
  //
  // http://www.ecma-international.org/ecma-262/6.0/#sec-array-exotic-objects
  if (typeof index !== 'number') {
    var uint32Index = index >>> 0; // N >>> 0 is shorthand for ToUint32
    if ('' + uint32Index !== index || uint32Index === 4294967295) {
      return NaN;
    }
    index = uint32Index;
  }
  return index < 0 ? ensureSize(iter) + index : index;
}

function returnTrue() {
  return true;
}

function wholeSlice(begin, end, size) {
  return (begin === 0 || (size !== undefined && begin <= -size)) &&
    (end === undefined || (size !== undefined && end >= size));
}

function resolveBegin(begin, size) {
  return resolveIndex(begin, size, 0);
}

function resolveEnd(end, size) {
  return resolveIndex(end, size, size);
}

function resolveIndex(index, size, defaultIndex) {
  // Sanitize indices using this shorthand for ToInt32(argument)
  // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
  return index === undefined
    ? defaultIndex
    : index < 0
        ? size === Infinity ? size : Math.max(0, size + index) | 0
        : size === undefined || size === index
            ? index
            : Math.min(size, index) | 0;
}

function isImmutable(maybeImmutable) {
  return (isCollection(maybeImmutable) || isRecord(maybeImmutable)) &&
    !maybeImmutable.__ownerID;
}

function isCollection(maybeCollection) {
  return !!(maybeCollection && maybeCollection[IS_ITERABLE_SENTINEL]);
}

function isKeyed(maybeKeyed) {
  return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
}

function isIndexed(maybeIndexed) {
  return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
}

function isAssociative(maybeAssociative) {
  return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
}

function isOrdered(maybeOrdered) {
  return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
}

function isRecord(maybeRecord) {
  return !!(maybeRecord && maybeRecord[IS_RECORD_SENTINEL]);
}

function isValueObject(maybeValue) {
  return !!(maybeValue &&
    typeof maybeValue.equals === 'function' &&
    typeof maybeValue.hashCode === 'function');
}

var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';
var IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@';

var Collection = function Collection(value) {
  return isCollection(value) ? value : Seq(value);
};

var KeyedCollection = (function (Collection) {
  function KeyedCollection(value) {
    return isKeyed(value) ? value : KeyedSeq(value);
  }

  if ( Collection ) KeyedCollection.__proto__ = Collection;
  KeyedCollection.prototype = Object.create( Collection && Collection.prototype );
  KeyedCollection.prototype.constructor = KeyedCollection;

  return KeyedCollection;
}(Collection));

var IndexedCollection = (function (Collection) {
  function IndexedCollection(value) {
    return isIndexed(value) ? value : IndexedSeq(value);
  }

  if ( Collection ) IndexedCollection.__proto__ = Collection;
  IndexedCollection.prototype = Object.create( Collection && Collection.prototype );
  IndexedCollection.prototype.constructor = IndexedCollection;

  return IndexedCollection;
}(Collection));

var SetCollection = (function (Collection) {
  function SetCollection(value) {
    return isCollection(value) && !isAssociative(value) ? value : SetSeq(value);
  }

  if ( Collection ) SetCollection.__proto__ = Collection;
  SetCollection.prototype = Object.create( Collection && Collection.prototype );
  SetCollection.prototype.constructor = SetCollection;

  return SetCollection;
}(Collection));

Collection.Keyed = KeyedCollection;
Collection.Indexed = IndexedCollection;
Collection.Set = SetCollection;

var ITERATE_KEYS = 0;
var ITERATE_VALUES = 1;
var ITERATE_ENTRIES = 2;

var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator';

var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;

var Iterator = function Iterator(next) {
  this.next = next;
};

Iterator.prototype.toString = function toString () {
  return '[Iterator]';
};

Iterator.KEYS = ITERATE_KEYS;
Iterator.VALUES = ITERATE_VALUES;
Iterator.ENTRIES = ITERATE_ENTRIES;

Iterator.prototype.inspect = (Iterator.prototype.toSource = function() {
  return this.toString();
});
Iterator.prototype[ITERATOR_SYMBOL] = function() {
  return this;
};

function iteratorValue(type, k, v, iteratorResult) {
  var value = type === 0 ? k : type === 1 ? v : [k, v];
  iteratorResult
    ? (iteratorResult.value = value)
    : (iteratorResult = {
        value: value,
        done: false
      });
  return iteratorResult;
}

function iteratorDone() {
  return { value: undefined, done: true };
}

function hasIterator(maybeIterable) {
  return !!getIteratorFn(maybeIterable);
}

function isIterator(maybeIterator) {
  return maybeIterator && typeof maybeIterator.next === 'function';
}

function getIterator(iterable) {
  var iteratorFn = getIteratorFn(iterable);
  return iteratorFn && iteratorFn.call(iterable);
}

function getIteratorFn(iterable) {
  var iteratorFn = iterable &&
    ((REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
      iterable[FAUX_ITERATOR_SYMBOL]);
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

function isArrayLike(value) {
  return value && typeof value.length === 'number';
}

var Seq = (function (Collection$$1) {
  function Seq(value) {
    return value === null || value === undefined
      ? emptySequence()
      : isCollection(value) || isRecord(value)
          ? value.toSeq()
          : seqFromValue(value);
  }

  if ( Collection$$1 ) Seq.__proto__ = Collection$$1;
  Seq.prototype = Object.create( Collection$$1 && Collection$$1.prototype );
  Seq.prototype.constructor = Seq;

  Seq.of = function of (/*...values*/) {
    return Seq(arguments);
  };

  Seq.prototype.toSeq = function toSeq () {
    return this;
  };

  Seq.prototype.toString = function toString () {
    return this.__toString('Seq {', '}');
  };

  Seq.prototype.cacheResult = function cacheResult () {
    if (!this._cache && this.__iterateUncached) {
      this._cache = this.entrySeq().toArray();
      this.size = this._cache.length;
    }
    return this;
  };

  // abstract __iterateUncached(fn, reverse)

  Seq.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    var cache = this._cache;
    if (cache) {
      var size = cache.length;
      var i = 0;
      while (i !== size) {
        var entry = cache[reverse ? size - ++i : i++];
        if (fn(entry[1], entry[0], this$1) === false) {
          break;
        }
      }
      return i;
    }
    return this.__iterateUncached(fn, reverse);
  };

  // abstract __iteratorUncached(type, reverse)

  Seq.prototype.__iterator = function __iterator (type, reverse) {
    var cache = this._cache;
    if (cache) {
      var size = cache.length;
      var i = 0;
      return new Iterator(function () {
        if (i === size) {
          return iteratorDone();
        }
        var entry = cache[reverse ? size - ++i : i++];
        return iteratorValue(type, entry[0], entry[1]);
      });
    }
    return this.__iteratorUncached(type, reverse);
  };

  return Seq;
}(Collection));

var KeyedSeq = (function (Seq) {
  function KeyedSeq(value) {
    return value === null || value === undefined
      ? emptySequence().toKeyedSeq()
      : isCollection(value)
          ? isKeyed(value) ? value.toSeq() : value.fromEntrySeq()
          : isRecord(value) ? value.toSeq() : keyedSeqFromValue(value);
  }

  if ( Seq ) KeyedSeq.__proto__ = Seq;
  KeyedSeq.prototype = Object.create( Seq && Seq.prototype );
  KeyedSeq.prototype.constructor = KeyedSeq;

  KeyedSeq.prototype.toKeyedSeq = function toKeyedSeq () {
    return this;
  };

  return KeyedSeq;
}(Seq));

var IndexedSeq = (function (Seq) {
  function IndexedSeq(value) {
    return value === null || value === undefined
      ? emptySequence()
      : isCollection(value)
          ? isKeyed(value) ? value.entrySeq() : value.toIndexedSeq()
          : isRecord(value)
              ? value.toSeq().entrySeq()
              : indexedSeqFromValue(value);
  }

  if ( Seq ) IndexedSeq.__proto__ = Seq;
  IndexedSeq.prototype = Object.create( Seq && Seq.prototype );
  IndexedSeq.prototype.constructor = IndexedSeq;

  IndexedSeq.of = function of (/*...values*/) {
    return IndexedSeq(arguments);
  };

  IndexedSeq.prototype.toIndexedSeq = function toIndexedSeq () {
    return this;
  };

  IndexedSeq.prototype.toString = function toString () {
    return this.__toString('Seq [', ']');
  };

  return IndexedSeq;
}(Seq));

var SetSeq = (function (Seq) {
  function SetSeq(value) {
    return (isCollection(value) && !isAssociative(value)
      ? value
      : IndexedSeq(value)).toSetSeq();
  }

  if ( Seq ) SetSeq.__proto__ = Seq;
  SetSeq.prototype = Object.create( Seq && Seq.prototype );
  SetSeq.prototype.constructor = SetSeq;

  SetSeq.of = function of (/*...values*/) {
    return SetSeq(arguments);
  };

  SetSeq.prototype.toSetSeq = function toSetSeq () {
    return this;
  };

  return SetSeq;
}(Seq));

Seq.isSeq = isSeq;
Seq.Keyed = KeyedSeq;
Seq.Set = SetSeq;
Seq.Indexed = IndexedSeq;

var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';

Seq.prototype[IS_SEQ_SENTINEL] = true;

// #pragma Root Sequences

var ArraySeq = (function (IndexedSeq) {
  function ArraySeq(array) {
    this._array = array;
    this.size = array.length;
  }

  if ( IndexedSeq ) ArraySeq.__proto__ = IndexedSeq;
  ArraySeq.prototype = Object.create( IndexedSeq && IndexedSeq.prototype );
  ArraySeq.prototype.constructor = ArraySeq;

  ArraySeq.prototype.get = function get (index, notSetValue) {
    return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
  };

  ArraySeq.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    var array = this._array;
    var size = array.length;
    var i = 0;
    while (i !== size) {
      var ii = reverse ? size - ++i : i++;
      if (fn(array[ii], ii, this$1) === false) {
        break;
      }
    }
    return i;
  };

  ArraySeq.prototype.__iterator = function __iterator (type, reverse) {
    var array = this._array;
    var size = array.length;
    var i = 0;
    return new Iterator(function () {
      if (i === size) {
        return iteratorDone();
      }
      var ii = reverse ? size - ++i : i++;
      return iteratorValue(type, ii, array[ii]);
    });
  };

  return ArraySeq;
}(IndexedSeq));

var ObjectSeq = (function (KeyedSeq) {
  function ObjectSeq(object) {
    var keys = Object.keys(object);
    this._object = object;
    this._keys = keys;
    this.size = keys.length;
  }

  if ( KeyedSeq ) ObjectSeq.__proto__ = KeyedSeq;
  ObjectSeq.prototype = Object.create( KeyedSeq && KeyedSeq.prototype );
  ObjectSeq.prototype.constructor = ObjectSeq;

  ObjectSeq.prototype.get = function get (key, notSetValue) {
    if (notSetValue !== undefined && !this.has(key)) {
      return notSetValue;
    }
    return this._object[key];
  };

  ObjectSeq.prototype.has = function has (key) {
    return this._object.hasOwnProperty(key);
  };

  ObjectSeq.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    var object = this._object;
    var keys = this._keys;
    var size = keys.length;
    var i = 0;
    while (i !== size) {
      var key = keys[reverse ? size - ++i : i++];
      if (fn(object[key], key, this$1) === false) {
        break;
      }
    }
    return i;
  };

  ObjectSeq.prototype.__iterator = function __iterator (type, reverse) {
    var object = this._object;
    var keys = this._keys;
    var size = keys.length;
    var i = 0;
    return new Iterator(function () {
      if (i === size) {
        return iteratorDone();
      }
      var key = keys[reverse ? size - ++i : i++];
      return iteratorValue(type, key, object[key]);
    });
  };

  return ObjectSeq;
}(KeyedSeq));
ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;

var CollectionSeq = (function (IndexedSeq) {
  function CollectionSeq(collection) {
    this._collection = collection;
    this.size = collection.length || collection.size;
  }

  if ( IndexedSeq ) CollectionSeq.__proto__ = IndexedSeq;
  CollectionSeq.prototype = Object.create( IndexedSeq && IndexedSeq.prototype );
  CollectionSeq.prototype.constructor = CollectionSeq;

  CollectionSeq.prototype.__iterateUncached = function __iterateUncached (fn, reverse) {
    var this$1 = this;

    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse);
    }
    var collection = this._collection;
    var iterator = getIterator(collection);
    var iterations = 0;
    if (isIterator(iterator)) {
      var step;
      while (!(step = iterator.next()).done) {
        if (fn(step.value, iterations++, this$1) === false) {
          break;
        }
      }
    }
    return iterations;
  };

  CollectionSeq.prototype.__iteratorUncached = function __iteratorUncached (type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse);
    }
    var collection = this._collection;
    var iterator = getIterator(collection);
    if (!isIterator(iterator)) {
      return new Iterator(iteratorDone);
    }
    var iterations = 0;
    return new Iterator(function () {
      var step = iterator.next();
      return step.done ? step : iteratorValue(type, iterations++, step.value);
    });
  };

  return CollectionSeq;
}(IndexedSeq));

var IteratorSeq = (function (IndexedSeq) {
  function IteratorSeq(iterator) {
    this._iterator = iterator;
    this._iteratorCache = [];
  }

  if ( IndexedSeq ) IteratorSeq.__proto__ = IndexedSeq;
  IteratorSeq.prototype = Object.create( IndexedSeq && IndexedSeq.prototype );
  IteratorSeq.prototype.constructor = IteratorSeq;

  IteratorSeq.prototype.__iterateUncached = function __iterateUncached (fn, reverse) {
    var this$1 = this;

    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse);
    }
    var iterator = this._iterator;
    var cache = this._iteratorCache;
    var iterations = 0;
    while (iterations < cache.length) {
      if (fn(cache[iterations], iterations++, this$1) === false) {
        return iterations;
      }
    }
    var step;
    while (!(step = iterator.next()).done) {
      var val = step.value;
      cache[iterations] = val;
      if (fn(val, iterations++, this$1) === false) {
        break;
      }
    }
    return iterations;
  };

  IteratorSeq.prototype.__iteratorUncached = function __iteratorUncached (type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse);
    }
    var iterator = this._iterator;
    var cache = this._iteratorCache;
    var iterations = 0;
    return new Iterator(function () {
      if (iterations >= cache.length) {
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        cache[iterations] = step.value;
      }
      return iteratorValue(type, iterations, cache[iterations++]);
    });
  };

  return IteratorSeq;
}(IndexedSeq));

// # pragma Helper functions

function isSeq(maybeSeq) {
  return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
}

var EMPTY_SEQ;

function emptySequence() {
  return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
}

function keyedSeqFromValue(value) {
  var seq = Array.isArray(value)
    ? new ArraySeq(value)
    : isIterator(value)
        ? new IteratorSeq(value)
        : hasIterator(value) ? new CollectionSeq(value) : undefined;
  if (seq) {
    return seq.fromEntrySeq();
  }
  if (typeof value === 'object') {
    return new ObjectSeq(value);
  }
  throw new TypeError(
    'Expected Array or collection object of [k, v] entries, or keyed object: ' +
      value
  );
}

function indexedSeqFromValue(value) {
  var seq = maybeIndexedSeqFromValue(value);
  if (seq) {
    return seq;
  }
  throw new TypeError(
    'Expected Array or collection object of values: ' + value
  );
}

function seqFromValue(value) {
  var seq = maybeIndexedSeqFromValue(value);
  if (seq) {
    return seq;
  }
  if (typeof value === 'object') {
    return new ObjectSeq(value);
  }
  throw new TypeError(
    'Expected Array or collection object of values, or keyed object: ' + value
  );
}

function maybeIndexedSeqFromValue(value) {
  return isArrayLike(value)
    ? new ArraySeq(value)
    : isIterator(value)
        ? new IteratorSeq(value)
        : hasIterator(value) ? new CollectionSeq(value) : undefined;
}

/**
 * An extension of the "same-value" algorithm as [described for use by ES6 Map
 * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
 *
 * NaN is considered the same as NaN, however -0 and 0 are considered the same
 * value, which is different from the algorithm described by
 * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
 *
 * This is extended further to allow Objects to describe the values they
 * represent, by way of `valueOf` or `equals` (and `hashCode`).
 *
 * Note: because of this extension, the key equality of Immutable.Map and the
 * value equality of Immutable.Set will differ from ES6 Map and Set.
 *
 * ### Defining custom values
 *
 * The easiest way to describe the value an object represents is by implementing
 * `valueOf`. For example, `Date` represents a value by returning a unix
 * timestamp for `valueOf`:
 *
 *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
 *     var date2 = new Date(1234567890000);
 *     date1.valueOf(); // 1234567890000
 *     assert( date1 !== date2 );
 *     assert( Immutable.is( date1, date2 ) );
 *
 * Note: overriding `valueOf` may have other implications if you use this object
 * where JavaScript expects a primitive, such as implicit string coercion.
 *
 * For more complex types, especially collections, implementing `valueOf` may
 * not be performant. An alternative is to implement `equals` and `hashCode`.
 *
 * `equals` takes another object, presumably of similar type, and returns true
 * if it is equal. Equality is symmetrical, so the same result should be
 * returned if this and the argument are flipped.
 *
 *     assert( a.equals(b) === b.equals(a) );
 *
 * `hashCode` returns a 32bit integer number representing the object which will
 * be used to determine how to store the value object in a Map or Set. You must
 * provide both or neither methods, one must not exist without the other.
 *
 * Also, an important relationship between these methods must be upheld: if two
 * values are equal, they *must* return the same hashCode. If the values are not
 * equal, they might have the same hashCode; this is called a hash collision,
 * and while undesirable for performance reasons, it is acceptable.
 *
 *     if (a.equals(b)) {
 *       assert( a.hashCode() === b.hashCode() );
 *     }
 *
 * All Immutable collections are Value Objects: they implement `equals()`
 * and `hashCode()`.
 */
function is(valueA, valueB) {
  if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
    return true;
  }
  if (!valueA || !valueB) {
    return false;
  }
  if (
    typeof valueA.valueOf === 'function' && typeof valueB.valueOf === 'function'
  ) {
    valueA = valueA.valueOf();
    valueB = valueB.valueOf();
    if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
      return true;
    }
    if (!valueA || !valueB) {
      return false;
    }
  }
  return !!(isValueObject(valueA) &&
    isValueObject(valueB) &&
    valueA.equals(valueB));
}

function fromJS(value, converter) {
  return fromJSWith(
    [],
    converter || defaultConverter,
    value,
    '',
    converter && converter.length > 2 ? [] : undefined,
    { '': value }
  );
}

function fromJSWith(stack, converter, value, key, keyPath, parentValue) {
  var toSeq = Array.isArray(value)
    ? IndexedSeq
    : isPlainObj(value) ? KeyedSeq : null;
  if (toSeq) {
    if (~stack.indexOf(value)) {
      throw new TypeError('Cannot convert circular structure to Immutable');
    }
    stack.push(value);
    keyPath && key !== '' && keyPath.push(key);
    var converted = converter.call(
      parentValue,
      key,
      toSeq(value).map(function (v, k) { return fromJSWith(stack, converter, v, k, keyPath, value); }),
      keyPath && keyPath.slice()
    );
    stack.pop();
    keyPath && keyPath.pop();
    return converted;
  }
  return value;
}

function defaultConverter(k, v) {
  return isKeyed(v) ? v.toMap() : v.toList();
}

function isPlainObj(value) {
  return value &&
    (value.constructor === Object || value.constructor === undefined);
}

var imul = typeof Math.imul === 'function' &&
  Math.imul(0xffffffff, 2) === -2
  ? Math.imul
  : function imul(a, b) {
      a |= 0; // int
      b |= 0; // int
      var c = a & 0xffff;
      var d = b & 0xffff;
      // Shift by 0 fixes the sign on the high part.
      return c * d + ((a >>> 16) * d + c * (b >>> 16) << 16 >>> 0) | 0; // int
    };

// v8 has an optimization for storing 31-bit signed numbers.
// Values which have either 00 or 11 as the high order bits qualify.
// This function drops the highest order bit in a signed number, maintaining
// the sign bit.
function smi(i32) {
  return i32 >>> 1 & 0x40000000 | i32 & 0xbfffffff;
}

function hash(o) {
  if (o === false || o === null || o === undefined) {
    return 0;
  }
  if (typeof o.valueOf === 'function') {
    o = o.valueOf();
    if (o === false || o === null || o === undefined) {
      return 0;
    }
  }
  if (o === true) {
    return 1;
  }
  var type = typeof o;
  if (type === 'number') {
    if (o !== o || o === Infinity) {
      return 0;
    }
    var h = o | 0;
    if (h !== o) {
      h ^= o * 0xffffffff;
    }
    while (o > 0xffffffff) {
      o /= 0xffffffff;
      h ^= o;
    }
    return smi(h);
  }
  if (type === 'string') {
    return o.length > STRING_HASH_CACHE_MIN_STRLEN
      ? cachedHashString(o)
      : hashString(o);
  }
  if (typeof o.hashCode === 'function') {
    return o.hashCode();
  }
  if (type === 'object') {
    return hashJSObj(o);
  }
  if (typeof o.toString === 'function') {
    return hashString(o.toString());
  }
  throw new Error('Value type ' + type + ' cannot be hashed.');
}

function cachedHashString(string) {
  var hash = stringHashCache[string];
  if (hash === undefined) {
    hash = hashString(string);
    if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
      STRING_HASH_CACHE_SIZE = 0;
      stringHashCache = {};
    }
    STRING_HASH_CACHE_SIZE++;
    stringHashCache[string] = hash;
  }
  return hash;
}

// http://jsperf.com/hashing-strings
function hashString(string) {
  // This is the hash from JVM
  // The hash code for a string is computed as
  // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
  // where s[i] is the ith character of the string and n is the length of
  // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
  // (exclusive) by dropping high bits.
  var hash = 0;
  for (var ii = 0; ii < string.length; ii++) {
    hash = 31 * hash + string.charCodeAt(ii) | 0;
  }
  return smi(hash);
}

function hashJSObj(obj) {
  var hash;
  if (usingWeakMap) {
    hash = weakMap.get(obj);
    if (hash !== undefined) {
      return hash;
    }
  }

  hash = obj[UID_HASH_KEY];
  if (hash !== undefined) {
    return hash;
  }

  if (!canDefineProperty) {
    hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
    if (hash !== undefined) {
      return hash;
    }

    hash = getIENodeHash(obj);
    if (hash !== undefined) {
      return hash;
    }
  }

  hash = ++objHashUID;
  if (objHashUID & 0x40000000) {
    objHashUID = 0;
  }

  if (usingWeakMap) {
    weakMap.set(obj, hash);
  } else if (isExtensible !== undefined && isExtensible(obj) === false) {
    throw new Error('Non-extensible objects are not allowed as keys.');
  } else if (canDefineProperty) {
    Object.defineProperty(obj, UID_HASH_KEY, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: hash
    });
  } else if (
    obj.propertyIsEnumerable !== undefined &&
    obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable
  ) {
    // Since we can't define a non-enumerable property on the object
    // we'll hijack one of the less-used non-enumerable properties to
    // save our hash on it. Since this is a function it will not show up in
    // `JSON.stringify` which is what we want.
    obj.propertyIsEnumerable = function() {
      return this.constructor.prototype.propertyIsEnumerable.apply(
        this,
        arguments
      );
    };
    obj.propertyIsEnumerable[UID_HASH_KEY] = hash;
  } else if (obj.nodeType !== undefined) {
    // At this point we couldn't get the IE `uniqueID` to use as a hash
    // and we couldn't use a non-enumerable property to exploit the
    // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
    // itself.
    obj[UID_HASH_KEY] = hash;
  } else {
    throw new Error('Unable to set a non-enumerable property on object.');
  }

  return hash;
}

// Get references to ES5 object methods.
var isExtensible = Object.isExtensible;

// True if Object.defineProperty works as expected. IE8 fails this test.
var canDefineProperty = (function() {
  try {
    Object.defineProperty({}, '@', {});
    return true;
  } catch (e) {
    return false;
  }
})();

// IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
// and avoid memory leaks from the IE cloneNode bug.
function getIENodeHash(node) {
  if (node && node.nodeType > 0) {
    switch (node.nodeType) {
      case 1: // Element
        return node.uniqueID;
      case 9: // Document
        return node.documentElement && node.documentElement.uniqueID;
    }
  }
}

// If possible, use a WeakMap.
var usingWeakMap = typeof WeakMap === 'function';
var weakMap;
if (usingWeakMap) {
  weakMap = new WeakMap();
}

var objHashUID = 0;

var UID_HASH_KEY = '__immutablehash__';
if (typeof Symbol === 'function') {
  UID_HASH_KEY = Symbol(UID_HASH_KEY);
}

var STRING_HASH_CACHE_MIN_STRLEN = 16;
var STRING_HASH_CACHE_MAX_SIZE = 255;
var STRING_HASH_CACHE_SIZE = 0;
var stringHashCache = {};

var ToKeyedSequence = (function (KeyedSeq$$1) {
  function ToKeyedSequence(indexed, useKeys) {
    this._iter = indexed;
    this._useKeys = useKeys;
    this.size = indexed.size;
  }

  if ( KeyedSeq$$1 ) ToKeyedSequence.__proto__ = KeyedSeq$$1;
  ToKeyedSequence.prototype = Object.create( KeyedSeq$$1 && KeyedSeq$$1.prototype );
  ToKeyedSequence.prototype.constructor = ToKeyedSequence;

  ToKeyedSequence.prototype.get = function get (key, notSetValue) {
    return this._iter.get(key, notSetValue);
  };

  ToKeyedSequence.prototype.has = function has (key) {
    return this._iter.has(key);
  };

  ToKeyedSequence.prototype.valueSeq = function valueSeq () {
    return this._iter.valueSeq();
  };

  ToKeyedSequence.prototype.reverse = function reverse () {
    var this$1 = this;

    var reversedSequence = reverseFactory(this, true);
    if (!this._useKeys) {
      reversedSequence.valueSeq = function () { return this$1._iter.toSeq().reverse(); };
    }
    return reversedSequence;
  };

  ToKeyedSequence.prototype.map = function map (mapper, context) {
    var this$1 = this;

    var mappedSequence = mapFactory(this, mapper, context);
    if (!this._useKeys) {
      mappedSequence.valueSeq = function () { return this$1._iter.toSeq().map(mapper, context); };
    }
    return mappedSequence;
  };

  ToKeyedSequence.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    return this._iter.__iterate(function (v, k) { return fn(v, k, this$1); }, reverse);
  };

  ToKeyedSequence.prototype.__iterator = function __iterator (type, reverse) {
    return this._iter.__iterator(type, reverse);
  };

  return ToKeyedSequence;
}(KeyedSeq));
ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;

var ToIndexedSequence = (function (IndexedSeq$$1) {
  function ToIndexedSequence(iter) {
    this._iter = iter;
    this.size = iter.size;
  }

  if ( IndexedSeq$$1 ) ToIndexedSequence.__proto__ = IndexedSeq$$1;
  ToIndexedSequence.prototype = Object.create( IndexedSeq$$1 && IndexedSeq$$1.prototype );
  ToIndexedSequence.prototype.constructor = ToIndexedSequence;

  ToIndexedSequence.prototype.includes = function includes (value) {
    return this._iter.includes(value);
  };

  ToIndexedSequence.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    var i = 0;
    reverse && ensureSize(this);
    return this._iter.__iterate(
      function (v) { return fn(v, reverse ? this$1.size - ++i : i++, this$1); },
      reverse
    );
  };

  ToIndexedSequence.prototype.__iterator = function __iterator (type, reverse) {
    var this$1 = this;

    var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
    var i = 0;
    reverse && ensureSize(this);
    return new Iterator(function () {
      var step = iterator.next();
      return step.done
        ? step
        : iteratorValue(
            type,
            reverse ? this$1.size - ++i : i++,
            step.value,
            step
          );
    });
  };

  return ToIndexedSequence;
}(IndexedSeq));

var ToSetSequence = (function (SetSeq$$1) {
  function ToSetSequence(iter) {
    this._iter = iter;
    this.size = iter.size;
  }

  if ( SetSeq$$1 ) ToSetSequence.__proto__ = SetSeq$$1;
  ToSetSequence.prototype = Object.create( SetSeq$$1 && SetSeq$$1.prototype );
  ToSetSequence.prototype.constructor = ToSetSequence;

  ToSetSequence.prototype.has = function has (key) {
    return this._iter.includes(key);
  };

  ToSetSequence.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    return this._iter.__iterate(function (v) { return fn(v, v, this$1); }, reverse);
  };

  ToSetSequence.prototype.__iterator = function __iterator (type, reverse) {
    var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
    return new Iterator(function () {
      var step = iterator.next();
      return step.done
        ? step
        : iteratorValue(type, step.value, step.value, step);
    });
  };

  return ToSetSequence;
}(SetSeq));

var FromEntriesSequence = (function (KeyedSeq$$1) {
  function FromEntriesSequence(entries) {
    this._iter = entries;
    this.size = entries.size;
  }

  if ( KeyedSeq$$1 ) FromEntriesSequence.__proto__ = KeyedSeq$$1;
  FromEntriesSequence.prototype = Object.create( KeyedSeq$$1 && KeyedSeq$$1.prototype );
  FromEntriesSequence.prototype.constructor = FromEntriesSequence;

  FromEntriesSequence.prototype.entrySeq = function entrySeq () {
    return this._iter.toSeq();
  };

  FromEntriesSequence.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    return this._iter.__iterate(
      function (entry) {
        // Check if entry exists first so array access doesn't throw for holes
        // in the parent iteration.
        if (entry) {
          validateEntry(entry);
          var indexedCollection = isCollection(entry);
          return fn(
            indexedCollection ? entry.get(1) : entry[1],
            indexedCollection ? entry.get(0) : entry[0],
            this$1
          );
        }
      },
      reverse
    );
  };

  FromEntriesSequence.prototype.__iterator = function __iterator (type, reverse) {
    var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
    return new Iterator(function () {
      while (true) {
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        var entry = step.value;
        // Check if entry exists first so array access doesn't throw for holes
        // in the parent iteration.
        if (entry) {
          validateEntry(entry);
          var indexedCollection = isCollection(entry);
          return iteratorValue(
            type,
            indexedCollection ? entry.get(0) : entry[0],
            indexedCollection ? entry.get(1) : entry[1],
            step
          );
        }
      }
    });
  };

  return FromEntriesSequence;
}(KeyedSeq));

ToIndexedSequence.prototype.cacheResult = (ToKeyedSequence.prototype.cacheResult = (ToSetSequence.prototype.cacheResult = (FromEntriesSequence.prototype.cacheResult = cacheResultThrough)));

function flipFactory(collection) {
  var flipSequence = makeSequence(collection);
  flipSequence._iter = collection;
  flipSequence.size = collection.size;
  flipSequence.flip = function () { return collection; };
  flipSequence.reverse = function() {
    var reversedSequence = collection.reverse.apply(this); // super.reverse()
    reversedSequence.flip = function () { return collection.reverse(); };
    return reversedSequence;
  };
  flipSequence.has = function (key) { return collection.includes(key); };
  flipSequence.includes = function (key) { return collection.has(key); };
  flipSequence.cacheResult = cacheResultThrough;
  flipSequence.__iterateUncached = function(fn, reverse) {
    var this$1 = this;

    return collection.__iterate(function (v, k) { return fn(k, v, this$1) !== false; }, reverse);
  };
  flipSequence.__iteratorUncached = function(type, reverse) {
    if (type === ITERATE_ENTRIES) {
      var iterator = collection.__iterator(type, reverse);
      return new Iterator(function () {
        var step = iterator.next();
        if (!step.done) {
          var k = step.value[0];
          step.value[0] = step.value[1];
          step.value[1] = k;
        }
        return step;
      });
    }
    return collection.__iterator(
      type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
      reverse
    );
  };
  return flipSequence;
}

function mapFactory(collection, mapper, context) {
  var mappedSequence = makeSequence(collection);
  mappedSequence.size = collection.size;
  mappedSequence.has = function (key) { return collection.has(key); };
  mappedSequence.get = function (key, notSetValue) {
    var v = collection.get(key, NOT_SET);
    return v === NOT_SET
      ? notSetValue
      : mapper.call(context, v, key, collection);
  };
  mappedSequence.__iterateUncached = function(fn, reverse) {
    var this$1 = this;

    return collection.__iterate(
      function (v, k, c) { return fn(mapper.call(context, v, k, c), k, this$1) !== false; },
      reverse
    );
  };
  mappedSequence.__iteratorUncached = function(type, reverse) {
    var iterator = collection.__iterator(ITERATE_ENTRIES, reverse);
    return new Iterator(function () {
      var step = iterator.next();
      if (step.done) {
        return step;
      }
      var entry = step.value;
      var key = entry[0];
      return iteratorValue(
        type,
        key,
        mapper.call(context, entry[1], key, collection),
        step
      );
    });
  };
  return mappedSequence;
}

function reverseFactory(collection, useKeys) {
  var this$1 = this;

  var reversedSequence = makeSequence(collection);
  reversedSequence._iter = collection;
  reversedSequence.size = collection.size;
  reversedSequence.reverse = function () { return collection; };
  if (collection.flip) {
    reversedSequence.flip = function() {
      var flipSequence = flipFactory(collection);
      flipSequence.reverse = function () { return collection.flip(); };
      return flipSequence;
    };
  }
  reversedSequence.get = function (key, notSetValue) { return collection.get(useKeys ? key : -1 - key, notSetValue); };
  reversedSequence.has = function (key) { return collection.has(useKeys ? key : -1 - key); };
  reversedSequence.includes = function (value) { return collection.includes(value); };
  reversedSequence.cacheResult = cacheResultThrough;
  reversedSequence.__iterate = function(fn, reverse) {
    var this$1 = this;

    var i = 0;
    reverse && ensureSize(collection);
    return collection.__iterate(
      function (v, k) { return fn(v, useKeys ? k : reverse ? this$1.size - ++i : i++, this$1); },
      !reverse
    );
  };
  reversedSequence.__iterator = function (type, reverse) {
    var i = 0;
    reverse && ensureSize(collection);
    var iterator = collection.__iterator(ITERATE_ENTRIES, !reverse);
    return new Iterator(function () {
      var step = iterator.next();
      if (step.done) {
        return step;
      }
      var entry = step.value;
      return iteratorValue(
        type,
        useKeys ? entry[0] : reverse ? this$1.size - ++i : i++,
        entry[1],
        step
      );
    });
  };
  return reversedSequence;
}

function filterFactory(collection, predicate, context, useKeys) {
  var filterSequence = makeSequence(collection);
  if (useKeys) {
    filterSequence.has = function (key) {
      var v = collection.get(key, NOT_SET);
      return v !== NOT_SET && !!predicate.call(context, v, key, collection);
    };
    filterSequence.get = function (key, notSetValue) {
      var v = collection.get(key, NOT_SET);
      return v !== NOT_SET && predicate.call(context, v, key, collection)
        ? v
        : notSetValue;
    };
  }
  filterSequence.__iterateUncached = function(fn, reverse) {
    var this$1 = this;

    var iterations = 0;
    collection.__iterate(
      function (v, k, c) {
        if (predicate.call(context, v, k, c)) {
          return fn(v, useKeys ? k : iterations++, this$1);
        }
      },
      reverse
    );
    return iterations;
  };
  filterSequence.__iteratorUncached = function(type, reverse) {
    var iterator = collection.__iterator(ITERATE_ENTRIES, reverse);
    var iterations = 0;
    return new Iterator(function () {
      while (true) {
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        var entry = step.value;
        var key = entry[0];
        var value = entry[1];
        if (predicate.call(context, value, key, collection)) {
          return iteratorValue(type, useKeys ? key : iterations++, value, step);
        }
      }
    });
  };
  return filterSequence;
}

function countByFactory(collection, grouper, context) {
  var groups = Map().asMutable();
  collection.__iterate(function (v, k) {
    groups.update(grouper.call(context, v, k, collection), 0, function (a) { return a + 1; });
  });
  return groups.asImmutable();
}

function groupByFactory(collection, grouper, context) {
  var isKeyedIter = isKeyed(collection);
  var groups = (isOrdered(collection) ? OrderedMap() : Map()).asMutable();
  collection.__iterate(function (v, k) {
    groups.update(
      grouper.call(context, v, k, collection),
      function (a) { return ((a = a || []), a.push(isKeyedIter ? [k, v] : v), a); }
    );
  });
  var coerce = collectionClass(collection);
  return groups.map(function (arr) { return reify(collection, coerce(arr)); });
}

function sliceFactory(collection, begin, end, useKeys) {
  var originalSize = collection.size;

  if (wholeSlice(begin, end, originalSize)) {
    return collection;
  }

  var resolvedBegin = resolveBegin(begin, originalSize);
  var resolvedEnd = resolveEnd(end, originalSize);

  // begin or end will be NaN if they were provided as negative numbers and
  // this collection's size is unknown. In that case, cache first so there is
  // a known size and these do not resolve to NaN.
  if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
    return sliceFactory(collection.toSeq().cacheResult(), begin, end, useKeys);
  }

  // Note: resolvedEnd is undefined when the original sequence's length is
  // unknown and this slice did not supply an end and should contain all
  // elements after resolvedBegin.
  // In that case, resolvedSize will be NaN and sliceSize will remain undefined.
  var resolvedSize = resolvedEnd - resolvedBegin;
  var sliceSize;
  if (resolvedSize === resolvedSize) {
    sliceSize = resolvedSize < 0 ? 0 : resolvedSize;
  }

  var sliceSeq = makeSequence(collection);

  // If collection.size is undefined, the size of the realized sliceSeq is
  // unknown at this point unless the number of items to slice is 0
  sliceSeq.size = sliceSize === 0
    ? sliceSize
    : (collection.size && sliceSize) || undefined;

  if (!useKeys && isSeq(collection) && sliceSize >= 0) {
    sliceSeq.get = function(index, notSetValue) {
      index = wrapIndex(this, index);
      return index >= 0 && index < sliceSize
        ? collection.get(index + resolvedBegin, notSetValue)
        : notSetValue;
    };
  }

  sliceSeq.__iterateUncached = function(fn, reverse) {
    var this$1 = this;

    if (sliceSize === 0) {
      return 0;
    }
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse);
    }
    var skipped = 0;
    var isSkipping = true;
    var iterations = 0;
    collection.__iterate(function (v, k) {
      if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
        iterations++;
        return fn(v, useKeys ? k : iterations - 1, this$1) !== false &&
          iterations !== sliceSize;
      }
    });
    return iterations;
  };

  sliceSeq.__iteratorUncached = function(type, reverse) {
    if (sliceSize !== 0 && reverse) {
      return this.cacheResult().__iterator(type, reverse);
    }
    // Don't bother instantiating parent iterator if taking 0.
    var iterator = sliceSize !== 0 && collection.__iterator(type, reverse);
    var skipped = 0;
    var iterations = 0;
    return new Iterator(function () {
      while (skipped++ < resolvedBegin) {
        iterator.next();
      }
      if (++iterations > sliceSize) {
        return iteratorDone();
      }
      var step = iterator.next();
      if (useKeys || type === ITERATE_VALUES) {
        return step;
      }
      if (type === ITERATE_KEYS) {
        return iteratorValue(type, iterations - 1, undefined, step);
      }
      return iteratorValue(type, iterations - 1, step.value[1], step);
    });
  };

  return sliceSeq;
}

function takeWhileFactory(collection, predicate, context) {
  var takeSequence = makeSequence(collection);
  takeSequence.__iterateUncached = function(fn, reverse) {
    var this$1 = this;

    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse);
    }
    var iterations = 0;
    collection.__iterate(
      function (v, k, c) { return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$1); }
    );
    return iterations;
  };
  takeSequence.__iteratorUncached = function(type, reverse) {
    var this$1 = this;

    if (reverse) {
      return this.cacheResult().__iterator(type, reverse);
    }
    var iterator = collection.__iterator(ITERATE_ENTRIES, reverse);
    var iterating = true;
    return new Iterator(function () {
      if (!iterating) {
        return iteratorDone();
      }
      var step = iterator.next();
      if (step.done) {
        return step;
      }
      var entry = step.value;
      var k = entry[0];
      var v = entry[1];
      if (!predicate.call(context, v, k, this$1)) {
        iterating = false;
        return iteratorDone();
      }
      return type === ITERATE_ENTRIES ? step : iteratorValue(type, k, v, step);
    });
  };
  return takeSequence;
}

function skipWhileFactory(collection, predicate, context, useKeys) {
  var skipSequence = makeSequence(collection);
  skipSequence.__iterateUncached = function(fn, reverse) {
    var this$1 = this;

    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse);
    }
    var isSkipping = true;
    var iterations = 0;
    collection.__iterate(function (v, k, c) {
      if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
        iterations++;
        return fn(v, useKeys ? k : iterations - 1, this$1);
      }
    });
    return iterations;
  };
  skipSequence.__iteratorUncached = function(type, reverse) {
    var this$1 = this;

    if (reverse) {
      return this.cacheResult().__iterator(type, reverse);
    }
    var iterator = collection.__iterator(ITERATE_ENTRIES, reverse);
    var skipping = true;
    var iterations = 0;
    return new Iterator(function () {
      var step;
      var k;
      var v;
      do {
        step = iterator.next();
        if (step.done) {
          if (useKeys || type === ITERATE_VALUES) {
            return step;
          }
          if (type === ITERATE_KEYS) {
            return iteratorValue(type, iterations++, undefined, step);
          }
          return iteratorValue(type, iterations++, step.value[1], step);
        }
        var entry = step.value;
        k = entry[0];
        v = entry[1];
        skipping && (skipping = predicate.call(context, v, k, this$1));
      } while (skipping);
      return type === ITERATE_ENTRIES ? step : iteratorValue(type, k, v, step);
    });
  };
  return skipSequence;
}

function concatFactory(collection, values) {
  var isKeyedCollection = isKeyed(collection);
  var iters = [collection]
    .concat(values)
    .map(function (v) {
      if (!isCollection(v)) {
        v = isKeyedCollection
          ? keyedSeqFromValue(v)
          : indexedSeqFromValue(Array.isArray(v) ? v : [v]);
      } else if (isKeyedCollection) {
        v = KeyedCollection(v);
      }
      return v;
    })
    .filter(function (v) { return v.size !== 0; });

  if (iters.length === 0) {
    return collection;
  }

  if (iters.length === 1) {
    var singleton = iters[0];
    if (
      singleton === collection ||
      (isKeyedCollection && isKeyed(singleton)) ||
      (isIndexed(collection) && isIndexed(singleton))
    ) {
      return singleton;
    }
  }

  var concatSeq = new ArraySeq(iters);
  if (isKeyedCollection) {
    concatSeq = concatSeq.toKeyedSeq();
  } else if (!isIndexed(collection)) {
    concatSeq = concatSeq.toSetSeq();
  }
  concatSeq = concatSeq.flatten(true);
  concatSeq.size = iters.reduce(
    function (sum, seq) {
      if (sum !== undefined) {
        var size = seq.size;
        if (size !== undefined) {
          return sum + size;
        }
      }
    },
    0
  );
  return concatSeq;
}

function flattenFactory(collection, depth, useKeys) {
  var flatSequence = makeSequence(collection);
  flatSequence.__iterateUncached = function(fn, reverse) {
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse);
    }
    var iterations = 0;
    var stopped = false;
    function flatDeep(iter, currentDepth) {
      iter.__iterate(
        function (v, k) {
          if ((!depth || currentDepth < depth) && isCollection(v)) {
            flatDeep(v, currentDepth + 1);
          } else if (
            fn(v, useKeys ? k : iterations++, flatSequence) === false
          ) {
            stopped = true;
          }
          return !stopped;
        },
        reverse
      );
    }
    flatDeep(collection, 0);
    return iterations;
  };
  flatSequence.__iteratorUncached = function(type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse);
    }
    var iterator = collection.__iterator(type, reverse);
    var stack = [];
    var iterations = 0;
    return new Iterator(function () {
      while (iterator) {
        var step = iterator.next();
        if (step.done !== false) {
          iterator = stack.pop();
          continue;
        }
        var v = step.value;
        if (type === ITERATE_ENTRIES) {
          v = v[1];
        }
        if ((!depth || stack.length < depth) && isCollection(v)) {
          stack.push(iterator);
          iterator = v.__iterator(type, reverse);
        } else {
          return useKeys ? step : iteratorValue(type, iterations++, v, step);
        }
      }
      return iteratorDone();
    });
  };
  return flatSequence;
}

function flatMapFactory(collection, mapper, context) {
  var coerce = collectionClass(collection);
  return collection
    .toSeq()
    .map(function (v, k) { return coerce(mapper.call(context, v, k, collection)); })
    .flatten(true);
}

function interposeFactory(collection, separator) {
  var interposedSequence = makeSequence(collection);
  interposedSequence.size = collection.size && collection.size * 2 - 1;
  interposedSequence.__iterateUncached = function(fn, reverse) {
    var this$1 = this;

    var iterations = 0;
    collection.__iterate(
      function (v) { return (!iterations || fn(separator, iterations++, this$1) !== false) &&
        fn(v, iterations++, this$1) !== false; },
      reverse
    );
    return iterations;
  };
  interposedSequence.__iteratorUncached = function(type, reverse) {
    var iterator = collection.__iterator(ITERATE_VALUES, reverse);
    var iterations = 0;
    var step;
    return new Iterator(function () {
      if (!step || iterations % 2) {
        step = iterator.next();
        if (step.done) {
          return step;
        }
      }
      return iterations % 2
        ? iteratorValue(type, iterations++, separator)
        : iteratorValue(type, iterations++, step.value, step);
    });
  };
  return interposedSequence;
}

function sortFactory(collection, comparator, mapper) {
  if (!comparator) {
    comparator = defaultComparator;
  }
  var isKeyedCollection = isKeyed(collection);
  var index = 0;
  var entries = collection
    .toSeq()
    .map(function (v, k) { return [k, v, index++, mapper ? mapper(v, k, collection) : v]; })
    .toArray();
  entries.sort(function (a, b) { return comparator(a[3], b[3]) || a[2] - b[2]; }).forEach(
    isKeyedCollection
      ? function (v, i) {
          entries[i].length = 2;
        }
      : function (v, i) {
          entries[i] = v[1];
        }
  );
  return isKeyedCollection
    ? KeyedSeq(entries)
    : isIndexed(collection) ? IndexedSeq(entries) : SetSeq(entries);
}

function maxFactory(collection, comparator, mapper) {
  if (!comparator) {
    comparator = defaultComparator;
  }
  if (mapper) {
    var entry = collection
      .toSeq()
      .map(function (v, k) { return [v, mapper(v, k, collection)]; })
      .reduce(function (a, b) { return maxCompare(comparator, a[1], b[1]) ? b : a; });
    return entry && entry[0];
  }
  return collection.reduce(function (a, b) { return maxCompare(comparator, a, b) ? b : a; });
}

function maxCompare(comparator, a, b) {
  var comp = comparator(b, a);
  // b is considered the new max if the comparator declares them equal, but
  // they are not equal and b is in fact a nullish value.
  return (comp === 0 &&
    b !== a &&
    (b === undefined || b === null || b !== b)) ||
    comp > 0;
}

function zipWithFactory(keyIter, zipper, iters) {
  var zipSequence = makeSequence(keyIter);
  zipSequence.size = new ArraySeq(iters).map(function (i) { return i.size; }).min();
  // Note: this a generic base implementation of __iterate in terms of
  // __iterator which may be more generically useful in the future.
  zipSequence.__iterate = function(fn, reverse) {
    var this$1 = this;

    /* generic:
    var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
    var step;
    var iterations = 0;
    while (!(step = iterator.next()).done) {
      iterations++;
      if (fn(step.value[1], step.value[0], this) === false) {
        break;
      }
    }
    return iterations;
    */
    // indexed:
    var iterator = this.__iterator(ITERATE_VALUES, reverse);
    var step;
    var iterations = 0;
    while (!(step = iterator.next()).done) {
      if (fn(step.value, iterations++, this$1) === false) {
        break;
      }
    }
    return iterations;
  };
  zipSequence.__iteratorUncached = function(type, reverse) {
    var iterators = iters.map(
      function (i) { return ((i = Collection(i)), getIterator(reverse ? i.reverse() : i)); }
    );
    var iterations = 0;
    var isDone = false;
    return new Iterator(function () {
      var steps;
      if (!isDone) {
        steps = iterators.map(function (i) { return i.next(); });
        isDone = steps.some(function (s) { return s.done; });
      }
      if (isDone) {
        return iteratorDone();
      }
      return iteratorValue(
        type,
        iterations++,
        zipper.apply(null, steps.map(function (s) { return s.value; }))
      );
    });
  };
  return zipSequence;
}

// #pragma Helper Functions

function reify(iter, seq) {
  return iter === seq ? iter : isSeq(iter) ? seq : iter.constructor(seq);
}

function validateEntry(entry) {
  if (entry !== Object(entry)) {
    throw new TypeError('Expected [K, V] tuple: ' + entry);
  }
}

function collectionClass(collection) {
  return isKeyed(collection)
    ? KeyedCollection
    : isIndexed(collection) ? IndexedCollection : SetCollection;
}

function makeSequence(collection) {
  return Object.create(
    (isKeyed(collection)
      ? KeyedSeq
      : isIndexed(collection) ? IndexedSeq : SetSeq).prototype
  );
}

function cacheResultThrough() {
  if (this._iter.cacheResult) {
    this._iter.cacheResult();
    this.size = this._iter.size;
    return this;
  }
  return Seq.prototype.cacheResult.call(this);
}

function defaultComparator(a, b) {
  if (a === undefined && b === undefined) {
    return 0;
  }

  if (a === undefined) {
    return 1;
  }

  if (b === undefined) {
    return -1;
  }

  return a > b ? 1 : a < b ? -1 : 0;
}

function coerceKeyPath(keyPath) {
  if (isArrayLike(keyPath) && typeof keyPath !== 'string') {
    return keyPath;
  }
  if (isOrdered(keyPath)) {
    return keyPath.toArray();
  }
  throw new TypeError(
    'Invalid keyPath: expected Ordered Collection or Array: ' + keyPath
  );
}

function invariant(condition, error) {
  if (!condition) { throw new Error(error); }
}

function assertNotInfinite(size) {
  invariant(
    size !== Infinity,
    'Cannot perform this action with an infinite size.'
  );
}

/**
 * Converts a value to a string, adding quotes if a string was provided.
 */
function quoteString(value) {
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

var Map = (function (KeyedCollection$$1) {
  function Map(value) {
    return value === null || value === undefined
      ? emptyMap()
      : isMap(value) && !isOrdered(value)
          ? value
          : emptyMap().withMutations(function (map) {
              var iter = KeyedCollection$$1(value);
              assertNotInfinite(iter.size);
              iter.forEach(function (v, k) { return map.set(k, v); });
            });
  }

  if ( KeyedCollection$$1 ) Map.__proto__ = KeyedCollection$$1;
  Map.prototype = Object.create( KeyedCollection$$1 && KeyedCollection$$1.prototype );
  Map.prototype.constructor = Map;

  Map.of = function of () {
    var keyValues = [], len = arguments.length;
    while ( len-- ) keyValues[ len ] = arguments[ len ];

    return emptyMap().withMutations(function (map) {
      for (var i = 0; i < keyValues.length; i += 2) {
        if (i + 1 >= keyValues.length) {
          throw new Error('Missing value for key: ' + keyValues[i]);
        }
        map.set(keyValues[i], keyValues[i + 1]);
      }
    });
  };

  Map.prototype.toString = function toString () {
    return this.__toString('Map {', '}');
  };

  // @pragma Access

  Map.prototype.get = function get (k, notSetValue) {
    return this._root
      ? this._root.get(0, undefined, k, notSetValue)
      : notSetValue;
  };

  // @pragma Modification

  Map.prototype.set = function set (k, v) {
    return updateMap(this, k, v);
  };

  Map.prototype.setIn = function setIn (keyPath, v) {
    return this.updateIn(keyPath, NOT_SET, function () { return v; });
  };

  Map.prototype.remove = function remove (k) {
    return updateMap(this, k, NOT_SET);
  };

  Map.prototype.deleteIn = function deleteIn (keyPath) {
    keyPath = [].concat( coerceKeyPath(keyPath) );
    if (keyPath.length) {
      var lastKey = keyPath.pop();
      return this.updateIn(keyPath, function (c) { return c && c.remove(lastKey); });
    }
  };

  Map.prototype.deleteAll = function deleteAll (keys) {
    var collection = Collection(keys);

    if (collection.size === 0) {
      return this;
    }

    return this.withMutations(function (map) {
      collection.forEach(function (key) { return map.remove(key); });
    });
  };

  Map.prototype.update = function update (k, notSetValue, updater) {
    return arguments.length === 1
      ? k(this)
      : this.updateIn([k], notSetValue, updater);
  };

  Map.prototype.updateIn = function updateIn (keyPath, notSetValue, updater) {
    if (!updater) {
      updater = notSetValue;
      notSetValue = undefined;
    }
    var updatedValue = updateInDeepMap(
      this,
      coerceKeyPath(keyPath),
      0,
      notSetValue,
      updater
    );
    return updatedValue === NOT_SET ? notSetValue : updatedValue;
  };

  Map.prototype.clear = function clear () {
    if (this.size === 0) {
      return this;
    }
    if (this.__ownerID) {
      this.size = 0;
      this._root = null;
      this.__hash = undefined;
      this.__altered = true;
      return this;
    }
    return emptyMap();
  };

  // @pragma Composition

  Map.prototype.merge = function merge (/*...iters*/) {
    return mergeIntoMapWith(this, undefined, arguments);
  };

  Map.prototype.mergeWith = function mergeWith (merger) {
    var iters = [], len = arguments.length - 1;
    while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];

    return mergeIntoMapWith(this, merger, iters);
  };

  Map.prototype.mergeIn = function mergeIn (keyPath) {
    var iters = [], len = arguments.length - 1;
    while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];

    return this.updateIn(
      keyPath,
      emptyMap(),
      function (m) { return typeof m.merge === 'function'
          ? m.merge.apply(m, iters)
          : iters[iters.length - 1]; }
    );
  };

  Map.prototype.mergeDeep = function mergeDeep (/*...iters*/) {
    return mergeIntoMapWith(this, deepMerger, arguments);
  };

  Map.prototype.mergeDeepWith = function mergeDeepWith (merger) {
    var iters = [], len = arguments.length - 1;
    while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];

    return mergeIntoMapWith(this, deepMergerWith(merger), iters);
  };

  Map.prototype.mergeDeepIn = function mergeDeepIn (keyPath) {
    var iters = [], len = arguments.length - 1;
    while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];

    return this.updateIn(
      keyPath,
      emptyMap(),
      function (m) { return typeof m.mergeDeep === 'function'
          ? m.mergeDeep.apply(m, iters)
          : iters[iters.length - 1]; }
    );
  };

  Map.prototype.sort = function sort (comparator) {
    // Late binding
    return OrderedMap(sortFactory(this, comparator));
  };

  Map.prototype.sortBy = function sortBy (mapper, comparator) {
    // Late binding
    return OrderedMap(sortFactory(this, comparator, mapper));
  };

  // @pragma Mutability

  Map.prototype.withMutations = function withMutations (fn) {
    var mutable = this.asMutable();
    fn(mutable);
    return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
  };

  Map.prototype.asMutable = function asMutable () {
    return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
  };

  Map.prototype.asImmutable = function asImmutable () {
    return this.__ensureOwner();
  };

  Map.prototype.wasAltered = function wasAltered () {
    return this.__altered;
  };

  Map.prototype.__iterator = function __iterator (type, reverse) {
    return new MapIterator(this, type, reverse);
  };

  Map.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    var iterations = 0;
    this._root &&
      this._root.iterate(
        function (entry) {
          iterations++;
          return fn(entry[1], entry[0], this$1);
        },
        reverse
      );
    return iterations;
  };

  Map.prototype.__ensureOwner = function __ensureOwner (ownerID) {
    if (ownerID === this.__ownerID) {
      return this;
    }
    if (!ownerID) {
      if (this.size === 0) {
        return emptyMap();
      }
      this.__ownerID = ownerID;
      this.__altered = false;
      return this;
    }
    return makeMap(this.size, this._root, ownerID, this.__hash);
  };

  return Map;
}(KeyedCollection));

function isMap(maybeMap) {
  return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
}

Map.isMap = isMap;

var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

var MapPrototype = Map.prototype;
MapPrototype[IS_MAP_SENTINEL] = true;
MapPrototype[DELETE] = MapPrototype.remove;
MapPrototype.removeIn = MapPrototype.deleteIn;
MapPrototype.removeAll = MapPrototype.deleteAll;

// #pragma Trie Nodes

var ArrayMapNode = function ArrayMapNode(ownerID, entries) {
  this.ownerID = ownerID;
  this.entries = entries;
};

ArrayMapNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
  var entries = this.entries;
  for (var ii = 0, len = entries.length; ii < len; ii++) {
    if (is(key, entries[ii][0])) {
      return entries[ii][1];
    }
  }
  return notSetValue;
};

ArrayMapNode.prototype.update = function update (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
  var removed = value === NOT_SET;

  var entries = this.entries;
  var idx = 0;
  var len = entries.length;
  for (; idx < len; idx++) {
    if (is(key, entries[idx][0])) {
      break;
    }
  }
  var exists = idx < len;

  if (exists ? entries[idx][1] === value : removed) {
    return this;
  }

  SetRef(didAlter);
  (removed || !exists) && SetRef(didChangeSize);

  if (removed && entries.length === 1) {
    return; // undefined
  }

  if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
    return createNodes(ownerID, entries, key, value);
  }

  var isEditable = ownerID && ownerID === this.ownerID;
  var newEntries = isEditable ? entries : arrCopy(entries);

  if (exists) {
    if (removed) {
      idx === len - 1
        ? newEntries.pop()
        : (newEntries[idx] = newEntries.pop());
    } else {
      newEntries[idx] = [key, value];
    }
  } else {
    newEntries.push([key, value]);
  }

  if (isEditable) {
    this.entries = newEntries;
    return this;
  }

  return new ArrayMapNode(ownerID, newEntries);
};

var BitmapIndexedNode = function BitmapIndexedNode(ownerID, bitmap, nodes) {
  this.ownerID = ownerID;
  this.bitmap = bitmap;
  this.nodes = nodes;
};

BitmapIndexedNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
  if (keyHash === undefined) {
    keyHash = hash(key);
  }
  var bit = 1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK);
  var bitmap = this.bitmap;
  return (bitmap & bit) === 0
    ? notSetValue
    : this.nodes[popCount(bitmap & bit - 1)].get(
        shift + SHIFT,
        keyHash,
        key,
        notSetValue
      );
};

BitmapIndexedNode.prototype.update = function update (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
  if (keyHash === undefined) {
    keyHash = hash(key);
  }
  var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
  var bit = 1 << keyHashFrag;
  var bitmap = this.bitmap;
  var exists = (bitmap & bit) !== 0;

  if (!exists && value === NOT_SET) {
    return this;
  }

  var idx = popCount(bitmap & bit - 1);
  var nodes = this.nodes;
  var node = exists ? nodes[idx] : undefined;
  var newNode = updateNode(
    node,
    ownerID,
    shift + SHIFT,
    keyHash,
    key,
    value,
    didChangeSize,
    didAlter
  );

  if (newNode === node) {
    return this;
  }

  if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
    return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
  }

  if (
    exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])
  ) {
    return nodes[idx ^ 1];
  }

  if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
    return newNode;
  }

  var isEditable = ownerID && ownerID === this.ownerID;
  var newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
  var newNodes = exists
    ? newNode
        ? setIn(nodes, idx, newNode, isEditable)
        : spliceOut(nodes, idx, isEditable)
    : spliceIn(nodes, idx, newNode, isEditable);

  if (isEditable) {
    this.bitmap = newBitmap;
    this.nodes = newNodes;
    return this;
  }

  return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
};

var HashArrayMapNode = function HashArrayMapNode(ownerID, count, nodes) {
  this.ownerID = ownerID;
  this.count = count;
  this.nodes = nodes;
};

HashArrayMapNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
  if (keyHash === undefined) {
    keyHash = hash(key);
  }
  var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
  var node = this.nodes[idx];
  return node
    ? node.get(shift + SHIFT, keyHash, key, notSetValue)
    : notSetValue;
};

HashArrayMapNode.prototype.update = function update (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
  if (keyHash === undefined) {
    keyHash = hash(key);
  }
  var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
  var removed = value === NOT_SET;
  var nodes = this.nodes;
  var node = nodes[idx];

  if (removed && !node) {
    return this;
  }

  var newNode = updateNode(
    node,
    ownerID,
    shift + SHIFT,
    keyHash,
    key,
    value,
    didChangeSize,
    didAlter
  );
  if (newNode === node) {
    return this;
  }

  var newCount = this.count;
  if (!node) {
    newCount++;
  } else if (!newNode) {
    newCount--;
    if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
      return packNodes(ownerID, nodes, newCount, idx);
    }
  }

  var isEditable = ownerID && ownerID === this.ownerID;
  var newNodes = setIn(nodes, idx, newNode, isEditable);

  if (isEditable) {
    this.count = newCount;
    this.nodes = newNodes;
    return this;
  }

  return new HashArrayMapNode(ownerID, newCount, newNodes);
};

var HashCollisionNode = function HashCollisionNode(ownerID, keyHash, entries) {
  this.ownerID = ownerID;
  this.keyHash = keyHash;
  this.entries = entries;
};

HashCollisionNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
  var entries = this.entries;
  for (var ii = 0, len = entries.length; ii < len; ii++) {
    if (is(key, entries[ii][0])) {
      return entries[ii][1];
    }
  }
  return notSetValue;
};

HashCollisionNode.prototype.update = function update (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
  if (keyHash === undefined) {
    keyHash = hash(key);
  }

  var removed = value === NOT_SET;

  if (keyHash !== this.keyHash) {
    if (removed) {
      return this;
    }
    SetRef(didAlter);
    SetRef(didChangeSize);
    return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
  }

  var entries = this.entries;
  var idx = 0;
  var len = entries.length;
  for (; idx < len; idx++) {
    if (is(key, entries[idx][0])) {
      break;
    }
  }
  var exists = idx < len;

  if (exists ? entries[idx][1] === value : removed) {
    return this;
  }

  SetRef(didAlter);
  (removed || !exists) && SetRef(didChangeSize);

  if (removed && len === 2) {
    return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
  }

  var isEditable = ownerID && ownerID === this.ownerID;
  var newEntries = isEditable ? entries : arrCopy(entries);

  if (exists) {
    if (removed) {
      idx === len - 1
        ? newEntries.pop()
        : (newEntries[idx] = newEntries.pop());
    } else {
      newEntries[idx] = [key, value];
    }
  } else {
    newEntries.push([key, value]);
  }

  if (isEditable) {
    this.entries = newEntries;
    return this;
  }

  return new HashCollisionNode(ownerID, this.keyHash, newEntries);
};

var ValueNode = function ValueNode(ownerID, keyHash, entry) {
  this.ownerID = ownerID;
  this.keyHash = keyHash;
  this.entry = entry;
};

ValueNode.prototype.get = function get (shift, keyHash, key, notSetValue) {
  return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
};

ValueNode.prototype.update = function update (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
  var removed = value === NOT_SET;
  var keyMatch = is(key, this.entry[0]);
  if (keyMatch ? value === this.entry[1] : removed) {
    return this;
  }

  SetRef(didAlter);

  if (removed) {
    SetRef(didChangeSize);
    return; // undefined
  }

  if (keyMatch) {
    if (ownerID && ownerID === this.ownerID) {
      this.entry[1] = value;
      return this;
    }
    return new ValueNode(ownerID, this.keyHash, [key, value]);
  }

  SetRef(didChangeSize);
  return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
};

// #pragma Iterators

ArrayMapNode.prototype.iterate = (HashCollisionNode.prototype.iterate = function(
  fn,
  reverse
) {
  var entries = this.entries;
  for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
    if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
      return false;
    }
  }
});

BitmapIndexedNode.prototype.iterate = (HashArrayMapNode.prototype.iterate = function(
  fn,
  reverse
) {
  var nodes = this.nodes;
  for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
    var node = nodes[reverse ? maxIndex - ii : ii];
    if (node && node.iterate(fn, reverse) === false) {
      return false;
    }
  }
});

// eslint-disable-next-line no-unused-vars
ValueNode.prototype.iterate = function(fn, reverse) {
  return fn(this.entry);
};

var MapIterator = (function (Iterator$$1) {
  function MapIterator(map, type, reverse) {
    this._type = type;
    this._reverse = reverse;
    this._stack = map._root && mapIteratorFrame(map._root);
  }

  if ( Iterator$$1 ) MapIterator.__proto__ = Iterator$$1;
  MapIterator.prototype = Object.create( Iterator$$1 && Iterator$$1.prototype );
  MapIterator.prototype.constructor = MapIterator;

  MapIterator.prototype.next = function next () {
    var this$1 = this;

    var type = this._type;
    var stack = this._stack;
    while (stack) {
      var node = stack.node;
      var index = stack.index++;
      var maxIndex = (void 0);
      if (node.entry) {
        if (index === 0) {
          return mapIteratorValue(type, node.entry);
        }
      } else if (node.entries) {
        maxIndex = node.entries.length - 1;
        if (index <= maxIndex) {
          return mapIteratorValue(
            type,
            node.entries[this$1._reverse ? maxIndex - index : index]
          );
        }
      } else {
        maxIndex = node.nodes.length - 1;
        if (index <= maxIndex) {
          var subNode = node.nodes[this$1._reverse ? maxIndex - index : index];
          if (subNode) {
            if (subNode.entry) {
              return mapIteratorValue(type, subNode.entry);
            }
            stack = (this$1._stack = mapIteratorFrame(subNode, stack));
          }
          continue;
        }
      }
      stack = (this$1._stack = this$1._stack.__prev);
    }
    return iteratorDone();
  };

  return MapIterator;
}(Iterator));

function mapIteratorValue(type, entry) {
  return iteratorValue(type, entry[0], entry[1]);
}

function mapIteratorFrame(node, prev) {
  return {
    node: node,
    index: 0,
    __prev: prev
  };
}

function makeMap(size, root, ownerID, hash$$1) {
  var map = Object.create(MapPrototype);
  map.size = size;
  map._root = root;
  map.__ownerID = ownerID;
  map.__hash = hash$$1;
  map.__altered = false;
  return map;
}

var EMPTY_MAP;
function emptyMap() {
  return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
}

function updateMap(map, k, v) {
  var newRoot;
  var newSize;
  if (!map._root) {
    if (v === NOT_SET) {
      return map;
    }
    newSize = 1;
    newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
  } else {
    var didChangeSize = MakeRef(CHANGE_LENGTH);
    var didAlter = MakeRef(DID_ALTER);
    newRoot = updateNode(
      map._root,
      map.__ownerID,
      0,
      undefined,
      k,
      v,
      didChangeSize,
      didAlter
    );
    if (!didAlter.value) {
      return map;
    }
    newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
  }
  if (map.__ownerID) {
    map.size = newSize;
    map._root = newRoot;
    map.__hash = undefined;
    map.__altered = true;
    return map;
  }
  return newRoot ? makeMap(newSize, newRoot) : emptyMap();
}

function updateNode(
  node,
  ownerID,
  shift,
  keyHash,
  key,
  value,
  didChangeSize,
  didAlter
) {
  if (!node) {
    if (value === NOT_SET) {
      return node;
    }
    SetRef(didAlter);
    SetRef(didChangeSize);
    return new ValueNode(ownerID, keyHash, [key, value]);
  }
  return node.update(
    ownerID,
    shift,
    keyHash,
    key,
    value,
    didChangeSize,
    didAlter
  );
}

function isLeafNode(node) {
  return node.constructor === ValueNode ||
    node.constructor === HashCollisionNode;
}

function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
  if (node.keyHash === keyHash) {
    return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
  }

  var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
  var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;

  var newNode;
  var nodes = idx1 === idx2
    ? [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)]
    : ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2
        ? [node, newNode]
        : [newNode, node]);

  return new BitmapIndexedNode(ownerID, 1 << idx1 | 1 << idx2, nodes);
}

function createNodes(ownerID, entries, key, value) {
  if (!ownerID) {
    ownerID = new OwnerID();
  }
  var node = new ValueNode(ownerID, hash(key), [key, value]);
  for (var ii = 0; ii < entries.length; ii++) {
    var entry = entries[ii];
    node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
  }
  return node;
}

function packNodes(ownerID, nodes, count, excluding) {
  var bitmap = 0;
  var packedII = 0;
  var packedNodes = new Array(count);
  for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, (bit <<= 1)) {
    var node = nodes[ii];
    if (node !== undefined && ii !== excluding) {
      bitmap |= bit;
      packedNodes[packedII++] = node;
    }
  }
  return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
}

function expandNodes(ownerID, nodes, bitmap, including, node) {
  var count = 0;
  var expandedNodes = new Array(SIZE);
  for (var ii = 0; bitmap !== 0; ii++, (bitmap >>>= 1)) {
    expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
  }
  expandedNodes[including] = node;
  return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
}

function mergeIntoMapWith(map, merger, collections) {
  var iters = [];
  for (var ii = 0; ii < collections.length; ii++) {
    var value = collections[ii];
    var iter = KeyedCollection(value);
    if (!isCollection(value)) {
      iter = iter.map(function (v) { return fromJS(v); });
    }
    iters.push(iter);
  }
  return mergeIntoCollectionWith(map, merger, iters);
}

function deepMerger(oldVal, newVal) {
  return oldVal && oldVal.mergeDeep && isCollection(newVal)
    ? oldVal.mergeDeep(newVal)
    : is(oldVal, newVal) ? oldVal : newVal;
}

function deepMergerWith(merger) {
  return function (oldVal, newVal, key) {
    if (oldVal && oldVal.mergeDeepWith && isCollection(newVal)) {
      return oldVal.mergeDeepWith(merger, newVal);
    }
    var nextValue = merger(oldVal, newVal, key);
    return is(oldVal, nextValue) ? oldVal : nextValue;
  };
}

function mergeIntoCollectionWith(collection, merger, iters) {
  iters = iters.filter(function (x) { return x.size !== 0; });
  if (iters.length === 0) {
    return collection;
  }
  if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
    return collection.constructor(iters[0]);
  }
  return collection.withMutations(function (collection) {
    var mergeIntoMap = merger
      ? function (value, key) {
          collection.update(
            key,
            NOT_SET,
            function (oldVal) { return oldVal === NOT_SET ? value : merger(oldVal, value, key); }
          );
        }
      : function (value, key) {
          collection.set(key, value);
        };
    for (var ii = 0; ii < iters.length; ii++) {
      iters[ii].forEach(mergeIntoMap);
    }
  });
}

function updateInDeepMap(existing, keyPath, i, notSetValue, updater) {
  var isNotSet = existing === NOT_SET;
  if (i === keyPath.length) {
    var existingValue = isNotSet ? notSetValue : existing;
    var newValue = updater(existingValue);
    return newValue === existingValue ? existing : newValue;
  }
  if (!(isNotSet || (existing && existing.set))) {
    throw new TypeError(
      'Invalid keyPath: Value at [' +
        keyPath.slice(0, i).map(quoteString) +
        '] does not have a .set() method and cannot be updated: ' +
        existing
    );
  }
  var key = keyPath[i];
  var nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET);
  var nextUpdated = updateInDeepMap(
    nextExisting,
    keyPath,
    i + 1,
    notSetValue,
    updater
  );
  return nextUpdated === nextExisting
    ? existing
    : nextUpdated === NOT_SET
        ? existing.remove(key)
        : (isNotSet ? emptyMap() : existing).set(key, nextUpdated);
}

function popCount(x) {
  x -= x >> 1 & 0x55555555;
  x = (x & 0x33333333) + (x >> 2 & 0x33333333);
  x = x + (x >> 4) & 0x0f0f0f0f;
  x += x >> 8;
  x += x >> 16;
  return x & 0x7f;
}

function setIn(array, idx, val, canEdit) {
  var newArray = canEdit ? array : arrCopy(array);
  newArray[idx] = val;
  return newArray;
}

function spliceIn(array, idx, val, canEdit) {
  var newLen = array.length + 1;
  if (canEdit && idx + 1 === newLen) {
    array[idx] = val;
    return array;
  }
  var newArray = new Array(newLen);
  var after = 0;
  for (var ii = 0; ii < newLen; ii++) {
    if (ii === idx) {
      newArray[ii] = val;
      after = -1;
    } else {
      newArray[ii] = array[ii + after];
    }
  }
  return newArray;
}

function spliceOut(array, idx, canEdit) {
  var newLen = array.length - 1;
  if (canEdit && idx === newLen) {
    array.pop();
    return array;
  }
  var newArray = new Array(newLen);
  var after = 0;
  for (var ii = 0; ii < newLen; ii++) {
    if (ii === idx) {
      after = 1;
    }
    newArray[ii] = array[ii + after];
  }
  return newArray;
}

var MAX_ARRAY_MAP_SIZE = SIZE / 4;
var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

var List = (function (IndexedCollection$$1) {
  function List(value) {
    var empty = emptyList();
    if (value === null || value === undefined) {
      return empty;
    }
    if (isList(value)) {
      return value;
    }
    var iter = IndexedCollection$$1(value);
    var size = iter.size;
    if (size === 0) {
      return empty;
    }
    assertNotInfinite(size);
    if (size > 0 && size < SIZE) {
      return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
    }
    return empty.withMutations(function (list) {
      list.setSize(size);
      iter.forEach(function (v, i) { return list.set(i, v); });
    });
  }

  if ( IndexedCollection$$1 ) List.__proto__ = IndexedCollection$$1;
  List.prototype = Object.create( IndexedCollection$$1 && IndexedCollection$$1.prototype );
  List.prototype.constructor = List;

  List.of = function of (/*...values*/) {
    return this(arguments);
  };

  List.prototype.toString = function toString () {
    return this.__toString('List [', ']');
  };

  // @pragma Access

  List.prototype.get = function get (index, notSetValue) {
    index = wrapIndex(this, index);
    if (index >= 0 && index < this.size) {
      index += this._origin;
      var node = listNodeFor(this, index);
      return node && node.array[index & MASK];
    }
    return notSetValue;
  };

  // @pragma Modification

  List.prototype.set = function set (index, value) {
    return updateList(this, index, value);
  };

  List.prototype.remove = function remove (index) {
    return !this.has(index)
      ? this
      : index === 0
          ? this.shift()
          : index === this.size - 1 ? this.pop() : this.splice(index, 1);
  };

  List.prototype.insert = function insert (index, value) {
    return this.splice(index, 0, value);
  };

  List.prototype.clear = function clear () {
    if (this.size === 0) {
      return this;
    }
    if (this.__ownerID) {
      this.size = (this._origin = (this._capacity = 0));
      this._level = SHIFT;
      this._root = (this._tail = null);
      this.__hash = undefined;
      this.__altered = true;
      return this;
    }
    return emptyList();
  };

  List.prototype.push = function push (/*...values*/) {
    var values = arguments;
    var oldSize = this.size;
    return this.withMutations(function (list) {
      setListBounds(list, 0, oldSize + values.length);
      for (var ii = 0; ii < values.length; ii++) {
        list.set(oldSize + ii, values[ii]);
      }
    });
  };

  List.prototype.pop = function pop () {
    return setListBounds(this, 0, -1);
  };

  List.prototype.unshift = function unshift (/*...values*/) {
    var values = arguments;
    return this.withMutations(function (list) {
      setListBounds(list, -values.length);
      for (var ii = 0; ii < values.length; ii++) {
        list.set(ii, values[ii]);
      }
    });
  };

  List.prototype.shift = function shift () {
    return setListBounds(this, 1);
  };

  // @pragma Composition

  List.prototype.merge = function merge (/*...iters*/) {
    return mergeIntoListWith(this, undefined, arguments);
  };

  List.prototype.mergeWith = function mergeWith (merger) {
    var iters = [], len = arguments.length - 1;
    while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];

    return mergeIntoListWith(this, merger, iters);
  };

  List.prototype.mergeDeep = function mergeDeep (/*...iters*/) {
    return mergeIntoListWith(this, deepMerger, arguments);
  };

  List.prototype.mergeDeepWith = function mergeDeepWith (merger) {
    var iters = [], len = arguments.length - 1;
    while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];

    return mergeIntoListWith(this, deepMergerWith(merger), iters);
  };

  List.prototype.setSize = function setSize (size) {
    return setListBounds(this, 0, size);
  };

  // @pragma Iteration

  List.prototype.slice = function slice (begin, end) {
    var size = this.size;
    if (wholeSlice(begin, end, size)) {
      return this;
    }
    return setListBounds(
      this,
      resolveBegin(begin, size),
      resolveEnd(end, size)
    );
  };

  List.prototype.__iterator = function __iterator (type, reverse) {
    var index = reverse ? this.size : 0;
    var values = iterateList(this, reverse);
    return new Iterator(function () {
      var value = values();
      return value === DONE
        ? iteratorDone()
        : iteratorValue(type, reverse ? --index : index++, value);
    });
  };

  List.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    var index = reverse ? this.size : 0;
    var values = iterateList(this, reverse);
    var value;
    while ((value = values()) !== DONE) {
      if (fn(value, reverse ? --index : index++, this$1) === false) {
        break;
      }
    }
    return index;
  };

  List.prototype.__ensureOwner = function __ensureOwner (ownerID) {
    if (ownerID === this.__ownerID) {
      return this;
    }
    if (!ownerID) {
      if (this.size === 0) {
        return emptyList();
      }
      this.__ownerID = ownerID;
      return this;
    }
    return makeList(
      this._origin,
      this._capacity,
      this._level,
      this._root,
      this._tail,
      ownerID,
      this.__hash
    );
  };

  return List;
}(IndexedCollection));

function isList(maybeList) {
  return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
}

List.isList = isList;

var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

var ListPrototype = List.prototype;
ListPrototype[IS_LIST_SENTINEL] = true;
ListPrototype[DELETE] = ListPrototype.remove;
ListPrototype.setIn = MapPrototype.setIn;
ListPrototype.deleteIn = (ListPrototype.removeIn = MapPrototype.removeIn);
ListPrototype.update = MapPrototype.update;
ListPrototype.updateIn = MapPrototype.updateIn;
ListPrototype.mergeIn = MapPrototype.mergeIn;
ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
ListPrototype.withMutations = MapPrototype.withMutations;
ListPrototype.asMutable = MapPrototype.asMutable;
ListPrototype.asImmutable = MapPrototype.asImmutable;
ListPrototype.wasAltered = MapPrototype.wasAltered;

var VNode = function VNode(array, ownerID) {
  this.array = array;
  this.ownerID = ownerID;
};

// TODO: seems like these methods are very similar

VNode.prototype.removeBefore = function removeBefore (ownerID, level, index) {
  if (index === level ? 1 << level : 0 || this.array.length === 0) {
    return this;
  }
  var originIndex = index >>> level & MASK;
  if (originIndex >= this.array.length) {
    return new VNode([], ownerID);
  }
  var removingFirst = originIndex === 0;
  var newChild;
  if (level > 0) {
    var oldChild = this.array[originIndex];
    newChild = oldChild &&
      oldChild.removeBefore(ownerID, level - SHIFT, index);
    if (newChild === oldChild && removingFirst) {
      return this;
    }
  }
  if (removingFirst && !newChild) {
    return this;
  }
  var editable = editableVNode(this, ownerID);
  if (!removingFirst) {
    for (var ii = 0; ii < originIndex; ii++) {
      editable.array[ii] = undefined;
    }
  }
  if (newChild) {
    editable.array[originIndex] = newChild;
  }
  return editable;
};

VNode.prototype.removeAfter = function removeAfter (ownerID, level, index) {
  if (index === (level ? 1 << level : 0) || this.array.length === 0) {
    return this;
  }
  var sizeIndex = index - 1 >>> level & MASK;
  if (sizeIndex >= this.array.length) {
    return this;
  }

  var newChild;
  if (level > 0) {
    var oldChild = this.array[sizeIndex];
    newChild = oldChild &&
      oldChild.removeAfter(ownerID, level - SHIFT, index);
    if (newChild === oldChild && sizeIndex === this.array.length - 1) {
      return this;
    }
  }

  var editable = editableVNode(this, ownerID);
  editable.array.splice(sizeIndex + 1);
  if (newChild) {
    editable.array[sizeIndex] = newChild;
  }
  return editable;
};

var DONE = {};

function iterateList(list, reverse) {
  var left = list._origin;
  var right = list._capacity;
  var tailPos = getTailOffset(right);
  var tail = list._tail;

  return iterateNodeOrLeaf(list._root, list._level, 0);

  function iterateNodeOrLeaf(node, level, offset) {
    return level === 0
      ? iterateLeaf(node, offset)
      : iterateNode(node, level, offset);
  }

  function iterateLeaf(node, offset) {
    var array = offset === tailPos ? tail && tail.array : node && node.array;
    var from = offset > left ? 0 : left - offset;
    var to = right - offset;
    if (to > SIZE) {
      to = SIZE;
    }
    return function () {
      if (from === to) {
        return DONE;
      }
      var idx = reverse ? --to : from++;
      return array && array[idx];
    };
  }

  function iterateNode(node, level, offset) {
    var values;
    var array = node && node.array;
    var from = offset > left ? 0 : left - offset >> level;
    var to = (right - offset >> level) + 1;
    if (to > SIZE) {
      to = SIZE;
    }
    return function () {
      while (true) {
        if (values) {
          var value = values();
          if (value !== DONE) {
            return value;
          }
          values = null;
        }
        if (from === to) {
          return DONE;
        }
        var idx = reverse ? --to : from++;
        values = iterateNodeOrLeaf(
          array && array[idx],
          level - SHIFT,
          offset + (idx << level)
        );
      }
    };
  }
}

function makeList(origin, capacity, level, root, tail, ownerID, hash) {
  var list = Object.create(ListPrototype);
  list.size = capacity - origin;
  list._origin = origin;
  list._capacity = capacity;
  list._level = level;
  list._root = root;
  list._tail = tail;
  list.__ownerID = ownerID;
  list.__hash = hash;
  list.__altered = false;
  return list;
}

var EMPTY_LIST;
function emptyList() {
  return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
}

function updateList(list, index, value) {
  index = wrapIndex(list, index);

  if (index !== index) {
    return list;
  }

  if (index >= list.size || index < 0) {
    return list.withMutations(function (list) {
      index < 0
        ? setListBounds(list, index).set(0, value)
        : setListBounds(list, 0, index + 1).set(index, value);
    });
  }

  index += list._origin;

  var newTail = list._tail;
  var newRoot = list._root;
  var didAlter = MakeRef(DID_ALTER);
  if (index >= getTailOffset(list._capacity)) {
    newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
  } else {
    newRoot = updateVNode(
      newRoot,
      list.__ownerID,
      list._level,
      index,
      value,
      didAlter
    );
  }

  if (!didAlter.value) {
    return list;
  }

  if (list.__ownerID) {
    list._root = newRoot;
    list._tail = newTail;
    list.__hash = undefined;
    list.__altered = true;
    return list;
  }
  return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
}

function updateVNode(node, ownerID, level, index, value, didAlter) {
  var idx = index >>> level & MASK;
  var nodeHas = node && idx < node.array.length;
  if (!nodeHas && value === undefined) {
    return node;
  }

  var newNode;

  if (level > 0) {
    var lowerNode = node && node.array[idx];
    var newLowerNode = updateVNode(
      lowerNode,
      ownerID,
      level - SHIFT,
      index,
      value,
      didAlter
    );
    if (newLowerNode === lowerNode) {
      return node;
    }
    newNode = editableVNode(node, ownerID);
    newNode.array[idx] = newLowerNode;
    return newNode;
  }

  if (nodeHas && node.array[idx] === value) {
    return node;
  }

  SetRef(didAlter);

  newNode = editableVNode(node, ownerID);
  if (value === undefined && idx === newNode.array.length - 1) {
    newNode.array.pop();
  } else {
    newNode.array[idx] = value;
  }
  return newNode;
}

function editableVNode(node, ownerID) {
  if (ownerID && node && ownerID === node.ownerID) {
    return node;
  }
  return new VNode(node ? node.array.slice() : [], ownerID);
}

function listNodeFor(list, rawIndex) {
  if (rawIndex >= getTailOffset(list._capacity)) {
    return list._tail;
  }
  if (rawIndex < 1 << list._level + SHIFT) {
    var node = list._root;
    var level = list._level;
    while (node && level > 0) {
      node = node.array[rawIndex >>> level & MASK];
      level -= SHIFT;
    }
    return node;
  }
}

function setListBounds(list, begin, end) {
  // Sanitize begin & end using this shorthand for ToInt32(argument)
  // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
  if (begin !== undefined) {
    begin |= 0;
  }
  if (end !== undefined) {
    end |= 0;
  }
  var owner = list.__ownerID || new OwnerID();
  var oldOrigin = list._origin;
  var oldCapacity = list._capacity;
  var newOrigin = oldOrigin + begin;
  var newCapacity = end === undefined
    ? oldCapacity
    : end < 0 ? oldCapacity + end : oldOrigin + end;
  if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
    return list;
  }

  // If it's going to end after it starts, it's empty.
  if (newOrigin >= newCapacity) {
    return list.clear();
  }

  var newLevel = list._level;
  var newRoot = list._root;

  // New origin might need creating a higher root.
  var offsetShift = 0;
  while (newOrigin + offsetShift < 0) {
    newRoot = new VNode(
      newRoot && newRoot.array.length ? [undefined, newRoot] : [],
      owner
    );
    newLevel += SHIFT;
    offsetShift += 1 << newLevel;
  }
  if (offsetShift) {
    newOrigin += offsetShift;
    oldOrigin += offsetShift;
    newCapacity += offsetShift;
    oldCapacity += offsetShift;
  }

  var oldTailOffset = getTailOffset(oldCapacity);
  var newTailOffset = getTailOffset(newCapacity);

  // New size might need creating a higher root.
  while (newTailOffset >= 1 << newLevel + SHIFT) {
    newRoot = new VNode(
      newRoot && newRoot.array.length ? [newRoot] : [],
      owner
    );
    newLevel += SHIFT;
  }

  // Locate or create the new tail.
  var oldTail = list._tail;
  var newTail = newTailOffset < oldTailOffset
    ? listNodeFor(list, newCapacity - 1)
    : newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;

  // Merge Tail into tree.
  if (
    oldTail &&
    newTailOffset > oldTailOffset &&
    newOrigin < oldCapacity &&
    oldTail.array.length
  ) {
    newRoot = editableVNode(newRoot, owner);
    var node = newRoot;
    for (var level = newLevel; level > SHIFT; level -= SHIFT) {
      var idx = oldTailOffset >>> level & MASK;
      node = (node.array[idx] = editableVNode(node.array[idx], owner));
    }
    node.array[oldTailOffset >>> SHIFT & MASK] = oldTail;
  }

  // If the size has been reduced, there's a chance the tail needs to be trimmed.
  if (newCapacity < oldCapacity) {
    newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
  }

  // If the new origin is within the tail, then we do not need a root.
  if (newOrigin >= newTailOffset) {
    newOrigin -= newTailOffset;
    newCapacity -= newTailOffset;
    newLevel = SHIFT;
    newRoot = null;
    newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);

    // Otherwise, if the root has been trimmed, garbage collect.
  } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
    offsetShift = 0;

    // Identify the new top root node of the subtree of the old root.
    while (newRoot) {
      var beginIndex = newOrigin >>> newLevel & MASK;
      if (beginIndex !== newTailOffset >>> newLevel & MASK) {
        break;
      }
      if (beginIndex) {
        offsetShift += (1 << newLevel) * beginIndex;
      }
      newLevel -= SHIFT;
      newRoot = newRoot.array[beginIndex];
    }

    // Trim the new sides of the new root.
    if (newRoot && newOrigin > oldOrigin) {
      newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
    }
    if (newRoot && newTailOffset < oldTailOffset) {
      newRoot = newRoot.removeAfter(
        owner,
        newLevel,
        newTailOffset - offsetShift
      );
    }
    if (offsetShift) {
      newOrigin -= offsetShift;
      newCapacity -= offsetShift;
    }
  }

  if (list.__ownerID) {
    list.size = newCapacity - newOrigin;
    list._origin = newOrigin;
    list._capacity = newCapacity;
    list._level = newLevel;
    list._root = newRoot;
    list._tail = newTail;
    list.__hash = undefined;
    list.__altered = true;
    return list;
  }
  return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
}

function mergeIntoListWith(list, merger, collections) {
  var iters = [];
  var maxSize = 0;
  for (var ii = 0; ii < collections.length; ii++) {
    var value = collections[ii];
    var iter = IndexedCollection(value);
    if (iter.size > maxSize) {
      maxSize = iter.size;
    }
    if (!isCollection(value)) {
      iter = iter.map(function (v) { return fromJS(v); });
    }
    iters.push(iter);
  }
  if (maxSize > list.size) {
    list = list.setSize(maxSize);
  }
  return mergeIntoCollectionWith(list, merger, iters);
}

function getTailOffset(size) {
  return size < SIZE ? 0 : size - 1 >>> SHIFT << SHIFT;
}

var OrderedMap = (function (Map$$1) {
  function OrderedMap(value) {
    return value === null || value === undefined
      ? emptyOrderedMap()
      : isOrderedMap(value)
          ? value
          : emptyOrderedMap().withMutations(function (map) {
              var iter = KeyedCollection(value);
              assertNotInfinite(iter.size);
              iter.forEach(function (v, k) { return map.set(k, v); });
            });
  }

  if ( Map$$1 ) OrderedMap.__proto__ = Map$$1;
  OrderedMap.prototype = Object.create( Map$$1 && Map$$1.prototype );
  OrderedMap.prototype.constructor = OrderedMap;

  OrderedMap.of = function of (/*...values*/) {
    return this(arguments);
  };

  OrderedMap.prototype.toString = function toString () {
    return this.__toString('OrderedMap {', '}');
  };

  // @pragma Access

  OrderedMap.prototype.get = function get (k, notSetValue) {
    var index = this._map.get(k);
    return index !== undefined ? this._list.get(index)[1] : notSetValue;
  };

  // @pragma Modification

  OrderedMap.prototype.clear = function clear () {
    if (this.size === 0) {
      return this;
    }
    if (this.__ownerID) {
      this.size = 0;
      this._map.clear();
      this._list.clear();
      return this;
    }
    return emptyOrderedMap();
  };

  OrderedMap.prototype.set = function set (k, v) {
    return updateOrderedMap(this, k, v);
  };

  OrderedMap.prototype.remove = function remove (k) {
    return updateOrderedMap(this, k, NOT_SET);
  };

  OrderedMap.prototype.wasAltered = function wasAltered () {
    return this._map.wasAltered() || this._list.wasAltered();
  };

  OrderedMap.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    return this._list.__iterate(
      function (entry) { return entry && fn(entry[1], entry[0], this$1); },
      reverse
    );
  };

  OrderedMap.prototype.__iterator = function __iterator (type, reverse) {
    return this._list.fromEntrySeq().__iterator(type, reverse);
  };

  OrderedMap.prototype.__ensureOwner = function __ensureOwner (ownerID) {
    if (ownerID === this.__ownerID) {
      return this;
    }
    var newMap = this._map.__ensureOwner(ownerID);
    var newList = this._list.__ensureOwner(ownerID);
    if (!ownerID) {
      if (this.size === 0) {
        return emptyOrderedMap();
      }
      this.__ownerID = ownerID;
      this._map = newMap;
      this._list = newList;
      return this;
    }
    return makeOrderedMap(newMap, newList, ownerID, this.__hash);
  };

  return OrderedMap;
}(Map));

function isOrderedMap(maybeOrderedMap) {
  return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
}

OrderedMap.isOrderedMap = isOrderedMap;

OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;

function makeOrderedMap(map, list, ownerID, hash) {
  var omap = Object.create(OrderedMap.prototype);
  omap.size = map ? map.size : 0;
  omap._map = map;
  omap._list = list;
  omap.__ownerID = ownerID;
  omap.__hash = hash;
  return omap;
}

var EMPTY_ORDERED_MAP;
function emptyOrderedMap() {
  return EMPTY_ORDERED_MAP ||
    (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()));
}

function updateOrderedMap(omap, k, v) {
  var map = omap._map;
  var list = omap._list;
  var i = map.get(k);
  var has = i !== undefined;
  var newMap;
  var newList;
  if (v === NOT_SET) {
    // removed
    if (!has) {
      return omap;
    }
    if (list.size >= SIZE && list.size >= map.size * 2) {
      newList = list.filter(function (entry, idx) { return entry !== undefined && i !== idx; });
      newMap = newList.toKeyedSeq().map(function (entry) { return entry[0]; }).flip().toMap();
      if (omap.__ownerID) {
        newMap.__ownerID = (newList.__ownerID = omap.__ownerID);
      }
    } else {
      newMap = map.remove(k);
      newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
    }
  } else if (has) {
    if (v === list.get(i)[1]) {
      return omap;
    }
    newMap = map;
    newList = list.set(i, [k, v]);
  } else {
    newMap = map.set(k, list.size);
    newList = list.set(list.size, [k, v]);
  }
  if (omap.__ownerID) {
    omap.size = newMap.size;
    omap._map = newMap;
    omap._list = newList;
    omap.__hash = undefined;
    return omap;
  }
  return makeOrderedMap(newMap, newList);
}

var Stack = (function (IndexedCollection$$1) {
  function Stack(value) {
    return value === null || value === undefined
      ? emptyStack()
      : isStack(value) ? value : emptyStack().pushAll(value);
  }

  if ( IndexedCollection$$1 ) Stack.__proto__ = IndexedCollection$$1;
  Stack.prototype = Object.create( IndexedCollection$$1 && IndexedCollection$$1.prototype );
  Stack.prototype.constructor = Stack;

  Stack.of = function of (/*...values*/) {
    return this(arguments);
  };

  Stack.prototype.toString = function toString () {
    return this.__toString('Stack [', ']');
  };

  // @pragma Access

  Stack.prototype.get = function get (index, notSetValue) {
    var head = this._head;
    index = wrapIndex(this, index);
    while (head && index--) {
      head = head.next;
    }
    return head ? head.value : notSetValue;
  };

  Stack.prototype.peek = function peek () {
    return this._head && this._head.value;
  };

  // @pragma Modification

  Stack.prototype.push = function push (/*...values*/) {
    var arguments$1 = arguments;

    if (arguments.length === 0) {
      return this;
    }
    var newSize = this.size + arguments.length;
    var head = this._head;
    for (var ii = arguments.length - 1; ii >= 0; ii--) {
      head = {
        value: arguments$1[ii],
        next: head
      };
    }
    if (this.__ownerID) {
      this.size = newSize;
      this._head = head;
      this.__hash = undefined;
      this.__altered = true;
      return this;
    }
    return makeStack(newSize, head);
  };

  Stack.prototype.pushAll = function pushAll (iter) {
    iter = IndexedCollection$$1(iter);
    if (iter.size === 0) {
      return this;
    }
    if (this.size === 0 && isStack(iter)) {
      return iter;
    }
    assertNotInfinite(iter.size);
    var newSize = this.size;
    var head = this._head;
    iter.__iterate(
      function (value) {
        newSize++;
        head = {
          value: value,
          next: head
        };
      },
      /* reverse */ true
    );
    if (this.__ownerID) {
      this.size = newSize;
      this._head = head;
      this.__hash = undefined;
      this.__altered = true;
      return this;
    }
    return makeStack(newSize, head);
  };

  Stack.prototype.pop = function pop () {
    return this.slice(1);
  };

  Stack.prototype.clear = function clear () {
    if (this.size === 0) {
      return this;
    }
    if (this.__ownerID) {
      this.size = 0;
      this._head = undefined;
      this.__hash = undefined;
      this.__altered = true;
      return this;
    }
    return emptyStack();
  };

  Stack.prototype.slice = function slice (begin, end) {
    if (wholeSlice(begin, end, this.size)) {
      return this;
    }
    var resolvedBegin = resolveBegin(begin, this.size);
    var resolvedEnd = resolveEnd(end, this.size);
    if (resolvedEnd !== this.size) {
      // super.slice(begin, end);
      return IndexedCollection$$1.prototype.slice.call(this, begin, end);
    }
    var newSize = this.size - resolvedBegin;
    var head = this._head;
    while (resolvedBegin--) {
      head = head.next;
    }
    if (this.__ownerID) {
      this.size = newSize;
      this._head = head;
      this.__hash = undefined;
      this.__altered = true;
      return this;
    }
    return makeStack(newSize, head);
  };

  // @pragma Mutability

  Stack.prototype.__ensureOwner = function __ensureOwner (ownerID) {
    if (ownerID === this.__ownerID) {
      return this;
    }
    if (!ownerID) {
      if (this.size === 0) {
        return emptyStack();
      }
      this.__ownerID = ownerID;
      this.__altered = false;
      return this;
    }
    return makeStack(this.size, this._head, ownerID, this.__hash);
  };

  // @pragma Iteration

  Stack.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    if (reverse) {
      return new ArraySeq(this.toArray()).__iterate(
        function (v, k) { return fn(v, k, this$1); },
        reverse
      );
    }
    var iterations = 0;
    var node = this._head;
    while (node) {
      if (fn(node.value, iterations++, this$1) === false) {
        break;
      }
      node = node.next;
    }
    return iterations;
  };

  Stack.prototype.__iterator = function __iterator (type, reverse) {
    if (reverse) {
      return new ArraySeq(this.toArray()).__iterator(type, reverse);
    }
    var iterations = 0;
    var node = this._head;
    return new Iterator(function () {
      if (node) {
        var value = node.value;
        node = node.next;
        return iteratorValue(type, iterations++, value);
      }
      return iteratorDone();
    });
  };

  return Stack;
}(IndexedCollection));

function isStack(maybeStack) {
  return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
}

Stack.isStack = isStack;

var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

var StackPrototype = Stack.prototype;
StackPrototype[IS_STACK_SENTINEL] = true;
StackPrototype.withMutations = MapPrototype.withMutations;
StackPrototype.asMutable = MapPrototype.asMutable;
StackPrototype.asImmutable = MapPrototype.asImmutable;
StackPrototype.wasAltered = MapPrototype.wasAltered;
StackPrototype.shift = StackPrototype.pop;
StackPrototype.unshift = StackPrototype.push;
StackPrototype.unshiftAll = StackPrototype.pushAll;

function makeStack(size, head, ownerID, hash) {
  var map = Object.create(StackPrototype);
  map.size = size;
  map._head = head;
  map.__ownerID = ownerID;
  map.__hash = hash;
  map.__altered = false;
  return map;
}

var EMPTY_STACK;
function emptyStack() {
  return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
}

function deepEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (
    !isCollection(b) ||
    (a.size !== undefined && b.size !== undefined && a.size !== b.size) ||
    (a.__hash !== undefined &&
      b.__hash !== undefined &&
      a.__hash !== b.__hash) ||
    isKeyed(a) !== isKeyed(b) ||
    isIndexed(a) !== isIndexed(b) ||
    isOrdered(a) !== isOrdered(b)
  ) {
    return false;
  }

  if (a.size === 0 && b.size === 0) {
    return true;
  }

  var notAssociative = !isAssociative(a);

  if (isOrdered(a)) {
    var entries = a.entries();
    return b.every(function (v, k) {
      var entry = entries.next().value;
      return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
    }) && entries.next().done;
  }

  var flipped = false;

  if (a.size === undefined) {
    if (b.size === undefined) {
      if (typeof a.cacheResult === 'function') {
        a.cacheResult();
      }
    } else {
      flipped = true;
      var _ = a;
      a = b;
      b = _;
    }
  }

  var allEqual = true;
  var bSize = b.__iterate(function (v, k) {
    if (
      notAssociative
        ? !a.has(v)
        : flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)
    ) {
      allEqual = false;
      return false;
    }
  });

  return allEqual && a.size === bSize;
}

/**
 * Contributes additional methods to a constructor
 */
function mixin(ctor, methods) {
  var keyCopier = function (key) {
    ctor.prototype[key] = methods[key];
  };
  Object.keys(methods).forEach(keyCopier);
  Object.getOwnPropertySymbols &&
    Object.getOwnPropertySymbols(methods).forEach(keyCopier);
  return ctor;
}

var Set = (function (SetCollection$$1) {
  function Set(value) {
    return value === null || value === undefined
      ? emptySet()
      : isSet(value) && !isOrdered(value)
          ? value
          : emptySet().withMutations(function (set) {
              var iter = SetCollection$$1(value);
              assertNotInfinite(iter.size);
              iter.forEach(function (v) { return set.add(v); });
            });
  }

  if ( SetCollection$$1 ) Set.__proto__ = SetCollection$$1;
  Set.prototype = Object.create( SetCollection$$1 && SetCollection$$1.prototype );
  Set.prototype.constructor = Set;

  Set.of = function of (/*...values*/) {
    return this(arguments);
  };

  Set.fromKeys = function fromKeys (value) {
    return this(KeyedCollection(value).keySeq());
  };

  Set.intersect = function intersect (sets) {
    sets = Collection(sets).toArray();
    return sets.length
      ? SetPrototype.intersect.apply(Set(sets.pop()), sets)
      : emptySet();
  };

  Set.union = function union (sets) {
    sets = Collection(sets).toArray();
    return sets.length
      ? SetPrototype.union.apply(Set(sets.pop()), sets)
      : emptySet();
  };

  Set.prototype.toString = function toString () {
    return this.__toString('Set {', '}');
  };

  // @pragma Access

  Set.prototype.has = function has (value) {
    return this._map.has(value);
  };

  // @pragma Modification

  Set.prototype.add = function add (value) {
    return updateSet(this, this._map.set(value, true));
  };

  Set.prototype.remove = function remove (value) {
    return updateSet(this, this._map.remove(value));
  };

  Set.prototype.clear = function clear () {
    return updateSet(this, this._map.clear());
  };

  // @pragma Composition

  Set.prototype.union = function union () {
    var iters = [], len = arguments.length;
    while ( len-- ) iters[ len ] = arguments[ len ];

    iters = iters.filter(function (x) { return x.size !== 0; });
    if (iters.length === 0) {
      return this;
    }
    if (this.size === 0 && !this.__ownerID && iters.length === 1) {
      return this.constructor(iters[0]);
    }
    return this.withMutations(function (set) {
      for (var ii = 0; ii < iters.length; ii++) {
        SetCollection$$1(iters[ii]).forEach(function (value) { return set.add(value); });
      }
    });
  };

  Set.prototype.intersect = function intersect () {
    var iters = [], len = arguments.length;
    while ( len-- ) iters[ len ] = arguments[ len ];

    if (iters.length === 0) {
      return this;
    }
    iters = iters.map(function (iter) { return SetCollection$$1(iter); });
    var toRemove = [];
    this.forEach(function (value) {
      if (!iters.every(function (iter) { return iter.includes(value); })) {
        toRemove.push(value);
      }
    });
    return this.withMutations(function (set) {
      toRemove.forEach(function (value) {
        set.remove(value);
      });
    });
  };

  Set.prototype.subtract = function subtract () {
    var iters = [], len = arguments.length;
    while ( len-- ) iters[ len ] = arguments[ len ];

    if (iters.length === 0) {
      return this;
    }
    var toRemove = [];
    this.forEach(function (value) {
      if (iters.some(function (iter) { return iter.includes(value); })) {
        toRemove.push(value);
      }
    });
    return this.withMutations(function (set) {
      toRemove.forEach(function (value) {
        set.remove(value);
      });
    });
  };

  Set.prototype.merge = function merge () {
    return this.union.apply(this, arguments);
  };

  Set.prototype.mergeWith = function mergeWith (merger) {
    var iters = [], len = arguments.length - 1;
    while ( len-- > 0 ) iters[ len ] = arguments[ len + 1 ];

    return this.union.apply(this, iters);
  };

  Set.prototype.sort = function sort (comparator) {
    // Late binding
    return OrderedSet(sortFactory(this, comparator));
  };

  Set.prototype.sortBy = function sortBy (mapper, comparator) {
    // Late binding
    return OrderedSet(sortFactory(this, comparator, mapper));
  };

  Set.prototype.wasAltered = function wasAltered () {
    return this._map.wasAltered();
  };

  Set.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    return this._map.__iterate(function (_, k) { return fn(k, k, this$1); }, reverse);
  };

  Set.prototype.__iterator = function __iterator (type, reverse) {
    return this._map.map(function (_, k) { return k; }).__iterator(type, reverse);
  };

  Set.prototype.__ensureOwner = function __ensureOwner (ownerID) {
    if (ownerID === this.__ownerID) {
      return this;
    }
    var newMap = this._map.__ensureOwner(ownerID);
    if (!ownerID) {
      if (this.size === 0) {
        return emptySet();
      }
      this.__ownerID = ownerID;
      this._map = newMap;
      return this;
    }
    return this.__make(newMap, ownerID);
  };

  return Set;
}(SetCollection));

function isSet(maybeSet) {
  return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
}

Set.isSet = isSet;

var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';

var SetPrototype = Set.prototype;
SetPrototype[IS_SET_SENTINEL] = true;
SetPrototype[DELETE] = SetPrototype.remove;
SetPrototype.mergeDeep = SetPrototype.merge;
SetPrototype.mergeDeepWith = SetPrototype.mergeWith;
SetPrototype.withMutations = MapPrototype.withMutations;
SetPrototype.asMutable = MapPrototype.asMutable;
SetPrototype.asImmutable = MapPrototype.asImmutable;

SetPrototype.__empty = emptySet;
SetPrototype.__make = makeSet;

function updateSet(set, newMap) {
  if (set.__ownerID) {
    set.size = newMap.size;
    set._map = newMap;
    return set;
  }
  return newMap === set._map
    ? set
    : newMap.size === 0 ? set.__empty() : set.__make(newMap);
}

function makeSet(map, ownerID) {
  var set = Object.create(SetPrototype);
  set.size = map ? map.size : 0;
  set._map = map;
  set.__ownerID = ownerID;
  return set;
}

var EMPTY_SET;
function emptySet() {
  return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
}

/**
 * Returns a lazy seq of nums from start (inclusive) to end
 * (exclusive), by step, where start defaults to 0, step to 1, and end to
 * infinity. When start is equal to end, returns empty list.
 */
var Range = (function (IndexedSeq$$1) {
  function Range(start, end, step) {
    if (!(this instanceof Range)) {
      return new Range(start, end, step);
    }
    invariant(step !== 0, 'Cannot step a Range by 0');
    start = start || 0;
    if (end === undefined) {
      end = Infinity;
    }
    step = step === undefined ? 1 : Math.abs(step);
    if (end < start) {
      step = -step;
    }
    this._start = start;
    this._end = end;
    this._step = step;
    this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
    if (this.size === 0) {
      if (EMPTY_RANGE) {
        return EMPTY_RANGE;
      }
      EMPTY_RANGE = this;
    }
  }

  if ( IndexedSeq$$1 ) Range.__proto__ = IndexedSeq$$1;
  Range.prototype = Object.create( IndexedSeq$$1 && IndexedSeq$$1.prototype );
  Range.prototype.constructor = Range;

  Range.prototype.toString = function toString () {
    if (this.size === 0) {
      return 'Range []';
    }
    return 'Range [ ' +
      this._start +
      '...' +
      this._end +
      (this._step !== 1 ? ' by ' + this._step : '') +
      ' ]';
  };

  Range.prototype.get = function get (index, notSetValue) {
    return this.has(index)
      ? this._start + wrapIndex(this, index) * this._step
      : notSetValue;
  };

  Range.prototype.includes = function includes (searchValue) {
    var possibleIndex = (searchValue - this._start) / this._step;
    return possibleIndex >= 0 &&
      possibleIndex < this.size &&
      possibleIndex === Math.floor(possibleIndex);
  };

  Range.prototype.slice = function slice (begin, end) {
    if (wholeSlice(begin, end, this.size)) {
      return this;
    }
    begin = resolveBegin(begin, this.size);
    end = resolveEnd(end, this.size);
    if (end <= begin) {
      return new Range(0, 0);
    }
    return new Range(
      this.get(begin, this._end),
      this.get(end, this._end),
      this._step
    );
  };

  Range.prototype.indexOf = function indexOf (searchValue) {
    var offsetValue = searchValue - this._start;
    if (offsetValue % this._step === 0) {
      var index = offsetValue / this._step;
      if (index >= 0 && index < this.size) {
        return index;
      }
    }
    return -1;
  };

  Range.prototype.lastIndexOf = function lastIndexOf (searchValue) {
    return this.indexOf(searchValue);
  };

  Range.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    var size = this.size;
    var step = this._step;
    var value = reverse ? this._start + (size - 1) * step : this._start;
    var i = 0;
    while (i !== size) {
      if (fn(value, reverse ? size - ++i : i++, this$1) === false) {
        break;
      }
      value += reverse ? -step : step;
    }
    return i;
  };

  Range.prototype.__iterator = function __iterator (type, reverse) {
    var size = this.size;
    var step = this._step;
    var value = reverse ? this._start + (size - 1) * step : this._start;
    var i = 0;
    return new Iterator(function () {
      if (i === size) {
        return iteratorDone();
      }
      var v = value;
      value += reverse ? -step : step;
      return iteratorValue(type, reverse ? size - ++i : i++, v);
    });
  };

  Range.prototype.equals = function equals (other) {
    return other instanceof Range
      ? this._start === other._start &&
          this._end === other._end &&
          this._step === other._step
      : deepEqual(this, other);
  };

  return Range;
}(IndexedSeq));

var EMPTY_RANGE;

// Note: all of these methods are deprecated.
Collection.isIterable = isCollection;
Collection.isKeyed = isKeyed;
Collection.isIndexed = isIndexed;
Collection.isAssociative = isAssociative;
Collection.isOrdered = isOrdered;

Collection.Iterator = Iterator;

mixin(Collection, {
  // ### Conversion to other types

  toArray: function toArray() {
    assertNotInfinite(this.size);
    var array = new Array(this.size || 0);
    this.valueSeq().__iterate(function (v, i) {
      array[i] = v;
    });
    return array;
  },

  toIndexedSeq: function toIndexedSeq() {
    return new ToIndexedSequence(this);
  },

  toJS: function toJS$1() {
    return this.toSeq().map(toJS).toJSON();
  },

  toKeyedSeq: function toKeyedSeq() {
    return new ToKeyedSequence(this, true);
  },

  toMap: function toMap() {
    // Use Late Binding here to solve the circular dependency.
    return Map(this.toKeyedSeq());
  },

  toObject: function toObject() {
    assertNotInfinite(this.size);
    var object = {};
    this.__iterate(function (v, k) {
      object[k] = v;
    });
    return object;
  },

  toOrderedMap: function toOrderedMap() {
    // Use Late Binding here to solve the circular dependency.
    return OrderedMap(this.toKeyedSeq());
  },

  toOrderedSet: function toOrderedSet() {
    // Use Late Binding here to solve the circular dependency.
    return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
  },

  toSet: function toSet() {
    // Use Late Binding here to solve the circular dependency.
    return Set(isKeyed(this) ? this.valueSeq() : this);
  },

  toSetSeq: function toSetSeq() {
    return new ToSetSequence(this);
  },

  toSeq: function toSeq() {
    return isIndexed(this)
      ? this.toIndexedSeq()
      : isKeyed(this) ? this.toKeyedSeq() : this.toSetSeq();
  },

  toStack: function toStack() {
    // Use Late Binding here to solve the circular dependency.
    return Stack(isKeyed(this) ? this.valueSeq() : this);
  },

  toList: function toList() {
    // Use Late Binding here to solve the circular dependency.
    return List(isKeyed(this) ? this.valueSeq() : this);
  },

  // ### Common JavaScript methods and properties

  toString: function toString() {
    return '[Collection]';
  },

  __toString: function __toString(head, tail) {
    if (this.size === 0) {
      return head + tail;
    }
    return head +
      ' ' +
      this.toSeq().map(this.__toStringMapper).join(', ') +
      ' ' +
      tail;
  },

  // ### ES6 Collection methods (ES6 Array and Map)

  concat: function concat() {
    var values = [], len = arguments.length;
    while ( len-- ) values[ len ] = arguments[ len ];

    return reify(this, concatFactory(this, values));
  },

  includes: function includes(searchValue) {
    return this.some(function (value) { return is(value, searchValue); });
  },

  entries: function entries() {
    return this.__iterator(ITERATE_ENTRIES);
  },

  every: function every(predicate, context) {
    assertNotInfinite(this.size);
    var returnValue = true;
    this.__iterate(function (v, k, c) {
      if (!predicate.call(context, v, k, c)) {
        returnValue = false;
        return false;
      }
    });
    return returnValue;
  },

  filter: function filter(predicate, context) {
    return reify(this, filterFactory(this, predicate, context, true));
  },

  find: function find(predicate, context, notSetValue) {
    var entry = this.findEntry(predicate, context);
    return entry ? entry[1] : notSetValue;
  },

  forEach: function forEach(sideEffect, context) {
    assertNotInfinite(this.size);
    return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
  },

  join: function join(separator) {
    assertNotInfinite(this.size);
    separator = separator !== undefined ? '' + separator : ',';
    var joined = '';
    var isFirst = true;
    this.__iterate(function (v) {
      isFirst ? (isFirst = false) : (joined += separator);
      joined += v !== null && v !== undefined ? v.toString() : '';
    });
    return joined;
  },

  keys: function keys() {
    return this.__iterator(ITERATE_KEYS);
  },

  map: function map(mapper, context) {
    return reify(this, mapFactory(this, mapper, context));
  },

  reduce: function reduce$1(reducer, initialReduction, context) {
    return reduce(
      this,
      reducer,
      initialReduction,
      context,
      arguments.length < 2,
      false
    );
  },

  reduceRight: function reduceRight(reducer, initialReduction, context) {
    return reduce(
      this,
      reducer,
      initialReduction,
      context,
      arguments.length < 2,
      true
    );
  },

  reverse: function reverse() {
    return reify(this, reverseFactory(this, true));
  },

  slice: function slice(begin, end) {
    return reify(this, sliceFactory(this, begin, end, true));
  },

  some: function some(predicate, context) {
    return !this.every(not(predicate), context);
  },

  sort: function sort(comparator) {
    return reify(this, sortFactory(this, comparator));
  },

  values: function values() {
    return this.__iterator(ITERATE_VALUES);
  },

  // ### More sequential methods

  butLast: function butLast() {
    return this.slice(0, -1);
  },

  isEmpty: function isEmpty() {
    return this.size !== undefined ? this.size === 0 : !this.some(function () { return true; });
  },

  count: function count(predicate, context) {
    return ensureSize(
      predicate ? this.toSeq().filter(predicate, context) : this
    );
  },

  countBy: function countBy(grouper, context) {
    return countByFactory(this, grouper, context);
  },

  equals: function equals(other) {
    return deepEqual(this, other);
  },

  entrySeq: function entrySeq() {
    var collection = this;
    if (collection._cache) {
      // We cache as an entries array, so we can just return the cache!
      return new ArraySeq(collection._cache);
    }
    var entriesSequence = collection.toSeq().map(entryMapper).toIndexedSeq();
    entriesSequence.fromEntrySeq = function () { return collection.toSeq(); };

    // Entries are plain Array, which do not define toJS, so it must
    // manually converts keys and values before conversion.
    entriesSequence.toJS = function() {
      return this.map(function (entry) { return [toJS(entry[0]), toJS(entry[1])]; }).toJSON();
    };

    return entriesSequence;
  },

  filterNot: function filterNot(predicate, context) {
    return this.filter(not(predicate), context);
  },

  findEntry: function findEntry(predicate, context, notSetValue) {
    var found = notSetValue;
    this.__iterate(function (v, k, c) {
      if (predicate.call(context, v, k, c)) {
        found = [k, v];
        return false;
      }
    });
    return found;
  },

  findKey: function findKey(predicate, context) {
    var entry = this.findEntry(predicate, context);
    return entry && entry[0];
  },

  findLast: function findLast(predicate, context, notSetValue) {
    return this.toKeyedSeq().reverse().find(predicate, context, notSetValue);
  },

  findLastEntry: function findLastEntry(predicate, context, notSetValue) {
    return this.toKeyedSeq()
      .reverse()
      .findEntry(predicate, context, notSetValue);
  },

  findLastKey: function findLastKey(predicate, context) {
    return this.toKeyedSeq().reverse().findKey(predicate, context);
  },

  first: function first() {
    return this.find(returnTrue);
  },

  flatMap: function flatMap(mapper, context) {
    return reify(this, flatMapFactory(this, mapper, context));
  },

  flatten: function flatten(depth) {
    return reify(this, flattenFactory(this, depth, true));
  },

  fromEntrySeq: function fromEntrySeq() {
    return new FromEntriesSequence(this);
  },

  get: function get(searchKey, notSetValue) {
    return this.find(function (_, key) { return is(key, searchKey); }, undefined, notSetValue);
  },

  getIn: function getIn(searchKeyPath, notSetValue) {
    var nested = this;
    var keyPath = coerceKeyPath(searchKeyPath);
    var i = 0;
    while (i !== keyPath.length) {
      if (!nested || !nested.get) {
        throw new TypeError(
          'Invalid keyPath: Value at [' +
            keyPath.slice(0, i).map(quoteString) +
            '] does not have a .get() method: ' +
            nested
        );
      }
      nested = nested.get(keyPath[i++], NOT_SET);
      if (nested === NOT_SET) {
        return notSetValue;
      }
    }
    return nested;
    // var step;
    // while (!(step = iter.next()).done) {
    //   var key = step.value;
    //   nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET;
    //   if (nested === NOT_SET) {
    //     return notSetValue;
    //   }
    // }
    // return nested;
  },

  groupBy: function groupBy(grouper, context) {
    return groupByFactory(this, grouper, context);
  },

  has: function has(searchKey) {
    return this.get(searchKey, NOT_SET) !== NOT_SET;
  },

  hasIn: function hasIn(searchKeyPath) {
    return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET;
  },

  isSubset: function isSubset(iter) {
    iter = typeof iter.includes === 'function' ? iter : Collection(iter);
    return this.every(function (value) { return iter.includes(value); });
  },

  isSuperset: function isSuperset(iter) {
    iter = typeof iter.isSubset === 'function' ? iter : Collection(iter);
    return iter.isSubset(this);
  },

  keyOf: function keyOf(searchValue) {
    return this.findKey(function (value) { return is(value, searchValue); });
  },

  keySeq: function keySeq() {
    return this.toSeq().map(keyMapper).toIndexedSeq();
  },

  last: function last() {
    return this.toSeq().reverse().first();
  },

  lastKeyOf: function lastKeyOf(searchValue) {
    return this.toKeyedSeq().reverse().keyOf(searchValue);
  },

  max: function max(comparator) {
    return maxFactory(this, comparator);
  },

  maxBy: function maxBy(mapper, comparator) {
    return maxFactory(this, comparator, mapper);
  },

  min: function min(comparator) {
    return maxFactory(
      this,
      comparator ? neg(comparator) : defaultNegComparator
    );
  },

  minBy: function minBy(mapper, comparator) {
    return maxFactory(
      this,
      comparator ? neg(comparator) : defaultNegComparator,
      mapper
    );
  },

  rest: function rest() {
    return this.slice(1);
  },

  skip: function skip(amount) {
    return amount === 0 ? this : this.slice(Math.max(0, amount));
  },

  skipLast: function skipLast(amount) {
    return amount === 0 ? this : this.slice(0, -Math.max(0, amount));
  },

  skipWhile: function skipWhile(predicate, context) {
    return reify(this, skipWhileFactory(this, predicate, context, true));
  },

  skipUntil: function skipUntil(predicate, context) {
    return this.skipWhile(not(predicate), context);
  },

  sortBy: function sortBy(mapper, comparator) {
    return reify(this, sortFactory(this, comparator, mapper));
  },

  take: function take(amount) {
    return this.slice(0, Math.max(0, amount));
  },

  takeLast: function takeLast(amount) {
    return this.slice(-Math.max(0, amount));
  },

  takeWhile: function takeWhile(predicate, context) {
    return reify(this, takeWhileFactory(this, predicate, context));
  },

  takeUntil: function takeUntil(predicate, context) {
    return this.takeWhile(not(predicate), context);
  },

  update: function update(fn) {
    return fn(this);
  },

  valueSeq: function valueSeq() {
    return this.toIndexedSeq();
  },

  // ### Hashable Object

  hashCode: function hashCode() {
    return this.__hash || (this.__hash = hashCollection(this));
  }

  // ### Internal

  // abstract __iterate(fn, reverse)

  // abstract __iterator(type, reverse)
});

var CollectionPrototype = Collection.prototype;
CollectionPrototype[IS_ITERABLE_SENTINEL] = true;
CollectionPrototype[ITERATOR_SYMBOL] = CollectionPrototype.values;
CollectionPrototype.toJSON = CollectionPrototype.toArray;
CollectionPrototype.__toStringMapper = quoteString;
CollectionPrototype.inspect = (CollectionPrototype.toSource = function() {
  return this.toString();
});
CollectionPrototype.chain = CollectionPrototype.flatMap;
CollectionPrototype.contains = CollectionPrototype.includes;

mixin(KeyedCollection, {
  // ### More sequential methods

  flip: function flip() {
    return reify(this, flipFactory(this));
  },

  mapEntries: function mapEntries(mapper, context) {
    var this$1 = this;

    var iterations = 0;
    return reify(
      this,
      this.toSeq()
        .map(function (v, k) { return mapper.call(context, [k, v], iterations++, this$1); })
        .fromEntrySeq()
    );
  },

  mapKeys: function mapKeys(mapper, context) {
    var this$1 = this;

    return reify(
      this,
      this.toSeq().flip().map(function (k, v) { return mapper.call(context, k, v, this$1); }).flip()
    );
  }
});

var KeyedCollectionPrototype = KeyedCollection.prototype;
KeyedCollectionPrototype[IS_KEYED_SENTINEL] = true;
KeyedCollectionPrototype[ITERATOR_SYMBOL] = CollectionPrototype.entries;
KeyedCollectionPrototype.toJSON = CollectionPrototype.toObject;
KeyedCollectionPrototype.__toStringMapper = function (v, k) { return quoteString(k) + ': ' + quoteString(v); };

mixin(IndexedCollection, {
  // ### Conversion to other types

  toKeyedSeq: function toKeyedSeq() {
    return new ToKeyedSequence(this, false);
  },

  // ### ES6 Collection methods (ES6 Array and Map)

  filter: function filter(predicate, context) {
    return reify(this, filterFactory(this, predicate, context, false));
  },

  findIndex: function findIndex(predicate, context) {
    var entry = this.findEntry(predicate, context);
    return entry ? entry[0] : -1;
  },

  indexOf: function indexOf(searchValue) {
    var key = this.keyOf(searchValue);
    return key === undefined ? -1 : key;
  },

  lastIndexOf: function lastIndexOf(searchValue) {
    var key = this.lastKeyOf(searchValue);
    return key === undefined ? -1 : key;
  },

  reverse: function reverse() {
    return reify(this, reverseFactory(this, false));
  },

  slice: function slice(begin, end) {
    return reify(this, sliceFactory(this, begin, end, false));
  },

  splice: function splice(index, removeNum /*, ...values*/) {
    var numArgs = arguments.length;
    removeNum = Math.max(removeNum || 0, 0);
    if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
      return this;
    }
    // If index is negative, it should resolve relative to the size of the
    // collection. However size may be expensive to compute if not cached, so
    // only call count() if the number is in fact negative.
    index = resolveBegin(index, index < 0 ? this.count() : this.size);
    var spliced = this.slice(0, index);
    return reify(
      this,
      numArgs === 1
        ? spliced
        : spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
    );
  },

  // ### More collection methods

  findLastIndex: function findLastIndex(predicate, context) {
    var entry = this.findLastEntry(predicate, context);
    return entry ? entry[0] : -1;
  },

  first: function first() {
    return this.get(0);
  },

  flatten: function flatten(depth) {
    return reify(this, flattenFactory(this, depth, false));
  },

  get: function get(index, notSetValue) {
    index = wrapIndex(this, index);
    return index < 0 ||
      (this.size === Infinity || (this.size !== undefined && index > this.size))
      ? notSetValue
      : this.find(function (_, key) { return key === index; }, undefined, notSetValue);
  },

  has: function has(index) {
    index = wrapIndex(this, index);
    return index >= 0 &&
      (this.size !== undefined
        ? this.size === Infinity || index < this.size
        : this.indexOf(index) !== -1);
  },

  interpose: function interpose(separator) {
    return reify(this, interposeFactory(this, separator));
  },

  interleave: function interleave(/*...collections*/) {
    var collections = [this].concat(arrCopy(arguments));
    var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, collections);
    var interleaved = zipped.flatten(true);
    if (zipped.size) {
      interleaved.size = zipped.size * collections.length;
    }
    return reify(this, interleaved);
  },

  keySeq: function keySeq() {
    return Range(0, this.size);
  },

  last: function last() {
    return this.get(-1);
  },

  skipWhile: function skipWhile(predicate, context) {
    return reify(this, skipWhileFactory(this, predicate, context, false));
  },

  zip: function zip(/*, ...collections */) {
    var collections = [this].concat(arrCopy(arguments));
    return reify(this, zipWithFactory(this, defaultZipper, collections));
  },

  zipWith: function zipWith(zipper /*, ...collections */) {
    var collections = arrCopy(arguments);
    collections[0] = this;
    return reify(this, zipWithFactory(this, zipper, collections));
  }
});

var IndexedCollectionPrototype = IndexedCollection.prototype;
IndexedCollectionPrototype[IS_INDEXED_SENTINEL] = true;
IndexedCollectionPrototype[IS_ORDERED_SENTINEL] = true;

mixin(SetCollection, {
  // ### ES6 Collection methods (ES6 Array and Map)

  get: function get(value, notSetValue) {
    return this.has(value) ? value : notSetValue;
  },

  includes: function includes(value) {
    return this.has(value);
  },

  // ### More sequential methods

  keySeq: function keySeq() {
    return this.valueSeq();
  }
});

SetCollection.prototype.has = CollectionPrototype.includes;
SetCollection.prototype.contains = SetCollection.prototype.includes;

// Mixin subclasses

mixin(KeyedSeq, KeyedCollection.prototype);
mixin(IndexedSeq, IndexedCollection.prototype);
mixin(SetSeq, SetCollection.prototype);

// #pragma Helper functions

function reduce(collection, reducer, reduction, context, useFirst, reverse) {
  assertNotInfinite(collection.size);
  collection.__iterate(
    function (v, k, c) {
      if (useFirst) {
        useFirst = false;
        reduction = v;
      } else {
        reduction = reducer.call(context, reduction, v, k, c);
      }
    },
    reverse
  );
  return reduction;
}

function keyMapper(v, k) {
  return k;
}

function entryMapper(v, k) {
  return [k, v];
}

function toJS(value) {
  return value && typeof value.toJS === 'function' ? value.toJS() : value;
}

function not(predicate) {
  return function() {
    return !predicate.apply(this, arguments);
  };
}

function neg(predicate) {
  return function() {
    return -predicate.apply(this, arguments);
  };
}

function defaultZipper() {
  return arrCopy(arguments);
}

function defaultNegComparator(a, b) {
  return a < b ? 1 : a > b ? -1 : 0;
}

function hashCollection(collection) {
  if (collection.size === Infinity) {
    return 0;
  }
  var ordered = isOrdered(collection);
  var keyed = isKeyed(collection);
  var h = ordered ? 1 : 0;
  var size = collection.__iterate(
    keyed
      ? ordered
          ? function (v, k) {
              h = 31 * h + hashMerge(hash(v), hash(k)) | 0;
            }
          : function (v, k) {
              h = h + hashMerge(hash(v), hash(k)) | 0;
            }
      : ordered
          ? function (v) {
              h = 31 * h + hash(v) | 0;
            }
          : function (v) {
              h = h + hash(v) | 0;
            }
  );
  return murmurHashOfSize(size, h);
}

function murmurHashOfSize(size, h) {
  h = imul(h, 0xcc9e2d51);
  h = imul(h << 15 | h >>> -15, 0x1b873593);
  h = imul(h << 13 | h >>> -13, 5);
  h = (h + 0xe6546b64 | 0) ^ size;
  h = imul(h ^ h >>> 16, 0x85ebca6b);
  h = imul(h ^ h >>> 13, 0xc2b2ae35);
  h = smi(h ^ h >>> 16);
  return h;
}

function hashMerge(a, b) {
  return a ^ b + 0x9e3779b9 + (a << 6) + (a >> 2) | 0; // int
}

var OrderedSet = (function (Set$$1) {
  function OrderedSet(value) {
    return value === null || value === undefined
      ? emptyOrderedSet()
      : isOrderedSet(value)
          ? value
          : emptyOrderedSet().withMutations(function (set) {
              var iter = SetCollection(value);
              assertNotInfinite(iter.size);
              iter.forEach(function (v) { return set.add(v); });
            });
  }

  if ( Set$$1 ) OrderedSet.__proto__ = Set$$1;
  OrderedSet.prototype = Object.create( Set$$1 && Set$$1.prototype );
  OrderedSet.prototype.constructor = OrderedSet;

  OrderedSet.of = function of (/*...values*/) {
    return this(arguments);
  };

  OrderedSet.fromKeys = function fromKeys (value) {
    return this(KeyedCollection(value).keySeq());
  };

  OrderedSet.prototype.toString = function toString () {
    return this.__toString('OrderedSet {', '}');
  };

  return OrderedSet;
}(Set));

function isOrderedSet(maybeOrderedSet) {
  return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
}

OrderedSet.isOrderedSet = isOrderedSet;

var OrderedSetPrototype = OrderedSet.prototype;
OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;
OrderedSetPrototype.zip = IndexedCollectionPrototype.zip;
OrderedSetPrototype.zipWith = IndexedCollectionPrototype.zipWith;

OrderedSetPrototype.__empty = emptyOrderedSet;
OrderedSetPrototype.__make = makeOrderedSet;

function makeOrderedSet(map, ownerID) {
  var set = Object.create(OrderedSetPrototype);
  set.size = map ? map.size : 0;
  set._map = map;
  set.__ownerID = ownerID;
  return set;
}

var EMPTY_ORDERED_SET;
function emptyOrderedSet() {
  return EMPTY_ORDERED_SET ||
    (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()));
}

var Record = function Record(defaultValues, name) {
  var hasInitialized;

  var RecordType = function Record(values) {
    var this$1 = this;

    if (values instanceof RecordType) {
      return values;
    }
    if (!(this instanceof RecordType)) {
      return new RecordType(values);
    }
    if (!hasInitialized) {
      hasInitialized = true;
      var keys = Object.keys(defaultValues);
      var indices = (RecordTypePrototype._indices = {});
      RecordTypePrototype._name = name;
      RecordTypePrototype._keys = keys;
      RecordTypePrototype._defaultValues = defaultValues;
      for (var i = 0; i < keys.length; i++) {
        var propName = keys[i];
        indices[propName] = i;
        if (RecordTypePrototype[propName]) {
          /* eslint-disable no-console */
          typeof console === 'object' &&
            console.warn &&
            console.warn(
              'Cannot define ' +
                recordName(this$1) +
                ' with property "' +
                propName +
                '" since that property name is part of the Record API.'
            );
          /* eslint-enable no-console */
        } else {
          setProp(RecordTypePrototype, propName);
        }
      }
    }
    this.__ownerID = undefined;
    this._values = List().withMutations(function (l) {
      l.setSize(this$1._keys.length);
      KeyedCollection(values).forEach(function (v, k) {
        l.set(this$1._indices[k], v === this$1._defaultValues[k] ? undefined : v);
      });
    });
  };

  var RecordTypePrototype = (RecordType.prototype = Object.create(
    RecordPrototype
  ));
  RecordTypePrototype.constructor = RecordType;

  return RecordType;
};

Record.prototype.toString = function toString () {
    var this$1 = this;

  var str = recordName(this) + ' { ';
  var keys = this._keys;
  var k;
  for (var i = 0, l = keys.length; i !== l; i++) {
    k = keys[i];
    str += (i ? ', ' : '') + k + ': ' + quoteString(this$1.get(k));
  }
  return str + ' }';
};

Record.prototype.equals = function equals (other) {
  return this === other ||
    (this._keys === other._keys && recordSeq(this).equals(recordSeq(other)));
};

Record.prototype.hashCode = function hashCode () {
  return recordSeq(this).hashCode();
};

// @pragma Access

Record.prototype.has = function has (k) {
  return this._indices.hasOwnProperty(k);
};

Record.prototype.get = function get (k, notSetValue) {
  if (!this.has(k)) {
    return notSetValue;
  }
  var index = this._indices[k];
  var value = this._values.get(index);
  return value === undefined ? this._defaultValues[k] : value;
};

// @pragma Modification

Record.prototype.set = function set (k, v) {
  if (this.has(k)) {
    var newValues = this._values.set(
      this._indices[k],
      v === this._defaultValues[k] ? undefined : v
    );
    if (newValues !== this._values && !this.__ownerID) {
      return makeRecord(this, newValues);
    }
  }
  return this;
};

Record.prototype.remove = function remove (k) {
  return this.set(k);
};

Record.prototype.clear = function clear () {
  var newValues = this._values.clear().setSize(this._keys.length);
  return this.__ownerID ? this : makeRecord(this, newValues);
};

Record.prototype.wasAltered = function wasAltered () {
  return this._values.wasAltered();
};

Record.prototype.toSeq = function toSeq () {
  return recordSeq(this);
};

Record.prototype.toJS = function toJS () {
  return recordSeq(this).toJS();
};

Record.prototype.__iterator = function __iterator (type, reverse) {
  return recordSeq(this).__iterator(type, reverse);
};

Record.prototype.__iterate = function __iterate (fn, reverse) {
  return recordSeq(this).__iterate(fn, reverse);
};

Record.prototype.__ensureOwner = function __ensureOwner (ownerID) {
  if (ownerID === this.__ownerID) {
    return this;
  }
  var newValues = this._values.__ensureOwner(ownerID);
  if (!ownerID) {
    this.__ownerID = ownerID;
    this._values = newValues;
    return this;
  }
  return makeRecord(this, newValues, ownerID);
};

Record.isRecord = isRecord;
Record.getDescriptiveName = recordName;
var RecordPrototype = Record.prototype;
RecordPrototype[IS_RECORD_SENTINEL] = true;
RecordPrototype[DELETE] = RecordPrototype.remove;
RecordPrototype.getIn = CollectionPrototype.getIn;
RecordPrototype.hasIn = CollectionPrototype.hasIn;
RecordPrototype.merge = MapPrototype.merge;
RecordPrototype.mergeWith = MapPrototype.mergeWith;
RecordPrototype.mergeIn = MapPrototype.mergeIn;
RecordPrototype.mergeDeep = MapPrototype.mergeDeep;
RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith;
RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
RecordPrototype.setIn = MapPrototype.setIn;
RecordPrototype.update = MapPrototype.update;
RecordPrototype.updateIn = MapPrototype.updateIn;
RecordPrototype.withMutations = MapPrototype.withMutations;
RecordPrototype.asMutable = MapPrototype.asMutable;
RecordPrototype.asImmutable = MapPrototype.asImmutable;
RecordPrototype[ITERATOR_SYMBOL] = CollectionPrototype.entries;
RecordPrototype.toJSON = (RecordPrototype.toObject = CollectionPrototype.toObject);
RecordPrototype.inspect = (RecordPrototype.toSource = CollectionPrototype.toSource);

function makeRecord(likeRecord, values, ownerID) {
  var record = Object.create(Object.getPrototypeOf(likeRecord));
  record._values = values;
  record.__ownerID = ownerID;
  return record;
}

function recordName(record) {
  return record._name || record.constructor.name || 'Record';
}

function recordSeq(record) {
  return keyedSeqFromValue(record._keys.map(function (k) { return [k, record.get(k)]; }));
}

function setProp(prototype, name) {
  try {
    Object.defineProperty(prototype, name, {
      get: function() {
        return this.get(name);
      },
      set: function(value) {
        invariant(this.__ownerID, 'Cannot set on an immutable record.');
        this.set(name, value);
      }
    });
  } catch (error) {
    // Object.defineProperty failed. Probably IE8.
  }
}

/**
 * Returns a lazy Seq of `value` repeated `times` times. When `times` is
 * undefined, returns an infinite sequence of `value`.
 */
var Repeat = (function (IndexedSeq$$1) {
  function Repeat(value, times) {
    if (!(this instanceof Repeat)) {
      return new Repeat(value, times);
    }
    this._value = value;
    this.size = times === undefined ? Infinity : Math.max(0, times);
    if (this.size === 0) {
      if (EMPTY_REPEAT) {
        return EMPTY_REPEAT;
      }
      EMPTY_REPEAT = this;
    }
  }

  if ( IndexedSeq$$1 ) Repeat.__proto__ = IndexedSeq$$1;
  Repeat.prototype = Object.create( IndexedSeq$$1 && IndexedSeq$$1.prototype );
  Repeat.prototype.constructor = Repeat;

  Repeat.prototype.toString = function toString () {
    if (this.size === 0) {
      return 'Repeat []';
    }
    return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
  };

  Repeat.prototype.get = function get (index, notSetValue) {
    return this.has(index) ? this._value : notSetValue;
  };

  Repeat.prototype.includes = function includes (searchValue) {
    return is(this._value, searchValue);
  };

  Repeat.prototype.slice = function slice (begin, end) {
    var size = this.size;
    return wholeSlice(begin, end, size)
      ? this
      : new Repeat(
          this._value,
          resolveEnd(end, size) - resolveBegin(begin, size)
        );
  };

  Repeat.prototype.reverse = function reverse () {
    return this;
  };

  Repeat.prototype.indexOf = function indexOf (searchValue) {
    if (is(this._value, searchValue)) {
      return 0;
    }
    return -1;
  };

  Repeat.prototype.lastIndexOf = function lastIndexOf (searchValue) {
    if (is(this._value, searchValue)) {
      return this.size;
    }
    return -1;
  };

  Repeat.prototype.__iterate = function __iterate (fn, reverse) {
    var this$1 = this;

    var size = this.size;
    var i = 0;
    while (i !== size) {
      if (fn(this$1._value, reverse ? size - ++i : i++, this$1) === false) {
        break;
      }
    }
    return i;
  };

  Repeat.prototype.__iterator = function __iterator (type, reverse) {
    var this$1 = this;

    var size = this.size;
    var i = 0;
    return new Iterator(
      function () { return i === size
          ? iteratorDone()
          : iteratorValue(type, reverse ? size - ++i : i++, this$1._value); }
    );
  };

  Repeat.prototype.equals = function equals (other) {
    return other instanceof Repeat
      ? is(this._value, other._value)
      : deepEqual(other);
  };

  return Repeat;
}(IndexedSeq));

var EMPTY_REPEAT;

var Immutable = {
  Collection: Collection,
  // Note: Iterable is deprecated
  Iterable: Collection,

  Seq: Seq,
  Map: Map,
  OrderedMap: OrderedMap,
  List: List,
  Stack: Stack,
  Set: Set,
  OrderedSet: OrderedSet,

  Record: Record,
  Range: Range,
  Repeat: Repeat,

  is: is,
  fromJS: fromJS,
  hash: hash,

  isImmutable: isImmutable,
  isCollection: isCollection,
  isKeyed: isKeyed,
  isIndexed: isIndexed,
  isAssociative: isAssociative,
  isOrdered: isOrdered,
  isValueObject: isValueObject
};

// Note: Iterable is deprecated
var Iterable = Collection;

exports['default'] = Immutable;
exports.Collection = Collection;
exports.Iterable = Iterable;
exports.Seq = Seq;
exports.Map = Map;
exports.OrderedMap = OrderedMap;
exports.List = List;
exports.Stack = Stack;
exports.Set = Set;
exports.OrderedSet = OrderedSet;
exports.Record = Record;
exports.Range = Range;
exports.Repeat = Repeat;
exports.is = is;
exports.fromJS = fromJS;
exports.hash = hash;
exports.isImmutable = isImmutable;
exports.isCollection = isCollection;
exports.isKeyed = isKeyed;
exports.isIndexed = isIndexed;
exports.isAssociative = isAssociative;
exports.isOrdered = isOrdered;
exports.isValueObject = isValueObject;

Object.defineProperty(exports, '__esModule', { value: true });

})));


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "x", function() { return sym; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return TASK; });
/* unused harmony export HELPER */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return MATCH; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CANCEL; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return SAGA_ACTION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return SELF_CANCELLATION; });
/* unused harmony export konst */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "r", function() { return kTrue; });
/* unused harmony export kFalse */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "u", function() { return noop; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "o", function() { return ident; });
/* harmony export (immutable) */ __webpack_exports__["h"] = check;
/* unused harmony export hasOwn */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "q", function() { return is; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "v", function() { return object; });
/* harmony export (immutable) */ __webpack_exports__["w"] = remove;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return array; });
/* harmony export (immutable) */ __webpack_exports__["l"] = deferred;
/* harmony export (immutable) */ __webpack_exports__["g"] = arrayOfDeffered;
/* harmony export (immutable) */ __webpack_exports__["m"] = delay;
/* harmony export (immutable) */ __webpack_exports__["j"] = createMockTask;
/* unused harmony export autoInc */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "y", function() { return uid; });
/* harmony export (immutable) */ __webpack_exports__["t"] = makeIterator;
/* harmony export (immutable) */ __webpack_exports__["s"] = log;
/* harmony export (immutable) */ __webpack_exports__["n"] = deprecate;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "z", function() { return updateIncentive; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "p", function() { return internalErr; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return createSetContextWarning; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "A", function() { return wrapSagaDispatch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return cloneableGenerator; });
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var sym = function sym(id) {
  return '@@redux-saga/' + id;
};

var TASK = sym('TASK');
var HELPER = sym('HELPER');
var MATCH = sym('MATCH');
var CANCEL = sym('CANCEL_PROMISE');
var SAGA_ACTION = sym('SAGA_ACTION');
var SELF_CANCELLATION = sym('SELF_CANCELLATION');
var konst = function konst(v) {
  return function () {
    return v;
  };
};
var kTrue = konst(true);
var kFalse = konst(false);
var noop = function noop() {};
var ident = function ident(v) {
  return v;
};

function check(value, predicate, error) {
  if (!predicate(value)) {
    log('error', 'uncaught at check', error);
    throw new Error(error);
  }
}

var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(object, property) {
  return is.notUndef(object) && hasOwnProperty.call(object, property);
}

var is = {
  undef: function undef(v) {
    return v === null || v === undefined;
  },
  notUndef: function notUndef(v) {
    return v !== null && v !== undefined;
  },
  func: function func(f) {
    return typeof f === 'function';
  },
  number: function number(n) {
    return typeof n === 'number';
  },
  string: function string(s) {
    return typeof s === 'string';
  },
  array: Array.isArray,
  object: function object(obj) {
    return obj && !is.array(obj) && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
  },
  promise: function promise(p) {
    return p && is.func(p.then);
  },
  iterator: function iterator(it) {
    return it && is.func(it.next) && is.func(it.throw);
  },
  iterable: function iterable(it) {
    return it && is.func(Symbol) ? is.func(it[Symbol.iterator]) : is.array(it);
  },
  task: function task(t) {
    return t && t[TASK];
  },
  observable: function observable(ob) {
    return ob && is.func(ob.subscribe);
  },
  buffer: function buffer(buf) {
    return buf && is.func(buf.isEmpty) && is.func(buf.take) && is.func(buf.put);
  },
  pattern: function pattern(pat) {
    return pat && (is.string(pat) || (typeof pat === 'undefined' ? 'undefined' : _typeof(pat)) === 'symbol' || is.func(pat) || is.array(pat));
  },
  channel: function channel(ch) {
    return ch && is.func(ch.take) && is.func(ch.close);
  },
  helper: function helper(it) {
    return it && it[HELPER];
  },
  stringableFunc: function stringableFunc(f) {
    return is.func(f) && hasOwn(f, 'toString');
  }
};

var object = {
  assign: function assign(target, source) {
    for (var i in source) {
      if (hasOwn(source, i)) {
        target[i] = source[i];
      }
    }
  }
};

function remove(array, item) {
  var index = array.indexOf(item);
  if (index >= 0) {
    array.splice(index, 1);
  }
}

var array = {
  from: function from(obj) {
    var arr = Array(obj.length);
    for (var i in obj) {
      if (hasOwn(obj, i)) {
        arr[i] = obj[i];
      }
    }
    return arr;
  }
};

function deferred() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var def = _extends({}, props);
  var promise = new Promise(function (resolve, reject) {
    def.resolve = resolve;
    def.reject = reject;
  });
  def.promise = promise;
  return def;
}

function arrayOfDeffered(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr.push(deferred());
  }
  return arr;
}

function delay(ms) {
  var val = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  var timeoutId = void 0;
  var promise = new Promise(function (resolve) {
    timeoutId = setTimeout(function () {
      return resolve(val);
    }, ms);
  });

  promise[CANCEL] = function () {
    return clearTimeout(timeoutId);
  };

  return promise;
}

function createMockTask() {
  var _ref;

  var running = true;
  var _result = void 0,
      _error = void 0;

  return _ref = {}, _ref[TASK] = true, _ref.isRunning = function isRunning() {
    return running;
  }, _ref.result = function result() {
    return _result;
  }, _ref.error = function error() {
    return _error;
  }, _ref.setRunning = function setRunning(b) {
    return running = b;
  }, _ref.setResult = function setResult(r) {
    return _result = r;
  }, _ref.setError = function setError(e) {
    return _error = e;
  }, _ref;
}

function autoInc() {
  var seed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

  return function () {
    return ++seed;
  };
}

var uid = autoInc();

var kThrow = function kThrow(err) {
  throw err;
};
var kReturn = function kReturn(value) {
  return { value: value, done: true };
};
function makeIterator(next) {
  var thro = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : kThrow;
  var name = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var isHelper = arguments[3];

  var iterator = { name: name, next: next, throw: thro, return: kReturn };

  if (isHelper) {
    iterator[HELPER] = true;
  }
  if (typeof Symbol !== 'undefined') {
    iterator[Symbol.iterator] = function () {
      return iterator;
    };
  }
  return iterator;
}

/**
  Print error in a useful way whether in a browser environment
  (with expandable error stack traces), or in a node.js environment
  (text-only log output)
 **/
function log(level, message) {
  var error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

  /*eslint-disable no-console*/
  if (typeof window === 'undefined') {
    console.log('redux-saga ' + level + ': ' + message + '\n' + (error && error.stack || error));
  } else {
    console[level](message, error);
  }
}

function deprecate(fn, deprecationWarning) {
  return function () {
    if (false) log('warn', deprecationWarning);
    return fn.apply(undefined, arguments);
  };
}

var updateIncentive = function updateIncentive(deprecated, preferred) {
  return deprecated + ' has been deprecated in favor of ' + preferred + ', please update your code';
};

var internalErr = function internalErr(err) {
  return new Error('\n  redux-saga: Error checking hooks detected an inconsistent state. This is likely a bug\n  in redux-saga code and not yours. Thanks for reporting this in the project\'s github repo.\n  Error: ' + err + '\n');
};

var createSetContextWarning = function createSetContextWarning(ctx, props) {
  return (ctx ? ctx + '.' : '') + 'setContext(props): argument ' + props + ' is not a plain object';
};

var wrapSagaDispatch = function wrapSagaDispatch(dispatch) {
  return function (action) {
    return dispatch(Object.defineProperty(action, SAGA_ACTION, { value: true }));
  };
};

var cloneableGenerator = function cloneableGenerator(generatorFunc) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var history = [];
    var gen = generatorFunc.apply(undefined, args);
    return {
      next: function next(arg) {
        history.push(arg);
        return gen.next(arg);
      },
      clone: function clone() {
        var clonedGen = cloneableGenerator(generatorFunc).apply(undefined, args);
        history.forEach(function (arg) {
          return clonedGen.next(arg);
        });
        return clonedGen;
      },
      return: function _return(value) {
        return gen.return(value);
      },
      throw: function _throw(exception) {
        return gen.throw(exception);
      }
    };
  };
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TankRecord_1 = __webpack_require__(72);
exports.TankRecord = TankRecord_1.default;
exports.PlainTankRecord = TankRecord_1.PlainTankRecord;
var PowerUpRecord_1 = __webpack_require__(73);
exports.PowerUpRecord = PowerUpRecord_1.default;
var ScoreRecord_1 = __webpack_require__(74);
exports.ScoreRecord = ScoreRecord_1.default;
var ExplosionRecord_1 = __webpack_require__(75);
exports.ExplosionRecord = ExplosionRecord_1.default;
var FlickerRecord_1 = __webpack_require__(76);
exports.FlickerRecord = FlickerRecord_1.default;
var TextRecord_1 = __webpack_require__(77);
exports.TextRecord = TextRecord_1.default;
var BulletRecord_1 = __webpack_require__(78);
exports.BulletRecord = BulletRecord_1.default;
var PlayerRecord_1 = __webpack_require__(79);
exports.PlayerRecord = PlayerRecord_1.default;
var MapRecord_1 = __webpack_require__(80);
exports.MapRecord = MapRecord_1.default;
exports.mapRecord = MapRecord_1.mapRecord;
exports.PlainMapRecord = MapRecord_1.PlainMapRecord;
var EagleRecord_1 = __webpack_require__(14);
exports.EagleRecord = EagleRecord_1.default;
exports.eagleRecord = EagleRecord_1.eagleRecord;
exports.PlainEagleRecord = EagleRecord_1.PlainEagleRecord;
var index_1 = __webpack_require__(81);
exports.State = index_1.State;
var players_1 = __webpack_require__(22);
exports.PlayersMap = players_1.PlayersMap;
var bullets_1 = __webpack_require__(23);
exports.BulletsMap = bullets_1.BulletsMap;
var texts_1 = __webpack_require__(26);
exports.TextsMap = texts_1.TextsMap;
var tanks_1 = __webpack_require__(25);
exports.TanksMap = tanks_1.TanksMap;
var scores_1 = __webpack_require__(27);
exports.ScoresMap = scores_1.ScoresMap;
var explosions_1 = __webpack_require__(24);
exports.ExplosionsMap = explosions_1.ExplosionsMap;


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return END; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return isEnd; });
/* harmony export (immutable) */ __webpack_exports__["c"] = emitter;
/* unused harmony export INVALID_BUFFER */
/* unused harmony export UNDEFINED_INPUT_ERROR */
/* harmony export (immutable) */ __webpack_exports__["b"] = channel;
/* harmony export (immutable) */ __webpack_exports__["d"] = eventChannel;
/* harmony export (immutable) */ __webpack_exports__["f"] = stdChannel;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__buffers__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__scheduler__ = __webpack_require__(10);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };





var CHANNEL_END_TYPE = '@@redux-saga/CHANNEL_END';
var END = { type: CHANNEL_END_TYPE };
var isEnd = function isEnd(a) {
  return a && a.type === CHANNEL_END_TYPE;
};

function emitter() {
  var subscribers = [];

  function subscribe(sub) {
    subscribers.push(sub);
    return function () {
      return Object(__WEBPACK_IMPORTED_MODULE_0__utils__["w" /* remove */])(subscribers, sub);
    };
  }

  function emit(item) {
    var arr = subscribers.slice();
    for (var i = 0, len = arr.length; i < len; i++) {
      arr[i](item);
    }
  }

  return {
    subscribe: subscribe,
    emit: emit
  };
}

var INVALID_BUFFER = 'invalid buffer passed to channel factory function';
var UNDEFINED_INPUT_ERROR = 'Saga was provided with an undefined action';

if (false) {
  UNDEFINED_INPUT_ERROR += '\nHints:\n    - check that your Action Creator returns a non-undefined value\n    - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners\n  ';
}

function channel() {
  var buffer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : __WEBPACK_IMPORTED_MODULE_1__buffers__["a" /* buffers */].fixed();

  var closed = false;
  var takers = [];

  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(buffer, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].buffer, INVALID_BUFFER);

  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw Object(__WEBPACK_IMPORTED_MODULE_0__utils__["p" /* internalErr */])('Cannot have a closed channel with pending takers');
    }
    if (takers.length && !buffer.isEmpty()) {
      throw Object(__WEBPACK_IMPORTED_MODULE_0__utils__["p" /* internalErr */])('Cannot have pending takers with non empty buffer');
    }
  }

  function put(input) {
    checkForbiddenStates();
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(input, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, UNDEFINED_INPUT_ERROR);
    if (closed) {
      return;
    }
    if (!takers.length) {
      return buffer.put(input);
    }
    for (var i = 0; i < takers.length; i++) {
      var cb = takers[i];
      if (!cb[__WEBPACK_IMPORTED_MODULE_0__utils__["b" /* MATCH */]] || cb[__WEBPACK_IMPORTED_MODULE_0__utils__["b" /* MATCH */]](input)) {
        takers.splice(i, 1);
        return cb(input);
      }
    }
  }

  function take(cb) {
    checkForbiddenStates();
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(cb, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func, "channel.take's callback must be a function");

    if (closed && buffer.isEmpty()) {
      cb(END);
    } else if (!buffer.isEmpty()) {
      cb(buffer.take());
    } else {
      takers.push(cb);
      cb.cancel = function () {
        return Object(__WEBPACK_IMPORTED_MODULE_0__utils__["w" /* remove */])(takers, cb);
      };
    }
  }

  function flush(cb) {
    checkForbiddenStates(); // TODO: check if some new state should be forbidden now
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(cb, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func, "channel.flush' callback must be a function");
    if (closed && buffer.isEmpty()) {
      cb(END);
      return;
    }
    cb(buffer.flush());
  }

  function close() {
    checkForbiddenStates();
    if (!closed) {
      closed = true;
      if (takers.length) {
        var arr = takers;
        takers = [];
        for (var i = 0, len = arr.length; i < len; i++) {
          arr[i](END);
        }
      }
    }
  }

  return {
    take: take,
    put: put,
    flush: flush,
    close: close,
    get __takers__() {
      return takers;
    },
    get __closed__() {
      return closed;
    }
  };
}

function eventChannel(subscribe) {
  var buffer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : __WEBPACK_IMPORTED_MODULE_1__buffers__["a" /* buffers */].none();
  var matcher = arguments[2];

  /**
    should be if(typeof matcher !== undefined) instead?
    see PR #273 for a background discussion
  **/
  if (arguments.length > 2) {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(matcher, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func, 'Invalid match function passed to eventChannel');
  }

  var chan = channel(buffer);
  var close = function close() {
    if (!chan.__closed__) {
      if (unsubscribe) {
        unsubscribe();
      }
      chan.close();
    }
  };
  var unsubscribe = subscribe(function (input) {
    if (isEnd(input)) {
      close();
      return;
    }
    if (matcher && !matcher(input)) {
      return;
    }
    chan.put(input);
  });
  if (chan.__closed__) {
    unsubscribe();
  }

  if (!__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(unsubscribe)) {
    throw new Error('in eventChannel: subscribe should return a function to unsubscribe');
  }

  return {
    take: chan.take,
    flush: chan.flush,
    close: close
  };
}

function stdChannel(subscribe) {
  var chan = eventChannel(function (cb) {
    return subscribe(function (input) {
      if (input[__WEBPACK_IMPORTED_MODULE_0__utils__["c" /* SAGA_ACTION */]]) {
        cb(input);
        return;
      }
      Object(__WEBPACK_IMPORTED_MODULE_2__scheduler__["a" /* asap */])(function () {
        return cb(input);
      });
    });
  });

  return _extends({}, chan, {
    take: function take(cb, matcher) {
      if (arguments.length > 1) {
        Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(matcher, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func, "channel.take's matcher argument must be a function");
        cb[__WEBPACK_IMPORTED_MODULE_0__utils__["b" /* MATCH */]] = matcher;
      }
      chan.take(cb);
    }
  });
}

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["r"] = take;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "u", function() { return takem; });
/* harmony export (immutable) */ __webpack_exports__["m"] = put;
/* harmony export (immutable) */ __webpack_exports__["b"] = all;
/* harmony export (immutable) */ __webpack_exports__["n"] = race;
/* harmony export (immutable) */ __webpack_exports__["e"] = call;
/* harmony export (immutable) */ __webpack_exports__["c"] = apply;
/* harmony export (immutable) */ __webpack_exports__["h"] = cps;
/* harmony export (immutable) */ __webpack_exports__["j"] = fork;
/* harmony export (immutable) */ __webpack_exports__["q"] = spawn;
/* harmony export (immutable) */ __webpack_exports__["l"] = join;
/* harmony export (immutable) */ __webpack_exports__["f"] = cancel;
/* harmony export (immutable) */ __webpack_exports__["o"] = select;
/* harmony export (immutable) */ __webpack_exports__["a"] = actionChannel;
/* harmony export (immutable) */ __webpack_exports__["g"] = cancelled;
/* harmony export (immutable) */ __webpack_exports__["i"] = flush;
/* harmony export (immutable) */ __webpack_exports__["k"] = getContext;
/* harmony export (immutable) */ __webpack_exports__["p"] = setContext;
/* harmony export (immutable) */ __webpack_exports__["s"] = takeEvery;
/* harmony export (immutable) */ __webpack_exports__["t"] = takeLatest;
/* harmony export (immutable) */ __webpack_exports__["v"] = throttle;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return asEffect; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__sagaHelpers__ = __webpack_require__(13);



var IO = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["x" /* sym */])('IO');
var TAKE = 'TAKE';
var PUT = 'PUT';
var ALL = 'ALL';
var RACE = 'RACE';
var CALL = 'CALL';
var CPS = 'CPS';
var FORK = 'FORK';
var JOIN = 'JOIN';
var CANCEL = 'CANCEL';
var SELECT = 'SELECT';
var ACTION_CHANNEL = 'ACTION_CHANNEL';
var CANCELLED = 'CANCELLED';
var FLUSH = 'FLUSH';
var GET_CONTEXT = 'GET_CONTEXT';
var SET_CONTEXT = 'SET_CONTEXT';

var TEST_HINT = '\n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)';

var effect = function effect(type, payload) {
  var _ref;

  return _ref = {}, _ref[IO] = true, _ref[type] = payload, _ref;
};

function take() {
  var patternOrChannel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '*';

  if (arguments.length) {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(arguments[0], __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'take(patternOrChannel): patternOrChannel is undefined');
  }
  if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].pattern(patternOrChannel)) {
    return effect(TAKE, { pattern: patternOrChannel });
  }
  if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].channel(patternOrChannel)) {
    return effect(TAKE, { channel: patternOrChannel });
  }
  throw new Error('take(patternOrChannel): argument ' + String(patternOrChannel) + ' is not valid channel or a valid pattern');
}

take.maybe = function () {
  var eff = take.apply(undefined, arguments);
  eff[TAKE].maybe = true;
  return eff;
};

var takem = /*#__PURE__*/Object(__WEBPACK_IMPORTED_MODULE_0__utils__["n" /* deprecate */])(take.maybe, /*#__PURE__*/Object(__WEBPACK_IMPORTED_MODULE_0__utils__["z" /* updateIncentive */])('takem', 'take.maybe'));

function put(channel, action) {
  if (arguments.length > 1) {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(channel, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'put(channel, action): argument channel is undefined');
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(channel, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].channel, 'put(channel, action): argument ' + channel + ' is not a valid channel');
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(action, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'put(channel, action): argument action is undefined');
  } else {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(channel, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'put(action): argument action is undefined');
    action = channel;
    channel = null;
  }
  return effect(PUT, { channel: channel, action: action });
}

put.resolve = function () {
  var eff = put.apply(undefined, arguments);
  eff[PUT].resolve = true;
  return eff;
};

put.sync = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["n" /* deprecate */])(put.resolve, Object(__WEBPACK_IMPORTED_MODULE_0__utils__["z" /* updateIncentive */])('put.sync', 'put.resolve'));

function all(effects) {
  return effect(ALL, effects);
}

function race(effects) {
  return effect(RACE, effects);
}

function getFnCallDesc(meth, fn, args) {
  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(fn, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, meth + ': argument fn is undefined');

  var context = null;
  if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].array(fn)) {
    var _fn = fn;
    context = _fn[0];
    fn = _fn[1];
  } else if (fn.fn) {
    var _fn2 = fn;
    context = _fn2.context;
    fn = _fn2.fn;
  }
  if (context && __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].string(fn) && __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(context[fn])) {
    fn = context[fn];
  }
  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(fn, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func, meth + ': argument ' + fn + ' is not a function');

  return { context: context, fn: fn, args: args };
}

function call(fn) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return effect(CALL, getFnCallDesc('call', fn, args));
}

function apply(context, fn) {
  var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  return effect(CALL, getFnCallDesc('apply', { context: context, fn: fn }, args));
}

function cps(fn) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  return effect(CPS, getFnCallDesc('cps', fn, args));
}

function fork(fn) {
  for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    args[_key3 - 1] = arguments[_key3];
  }

  return effect(FORK, getFnCallDesc('fork', fn, args));
}

function spawn(fn) {
  for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    args[_key4 - 1] = arguments[_key4];
  }

  var eff = fork.apply(undefined, [fn].concat(args));
  eff[FORK].detached = true;
  return eff;
}

function join() {
  for (var _len5 = arguments.length, tasks = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    tasks[_key5] = arguments[_key5];
  }

  if (tasks.length > 1) {
    return all(tasks.map(function (t) {
      return join(t);
    }));
  }
  var task = tasks[0];
  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(task, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'join(task): argument task is undefined');
  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(task, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].task, 'join(task): argument ' + task + ' is not a valid Task object ' + TEST_HINT);
  return effect(JOIN, task);
}

function cancel() {
  for (var _len6 = arguments.length, tasks = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    tasks[_key6] = arguments[_key6];
  }

  if (tasks.length > 1) {
    return all(tasks.map(function (t) {
      return cancel(t);
    }));
  }
  var task = tasks[0];
  if (tasks.length === 1) {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(task, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'cancel(task): argument task is undefined');
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(task, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].task, 'cancel(task): argument ' + task + ' is not a valid Task object ' + TEST_HINT);
  }
  return effect(CANCEL, task || __WEBPACK_IMPORTED_MODULE_0__utils__["d" /* SELF_CANCELLATION */]);
}

function select(selector) {
  for (var _len7 = arguments.length, args = Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
    args[_key7 - 1] = arguments[_key7];
  }

  if (arguments.length === 0) {
    selector = __WEBPACK_IMPORTED_MODULE_0__utils__["o" /* ident */];
  } else {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(selector, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'select(selector,[...]): argument selector is undefined');
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(selector, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func, 'select(selector,[...]): argument ' + selector + ' is not a function');
  }
  return effect(SELECT, { selector: selector, args: args });
}

/**
  channel(pattern, [buffer])    => creates an event channel for store actions
**/
function actionChannel(pattern, buffer) {
  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(pattern, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'actionChannel(pattern,...): argument pattern is undefined');
  if (arguments.length > 1) {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(buffer, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].notUndef, 'actionChannel(pattern, buffer): argument buffer is undefined');
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(buffer, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].buffer, 'actionChannel(pattern, buffer): argument ' + buffer + ' is not a valid buffer');
  }
  return effect(ACTION_CHANNEL, { pattern: pattern, buffer: buffer });
}

function cancelled() {
  return effect(CANCELLED, {});
}

function flush(channel) {
  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(channel, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].channel, 'flush(channel): argument ' + channel + ' is not valid channel');
  return effect(FLUSH, channel);
}

function getContext(prop) {
  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(prop, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].string, 'getContext(prop): argument ' + prop + ' is not a string');
  return effect(GET_CONTEXT, prop);
}

function setContext(props) {
  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(props, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].object, Object(__WEBPACK_IMPORTED_MODULE_0__utils__["k" /* createSetContextWarning */])(null, props));
  return effect(SET_CONTEXT, props);
}

function takeEvery(patternOrChannel, worker) {
  for (var _len8 = arguments.length, args = Array(_len8 > 2 ? _len8 - 2 : 0), _key8 = 2; _key8 < _len8; _key8++) {
    args[_key8 - 2] = arguments[_key8];
  }

  return fork.apply(undefined, [__WEBPACK_IMPORTED_MODULE_1__sagaHelpers__["b" /* takeEveryHelper */], patternOrChannel, worker].concat(args));
}

function takeLatest(patternOrChannel, worker) {
  for (var _len9 = arguments.length, args = Array(_len9 > 2 ? _len9 - 2 : 0), _key9 = 2; _key9 < _len9; _key9++) {
    args[_key9 - 2] = arguments[_key9];
  }

  return fork.apply(undefined, [__WEBPACK_IMPORTED_MODULE_1__sagaHelpers__["d" /* takeLatestHelper */], patternOrChannel, worker].concat(args));
}

function throttle(ms, pattern, worker) {
  for (var _len10 = arguments.length, args = Array(_len10 > 3 ? _len10 - 3 : 0), _key10 = 3; _key10 < _len10; _key10++) {
    args[_key10 - 3] = arguments[_key10];
  }

  return fork.apply(undefined, [__WEBPACK_IMPORTED_MODULE_1__sagaHelpers__["f" /* throttleHelper */], ms, pattern, worker].concat(args));
}

var createAsEffectType = function createAsEffectType(type) {
  return function (effect) {
    return effect && effect[IO] && effect[type];
  };
};

var asEffect = {
  take: createAsEffectType(TAKE),
  put: createAsEffectType(PUT),
  all: createAsEffectType(ALL),
  race: createAsEffectType(RACE),
  call: createAsEffectType(CALL),
  cps: createAsEffectType(CPS),
  fork: createAsEffectType(FORK),
  join: createAsEffectType(JOIN),
  cancel: createAsEffectType(CANCEL),
  select: createAsEffectType(SELECT),
  actionChannel: createAsEffectType(ACTION_CHANNEL),
  cancelled: createAsEffectType(CANCELLED),
  flush: createAsEffectType(FLUSH),
  getContext: createAsEffectType(GET_CONTEXT),
  setContext: createAsEffectType(SET_CONTEXT)
};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = __webpack_require__(6);
const stages_1 = __webpack_require__(9);
const types_1 = __webpack_require__(2);
function sum(iterable) {
    let result = 0;
    for (const item of iterable) {
        result += item;
    }
    return result;
}
exports.sum = sum;
function getOrDefault(map, key, getValue) {
    if (!map.has(key)) {
        map.set(key, getValue());
    }
    return map.get(key);
}
exports.getOrDefault = getOrDefault;
// 根据坦克的位置计算子弹的生成位置
// 参数x,y,direction为坦克的位置和方向
function calculateBulletStartPosition({ x, y, direction }) {
    if (direction === 'up') {
        return { x: x + 6, y: y - 3 };
    }
    else if (direction === 'down') {
        return { x: x + 6, y: y + constants_1.BLOCK_SIZE };
    }
    else if (direction === 'left') {
        return { x: x - 3, y: y + 6 };
    }
    else if (direction === 'right') {
        return { x: x + constants_1.BLOCK_SIZE, y: y + 6 };
    }
    else {
        throw new Error(`Invalid direction ${direction}`);
    }
}
exports.calculateBulletStartPosition = calculateBulletStartPosition;
function between(min, value, max, threshhold = 0) {
    return min - threshhold <= value && value <= max + threshhold;
}
exports.between = between;
function getRowCol(t, N) {
    return [Math.floor(t / N), t % N];
}
exports.getRowCol = getRowCol;
/** 用来判断subject和object是否相撞 */
function testCollide(subject, object, threshhold = 0) {
    return between(subject.x - object.width, object.x, subject.x + subject.width, threshhold)
        && between(subject.y - object.height, object.y, subject.y + subject.height, threshhold);
}
exports.testCollide = testCollide;
// 输入itemSize和box. item对应brick/steel/river, box对应bullet/tank
// 生成器将yield满足条件<row行col列的item与box相撞>的[row, col]二元组
// itemSize: number
// box: { x: number, y: number, width: number, height: number }
function* iterRowsAndCols(itemSize, box) {
    const N = constants_1.FIELD_SIZE / itemSize; // todo should not use N
    const col1 = Math.max(0, Math.floor(box.x / itemSize));
    const col2 = Math.min(N - 1, Math.floor((box.x + box.width) / itemSize));
    const row1 = Math.max(0, Math.floor(box.y / itemSize));
    const row2 = Math.min(N - 1, Math.floor((box.y + box.height) / itemSize));
    for (let row = row1; row <= row2; row += 1) {
        for (let col = col1; col <= col2; col += 1) {
            yield [row, col];
        }
    }
}
exports.iterRowsAndCols = iterRowsAndCols;
exports.frame = (x) => 1000 / 60 * x;
// 判断box是否在战场内
// box: { x: number, y: number, width: number, height: number }
function isInField(box) {
    return between(0, box.x, constants_1.FIELD_SIZE - box.width)
        && between(0, box.y, constants_1.FIELD_SIZE - box.height);
}
exports.isInField = isInField;
const nextIdMap = new Map();
function getNextId(tag = '') {
    if (nextIdMap.has(tag)) {
        const nextId = nextIdMap.get(tag);
        nextIdMap.set(tag, nextId + 1);
        return nextId;
    }
    else {
        nextIdMap.set(tag, 2);
        return 1;
    }
}
exports.getNextId = getNextId;
// 将BulletRecord/TankRecord/Eagle/PowerUpRecord转换为Box类型对象
function asBox(item, enlargement = 0) {
    if (item instanceof types_1.BulletRecord) {
        return {
            x: item.x - constants_1.BULLET_SIZE / 2 * enlargement,
            y: item.y - constants_1.BULLET_SIZE / 2 * enlargement,
            width: constants_1.BULLET_SIZE * (1 + enlargement),
            height: constants_1.BULLET_SIZE * (1 + enlargement),
        };
    }
    else if (item instanceof types_1.TankRecord) {
        return {
            x: item.x - constants_1.TANK_SIZE / 2 * enlargement,
            y: item.y - constants_1.TANK_SIZE / 2 * enlargement,
            width: constants_1.TANK_SIZE * (1 + enlargement),
            height: constants_1.TANK_SIZE * (1 + enlargement),
        };
    }
    else if (item instanceof types_1.EagleRecord) {
        return {
            x: item.x - constants_1.BLOCK_SIZE / 2 * enlargement,
            y: item.y - constants_1.BLOCK_SIZE / 2 * enlargement,
            width: constants_1.BLOCK_SIZE * (1 + enlargement),
            height: constants_1.BLOCK_SIZE * (1 + enlargement),
        };
    }
    else if (item instanceof types_1.PowerUpRecord) {
        console.assert(enlargement === -0.5);
        return {
            x: item.x - constants_1.BLOCK_SIZE / 2 * enlargement,
            y: item.y - constants_1.BLOCK_SIZE / 2 * enlargement,
            width: constants_1.BLOCK_SIZE * (1 + enlargement),
            height: constants_1.BLOCK_SIZE * (1 + enlargement),
        };
    }
    else {
        throw new Error('Cannot convert to type Box');
    }
}
exports.asBox = asBox;
exports.inc = amount => x => x + amount;
exports.dec = amount => x => x - amount;
function getDirectionInfo(direction, flipxy = false) {
    let result;
    if (direction === 'up') {
        result = { xy: 'y', updater: exports.dec };
    }
    else if (direction === 'down') {
        result = { xy: 'y', updater: exports.inc };
    }
    else if (direction === 'left') {
        result = { xy: 'x', updater: exports.dec };
    }
    else if (direction === 'right') {
        result = { xy: 'x', updater: exports.inc };
    }
    else {
        throw new Error('Invalid direction');
    }
    if (flipxy) {
        result.xy = result.xy === 'x' ? 'y' : 'x';
    }
    return result;
}
exports.getDirectionInfo = getDirectionInfo;
function reverseDirection(direction) {
    if (direction === 'up') {
        return 'down';
    }
    if (direction === 'down') {
        return 'up';
    }
    if (direction === 'left') {
        return 'right';
    }
    if (direction === 'right') {
        return 'left';
    }
}
exports.reverseDirection = reverseDirection;
function incTankLevel(tank) {
    if (tank.level === 'basic') {
        return tank.set('level', 'fast');
    }
    else if (tank.level === 'fast') {
        return tank.set('level', 'power');
    }
    else {
        return tank.set('level', 'armor');
    }
}
exports.incTankLevel = incTankLevel;
function getTankBulletLimit(tank) {
    if (tank.side === 'ai' || tank.level === 'basic' || tank.level === 'fast') {
        return 1;
    }
    else {
        return 2;
    }
}
exports.getTankBulletLimit = getTankBulletLimit;
function getTankBulletSpeed(tank) {
    if (tank.side === 'human') {
        if (false) {
            return 0.6;
        }
        else {
            if (tank.level === 'basic') {
                return 0.12;
            }
            else {
                return 0.24;
            }
        }
    }
    else {
        if (tank.level === 'basic') {
            return 0.12;
        }
        else {
            return 0.24;
        }
    }
}
exports.getTankBulletSpeed = getTankBulletSpeed;
function getTankBulletInterval(tank) {
    // todo 需要校准数值
    if (tank.level === 'basic') {
        return 300;
    }
    else {
        return 200;
    }
}
exports.getTankBulletInterval = getTankBulletInterval;
function getTankMoveSpeed(tank) {
    if (tank.side === 'human') {
        return  false ? 0.09 : 0.045;
    }
    else {
        if (tank.level === 'basic') {
            return 0.03;
        }
        else if (tank.level === 'fast') {
            return 0.06;
        }
        else {
            return 0.045;
        }
    }
}
exports.getTankMoveSpeed = getTankMoveSpeed;
function getTankBulletPower(tank) {
    if (tank.side === 'human' && tank.level === 'armor') {
        return 3;
    }
    else if (tank.side === 'ai' && tank.level === 'power') {
        return 2;
    }
    else {
        return 1;
    }
}
exports.getTankBulletPower = getTankBulletPower;
function getWithPowerUpProbability(stageName) {
    // TODO 需要校准数值
    return 0.2 + stages_1.default[stageName].difficulty * 0.05;
}
exports.getWithPowerUpProbability = getWithPowerUpProbability;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/** 一块的大小对应16个像素 */
exports.BLOCK_SIZE = 16;
/** 坦克的大小 */
exports.TANK_SIZE = exports.BLOCK_SIZE;
/** 战场的大小 (13block * 13block) */
exports.FIELD_BLOCK_SIZE = 13;
/** 战场的大小 (208pixel * 208pixel) */
exports.FIELD_SIZE = exports.BLOCK_SIZE * exports.FIELD_BLOCK_SIZE;
/** 子弹的大小 */
exports.BULLET_SIZE = 3;
/** @depreacted 坦克生成的延迟 */
exports.TANK_SPAWN_DELAY = 1500;
/** 摧毁steel的最低子弹power值 */
exports.STEEL_POWER = 3;
exports.TANK_COLOR_SCHEMES = {
    yellow: {
        a: '#E7E794',
        b: '#E79C21',
        c: '#6B6B00',
    },
    green: {
        a: '#B5F7CE',
        b: '#008C31',
        c: '#005200',
    },
    silver: {
        a: '#FFFFFF',
        b: '#ADADAD',
        c: '#00424A',
    },
    red: {
        a: '#FFFFFF',
        b: '#B53121',
        c: '#5A007B',
    },
};
/** 击杀坦克的得分列表 */
exports.TANK_KILL_SCORE_MAP = {
    basic: 100,
    fast: 200,
    power: 300,
    armor: 400,
};
/** 物体的大小(边长) */
exports.ITEM_SIZE_MAP = {
    BRICK: 4,
    STEEL: 8,
    RIVER: exports.BLOCK_SIZE,
    SNOW: exports.BLOCK_SIZE,
    FOREST: exports.BLOCK_SIZE,
};
/** 物体铺满地图一整行所需要的数量 */
exports.N_MAP = {
    BRICK: exports.FIELD_SIZE / exports.ITEM_SIZE_MAP.BRICK,
    STEEL: exports.FIELD_SIZE / exports.ITEM_SIZE_MAP.STEEL,
    RIVER: exports.FIELD_SIZE / exports.ITEM_SIZE_MAP.RIVER,
    SNOW: exports.FIELD_SIZE / exports.ITEM_SIZE_MAP.SNOW,
    FOREST: exports.FIELD_SIZE / exports.ITEM_SIZE_MAP.FOREST,
};
exports.CONTROL_CONFIG = {
    player1: {
        up: 'w',
        left: 'a',
        down: 's',
        right: 'd',
        fire: 'j',
    },
    player2: {
        up: 'up',
        left: 'left',
        down: 'down',
        right: 'right',
        fire: 'space',
    },
};
exports.TANK_LEVELS = ['basic', 'fast', 'power', 'armor'];


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export BUFFER_OVERFLOW */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return buffers; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);


var BUFFER_OVERFLOW = "Channel's Buffer overflow!";

var ON_OVERFLOW_THROW = 1;
var ON_OVERFLOW_DROP = 2;
var ON_OVERFLOW_SLIDE = 3;
var ON_OVERFLOW_EXPAND = 4;

var zeroBuffer = { isEmpty: __WEBPACK_IMPORTED_MODULE_0__utils__["r" /* kTrue */], put: __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */], take: __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */] };

function ringBuffer() {
  var limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
  var overflowAction = arguments[1];

  var arr = new Array(limit);
  var length = 0;
  var pushIndex = 0;
  var popIndex = 0;

  var push = function push(it) {
    arr[pushIndex] = it;
    pushIndex = (pushIndex + 1) % limit;
    length++;
  };

  var take = function take() {
    if (length != 0) {
      var it = arr[popIndex];
      arr[popIndex] = null;
      length--;
      popIndex = (popIndex + 1) % limit;
      return it;
    }
  };

  var flush = function flush() {
    var items = [];
    while (length) {
      items.push(take());
    }
    return items;
  };

  return {
    isEmpty: function isEmpty() {
      return length == 0;
    },
    put: function put(it) {
      if (length < limit) {
        push(it);
      } else {
        var doubledLimit = void 0;
        switch (overflowAction) {
          case ON_OVERFLOW_THROW:
            throw new Error(BUFFER_OVERFLOW);
          case ON_OVERFLOW_SLIDE:
            arr[pushIndex] = it;
            pushIndex = (pushIndex + 1) % limit;
            popIndex = pushIndex;
            break;
          case ON_OVERFLOW_EXPAND:
            doubledLimit = 2 * limit;

            arr = flush();

            length = arr.length;
            pushIndex = arr.length;
            popIndex = 0;

            arr.length = doubledLimit;
            limit = doubledLimit;

            push(it);
            break;
          default:
          // DROP
        }
      }
    },
    take: take,
    flush: flush
  };
}

var buffers = {
  none: function none() {
    return zeroBuffer;
  },
  fixed: function fixed(limit) {
    return ringBuffer(limit, ON_OVERFLOW_THROW);
  },
  dropping: function dropping(limit) {
    return ringBuffer(limit, ON_OVERFLOW_DROP);
  },
  sliding: function sliding(limit) {
    return ringBuffer(limit, ON_OVERFLOW_SLIDE);
  },
  expanding: function expanding(initialSize) {
    return ringBuffer(initialSize, ON_OVERFLOW_EXPAND);
  }
};

/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return qEnd; });
/* harmony export (immutable) */ __webpack_exports__["c"] = safeName;
/* harmony export (immutable) */ __webpack_exports__["a"] = fsmIterator;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);


var done = { done: true, value: undefined };
var qEnd = {};

function safeName(patternOrChannel) {
  if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].channel(patternOrChannel)) {
    return 'channel';
  } else if (Array.isArray(patternOrChannel)) {
    return String(patternOrChannel.map(function (entry) {
      return String(entry);
    }));
  } else {
    return String(patternOrChannel);
  }
}

function fsmIterator(fsm, q0) {
  var name = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'iterator';

  var updateState = void 0,
      qNext = q0;

  function next(arg, error) {
    if (qNext === qEnd) {
      return done;
    }

    if (error) {
      qNext = qEnd;
      throw error;
    } else {
      updateState && updateState(arg);

      var _fsm$qNext = fsm[qNext](),
          q = _fsm$qNext[0],
          output = _fsm$qNext[1],
          _updateState = _fsm$qNext[2];

      qNext = q;
      updateState = _updateState;
      return qNext === qEnd ? done : output;
    }
  }

  return Object(__WEBPACK_IMPORTED_MODULE_0__utils__["t" /* makeIterator */])(next, function (error) {
    return next(null, error);
  }, name, true);
}

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const stageConfigs = {};
const requireStage = __webpack_require__(36);
for (const filename of requireStage.keys()) {
    const stage = requireStage(filename);
    stageConfigs[stage.name] = stage;
}
exports.default = stageConfigs;


/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = asap;
/* harmony export (immutable) */ __webpack_exports__["c"] = suspend;
/* harmony export (immutable) */ __webpack_exports__["b"] = flush;
var queue = [];
/**
  Variable to hold a counting semaphore
  - Incrementing adds a lock and puts the scheduler in a `suspended` state (if it's not
    already suspended)
  - Decrementing releases a lock. Zero locks puts the scheduler in a `released` state. This
    triggers flushing the queued tasks.
**/
var semaphore = 0;

/**
  Executes a task 'atomically'. Tasks scheduled during this execution will be queued
  and flushed after this task has finished (assuming the scheduler endup in a released
  state).
**/
function exec(task) {
  try {
    suspend();
    task();
  } finally {
    release();
  }
}

/**
  Executes or queues a task depending on the state of the scheduler (`suspended` or `released`)
**/
function asap(task) {
  queue.push(task);

  if (!semaphore) {
    suspend();
    flush();
  }
}

/**
  Puts the scheduler in a `suspended` state. Scheduled tasks will be queued until the
  scheduler is released.
**/
function suspend() {
  semaphore++;
}

/**
  Puts the scheduler in a `released` state.
**/
function release() {
  semaphore--;
}

/**
  Releases the current lock. Executes all queued tasks if the scheduler is in the released state.
**/
function flush() {
  release();

  var task = void 0;
  while (!semaphore && (task = queue.shift()) !== undefined) {
    exec(task);
  }
}

/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = runSaga;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__proc__ = __webpack_require__(12);



var RUN_SAGA_SIGNATURE = 'runSaga(storeInterface, saga, ...args)';
var NON_GENERATOR_ERR = RUN_SAGA_SIGNATURE + ': saga argument must be a Generator function!';

function runSaga(storeInterface, saga) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  var iterator = void 0;

  if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].iterator(storeInterface)) {
    if (false) {
      log('warn', 'runSaga(iterator, storeInterface) has been deprecated in favor of ' + RUN_SAGA_SIGNATURE);
    }
    iterator = storeInterface;
    storeInterface = saga;
  } else {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(saga, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func, NON_GENERATOR_ERR);
    iterator = saga.apply(undefined, args);
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(iterator, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].iterator, NON_GENERATOR_ERR);
  }

  var _storeInterface = storeInterface,
      subscribe = _storeInterface.subscribe,
      dispatch = _storeInterface.dispatch,
      getState = _storeInterface.getState,
      context = _storeInterface.context,
      sagaMonitor = _storeInterface.sagaMonitor,
      logger = _storeInterface.logger,
      onError = _storeInterface.onError;


  var effectId = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["y" /* uid */])();

  if (sagaMonitor) {
    // monitors are expected to have a certain interface, let's fill-in any missing ones
    sagaMonitor.effectTriggered = sagaMonitor.effectTriggered || __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
    sagaMonitor.effectResolved = sagaMonitor.effectResolved || __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
    sagaMonitor.effectRejected = sagaMonitor.effectRejected || __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
    sagaMonitor.effectCancelled = sagaMonitor.effectCancelled || __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
    sagaMonitor.actionDispatched = sagaMonitor.actionDispatched || __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];

    sagaMonitor.effectTriggered({ effectId: effectId, root: true, parentEffectId: 0, effect: { root: true, saga: saga, args: args } });
  }

  var task = Object(__WEBPACK_IMPORTED_MODULE_1__proc__["b" /* default */])(iterator, subscribe, Object(__WEBPACK_IMPORTED_MODULE_0__utils__["A" /* wrapSagaDispatch */])(dispatch), getState, context, { sagaMonitor: sagaMonitor, logger: logger, onError: onError }, effectId, saga.name);

  if (sagaMonitor) {
    sagaMonitor.effectResolved(effectId, task);
  }

  return task;
}

/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export NOT_ITERATOR_ERROR */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CHANNEL_END; });
/* unused harmony export TASK_CANCEL */
/* harmony export (immutable) */ __webpack_exports__["b"] = proc;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__scheduler__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__io__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__channel__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__buffers__ = __webpack_require__(7);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineEnumerableProperties(obj, descs) { for (var key in descs) { var desc = descs[key]; desc.configurable = desc.enumerable = true; if ("value" in desc) desc.writable = true; Object.defineProperty(obj, key, desc); } return obj; }







var NOT_ITERATOR_ERROR = 'proc first argument (Saga function result) must be an iterator';

var CHANNEL_END = {
  toString: function toString() {
    return '@@redux-saga/CHANNEL_END';
  }
};
var TASK_CANCEL = {
  toString: function toString() {
    return '@@redux-saga/TASK_CANCEL';
  }
};

var matchers = {
  wildcard: function wildcard() {
    return __WEBPACK_IMPORTED_MODULE_0__utils__["r" /* kTrue */];
  },
  default: function _default(pattern) {
    return (typeof pattern === 'undefined' ? 'undefined' : _typeof(pattern)) === 'symbol' ? function (input) {
      return input.type === pattern;
    } : function (input) {
      return input.type === String(pattern);
    };
  },
  array: function array(patterns) {
    return function (input) {
      return patterns.some(function (p) {
        return matcher(p)(input);
      });
    };
  },
  predicate: function predicate(_predicate) {
    return function (input) {
      return _predicate(input);
    };
  }
};

function matcher(pattern) {
  // prettier-ignore
  return (pattern === '*' ? matchers.wildcard : __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].array(pattern) ? matchers.array : __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].stringableFunc(pattern) ? matchers.default : __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(pattern) ? matchers.predicate : matchers.default)(pattern);
}

/**
  Used to track a parent task and its forks
  In the new fork model, forked tasks are attached by default to their parent
  We model this using the concept of Parent task && main Task
  main task is the main flow of the current Generator, the parent tasks is the
  aggregation of the main tasks + all its forked tasks.
  Thus the whole model represents an execution tree with multiple branches (vs the
  linear execution tree in sequential (non parallel) programming)

  A parent tasks has the following semantics
  - It completes if all its forks either complete or all cancelled
  - If it's cancelled, all forks are cancelled as well
  - It aborts if any uncaught error bubbles up from forks
  - If it completes, the return value is the one returned by the main task
**/
function forkQueue(name, mainTask, cb) {
  var tasks = [],
      result = void 0,
      completed = false;
  addTask(mainTask);

  function abort(err) {
    cancelAll();
    cb(err, true);
  }

  function addTask(task) {
    tasks.push(task);
    task.cont = function (res, isErr) {
      if (completed) {
        return;
      }

      Object(__WEBPACK_IMPORTED_MODULE_0__utils__["w" /* remove */])(tasks, task);
      task.cont = __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
      if (isErr) {
        abort(res);
      } else {
        if (task === mainTask) {
          result = res;
        }
        if (!tasks.length) {
          completed = true;
          cb(result);
        }
      }
    };
    // task.cont.cancel = task.cancel
  }

  function cancelAll() {
    if (completed) {
      return;
    }
    completed = true;
    tasks.forEach(function (t) {
      t.cont = __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
      t.cancel();
    });
    tasks = [];
  }

  return {
    addTask: addTask,
    cancelAll: cancelAll,
    abort: abort,
    getTasks: function getTasks() {
      return tasks;
    },
    taskNames: function taskNames() {
      return tasks.map(function (t) {
        return t.name;
      });
    }
  };
}

function createTaskIterator(_ref) {
  var context = _ref.context,
      fn = _ref.fn,
      args = _ref.args;

  if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].iterator(fn)) {
    return fn;
  }

  // catch synchronous failures; see #152 and #441
  var result = void 0,
      error = void 0;
  try {
    result = fn.apply(context, args);
  } catch (err) {
    error = err;
  }

  // i.e. a generator function returns an iterator
  if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].iterator(result)) {
    return result;
  }

  // do not bubble up synchronous failures for detached forks
  // instead create a failed task. See #152 and #441
  return error ? Object(__WEBPACK_IMPORTED_MODULE_0__utils__["t" /* makeIterator */])(function () {
    throw error;
  }) : Object(__WEBPACK_IMPORTED_MODULE_0__utils__["t" /* makeIterator */])(function () {
    var pc = void 0;
    var eff = { done: false, value: result };
    var ret = function ret(value) {
      return { done: true, value: value };
    };
    return function (arg) {
      if (!pc) {
        pc = true;
        return eff;
      } else {
        return ret(arg);
      }
    };
  }());
}

var wrapHelper = function wrapHelper(helper) {
  return { fn: helper };
};

function proc(iterator) {
  var subscribe = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {
    return __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
  };
  var dispatch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
  var getState = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
  var parentContext = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
  var parentEffectId = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
  var name = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 'anonymous';
  var cont = arguments[8];

  Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(iterator, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].iterator, NOT_ITERATOR_ERROR);

  var effectsString = '[...effects]';
  var runParallelEffect = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["n" /* deprecate */])(runAllEffect, Object(__WEBPACK_IMPORTED_MODULE_0__utils__["z" /* updateIncentive */])(effectsString, 'all(' + effectsString + ')'));

  var sagaMonitor = options.sagaMonitor,
      logger = options.logger,
      onError = options.onError;

  var log = logger || __WEBPACK_IMPORTED_MODULE_0__utils__["s" /* log */];
  var stdChannel = Object(__WEBPACK_IMPORTED_MODULE_3__channel__["f" /* stdChannel */])(subscribe);
  var taskContext = Object.create(parentContext);
  /**
    Tracks the current effect cancellation
    Each time the generator progresses. calling runEffect will set a new value
    on it. It allows propagating cancellation to child effects
  **/
  next.cancel = __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];

  /**
    Creates a new task descriptor for this generator, We'll also create a main task
    to track the main flow (besides other forked tasks)
  **/
  var task = newTask(parentEffectId, name, iterator, cont);
  var mainTask = { name: name, cancel: cancelMain, isRunning: true };
  var taskQueue = forkQueue(name, mainTask, end);

  /**
    cancellation of the main task. We'll simply resume the Generator with a Cancel
  **/
  function cancelMain() {
    if (mainTask.isRunning && !mainTask.isCancelled) {
      mainTask.isCancelled = true;
      next(TASK_CANCEL);
    }
  }

  /**
    This may be called by a parent generator to trigger/propagate cancellation
    cancel all pending tasks (including the main task), then end the current task.
     Cancellation propagates down to the whole execution tree holded by this Parent task
    It's also propagated to all joiners of this task and their execution tree/joiners
     Cancellation is noop for terminated/Cancelled tasks tasks
  **/
  function cancel() {
    /**
      We need to check both Running and Cancelled status
      Tasks can be Cancelled but still Running
    **/
    if (iterator._isRunning && !iterator._isCancelled) {
      iterator._isCancelled = true;
      taskQueue.cancelAll();
      /**
        Ending with a Never result will propagate the Cancellation to all joiners
      **/
      end(TASK_CANCEL);
    }
  }
  /**
    attaches cancellation logic to this task's continuation
    this will permit cancellation to propagate down the call chain
  **/
  cont && (cont.cancel = cancel);

  // tracks the running status
  iterator._isRunning = true;

  // kicks up the generator
  next();

  // then return the task descriptor to the caller
  return task;

  /**
    This is the generator driver
    It's a recursive async/continuation function which calls itself
    until the generator terminates or throws
  **/
  function next(arg, isErr) {
    // Preventive measure. If we end up here, then there is really something wrong
    if (!mainTask.isRunning) {
      throw new Error('Trying to resume an already finished generator');
    }

    try {
      var result = void 0;
      if (isErr) {
        result = iterator.throw(arg);
      } else if (arg === TASK_CANCEL) {
        /**
          getting TASK_CANCEL automatically cancels the main task
          We can get this value here
           - By cancelling the parent task manually
          - By joining a Cancelled task
        **/
        mainTask.isCancelled = true;
        /**
          Cancels the current effect; this will propagate the cancellation down to any called tasks
        **/
        next.cancel();
        /**
          If this Generator has a `return` method then invokes it
          This will jump to the finally block
        **/
        result = __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(iterator.return) ? iterator.return(TASK_CANCEL) : { done: true, value: TASK_CANCEL };
      } else if (arg === CHANNEL_END) {
        // We get CHANNEL_END by taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
        result = __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(iterator.return) ? iterator.return() : { done: true };
      } else {
        result = iterator.next(arg);
      }

      if (!result.done) {
        runEffect(result.value, parentEffectId, '', next);
      } else {
        /**
          This Generator has ended, terminate the main task and notify the fork queue
        **/
        mainTask.isMainRunning = false;
        mainTask.cont && mainTask.cont(result.value);
      }
    } catch (error) {
      if (mainTask.isCancelled) {
        log('error', 'uncaught at ' + name, error.message);
      }
      mainTask.isMainRunning = false;
      mainTask.cont(error, true);
    }
  }

  function end(result, isErr) {
    iterator._isRunning = false;
    stdChannel.close();
    if (!isErr) {
      if (false) {
        log('info', name + ' has been cancelled', '');
      }
      iterator._result = result;
      iterator._deferredEnd && iterator._deferredEnd.resolve(result);
    } else {
      if (result instanceof Error) {
        result.sagaStack = 'at ' + name + ' \n ' + (result.sagaStack || result.stack);
      }
      if (!task.cont) {
        log('error', 'uncaught', result.sagaStack || result.stack);
        if (result instanceof Error && onError) {
          onError(result);
        }
      }
      iterator._error = result;
      iterator._isAborted = true;
      iterator._deferredEnd && iterator._deferredEnd.reject(result);
    }
    task.cont && task.cont(result, isErr);
    task.joiners.forEach(function (j) {
      return j.cb(result, isErr);
    });
    task.joiners = null;
  }

  function runEffect(effect, parentEffectId) {
    var label = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var cb = arguments[3];

    var effectId = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["y" /* uid */])();
    sagaMonitor && sagaMonitor.effectTriggered({ effectId: effectId, parentEffectId: parentEffectId, label: label, effect: effect });

    /**
      completion callback and cancel callback are mutually exclusive
      We can't cancel an already completed effect
      And We can't complete an already cancelled effectId
    **/
    var effectSettled = void 0;

    // Completion callback passed to the appropriate effect runner
    function currCb(res, isErr) {
      if (effectSettled) {
        return;
      }

      effectSettled = true;
      cb.cancel = __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */]; // defensive measure
      if (sagaMonitor) {
        isErr ? sagaMonitor.effectRejected(effectId, res) : sagaMonitor.effectResolved(effectId, res);
      }
      cb(res, isErr);
    }
    // tracks down the current cancel
    currCb.cancel = __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];

    // setup cancellation logic on the parent cb
    cb.cancel = function () {
      // prevents cancelling an already completed effect
      if (effectSettled) {
        return;
      }

      effectSettled = true;
      /**
        propagates cancel downward
        catch uncaught cancellations errors; since we can no longer call the completion
        callback, log errors raised during cancellations into the console
      **/
      try {
        currCb.cancel();
      } catch (err) {
        log('error', 'uncaught at ' + name, err.message);
      }
      currCb.cancel = __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */]; // defensive measure

      sagaMonitor && sagaMonitor.effectCancelled(effectId);
    };

    /**
      each effect runner must attach its own logic of cancellation to the provided callback
      it allows this generator to propagate cancellation downward.
       ATTENTION! effect runners must setup the cancel logic by setting cb.cancel = [cancelMethod]
      And the setup must occur before calling the callback
       This is a sort of inversion of control: called async functions are responsible
      for completing the flow by calling the provided continuation; while caller functions
      are responsible for aborting the current flow by calling the attached cancel function
       Library users can attach their own cancellation logic to promises by defining a
      promise[CANCEL] method in their returned promises
      ATTENTION! calling cancel must have no effect on an already completed or cancelled effect
    **/
    var data = void 0;
    // prettier-ignore
    return (
      // Non declarative effect
      __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].promise(effect) ? resolvePromise(effect, currCb) : __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].helper(effect) ? runForkEffect(wrapHelper(effect), effectId, currCb) : __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].iterator(effect) ? resolveIterator(effect, effectId, name, currCb)

      // declarative effects
      : __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].array(effect) ? runParallelEffect(effect, effectId, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].take(effect)) ? runTakeEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].put(effect)) ? runPutEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].all(effect)) ? runAllEffect(data, effectId, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].race(effect)) ? runRaceEffect(data, effectId, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].call(effect)) ? runCallEffect(data, effectId, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].cps(effect)) ? runCPSEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].fork(effect)) ? runForkEffect(data, effectId, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].join(effect)) ? runJoinEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].cancel(effect)) ? runCancelEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].select(effect)) ? runSelectEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].actionChannel(effect)) ? runChannelEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].flush(effect)) ? runFlushEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].cancelled(effect)) ? runCancelledEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].getContext(effect)) ? runGetContextEffect(data, currCb) : (data = __WEBPACK_IMPORTED_MODULE_2__io__["d" /* asEffect */].setContext(effect)) ? runSetContextEffect(data, currCb) : /* anything else returned as is */currCb(effect)
    );
  }

  function resolvePromise(promise, cb) {
    var cancelPromise = promise[__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* CANCEL */]];
    if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(cancelPromise)) {
      cb.cancel = cancelPromise;
    } else if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(promise.abort)) {
      cb.cancel = function () {
        return promise.abort();
      };
      // TODO: add support for the fetch API, whenever they get around to
      // adding cancel support
    }
    promise.then(cb, function (error) {
      return cb(error, true);
    });
  }

  function resolveIterator(iterator, effectId, name, cb) {
    proc(iterator, subscribe, dispatch, getState, taskContext, options, effectId, name, cb);
  }

  function runTakeEffect(_ref2, cb) {
    var channel = _ref2.channel,
        pattern = _ref2.pattern,
        maybe = _ref2.maybe;

    channel = channel || stdChannel;
    var takeCb = function takeCb(inp) {
      return inp instanceof Error ? cb(inp, true) : Object(__WEBPACK_IMPORTED_MODULE_3__channel__["e" /* isEnd */])(inp) && !maybe ? cb(CHANNEL_END) : cb(inp);
    };
    try {
      channel.take(takeCb, matcher(pattern));
    } catch (err) {
      return cb(err, true);
    }
    cb.cancel = takeCb.cancel;
  }

  function runPutEffect(_ref3, cb) {
    var channel = _ref3.channel,
        action = _ref3.action,
        resolve = _ref3.resolve;

    /**
      Schedule the put in case another saga is holding a lock.
      The put will be executed atomically. ie nested puts will execute after
      this put has terminated.
    **/
    Object(__WEBPACK_IMPORTED_MODULE_1__scheduler__["a" /* asap */])(function () {
      var result = void 0;
      try {
        result = (channel ? channel.put : dispatch)(action);
      } catch (error) {
        // If we have a channel or `put.resolve` was used then bubble up the error.
        if (channel || resolve) return cb(error, true);
        log('error', 'uncaught at ' + name, error.stack || error.message || error);
      }

      if (resolve && __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].promise(result)) {
        resolvePromise(result, cb);
      } else {
        return cb(result);
      }
    });
    // Put effects are non cancellables
  }

  function runCallEffect(_ref4, effectId, cb) {
    var context = _ref4.context,
        fn = _ref4.fn,
        args = _ref4.args;

    var result = void 0;
    // catch synchronous failures; see #152
    try {
      result = fn.apply(context, args);
    } catch (error) {
      return cb(error, true);
    }
    return __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].promise(result) ? resolvePromise(result, cb) : __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].iterator(result) ? resolveIterator(result, effectId, fn.name, cb) : cb(result);
  }

  function runCPSEffect(_ref5, cb) {
    var context = _ref5.context,
        fn = _ref5.fn,
        args = _ref5.args;

    // CPS (ie node style functions) can define their own cancellation logic
    // by setting cancel field on the cb

    // catch synchronous failures; see #152
    try {
      var cpsCb = function cpsCb(err, res) {
        return __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].undef(err) ? cb(res) : cb(err, true);
      };
      fn.apply(context, args.concat(cpsCb));
      if (cpsCb.cancel) {
        cb.cancel = function () {
          return cpsCb.cancel();
        };
      }
    } catch (error) {
      return cb(error, true);
    }
  }

  function runForkEffect(_ref6, effectId, cb) {
    var context = _ref6.context,
        fn = _ref6.fn,
        args = _ref6.args,
        detached = _ref6.detached;

    var taskIterator = createTaskIterator({ context: context, fn: fn, args: args });

    try {
      Object(__WEBPACK_IMPORTED_MODULE_1__scheduler__["c" /* suspend */])();
      var _task = proc(taskIterator, subscribe, dispatch, getState, taskContext, options, effectId, fn.name, detached ? null : __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */]);

      if (detached) {
        cb(_task);
      } else {
        if (taskIterator._isRunning) {
          taskQueue.addTask(_task);
          cb(_task);
        } else if (taskIterator._error) {
          taskQueue.abort(taskIterator._error);
        } else {
          cb(_task);
        }
      }
    } finally {
      Object(__WEBPACK_IMPORTED_MODULE_1__scheduler__["b" /* flush */])();
    }
    // Fork effects are non cancellables
  }

  function runJoinEffect(t, cb) {
    if (t.isRunning()) {
      var joiner = { task: task, cb: cb };
      cb.cancel = function () {
        return Object(__WEBPACK_IMPORTED_MODULE_0__utils__["w" /* remove */])(t.joiners, joiner);
      };
      t.joiners.push(joiner);
    } else {
      t.isAborted() ? cb(t.error(), true) : cb(t.result());
    }
  }

  function runCancelEffect(taskToCancel, cb) {
    if (taskToCancel === __WEBPACK_IMPORTED_MODULE_0__utils__["d" /* SELF_CANCELLATION */]) {
      taskToCancel = task;
    }
    if (taskToCancel.isRunning()) {
      taskToCancel.cancel();
    }
    cb();
    // cancel effects are non cancellables
  }

  function runAllEffect(effects, effectId, cb) {
    var keys = Object.keys(effects);

    if (!keys.length) {
      return cb(__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].array(effects) ? [] : {});
    }

    var completedCount = 0;
    var completed = void 0;
    var results = {};
    var childCbs = {};

    function checkEffectEnd() {
      if (completedCount === keys.length) {
        completed = true;
        cb(__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].array(effects) ? __WEBPACK_IMPORTED_MODULE_0__utils__["f" /* array */].from(_extends({}, results, { length: keys.length })) : results);
      }
    }

    keys.forEach(function (key) {
      var chCbAtKey = function chCbAtKey(res, isErr) {
        if (completed) {
          return;
        }
        if (isErr || Object(__WEBPACK_IMPORTED_MODULE_3__channel__["e" /* isEnd */])(res) || res === CHANNEL_END || res === TASK_CANCEL) {
          cb.cancel();
          cb(res, isErr);
        } else {
          results[key] = res;
          completedCount++;
          checkEffectEnd();
        }
      };
      chCbAtKey.cancel = __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
      childCbs[key] = chCbAtKey;
    });

    cb.cancel = function () {
      if (!completed) {
        completed = true;
        keys.forEach(function (key) {
          return childCbs[key].cancel();
        });
      }
    };

    keys.forEach(function (key) {
      return runEffect(effects[key], effectId, key, childCbs[key]);
    });
  }

  function runRaceEffect(effects, effectId, cb) {
    var completed = void 0;
    var keys = Object.keys(effects);
    var childCbs = {};

    keys.forEach(function (key) {
      var chCbAtKey = function chCbAtKey(res, isErr) {
        if (completed) {
          return;
        }

        if (isErr) {
          // Race Auto cancellation
          cb.cancel();
          cb(res, true);
        } else if (!Object(__WEBPACK_IMPORTED_MODULE_3__channel__["e" /* isEnd */])(res) && res !== CHANNEL_END && res !== TASK_CANCEL) {
          var _cb;

          cb.cancel();
          completed = true;
          cb((_cb = {}, _cb[key] = res, _cb));
        }
      };
      chCbAtKey.cancel = __WEBPACK_IMPORTED_MODULE_0__utils__["u" /* noop */];
      childCbs[key] = chCbAtKey;
    });

    cb.cancel = function () {
      // prevents unnecessary cancellation
      if (!completed) {
        completed = true;
        keys.forEach(function (key) {
          return childCbs[key].cancel();
        });
      }
    };
    keys.forEach(function (key) {
      if (completed) {
        return;
      }
      runEffect(effects[key], effectId, key, childCbs[key]);
    });
  }

  function runSelectEffect(_ref7, cb) {
    var selector = _ref7.selector,
        args = _ref7.args;

    try {
      var state = selector.apply(undefined, [getState()].concat(args));
      cb(state);
    } catch (error) {
      cb(error, true);
    }
  }

  function runChannelEffect(_ref8, cb) {
    var pattern = _ref8.pattern,
        buffer = _ref8.buffer;

    var match = matcher(pattern);
    match.pattern = pattern;
    cb(Object(__WEBPACK_IMPORTED_MODULE_3__channel__["d" /* eventChannel */])(subscribe, buffer || __WEBPACK_IMPORTED_MODULE_4__buffers__["a" /* buffers */].fixed(), match));
  }

  function runCancelledEffect(data, cb) {
    cb(!!mainTask.isCancelled);
  }

  function runFlushEffect(channel, cb) {
    channel.flush(cb);
  }

  function runGetContextEffect(prop, cb) {
    cb(taskContext[prop]);
  }

  function runSetContextEffect(props, cb) {
    __WEBPACK_IMPORTED_MODULE_0__utils__["v" /* object */].assign(taskContext, props);
    cb();
  }

  function newTask(id, name, iterator, cont) {
    var _done, _ref9, _mutatorMap;

    iterator._deferredEnd = null;
    return _ref9 = {}, _ref9[__WEBPACK_IMPORTED_MODULE_0__utils__["e" /* TASK */]] = true, _ref9.id = id, _ref9.name = name, _done = 'done', _mutatorMap = {}, _mutatorMap[_done] = _mutatorMap[_done] || {}, _mutatorMap[_done].get = function () {
      if (iterator._deferredEnd) {
        return iterator._deferredEnd.promise;
      } else {
        var def = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["l" /* deferred */])();
        iterator._deferredEnd = def;
        if (!iterator._isRunning) {
          iterator._error ? def.reject(iterator._error) : def.resolve(iterator._result);
        }
        return def.promise;
      }
    }, _ref9.cont = cont, _ref9.joiners = [], _ref9.cancel = cancel, _ref9.isRunning = function isRunning() {
      return iterator._isRunning;
    }, _ref9.isCancelled = function isCancelled() {
      return iterator._isCancelled;
    }, _ref9.isAborted = function isAborted() {
      return iterator._isAborted;
    }, _ref9.result = function result() {
      return iterator._result;
    }, _ref9.error = function error() {
      return iterator._error;
    }, _ref9.setContext = function setContext(props) {
      Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(props, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].object, Object(__WEBPACK_IMPORTED_MODULE_0__utils__["k" /* createSetContextWarning */])('task', props));
      __WEBPACK_IMPORTED_MODULE_0__utils__["v" /* object */].assign(taskContext, props);
    }, _defineEnumerableProperties(_ref9, _mutatorMap), _ref9;
  }
}

/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return takeEvery; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return takeLatest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return throttle; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__takeEvery__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__takeLatest__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__throttle__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__utils__ = __webpack_require__(1);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return __WEBPACK_IMPORTED_MODULE_0__takeEvery__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return __WEBPACK_IMPORTED_MODULE_1__takeLatest__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return __WEBPACK_IMPORTED_MODULE_2__throttle__["a"]; });






var deprecationWarning = function deprecationWarning(helperName) {
  return 'import { ' + helperName + ' } from \'redux-saga\' has been deprecated in favor of import { ' + helperName + ' } from \'redux-saga/effects\'.\nThe latter will not work with yield*, as helper effects are wrapped automatically for you in fork effect.\nTherefore yield ' + helperName + ' will return task descriptor to your saga and execute next lines of code.';
};

var takeEvery = /*#__PURE__*/Object(__WEBPACK_IMPORTED_MODULE_3__utils__["n" /* deprecate */])(__WEBPACK_IMPORTED_MODULE_0__takeEvery__["a" /* default */], /*#__PURE__*/deprecationWarning('takeEvery'));
var takeLatest = /*#__PURE__*/Object(__WEBPACK_IMPORTED_MODULE_3__utils__["n" /* deprecate */])(__WEBPACK_IMPORTED_MODULE_1__takeLatest__["a" /* default */], /*#__PURE__*/deprecationWarning('takeLatest'));
var throttle = /*#__PURE__*/Object(__WEBPACK_IMPORTED_MODULE_3__utils__["n" /* deprecate */])(__WEBPACK_IMPORTED_MODULE_2__throttle__["a" /* default */], /*#__PURE__*/deprecationWarning('throttle'));



/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const constants_1 = __webpack_require__(6);
const EagleRecord = immutable_1.Record({
    x: 6 * constants_1.BLOCK_SIZE,
    y: 12 * constants_1.BLOCK_SIZE,
    broken: false,
});
exports.eagleRecord = EagleRecord();
exports.plainEagleRecord = exports.eagleRecord.toObject();
exports.default = EagleRecord;


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createStore__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__combineReducers__ = __webpack_require__(94);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__bindActionCreators__ = __webpack_require__(95);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__applyMiddleware__ = __webpack_require__(96);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__compose__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__utils_warning__ = __webpack_require__(20);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "createStore", function() { return __WEBPACK_IMPORTED_MODULE_0__createStore__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "combineReducers", function() { return __WEBPACK_IMPORTED_MODULE_1__combineReducers__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "bindActionCreators", function() { return __WEBPACK_IMPORTED_MODULE_2__bindActionCreators__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "applyMiddleware", function() { return __WEBPACK_IMPORTED_MODULE_3__applyMiddleware__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "compose", function() { return __WEBPACK_IMPORTED_MODULE_4__compose__["a"]; });







/*
* This is a dummy function to check if the function name has been altered by minification.
* If the function has been minified and NODE_ENV !== 'production', warn the user.
*/
function isCrushed() {}

if (false) {
  warning('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
}



/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ActionTypes; });
/* harmony export (immutable) */ __webpack_exports__["b"] = createStore;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lodash_es_isPlainObject__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_symbol_observable__ = __webpack_require__(90);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_symbol_observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_symbol_observable__);



/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = {
  INIT: '@@redux/INIT'

  /**
   * Creates a Redux store that holds the state tree.
   * The only way to change the data in the store is to call `dispatch()` on it.
   *
   * There should only be a single store in your app. To specify how different
   * parts of the state tree respond to actions, you may combine several reducers
   * into a single reducer function by using `combineReducers`.
   *
   * @param {Function} reducer A function that returns the next state tree, given
   * the current state tree and the action to handle.
   *
   * @param {any} [preloadedState] The initial state. You may optionally specify it
   * to hydrate the state from the server in universal apps, or to restore a
   * previously serialized user session.
   * If you use `combineReducers` to produce the root reducer function, this must be
   * an object with the same shape as `combineReducers` keys.
   *
   * @param {Function} [enhancer] The store enhancer. You may optionally specify it
   * to enhance the store with third-party capabilities such as middleware,
   * time travel, persistence, etc. The only store enhancer that ships with Redux
   * is `applyMiddleware()`.
   *
   * @returns {Store} A Redux store that lets you read the state, dispatch actions
   * and subscribe to changes.
   */
};function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!Object(__WEBPACK_IMPORTED_MODULE_0_lodash_es_isPlainObject__["a" /* default */])(action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      listener();
    }

    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.');
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return { unsubscribe: unsubscribe };
      }
    }, _ref[__WEBPACK_IMPORTED_MODULE_1_symbol_observable___default.a] = function () {
      return this;
    }, _ref;
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[__WEBPACK_IMPORTED_MODULE_1_symbol_observable___default.a] = observable, _ref2;
}

/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(82);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getPrototype_js__ = __webpack_require__(87);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__ = __webpack_require__(89);




/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!Object(__WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__["a" /* default */])(value) || Object(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value) != objectTag) {
    return false;
  }
  var proto = Object(__WEBPACK_IMPORTED_MODULE_1__getPrototype_js__["a" /* default */])(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

/* harmony default export */ __webpack_exports__["a"] = (isPlainObject);


/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__root_js__ = __webpack_require__(83);


/** Built-in value references. */
var Symbol = __WEBPACK_IMPORTED_MODULE_0__root_js__["a" /* default */].Symbol;

/* harmony default export */ __webpack_exports__["a"] = (Symbol);


/***/ }),
/* 19 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export default */
/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
    /* eslint-disable no-empty */
  } catch (e) {}
  /* eslint-enable no-empty */
}

/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = compose;
/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(function (a, b) {
    return function () {
      return a(b.apply(undefined, arguments));
    };
  });
}

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const common_1 = __webpack_require__(5);
function players(state = immutable_1.Map(), action) {
    if (action.type === 'ACTIVATE_PLAYER') {
        const { playerName, tankId } = action;
        return state.update(playerName, player => player.set('activeTankId', tankId)
            .set('active', true));
    }
    else if (action.type === 'CREATE_PLAYER') {
        return state.set(action.player.playerName, action.player);
    }
    else if (action.type === 'REMOVE_PLAYER') {
        return state.delete(action.playerName);
    }
    else if (action.type === 'SET_REVERSED_TANK') {
        const { playerName, reversedTank } = action;
        return state.update(playerName, p => p.set('reservedTank', reversedTank));
    }
    else if (action.type === 'REMOVE_TANK') {
        return state.map(p => p.activeTankId === action.tankId ? p.set('activeTankId', 0) : p);
    }
    else if (action.type === 'DEACTIVATE_ALL_PLAYERS') {
        return state.map(p => p.set('active', false));
    }
    else if (action.type === 'DECREMENT_PLAYER_LIFE') {
        const player = state.get(action.playerName);
        return state.set(action.playerName, player.update('lives', x => x - 1));
    }
    else if (action.type === 'INCREMENT_PLAYER_LIFE') {
        return state.update(action.playerName, p => p.update('lives', common_1.inc(1)));
    }
    else {
        return state;
    }
}
exports.default = players;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
function bullets(state = immutable_1.Map(), action) {
    if (action.type === 'ADD_BULLET') {
        return state.set(action.bullet.bulletId, action.bullet);
    }
    else if (action.type === 'REMOVE_BULLET') {
        return state.delete(action.bulletId);
    }
    else if (action.type === 'UPDATE_BULLETS') {
        return state.merge(action.updatedBullets);
    }
    else {
        return state;
    }
}
exports.default = bullets;


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
function explosions(state = immutable_1.Map(), action) {
    if (action.type === 'ADD_OR_UPDATE_EXPLOSION') {
        return state.set(action.explosion.explosionId, action.explosion);
    }
    else if (action.type === 'REMOVE_EXPLOSION') {
        return state.delete(action.explosionId);
    }
    else {
        return state;
    }
}
exports.default = explosions;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const types_1 = __webpack_require__(2);
const common_1 = __webpack_require__(5);
function tanks(state = immutable_1.Map(), action) {
    if (action.type === 'ADD_TANK') {
        return state.set(action.tank.tankId, types_1.TankRecord(action.tank));
    }
    else if (action.type === 'HURT') {
        const tankId = action.targetTank.tankId;
        return state.update(tankId, t => t.update('hp', hp => hp - action.hurt));
    }
    else if (action.type === 'CLEAR_TANKS') {
        return state.clear();
    }
    else if (action.type === 'MOVE') {
        return state.set(action.tank.tankId, action.tank);
    }
    else if (action.type === 'START_MOVE') {
        return state.setIn([action.tankId, 'moving'], true);
    }
    else if (action.type === 'STOP_MOVE') {
        return state.setIn([action.tankId, 'moving'], false);
    }
    else if (action.type === 'UPGRADE_TANK') {
        // todo 当tank.level已经是armor 该怎么办?
        return state.update(action.tankId, common_1.incTankLevel);
    }
    else if (action.type === 'REMOVE_TANK') {
        // 不能在关卡进行过程中移除tank, 因为tank的子弹可能正在飞行
        // 防御式编程: tank设置为inactive的时候重置一些状态
        return state.update(action.tankId, tank => tank.merge({
            active: false,
            cooldown: 0,
            frozenTimeout: 0,
            helmetDuration: 0,
            moving: false,
            withPowerUp: false,
        }));
    }
    else if (action.type === 'SET_COOLDOWN') {
        return state.update(action.tankId, tank => tank.set('cooldown', action.cooldown));
    }
    else if (action.type === 'SET_AI_FROZEN_TIMEOUT') {
        return state.map(tank => tank.side === 'ai' ? tank.set('moving', false) : tank);
    }
    else if (action.type === 'SET_FROZEN_TIMEOUT') {
        return state.update(action.tankId, tank => tank.set('frozenTimeout', action.frozenTimeout)
            .set('moving', (tank.frozenTimeout <= 0 && action.frozenTimeout > 0) && tank.moving));
    }
    else if (action.type === 'SET_HELMET_DURATION') {
        return state.update(action.tankId, tank => tank.set('helmetDuration', Math.max(0, action.duration)));
    }
    else {
        return state;
    }
}
exports.default = tanks;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const common_1 = __webpack_require__(5);
const types_1 = __webpack_require__(2);
function textsReducer(state = immutable_1.Map(), action) {
    if (action.type === 'SET_TEXT') {
        return state.set(action.textId, types_1.TextRecord(action));
    }
    else if (action.type === 'UPDATE_TEXT_POSITION') {
        const { textIds, direction, distance } = action;
        const set = immutable_1.Set(textIds);
        return state.map((t, textId) => {
            if (set.has(textId)) {
                const { xy, updater } = common_1.getDirectionInfo(direction);
                return t.update(xy, updater(distance));
            }
            else {
                return t;
            }
        });
    }
    else if (action.type === 'REMOVE_TEXT') {
        return state.delete(action.textId);
    }
    else {
        return state;
    }
}
exports.default = textsReducer;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const types_1 = __webpack_require__(2);
function scores(state = immutable_1.Map(), action) {
    if (action.type === 'ADD_SCORE') {
        return state.set(action.score.scoreId, types_1.ScoreRecord(action.score));
    }
    else if (action.type === 'REMOVE_SCORE') {
        return state.delete(action.scoreId);
    }
    else {
        return state;
    }
}
exports.default = scores;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = __webpack_require__(29);
const common_1 = __webpack_require__(5);
const AI_utils_ts_1 = __webpack_require__(103);
const GameAIClient_1 = __webpack_require__(104);
// const logFire = (...args: any[]) => console.log('[fire]', ...args)
const logFire = (...args) => 0;
const client = new GameAIClient_1.default();
function race(map) {
    return Promise.race(Object.entries(map)
        .map(([key, promise]) => promise.then(value => ({ key, value }))))
        .then(({ key: resolvedKey, value }) => ({ [resolvedKey]: value }));
}
async function main() {
    await Promise.all([
        moveLoop(),
        fireLoop(),
    ]);
}
main();
async function moveLoop() {
    let skipDelayAtFirstTime = true;
    while (true) {
        if (skipDelayAtFirstTime) {
            skipDelayAtFirstTime = false;
        }
        else {
            await race({
                timeout: redux_saga_1.delay(1000),
                reach: client.noteReach(),
            });
        }
        let tank = await client.queryMyTank();
        console.assert(tank != null, 'tank is null in mvoeLoop!');
        const map = await client.queryMapInfo();
        const tanks = await client.queryTanksInfo();
        const env = AI_utils_ts_1.getEnv(map, tanks, tank);
        const priorityMap = AI_utils_ts_1.calculatePriorityMap(env);
        // 降低回头的优先级
        const reverse = common_1.reverseDirection(tank.direction);
        priorityMap[reverse] = Math.min(priorityMap[reverse], 1);
        const nextDirection = AI_utils_ts_1.getRandomDirection(priorityMap);
        if (tank.direction !== nextDirection) {
            client.post({ type: 'turn', direction: nextDirection });
            tank = tank.set('direction', nextDirection);
            // 等待足够长的时间, 保证turn命令已经被处理
            await redux_saga_1.delay(100);
        }
        client.post({
            type: 'forward',
            // todo tank应该更加偏向于走到下一个 *路口*
            forwardLength: env.barrierInfo[tank.direction].length,
        });
    }
}
async function fireLoop() {
    let skipDelayAtFirstTime = true;
    while (true) {
        if (skipDelayAtFirstTime) {
            skipDelayAtFirstTime = false;
        }
        else {
            await race({
                timeout: redux_saga_1.delay(300),
                bulletComplete: client.noteBulletComplete(),
            });
        }
        let tank = await client.queryMyTank();
        console.assert(tank != null, 'tank is null in fireLoop!');
        const fireInfo = await client.queryMyFireInfo();
        if (fireInfo.canFire) {
            //   logFire('can not fire skip...')
            // } else {
            // logFire('can fire!')
            const map = await client.queryMapInfo();
            const tanks = await client.queryTanksInfo();
            const env = AI_utils_ts_1.getEnv(map, tanks, tank);
            if (AI_utils_ts_1.shouldFire(tank, env)) {
                logFire('fire!');
                client.post({ type: 'fire' });
                await redux_saga_1.delay(500);
            }
        }
    }
}


/***/ }),
/* 29 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__internal_middleware__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__internal_runSaga__ = __webpack_require__(11);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "runSaga", function() { return __WEBPACK_IMPORTED_MODULE_1__internal_runSaga__["a"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__internal_channel__ = __webpack_require__(3);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "END", function() { return __WEBPACK_IMPORTED_MODULE_2__internal_channel__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "eventChannel", function() { return __WEBPACK_IMPORTED_MODULE_2__internal_channel__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "channel", function() { return __WEBPACK_IMPORTED_MODULE_2__internal_channel__["b"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__internal_buffers__ = __webpack_require__(7);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "buffers", function() { return __WEBPACK_IMPORTED_MODULE_3__internal_buffers__["a"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__internal_sagaHelpers__ = __webpack_require__(13);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "takeEvery", function() { return __WEBPACK_IMPORTED_MODULE_4__internal_sagaHelpers__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "takeLatest", function() { return __WEBPACK_IMPORTED_MODULE_4__internal_sagaHelpers__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "throttle", function() { return __WEBPACK_IMPORTED_MODULE_4__internal_sagaHelpers__["e"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__internal_utils__ = __webpack_require__(1);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "delay", function() { return __WEBPACK_IMPORTED_MODULE_5__internal_utils__["m"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CANCEL", function() { return __WEBPACK_IMPORTED_MODULE_5__internal_utils__["a"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__effects__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__utils__ = __webpack_require__(35);
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "effects", function() { return __WEBPACK_IMPORTED_MODULE_6__effects__; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "utils", function() { return __WEBPACK_IMPORTED_MODULE_7__utils__; });

/* harmony default export */ __webpack_exports__["default"] = (__WEBPACK_IMPORTED_MODULE_0__internal_middleware__["a" /* default */]);












/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = sagaMiddlewareFactory;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__channel__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__runSaga__ = __webpack_require__(11);
function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }






function sagaMiddlewareFactory() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref$context = _ref.context,
      context = _ref$context === undefined ? {} : _ref$context,
      options = _objectWithoutProperties(_ref, ['context']);

  var sagaMonitor = options.sagaMonitor,
      logger = options.logger,
      onError = options.onError;


  if (__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(options)) {
    if (true) {
      throw new Error('Saga middleware no longer accept Generator functions. Use sagaMiddleware.run instead');
    } else {
      throw new Error('You passed a function to the Saga middleware. You are likely trying to start a        Saga by directly passing it to the middleware. This is no longer possible starting from 0.10.0.        To run a Saga, you must do it dynamically AFTER mounting the middleware into the store.\n        Example:\n          import createSagaMiddleware from \'redux-saga\'\n          ... other imports\n\n          const sagaMiddleware = createSagaMiddleware()\n          const store = createStore(reducer, applyMiddleware(sagaMiddleware))\n          sagaMiddleware.run(saga, ...args)\n      ');
    }
  }

  if (logger && !__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(logger)) {
    throw new Error('`options.logger` passed to the Saga middleware is not a function!');
  }

  if (false) {
    throw new Error('`options.onerror` was removed. Use `options.onError` instead.');
  }

  if (onError && !__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(onError)) {
    throw new Error('`options.onError` passed to the Saga middleware is not a function!');
  }

  if (options.emitter && !__WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].func(options.emitter)) {
    throw new Error('`options.emitter` passed to the Saga middleware is not a function!');
  }

  function sagaMiddleware(_ref2) {
    var getState = _ref2.getState,
        dispatch = _ref2.dispatch;

    var sagaEmitter = Object(__WEBPACK_IMPORTED_MODULE_1__channel__["c" /* emitter */])();
    sagaEmitter.emit = (options.emitter || __WEBPACK_IMPORTED_MODULE_0__utils__["o" /* ident */])(sagaEmitter.emit);

    sagaMiddleware.run = __WEBPACK_IMPORTED_MODULE_2__runSaga__["a" /* runSaga */].bind(null, {
      context: context,
      subscribe: sagaEmitter.subscribe,
      dispatch: dispatch,
      getState: getState,
      sagaMonitor: sagaMonitor,
      logger: logger,
      onError: onError
    });

    return function (next) {
      return function (action) {
        if (sagaMonitor && sagaMonitor.actionDispatched) {
          sagaMonitor.actionDispatched(action);
        }
        var result = next(action); // hit reducers
        sagaEmitter.emit(action);
        return result;
      };
    };
  }

  sagaMiddleware.run = function () {
    throw new Error('Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware');
  };

  sagaMiddleware.setContext = function (props) {
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["h" /* check */])(props, __WEBPACK_IMPORTED_MODULE_0__utils__["q" /* is */].object, Object(__WEBPACK_IMPORTED_MODULE_0__utils__["k" /* createSetContextWarning */])('sagaMiddleware', props));
    __WEBPACK_IMPORTED_MODULE_0__utils__["v" /* object */].assign(context, props);
  };

  return sagaMiddleware;
}

/***/ }),
/* 31 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = takeEvery;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__fsmIterator__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__io__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__channel__ = __webpack_require__(3);




function takeEvery(patternOrChannel, worker) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  var yTake = { done: false, value: Object(__WEBPACK_IMPORTED_MODULE_1__io__["r" /* take */])(patternOrChannel) };
  var yFork = function yFork(ac) {
    return { done: false, value: __WEBPACK_IMPORTED_MODULE_1__io__["j" /* fork */].apply(undefined, [worker].concat(args, [ac])) };
  };

  var action = void 0,
      setAction = function setAction(ac) {
    return action = ac;
  };

  return Object(__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["a" /* default */])({
    q1: function q1() {
      return ['q2', yTake, setAction];
    },
    q2: function q2() {
      return action === __WEBPACK_IMPORTED_MODULE_2__channel__["a" /* END */] ? [__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["b" /* qEnd */]] : ['q1', yFork(action)];
    }
  }, 'q1', 'takeEvery(' + Object(__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["c" /* safeName */])(patternOrChannel) + ', ' + worker.name + ')');
}

/***/ }),
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = takeLatest;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__fsmIterator__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__io__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__channel__ = __webpack_require__(3);




function takeLatest(patternOrChannel, worker) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  var yTake = { done: false, value: Object(__WEBPACK_IMPORTED_MODULE_1__io__["r" /* take */])(patternOrChannel) };
  var yFork = function yFork(ac) {
    return { done: false, value: __WEBPACK_IMPORTED_MODULE_1__io__["j" /* fork */].apply(undefined, [worker].concat(args, [ac])) };
  };
  var yCancel = function yCancel(task) {
    return { done: false, value: Object(__WEBPACK_IMPORTED_MODULE_1__io__["f" /* cancel */])(task) };
  };

  var task = void 0,
      action = void 0;
  var setTask = function setTask(t) {
    return task = t;
  };
  var setAction = function setAction(ac) {
    return action = ac;
  };

  return Object(__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["a" /* default */])({
    q1: function q1() {
      return ['q2', yTake, setAction];
    },
    q2: function q2() {
      return action === __WEBPACK_IMPORTED_MODULE_2__channel__["a" /* END */] ? [__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["b" /* qEnd */]] : task ? ['q3', yCancel(task)] : ['q1', yFork(action), setTask];
    },
    q3: function q3() {
      return ['q1', yFork(action), setTask];
    }
  }, 'q1', 'takeLatest(' + Object(__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["c" /* safeName */])(patternOrChannel) + ', ' + worker.name + ')');
}

/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = throttle;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__fsmIterator__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__io__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__channel__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__buffers__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__utils__ = __webpack_require__(1);






function throttle(delayLength, pattern, worker) {
  for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    args[_key - 3] = arguments[_key];
  }

  var action = void 0,
      channel = void 0;

  var yActionChannel = { done: false, value: Object(__WEBPACK_IMPORTED_MODULE_1__io__["a" /* actionChannel */])(pattern, __WEBPACK_IMPORTED_MODULE_3__buffers__["a" /* buffers */].sliding(1)) };
  var yTake = function yTake() {
    return { done: false, value: Object(__WEBPACK_IMPORTED_MODULE_1__io__["r" /* take */])(channel) };
  };
  var yFork = function yFork(ac) {
    return { done: false, value: __WEBPACK_IMPORTED_MODULE_1__io__["j" /* fork */].apply(undefined, [worker].concat(args, [ac])) };
  };
  var yDelay = { done: false, value: Object(__WEBPACK_IMPORTED_MODULE_1__io__["e" /* call */])(__WEBPACK_IMPORTED_MODULE_4__utils__["m" /* delay */], delayLength) };

  var setAction = function setAction(ac) {
    return action = ac;
  };
  var setChannel = function setChannel(ch) {
    return channel = ch;
  };

  return Object(__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["a" /* default */])({
    q1: function q1() {
      return ['q2', yActionChannel, setChannel];
    },
    q2: function q2() {
      return ['q3', yTake(), setAction];
    },
    q3: function q3() {
      return action === __WEBPACK_IMPORTED_MODULE_2__channel__["a" /* END */] ? [__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["b" /* qEnd */]] : ['q4', yFork(action)];
    },
    q4: function q4() {
      return ['q2', yDelay];
    }
  }, 'q1', 'throttle(' + Object(__WEBPACK_IMPORTED_MODULE_0__fsmIterator__["c" /* safeName */])(pattern) + ', ' + worker.name + ')');
}

/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__internal_io__ = __webpack_require__(4);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "take", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["r"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "takem", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["u"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "put", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["m"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "all", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "race", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["n"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "call", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "apply", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "cps", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["h"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "fork", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["j"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "spawn", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["q"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "join", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["l"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "cancel", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["f"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "select", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["o"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "actionChannel", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "cancelled", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["g"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "flush", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["i"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "getContext", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["k"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "setContext", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["p"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "takeEvery", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["s"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "takeLatest", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["t"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "throttle", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_io__["v"]; });


/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__internal_utils__ = __webpack_require__(1);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "TASK", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_utils__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "SAGA_ACTION", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_utils__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "noop", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_utils__["u"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "is", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_utils__["q"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "deferred", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_utils__["l"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "arrayOfDeffered", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_utils__["g"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "createMockTask", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_utils__["j"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "cloneableGenerator", function() { return __WEBPACK_IMPORTED_MODULE_0__internal_utils__["i"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__internal_io__ = __webpack_require__(4);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "asEffect", function() { return __WEBPACK_IMPORTED_MODULE_1__internal_io__["d"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__internal_proc__ = __webpack_require__(12);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CHANNEL_END", function() { return __WEBPACK_IMPORTED_MODULE_2__internal_proc__["a"]; });




/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./stage-1.json": 37,
	"./stage-10.json": 38,
	"./stage-11.json": 39,
	"./stage-12.json": 40,
	"./stage-13.json": 41,
	"./stage-14.json": 42,
	"./stage-15.json": 43,
	"./stage-16.json": 44,
	"./stage-17.json": 45,
	"./stage-18.json": 46,
	"./stage-19.json": 47,
	"./stage-2.json": 48,
	"./stage-20.json": 49,
	"./stage-21.json": 50,
	"./stage-22.json": 51,
	"./stage-23.json": 52,
	"./stage-24.json": 53,
	"./stage-25.json": 54,
	"./stage-26.json": 55,
	"./stage-27.json": 56,
	"./stage-28.json": 57,
	"./stage-29.json": 58,
	"./stage-3.json": 59,
	"./stage-30.json": 60,
	"./stage-31.json": 61,
	"./stage-32.json": 62,
	"./stage-33.json": 63,
	"./stage-34.json": 64,
	"./stage-35.json": 65,
	"./stage-4.json": 66,
	"./stage-5.json": 67,
	"./stage-6.json": 68,
	"./stage-7.json": 69,
	"./stage-8.json": 70,
	"./stage-9.json": 71
};
function webpackContext(req) {
	return __webpack_require__(webpackContextResolve(req));
};
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) // check for number or string
		throw new Error("Cannot find module '" + req + "'.");
	return id;
};
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 36;

/***/ }),
/* 37 */
/***/ (function(module, exports) {

module.exports = {"name":"1","difficulty":1,"map":["X  X  X  X  X  X  X  X  X  X  X  X  X  ","X  Bf X  Bf X  Bf X  Bf X  Bf X  Bf X  ","X  Bf X  Bf X  Bf X  Bf X  Bf X  Bf X  ","X  Bf X  Bf X  Bf Tf Bf X  Bf X  Bf X  ","X  Bf X  Bf X  B3 X  B3 X  Bf X  Bf X  ","X  B3 X  B3 X  Bc X  Bc X  B3 X  B3 X  ","Bc X  Bc Bc X  B3 X  B3 X  Bc Bc X  Bc ","T3 X  B3 B3 X  Bc X  Bc X  B3 B3 X  T3 ","X  Bc X  Bc X  Bf Bf Bf X  Bc X  Bc X  ","X  Bf X  Bf X  Bf X  Bf X  Bf X  Bf X  ","X  Bf X  Bf X  B3 X  B3 X  Bf X  Bf X  ","X  Bf X  Bf X  B8 Bc B4 X  Bf X  Bf X  ","X  X  X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["18*basic","2*fast"]}

/***/ }),
/* 38 */
/***/ (function(module, exports) {

module.exports = {"name":"10","difficulty":1,"map":["X  X  X  X  X  X  X  X  X  X  X  X  X  ","X  Ba B3 Bf X  X  X  X  X  X  Bf B3 B5 ","Ba B3 X  X  Bf X  F  F  X  Bf X  X  Ba ","Bf X  X  X  Bf F  F  F  F  Bf X  X  Ba ","Bf X  X  X  Bf F  Tf Tf F  Bf X  X  Bf ","Ba Bc Bc Bf R  R  R  R  R  R  Bf Bf Bf ","X  Bf Bf Bf Tf Tf Bf Tf Tf Bf Bf Bf B5 ","X  X  Bf Bf Tf X  Bf X  Tf Bf Bf B5 X  ","X  X  Bf Bf Bf Bf Bf Bf Bf Bf Bf B5 X  ","Bf F  B3 B3 B3 Tf Tf B3 B3 B3 B3 F  Bf ","Bf F  F  F  F  F  F  F  F  F  F  F  Bf ","X  X  F  F  F  B8 Bc B4 F  F  F  F  X  ","X  X  X  B5 X  Ba E  B5 X  X  B5 X  X  "],"enemies":["12*basic","2*fast","4*power","2*armor"]}

/***/ }),
/* 39 */
/***/ (function(module, exports) {

module.exports = {"name":"11","difficulty":2,"map":["X  X  X  X  X  Tf X  Bf X  Bf Bf X  X  ","X  Ba Bf Bf Bf Bf X  Bf X  X  X  X  X  ","X  X  X  B5 X  Bf X  Bf Bf X  F  F  F  ","X  Ba X  X  X  X  X  Tf X  F  F  F  F  ","X  Ba X  Bf Bf Bf Tf Bf Bf F  F  B3 Tf ","X  B3 B3 B3 Tf X  X  Bf X  F  F  X  Ba ","Ba Bf Bf Bf X  Tf F  F  F  F  F  X  X  ","X  X  X  Tf X  X  F  F  F  F  F  Bf X  ","Tf Bf X  F  F  F  F  Tf F  F  F  Bf X  ","Ba Bf F  F  F  F  F  X  X  X  X  Bf B5 ","X  Bf F  F  X  X  X  X  T3 Bf Bf Bf X  ","X  X  F  F  X  B8 Bc B4 X  Bf X  Ba X  ","X  Bc F  F  X  Ba E  B5 X  X  X  X  X  "],"enemies":["5*fast","6*armor","4*power","5*fast"]}

/***/ }),
/* 40 */
/***/ (function(module, exports) {

module.exports = {"name":"12","difficulty":1,"map":["X  X  X  X  X  X  X  Bf Bf Bf X  X  X  ","X  Bf Bf Bf Bc X  Bc X  X  Bf X  X  X  ","X  X  X  X  Bf X  B3 X  X  X  X  Bf Bf ","X  R  R  R  R  R  X  Bf B5 X  X  Bf T3 ","X  X  Tc Tc Tc R  X  Bf X  Tf T5 Bf X  ","Bf X  Bf Bf Bf R  R  R  X  R  Bf Bf X  ","X  X  X  X  Tf R  X  X  X  R  T3 X  X  ","R  R  R  X  R  R  Bf Bf X  R  X  X  X  ","X  X  X  X  X  Bf T3 T3 X  R  R  R  X  ","Bf Bf Bf X  X  X  X  X  X  X  X  X  X  ","X  X  Bf X  T3 T3 X  X  X  Bf Bf X  Ba ","Bf X  X  X  X  B8 Bc B4 X  Bf X  X  Bf ","X  X  X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["8*power","6*fast","6*armor"]}

/***/ }),
/* 41 */
/***/ (function(module, exports) {

module.exports = {"name":"13","difficulty":3,"map":["X  X  X  X  Bc X  X  X  Bc X  X  X  X  ","X  Bf Bf Bf Bf X  X  X  Bf Bf Bf Bf X  ","X  Bf X  X  X  X  Bf X  X  X  X  Tf X  ","X  Tf X  Bf B3 X  X  X  B3 Bf X  Bf Bf ","X  Bf X  B5 F  Tc Tf Tc F  Ba X  Tf Bf ","X  B3 X  X  F  F  F  F  F  X  X  T3 Bf ","Bf Tc X  X  F  F  F  F  F  X  X  Bc Bf ","Bf Tf X  B5 F  T3 Tf T3 F  Ba X  Bf X  ","Bf Bf X  Bf Bc X  X  X  Bc Bf X  Tf X  ","Bf Tf X  X  X  X  Bf X  X  X  X  Bf X  ","Bf Bf Bf Bf Bf X  X  X  Bf Bf Bf Tf Tf ","Bf Bf X  X  B3 B8 Bc B4 B3 X  X  Bf X  ","Bf Bf X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["8*power","8*fast","4*armor"]}

/***/ }),
/* 42 */
/***/ (function(module, exports) {

module.exports = {"name":"14","difficulty":3,"map":["X  X  X  X  X  X  X  X  X  X  X  X  X  ","F  F  X  X  Bc Bf Bf Bf Bc X  X  F  F  ","F  X  X  Ba Bf Bf Bf Bf Bf B5 X  X  F  ","X  X  X  Bf Bf F  Bf F  Bf Bf X  X  X  ","X  X  X  Bf F  F  Bf F  F  Bf X  X  X  ","F  X  X  Bf Bf Bf Bf Bf Bf Bf X  X  F  ","F  F  X  X  Bf F  Bf F  Bf X  X  F  F  ","R  R  R  X  Bf Bf Bf Bf Bf X  R  R  R  ","X  X  X  X  Ba Ba Ba Ba Ba X  X  X  X  ","X  X  X  X  B5 B5 B5 B5 B5 X  X  X  X  ","Ta Ta Ta X  X  X  X  X  X  X  T5 T5 T5 ","B5 B5 B5 X  X  B8 Bc B4 X  X  Ba Ba Ba ","T5 T5 T5 Ta X  Ba E  B5 X  T5 Ta Ta Ta "],"enemies":["10*power","4*fast","6*armor"]}

/***/ }),
/* 43 */
/***/ (function(module, exports) {

module.exports = {"name":"15","difficulty":2,"map":["X  X  X  X  Bf Bf X  X  Bf X  X  X  X  ","X  F  F  Bf Bf X  X  X  Bf X  X  X  X  ","F  F  F  F  F  F  F  F  Bf Bf X  X  X  ","F  T3 Bf F  Bf Bf Bf F  F  F  F  Bf Tf ","F  F  Bf F  F  F  T3 F  F  Bf T5 Bf X  ","X  F  F  Bf Tc F  F  F  F  Bf X  Bf X  ","X  Bf Bf Bf Bf Bf F  F  Bf Bf B5 F  F  ","Ta T3 Bf Bf X  X  X  Bf B3 X  X  X  F  ","X  Bf X  Bf X  Tc Bc B3 F  F  Bf B5 F  ","X  Bf X  X  Ba Bf B3 F  F  Bf X  X  F  ","X  Bf Bf B5 Ba B3 F  F  Bc F  Bf F  F  ","X  X  Bf X  F  B8 Bc B4 Bf F  B3 F  X  ","X  X  B3 X  X  Ba E  B5 X  F  F  F  X  "],"enemies":["2*basic","10*fast","8*armor"]}

/***/ }),
/* 44 */
/***/ (function(module, exports) {

module.exports = {"name":"16","difficulty":1,"map":["X  X  X  X  X  X  X  X  X  X  X  X  X  ","X  X  Tf F  Tf X  X  X  X  X  X  X  X  ","X  X  X  F  X  F  Tc X  X  X  X  X  X  ","X  F  X  X  X  X  F  Bc X  X  X  X  X  ","X  F  F  X  X  F  X  F  Tc X  X  X  X  ","X  F  X  F  X  F  X  X  F  Bc X  X  X  ","X  F  X  X  F  X  X  X  F  F  Tc X  X  ","X  X  F  X  X  X  X  F  F  F  F  Bc X  ","X  X  X  F  X  X  F  X  F  F  F  F  X  ","Bf X  X  X  X  X  F  X  X  F  F  F  Tf ","Bf Bf X  X  X  X  X  F  X  F  F  F  F  ","Tf Bf Bf X  X  B8 Bc B4 F  X  F  F  F  ","Tf Tf Bf Bf X  Ba E  B5 F  X  X  F  F  "],"enemies":["16*basic","2*fast","2*armor"]}

/***/ }),
/* 45 */
/***/ (function(module, exports) {

module.exports = {"name":"17","difficulty":2,"map":["X  X  X  X  Bc X  X  X  X  X  Bc X  X  ","X  Bf X  Bf Bf X  X  S  S  S  Bf Bf X  ","X  Bf X  X  Bf X  Tf S  S  S  S  S  X  ","S  S  S  T5 Bf X  X  Bf S  S  S  S  X  ","S  S  S  S  S  S  Bf Bf Ba B5 X  X  X  ","X  X  Ta S  S  S  S  Bf Ba B5 X  T3 T3 ","Bf Bf Bf Bf S  S  S  S  S  S  S  Bf Bf ","X  X  X  Bf Bf S  S  S  S  T5 X  X  X  ","X  Bf Bf Bf X  S  S  S  Bf Bf X  Bf X  ","S  S  S  Bf S  X  X  X  X  Bf X  Bf X  ","S  S  S  S  S  T3 X  T3 X  X  Bc Bf X  ","Bf S  S  S  S  B8 Bc B4 X  Bf X  X  X  ","Bf Bf T5 X  X  Ba E  B5 X  Bf X  Bf X  "],"enemies":["2*armor","2*fast","8*armor","8*basic"]}

/***/ }),
/* 46 */
/***/ (function(module, exports) {

module.exports = {"name":"18","difficulty":2,"map":["X  X  X  X  X  X  X  X  Tf Tf Tf F  X  ","X  Bf X  X  X  X  X  X  Tf X  X  Tf X  ","Bf F  Bf X  X  X  Bf Bf Bf Bf X  Tf X  ","X  Bf F  Bf X  X  Bf X  F  Bf Tf Tf X  ","X  X  Bf X  F  Tf Bf F  X  Bf X  X  X  ","X  X  X  X  Tf X  Bf Tf Bf Bf X  X  X  ","X  X  Bf Bf Tf Bf X  Tf X  X  X  X  X  ","X  X  Bf X  F  Bf Tf F  X  X  X  X  X  ","Tf Tf Tf F  X  Bf X  X  Bf Bf X  X  X  ","Tf X  Bf Bf Bf Bf X  X  Bf Tf Tf X  X  ","Tf X  X  Tf X  X  X  X  X  Tf Bf Bf X  ","F  Tf Tf Tf X  B8 Bc B4 X  X  Bf Tf Tf ","X  X  X  X  X  Ba E  B5 X  X  X  Tf Tf "],"enemies":["4*armor","2*basic","6*power","8*fast"]}

/***/ }),
/* 47 */
/***/ (function(module, exports) {

module.exports = {"name":"19","difficulty":3,"map":["X  Bf X  Bf X  Bf X  Bf X  Bf X  Bf X  ","X  Bf X  Bf X  Bf X  Bf X  Bf X  Bf X  ","X  T3 X  T3 X  T3 X  T3 X  T3 X  T3 X  ","Bc X  Bc X  Bf X  X  X  Bf X  Bc X  Bc ","Bf X  Bf B3 Bf X  Bf X  Bf B3 Bf X  Bf ","T3 X  T3 X  Tf X  T3 X  Tf X  T3 X  T3 ","F  F  X  X  Bf X  F  X  Bf X  X  F  F  ","F  F  F  F  Bf B3 F  B3 Bf F  F  F  F  ","F  F  F  F  F  F  F  F  F  F  F  F  F  ","Bc X  Bc X  Bf F  F  F  Bf X  Bc X  Bc ","X  Bf X  Bf X  X  F  X  X  Bf X  Bf X  ","X  Bf X  Bf X  B8 Bc B4 X  Bf X  Bf X  ","X  B3 X  B3 X  Ba E  B5 X  B3 X  B3 X  "],"enemies":["4*fast","8*armor","4*basic","4*power"]}

/***/ }),
/* 48 */
/***/ (function(module, exports) {

module.exports = {"name":"2","difficulty":1,"map":["X  X  X  Tf X  X  X  Tf X  X  X  X  X  ","X  B3 X  Tf X  X  X  Bf X  Bf X  Bf X  ","X  Bf X  X  X  X  Bf BF X  Bf Tf BF X  ","X  X  X  Bf X  X  X  X  X  Tf X  X  X  ","F  X  X  BF X  X  TF X  X  BF F  BF TF ","F  F  X  X  X  BF X  X  TF X  F  X  X  ","X  BF BF BF F  F  F  TF X  X  F  BF X  ","X  X  X  TF F  BF X  BF X  BF X  BF X  ","TF BF X  TF X  BF X  BF X  X  X  BF X  ","X  BF X  BF X  BF BF BF X  BF TF BF X  ","X  BF X  BF X  BF BF BF X  X  X  X  X  ","X  BF X  X  X  B8 BC B4 X  BF X  BF X  ","X  BF X  BF X  BA EE B5 X  BF BF BF X  "],"enemies":["2*armor","4*fast","14*basic"]}

/***/ }),
/* 49 */
/***/ (function(module, exports) {

module.exports = {"name":"20","difficulty":4,"map":["X  X  X  R  X  Bf X  X  Bf X  Bf X  X  ","X  X  X  X  X  X  X  X  Bf X  Tf X  X  ","X  X  X  R  X  Bc Tf X  Bf X  Bf X  X  ","T3 X  Bf R  X  Tf X  Bc B3 X  Bf X  X  ","X  X  Bf R  X  X  X  Bf X  X  X  X  X  ","Bf X  Bf R  R  X  R  R  R  R  X  X  Bf ","X  X  X  Bc X  X  X  F  X  R  X  T3 T3 ","Bf Bf Ba Bf X  Tf F  F  F  R  X  Bc Bc ","B3 X  Ba X  X  Bf F  F  F  R  X  Bf X  ","X  Tc X  X  X  Bf X  F  X  R  X  F  X  ","X  Bf X  Tc X  B3 B3 B3 X  X  F  F  F  ","X  Bf X  Bf X  B8 Bc B4 X  R  F  F  F  ","X  X  X  X  X  Ba E  B5 X  R  X  F  X  "],"enemies":["8*fast","2*basic","2*power","8*armor"]}

/***/ }),
/* 50 */
/***/ (function(module, exports) {

module.exports = {"name":"21","difficulty":3,"map":["X  X  X  Bc Bc Bc X  X  Bc X  X  X  X  ","X  Bc Bf Bf Bf Bf Bf Bf Bf Bf X  X  X  ","X  F  F  F  F  F  F  F  F  Bf Bf X  X  ","F  F  X  X  X  X  X  X  F  F  Bf Bf X  ","F  X  Tf X  X  Tf X  X  X  F  F  F  X  ","F  X  Tf X  X  Tf X  X  X  F  F  F  X  ","F  X  X  F  X  X  X  X  F  F  Bf Bf B5 ","F  F  F  F  F  F  F  F  F  Bf Bf Bf B5 ","Bf F  F  Bf Bf F  F  F  Bf Bf Bf Bf X  ","X  Bf Bf Bf Bf Bf Bf Bf Bf Bf Bf X  Tf ","Tf X  Bf Tf Bf Bf Bf Bf Bf Bf B5 X  Tf ","X  Tf Bf B3 Tf B8 Bc B4 Bf Bf Tf Tf Tf ","X  X  X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["8*power","2*fast","6*basic","4*armor"]}

/***/ }),
/* 51 */
/***/ (function(module, exports) {

module.exports = {"name":"22","difficulty":3,"map":["X  X  X  X  X  F  X  X  X  X  X  X  X  ","X  X  X  X  F  Tf F  X  X  X  X  X  X  ","X  X  F  X  X  F  X  X  F  F  X  X  X  ","X  F  Bf F  X  X  X  F  Bf Bf F  X  X  ","X  X  F  Bf F  X  X  X  F  F  X  X  F  ","F  X  X  F  X  X  F  X  X  X  X  F  Tf ","Bf F  X  X  X  F  Tf F  X  X  F  X  F  ","Tf Bf F  X  X  X  F  X  X  F  Tf F  X  ","Bf F  X  X  F  X  X  X  F  X  F  X  X  ","F  X  X  F  Bf F  X  F  Bf F  X  X  X  ","X  X  X  F  Bf F  X  X  F  X  X  F  X  ","X  F  X  X  F  B8 Bc B4 X  X  F  Tf F  ","F  Tf F  X  X  Ba E  B5 X  F  Bf F  X  "],"enemies":["8*fast","6*basic","2*power","4*armor"]}

/***/ }),
/* 52 */
/***/ (function(module, exports) {

module.exports = {"name":"23","difficulty":2,"map":["X  X  X  X  X  X  X  X  X  X  X  X  X  ","X  X  X  X  X  Tf Tf X  X  X  X  X  X  ","X  X  X  X  X  X  Tf X  X  X  X  X  X  ","X  Tf Tf F  F  Bf Tf Bf F  F  Tf Tf X  ","X  X  X  Tf F  F  Tf F  F  Tf X  X  X  ","F  X  X  X  Tf F  F  F  Tf X  X  X  F  ","Tf F  X  X  X  F  F  F  X  X  X  F  Tf ","F  X  X  X  Tc T3 F  T3 Tc X  X  X  F  ","X  X  X  X  Tf X  Tc X  Tf X  X  X  X  ","X  X  X  Tf X  X  Tf X  X  Tf X  X  X  ","X  X  X  X  X  X  X  X  X  X  X  X  X  ","X  X  X  X  X  B8 Bc B4 X  X  X  X  X  ","X  X  Tf X  X  Ba E  B5 X  X  Tf X  X  "],"enemies":["6*armor","4*power","10*fast"]}

/***/ }),
/* 53 */
/***/ (function(module, exports) {

module.exports = {"name":"24","difficulty":3,"map":["X  X  Tf X  Bf T3 X  X  X  X  Ba X  X  ","X  X  Bf X  Bf F  X  B3 Bf Bf Bf X  X  ","X  F  F  X  Bf F  Ba B5 X  X  X  Tf Tf ","F  F  F  F  F  F  Bf Bf Bf X  Ba Bf X  ","X  X  F  F  Bc Bc T3 Bf X  Ba Bf B3 Ba ","Bf T3 X  Bc B3 B3 X  X  X  Bf B3 X  Ba ","Ba X  Bc Bf S  S  S  S  S  S  S  S  S  ","Ba X  B3 X  S  S  S  S  S  S  S  S  S  ","X  X  Tf X  S  S  S  S  S  S  S  S  S  ","Bf X  Bf X  S  S  S  S  S  S  S  S  S  ","Ba X  Bf X  S  S  S  S  S  S  S  S  S  ","Ba X  Bf X  X  B8 Bc B4 S  S  S  S  S  ","X  X  B3 X  X  Ba E  B5 X  S  S  S  S  "],"enemies":["4*power","2*armor","4*fast","10*basic"]}

/***/ }),
/* 54 */
/***/ (function(module, exports) {

module.exports = {"name":"25","difficulty":3,"map":["X  X  X  Tf X  Bf X  Bf X  Bf X  Tf X  ","X  Bf X  Bf X  X  X  X  X  Tf X  X  X  ","X  Bf X  Bf X  X  Tf X  X  Tf X  Tf Tf ","X  Bf X  X  X  Bf X  Tf Bf X  X  X  Tf ","X  X  X  X  Bf Bf X  Bf Bf X  Tf X  X  ","X  X  Tf X  Bf X  X  Bf Bf X  Bf Bf X  ","Tf X  Tf X  X  Bf X  Tf X  X  Tf Bf X  ","X  X  Bf Bf X  Bf X  X  X  Bf Tf X  X  ","X  Tf Bf Bf X  Bf Bf X  Bf Bf X  X  Bf ","X  Bf X  X  X  Bf Tf X  X  X  X  Bf Bf ","X  X  X  Bf X  Bf Bf Tf X  Tf X  X  Bf ","Bf X  Bf Bf X  B8 Bc B4 X  Bf Tf X  X  ","Bf X  Bf X  X  Ba E  B5 X  Bf Bf Bf X  "],"enemies":["2*power","8*fast","10*armor"]}

/***/ }),
/* 55 */
/***/ (function(module, exports) {

module.exports = {"name":"26","difficulty":2,"map":["X  X  R  R  X  X  X  X  X  X  X  X  X  ","Tc X  X  R  F  X  B5 X  X  X  X  X  X  ","F  Tc X  X  X  X  T5 X  B5 X  R  R  X  ","F  F  X  T3 Bc Ba X  X  T5 F  R  X  X  ","F  F  F  X  X  Tf Bc Ba X  X  X  X  Tc ","F  F  T3 Tc X  Ba X  Tf Bc X  X  Tc F  ","F  T3 X  X  B3 Tf X  Ba X  T3 X  F  F  ","X  X  X  X  X  B5 B3 Tf X  X  F  F  F  ","X  X  R  F  Ta X  X  B5 B3 Tc T3 F  F  ","X  R  R  X  Ba X  Ta X  X  X  X  X  F  ","X  X  X  X  X  X  Ba X  F  R  X  X  T3 ","Tf X  X  X  X  B8 Bc B4 X  R  R  X  X  ","Tf Tf X  X  X  Ba E  B5 X  X  X  X  Tf "],"enemies":["6*fast","6*armor","4*basic","4*power"]}

/***/ }),
/* 56 */
/***/ (function(module, exports) {

module.exports = {"name":"27","difficulty":4,"map":["X  X  X  X  Tf X  X  X  X  X  X  X  X  ","Tf Tf X  X  Tf X  X  Tf Tf X  X  X  X  ","X  Tf X  X  Tf X  X  X  Tf X  Tf Tf F  ","X  Tf X  X  Tf Tf Tf X  F  X  Tf X  X  ","X  Bf X  X  X  X  Tf X  Tf Tf Tf X  X  ","F  Tf Tf X  Tf Bf Tf Bf Bf X  X  X  X  ","X  X  Tf F  Tf F  X  X  Bf X  X  Tf Tf ","X  X  Tf X  X  F  X  X  Tf X  X  Tf X  ","X  X  Bf X  X  Tf X  X  Tf Tf Bf Tf X  ","F  Tf Tf Tf F  F  Bf Tf Tf X  Bf Tf X  ","X  X  X  Bf X  X  X  X  F  F  X  Bf X  ","X  X  X  Tf X  B8 Bc B4 X  F  X  Bf X  ","X  X  X  Tf X  Ba E  B5 X  Tf X  Bf X  "],"enemies":["2*power","8*armor","8*fast","2*basic"]}

/***/ }),
/* 57 */
/***/ (function(module, exports) {

module.exports = {"name":"28","difficulty":3,"map":["X  X  X  X  X  X  X  X  X  X  Ta T5 X  ","X  X  X  X  X  X  Tc X  X  X  Tf X  X  ","X  X  X  X  X  Bc F  Bc X  Bf B5 X  X  ","X  X  X  X  Tc F  F  F  Tc Bf B5 X  X  ","X  X  X  Bc F  F  S  F  F  Bf B5 X  X  ","X  X  Tc F  F  S  S  S  F  F  B5 X  X  ","X  Bc F  F  S  S  S  S  S  F  F  Bc X  ","Tc F  F  S  S  S  S  S  S  S  F  F  Tc ","F  F  S  S  S  S  S  S  S  S  S  F  F  ","X  F  S  S  S  S  S  S  S  S  S  F  X  ","X  F  S  S  S  S  S  S  S  S  S  F  X  ","X  F  S  S  S  B8 Bc B4 S  S  S  F  X  ","X  F  S  S  X  Ba E  B5 X  S  S  F  X  "],"enemies":["2*fast","1*armor","15*basic","2*power"]}

/***/ }),
/* 58 */
/***/ (function(module, exports) {

module.exports = {"name":"29","difficulty":3,"map":["X  X  X  X  X  X  X  X  X  X  Bf X  X  ","X  Bf R  R  X  Tf X  Bf X  X  X  X  X  ","X  X  R  R  Bf F  F  F  R  R  X  Tf X  ","X  X  X  X  X  F  F  F  R  R  Bf X  X  ","X  Tf X  X  R  R  X  F  X  X  X  X  X  ","F  F  Bf X  R  R  Tf X  X  X  X  Bf X  ","F  F  F  X  X  X  X  X  X  Tf X  X  Tf ","X  Bf R  R  X  Bf X  X  X  X  X  X  X  ","Tf X  R  R  F  F  R  R  F  F  X  Bf X  ","X  X  X  X  F  X  R  R  F  F  R  R  X  ","X  X  X  Tf F  X  X  X  F  F  R  R  X  ","X  X  Bf X  Bf B8 Bc B4 X  X  X  X  X  ","Bf X  X  X  X  Ba E  B5 X  Bf Tf X  X  "],"enemies":["10*power","4*fast","6*armor"]}

/***/ }),
/* 59 */
/***/ (function(module, exports) {

module.exports = {"name":"3","difficulty":1,"map":["X  X  X  X  BF X  X  X  BF X  X  X  X  ","X  F  F  F  BF X  X  X  X  X  TC TC TC ","BF F  F  F  X  X  X  X  X  X  X  X  X  ","F  F  F  F  X  X  X  BF X  BF BF BF B5 ","F  F  F  F  BF BF BF B3 X  BF X  BA X  ","F  F  F  F  X  X  BF X  X  X  X  BA X  ","X  F  X  X  X  X  TF TF TF X  X  F  X  ","X  BC X  BF X  X  X  X  X  F  F  F  F  ","BF B5 BA BF B5 BC B3 B3 B3 F  F  F  F  ","X  X  X  X  X  BF X  BC BC F  F  F  F  ","BF X  X  T5 X  X  X  B3 B3 F  F  F  X  ","BF BF X  T5 X  B8 BC B4 X  F  F  F  X  ","TF BF BF X  X  BA EE B5 X  BF X  X  X  "],"enemies":["14*basic","4*fast","2*armor"]}

/***/ }),
/* 60 */
/***/ (function(module, exports) {

module.exports = {"name":"30","difficulty":2,"map":["X  X  X  X  X  X  X  X  X  X  X  X  X  ","X  X  X  X  X  Bc Bc X  X  X  Tc X  X  ","X  Tc Tc X  Bc F  F  Tc X  Bc F  Bc X  ","Bc F  F  Bc F  F  F  F  Bc F  F  F  Bc ","F  F  F  F  F  F  F  F  F  F  F  F  F  ","Tf F  R  F  F  F  F  F  R  F  F  F  F  ","F  F  R  R  R  F  F  F  R  R  R  F  Tf ","F  F  F  F  R  F  Tf F  F  F  R  F  F  ","F  F  F  F  F  F  F  F  F  F  F  F  F  ","F  F  F  F  F  B3 B3 F  F  F  F  F  T3 ","T3 F  F  F  B3 X  X  B3 F  F  F  T3 X  ","X  T3 B3 B3 X  B8 Bc B4 B3 B3 B3 X  X  ","X  X  X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["4*basic","8*fast","4*power","4*armor"]}

/***/ }),
/* 61 */
/***/ (function(module, exports) {

module.exports = {"name":"31","difficulty":2,"map":["X  X  X  R  X  X  X  X  R  X  X  X  X  ","R  R  X  R  X  R  R  R  R  X  R  R  R  ","F  F  Bf X  X  Bf X  X  R  X  R  F  R  ","F  R  R  R  R  X  Tf X  X  Bf F  F  F  ","F  F  X  R  X  X  R  X  R  R  R  R  F  ","R  R  X  R  X  R  R  X  X  R  X  X  X  ","X  X  Bf F  Bf X  Bf F  X  R  X  X  R  ","X  R  R  F  R  R  R  R  X  F  Bf X  R  ","Bf X  X  Bf X  X  R  X  F  F  R  X  R  ","R  R  X  R  R  X  R  Bf R  R  R  X  X  ","X  X  Bf X  F  F  X  X  F  R  X  X  R  ","X  R  R  R  F  B8 Bc B4 X  R  X  R  R  ","X  R  X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["3*power","8*fast","6*armor","3*power"]}

/***/ }),
/* 62 */
/***/ (function(module, exports) {

module.exports = {"name":"32","difficulty":3,"map":["S  S  S  S  S  S  X  S  S  S  S  S  S  ","S  S  S  S  S  S  S  S  S  S  S  S  S  ","S  S  S  Bf S  S  S  S  S  Bf S  S  S  ","S  Bf X  Bf X  Bf S  Bf X  Bf X  Bf S  ","S  B3 B3 Bf X  X  X  X  X  Bf B3 B3 S  ","S  S  S  Bf Bc Bf Tf Bf Bc Bf S  S  S  ","Tf S  S  S  X  T3 X  T3 X  S  S  S  Tf ","S  S  S  S  X  Bc X  Bc X  S  S  S  S  ","S  S  S  S  X  Bf X  Bf X  S  S  S  S  ","S  S  S  Bf X  X  Bc X  X  Bf S  S  S  ","S  Bf S  Bf X  T3 T3 T3 X  Bf S  Bf S  ","X  Bf Bc Bf X  B8 Bc B4 X  Bf Bc Bf X  ","X  B3 X  X  X  Ba E  B5 X  X  X  B3 X  "],"enemies":["8*armor","6*basic","2*power","4*fast"]}

/***/ }),
/* 63 */
/***/ (function(module, exports) {

module.exports = {"name":"33","difficulty":3,"map":["X  X  X  X  Tf X  X  X  X  Tf X  X  X  ","X  Tf X  X  X  Tf X  X  Tf F  F  X  X  ","X  X  Tf X  X  X  X  Tf F  Tc T5 X  X  ","X  X  X  Tf X  F  F  F  F  F  X  Ta X  ","X  T5 X  X  Tf F  F  Tf F  X  X  Tf X  ","X  T3 T5 F  X  Tf F  F  Tf X  X  Ta X  ","X  X  F  F  F  F  F  X  X  Tf X  X  X  ","X  Tc T5 F  X  Tf F  X  X  X  Tf X  X  ","X  F  F  F  Tf X  Tf X  Tc X  X  Tf X  ","F  F  F  Tf X  X  X  X  Ta X  X  X  X  ","X  X  Tf X  X  X  X  X  X  X  X  Ta Tf ","X  X  X  X  X  B8 Bc B4 X  Tc T5 X  X  ","T5 X  Tc X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["4*fast","8*armor","4*power","4*fast"]}

/***/ }),
/* 64 */
/***/ (function(module, exports) {

module.exports = {"name":"34","difficulty":4,"map":["X  X  X  X  B5 Ba X  X  X  X  X  X  X  ","B5 B5 B5 Ba X  B5 X  X  B5 B5 X  X  X  ","B5 B5 B5 Bf Bf X  X  X  B5 Bf B5 X  X  ","Ba Ba X  Bf B5 X  X  Ba B5 Bf Bf X  X  ","X  B5 X  Bf Ba B5 X  B5 Bf Bf Bf X  X  ","X  B5 Ba X  X  Bf B5 Bf Ba Ba Bf X  X  ","X  B5 X  X  Ba Bf Bf B5 X  B5 Bf X  X  ","X  Ba X  X  B5 Bf Bf B5 X  B5 Bf X  X  ","X  Ba B3 B3 X  Bf Bf Bf X  B5 B5 B3 Bf ","X  Ba X  X  Ba B5 Bf Ba B5 B5 B5 Ba Ba ","X  X  B5 X  Bf Ba B5 Bf Bf X  X  Ba X  ","X  X  B5 Ba B5 B8 Bc B4 Bf B5 X  B5 X  ","X  X  B5 Ba X  Ba E  B5 X  Bf Bf X  X  "],"enemies":["4*power","10*fast","6*armor"]}

/***/ }),
/* 65 */
/***/ (function(module, exports) {

module.exports = {"name":"35","difficulty":2,"map":["X  X  X  X  X  X  X  X  X  X  X  X  X  ","X  X  X  X  Bf X  Bf X  X  X  X  X  X  ","F  X  X  F  Bf F  Bf F  X  X  F  X  X  ","Bf F  F  Bf Bf Bf Bf Bf F  F  Bf F  X  ","Bf Bf Bf Bf Tf Bf Tf Bf Bf Bf Bf F  X  ","R  R  R  Bf Bf Bf Bf Bf R  R  R  F  X  ","R  Bf Bf Bf Bf Bf Bf Bf Bf Bf R  R  F  ","Bf Bf Bf R  Bf Bf Bf R  Bf Bf Bf F  F  ","Bf Bf R  R  R  Bf R  R  R  Bf Bf R  R  ","F  R  R  F  F  F  F  F  R  R  F  R  F  ","X  F  F  X  X  X  X  X  F  F  X  F  X  ","X  X  X  X  X  B8 Bc B4 X  X  X  X  X  ","X  X  X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["4*power","6*fast","10*armor"]}

/***/ }),
/* 66 */
/***/ (function(module, exports) {

module.exports = {"name":"4","difficulty":1,"map":["X  F  F  X  X  X  X  X  X  X  X  F  X  ","F  F  X  X  Bc Bf Bf Bc Bc X  X  X  F  ","F  X  X  Ba Bf Bf Bf Bf Bf Bf Bc X  T3 ","T3 X  X  Bf Bf Bf Bf Bf Bf Bf Bf B5 X  ","X  X  Ba B3 X  X  X  B3 Bf Bf X  B5 X  ","R  X  Ba X  T5 X  T5 X  Bf B5 X  X  X  ","X  X  Bf X  Bc Bc X  X  Bf B5 X  R  R  ","X  X  Bf Bf Bf Bf Bf Bf Bf Bf X  X  X  ","X  Ba Bf Bf Bf Bf Bf Bf Bf Bf B5 X  X  ","X  B3 B3 Bf Bf Bf Bf Bf Bf B3 B3 X  X  ","X  Bf Bf Bc B3 Bf Bf B3 Bc Bf Bf X  F  ","F  X  B3 B3 X  B8 Bc B4 B3 B3 X  F  F  ","Tf F  X  X  X  Ba E  B5 X  X  F  F  Tf "],"enemies":["10*power","5*fast","2*basic","3*armor"]}

/***/ }),
/* 67 */
/***/ (function(module, exports) {

module.exports = {"name":"5","difficulty":1,"map":["X  X  X  X  Bf Bf X  X  X  X  X  X  X  ","Tc X  Bc X  Bf X  X  X  T3 T3 Tf X  X  ","Tf X  Bf X  X  X  Bf X  X  X  X  X  X  ","Bf X  Bf Bf Bf X  Bf Bf X  R  R  X  R  ","B3 X  X  X  B3 X  X  X  X  R  X  X  X  ","X  X  Bc X  R  R  X  R  R  R  X  Bf Bf ","Bf Bf X  X  R  Bf X  Bf Bf X  X  X  X  ","X  X  X  X  R  X  X  X  X  X  Ta T5 X  ","R  R  R  X  R  X  Tf X  Bf X  Ta X  X  ","X  X  X  Bc Bc X  X  X  X  X  Ta Bf Bf ","X  X  X  X  Bf B3 B3 B3 Bf Bc X  X  X  ","Bf Bf B3 X  X  B8 Bc B4 X  B3 Bf X  X  ","B3 X  X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["5*power","2*armor","8*basic","5*fast"]}

/***/ }),
/* 68 */
/***/ (function(module, exports) {

module.exports = {"name":"6","difficulty":1,"map":["X  X  X  X  X  Ba X  B5 F  F  X  X  X  ","X  B5 Ta X  B5 X  X  X  Ba F  B5 Ba F  ","X  B5 Ta X  B5 X  Bf X  Ba F  B5 Ba F  ","X  Bf X  X  Bf X  Tf X  Bf F  X  Bf F  ","X  X  X  Ba T3 X  Bf X  B3 T5 X  F  F  ","Bf Bf B5 X  X  F  Bf F  X  X  Ba Bf Bf ","X  X  X  X  Ba F  F  F  B5 X  X  X  X  ","Tf Bf Bf X  B3 F  F  F  B3 Ba Bf Bf Tf ","T3 T3 T3 X  Bc X  F  X  Bc X  T3 T3 T3 ","X  Bf X  X  Bf X  X  X  Bf X  X  X  X  ","X  Bf B5 X  X  B3 X  B3 X  X  Ba Bf F  ","X  X  B3 X  X  B8 Bc B4 X  X  F  F  F  ","X  X  Bc X  X  Ba E  B5 X  X  Bc F  F  "],"enemies":["7*power","2*fast","9*basic","2*armor"]}

/***/ }),
/* 69 */
/***/ (function(module, exports) {

module.exports = {"name":"7","difficulty":2,"map":["X  X  X  X  X  X  X  T3 T3 X  X  X  X  ","X  X  Tf T3 T3 T3 X  X  X  X  Tf X  X  ","X  X  Tf X  X  X  F  X  T3 Tf Tf X  X  ","X  Tf X  X  X  F  Tf X  X  X  Tf X  X  ","X  X  X  X  F  Tf Tf X  X  X  T3 Tf X  ","X  Tf X  F  Tf Tf Tf X  Tf X  X  X  X  ","X  Ta X  Tf Tf X  X  X  Tf Tf X  X  X  ","T5 X  X  X  Tf X  Tf Tf Tf X  X  Ta X  ","X  Ta Tf X  X  X  Tf Tf F  X  X  Tf X  ","X  Tf X  X  X  X  Tf F  X  X  Tf Tf X  ","X  T3 T3 Tf X  X  F  X  X  Tf X  X  X  ","X  X  X  X  X  B8 Bc B4 X  T3 X  Tc Tf ","Tc Tc X  X  X  Ba E  B5 X  X  X  X  X  "],"enemies":["3*basic","4*fast","6*power","7*basic"]}

/***/ }),
/* 70 */
/***/ (function(module, exports) {

module.exports = {"name":"8","difficulty":3,"map":["X  X  Bf X  X  Bf X  Bc X  Bf X  X  X  ","F  Bf Bf Bf X  Bf X  Tc X  Bf B5 X  X  ","F  F  F  X  X  B3 X  Bf X  B3 X  Ba B5 ","F  R  R  R  R  R  R  R  R  R  R  X  R  ","X  Bf X  X  X  X  Bc Bc X  X  X  X  X  ","X  X  Bf X  X  Ba Bf Bf B3 Bf B3 T3 T3 ","Bf Bf X  Bf X  Ba Bf Bf F  Bf Tc Tc Bf ","X  X  X  Tf X  Tc X  F  F  F  F  X  X  ","R  R  X  R  R  R  R  R  X  R  R  R  R  ","F  F  X  Ba X  X  Bc Bc X  X  X  X  X  ","F  F  Bf X  B5 X  X  Ba X  Tc Bc Bf X  ","F  Tc Bf X  B5 B8 Bc B4 X  B3 X  Bf X  ","X  X  X  X  X  Ba E  B5 X  Bc X  B3 X  "],"enemies":["7*power","2*armor","4*fast","7*basic"]}

/***/ }),
/* 71 */
/***/ (function(module, exports) {

module.exports = {"name":"9","difficulty":1,"map":["X  X  X  Bf X  X  X  X  X  Tc F  X  X  ","Bf X  X  X  X  X  Tc F  Ta Tf T5 X  Bf ","X  X  X  Tc F  Ta Tf T5 X  T3 F  X  X  ","X  X  Ta Tf T5 X  T3 F  X  X  X  X  X  ","X  X  X  T3 F  X  X  X  X  X  X  X  X  ","X  X  X  F  Tc F  X  F  Tc F  X  X  X  ","Tf Bf X  Ta Tf T5 X  Ta Tf T5 X  Bf Tf ","X  X  X  F  T3 F  X  F  T3 F  X  X  X  ","X  X  X  X  Tc X  X  X  Tc X  X  X  X  ","Bf X  X  Ta Tf T5 X  Ta Tf T5 X  X  Bf ","Bf X  X  F  T3 F  X  F  T3 F  X  X  Bf ","X  X  Bc X  X  B8 Bc B4 X  X  Bc X  X  ","X  X  Bf Bf X  Ba E  B5 X  Bf Bf X  X  "],"enemies":["6*fast","4*fast","7*power","3*armor"]}

/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const TankRecord = immutable_1.Record({
    active: true,
    tankId: 0,
    x: 0,
    y: 0,
    side: 'human',
    direction: 'up',
    moving: false,
    level: 'basic',
    color: 'auto',
    hp: 1,
    withPowerUp: false,
    // helmetDuration用来记录tank的helmet的剩余的持续时间
    helmetDuration: 0,
    // frozenTimeout小于等于0表示可以进行移动, 大于0表示还需要等待frozen毫秒才能进行移动
    frozenTimeout: 0,
    // cooldown小于等于0表示可以进行开火, 大于0表示还需要等待cooldown毫秒才能进行开火
    cooldown: 0,
});
const record = TankRecord();
const plainTankRecord = record.toObject();
exports.default = TankRecord;


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const PowerUpRecord = immutable_1.Record({
    powerUpId: 0,
    x: 0,
    y: 0,
    visible: true,
    powerUpName: 'tank',
});
const record = PowerUpRecord();
exports.default = PowerUpRecord;


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const ScoreRecord = immutable_1.Record({
    scoreId: 0,
    score: 100,
    x: 0,
    y: 0,
});
const record = ScoreRecord();
exports.default = ScoreRecord;


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const ExplosionRecord = immutable_1.Record({
    explosionId: 0,
    shape: 's0',
    // 爆炸中心的位置, 因为爆炸形状改变的时候, 爆炸中心的坐标保持不变, 所以使用cx/cy比较合理
    cx: 0,
    cy: 0,
});
const record = ExplosionRecord();
exports.default = ExplosionRecord;


/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const FlickerRecord = immutable_1.Record({
    flickerId: 0,
    x: 0,
    y: 0,
    shape: 0,
});
const record = FlickerRecord();
exports.default = FlickerRecord;


/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const TextRecord = immutable_1.Record({
    textId: 0,
    content: '',
    fill: '#000000',
    x: 0,
    y: 0,
});
exports.default = TextRecord;


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const BulletRecord = immutable_1.Record({
    bulletId: 0,
    // 子弹的方向
    direction: 'up',
    // 子弹的速度
    speed: 0,
    // 子弹的位置
    x: 0,
    y: 0,
    /**
     * 子弹的强度 默认强度为1
     * 强度大于等于2的子弹一下子可以破坏两倍的brick-wall
     * 强度为3的子弹可以破坏steel-wall */
    power: 1,
    // 发射子弹的坦克id
    tankId: -1,
});
const record = BulletRecord();
exports.default = BulletRecord;


/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const PlayerRecord = immutable_1.Record({
    playerName: null,
    side: 'human',
    activeTankId: 0,
    lives: 0,
    score: 0,
    active: false,
    reservedTank: null,
});
const record = PlayerRecord();
exports.default = PlayerRecord;


/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const constants_1 = __webpack_require__(6);
const EagleRecord_1 = __webpack_require__(14);
const MapRecord = immutable_1.Record({
    eagle: EagleRecord_1.eagleRecord,
    bricks: immutable_1.Repeat(false, constants_1.N_MAP.BRICK ** 2).toList(),
    steels: immutable_1.Repeat(false, constants_1.N_MAP.STEEL ** 2).toList(),
    rivers: immutable_1.Repeat(false, constants_1.N_MAP.RIVER ** 2).toList(),
    snows: immutable_1.Repeat(false, constants_1.N_MAP.SNOW ** 2).toList(),
    forests: immutable_1.Repeat(false, constants_1.N_MAP.FOREST ** 2).toList(),
});
exports.mapRecord = MapRecord();
exports.default = MapRecord;


/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = __webpack_require__(15);
const game_1 = __webpack_require__(97);
const players_1 = __webpack_require__(22);
const bullets_1 = __webpack_require__(23);
const explosions_1 = __webpack_require__(24);
const flickers_1 = __webpack_require__(99);
const map_1 = __webpack_require__(100);
const tanks_1 = __webpack_require__(25);
const texts_1 = __webpack_require__(26);
const powerUps_1 = __webpack_require__(102);
const scores_1 = __webpack_require__(27);
function time(state = 0, action) {
    if (action.type === 'TICK') {
        return state + action.delta;
    }
    else {
        return state;
    }
}
exports.time = time;
exports.default = redux_1.combineReducers({
    game: game_1.default,
    players: players_1.default,
    bullets: bullets_1.default,
    map: map_1.default,
    time,
    explosions: explosions_1.default,
    flickers: flickers_1.default,
    tanks: tanks_1.default,
    texts: texts_1.default,
    powerUps: powerUps_1.default,
    scores: scores_1.default,
});


/***/ }),
/* 82 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getRawTag_js__ = __webpack_require__(85);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__objectToString_js__ = __webpack_require__(86);




/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? Object(__WEBPACK_IMPORTED_MODULE_1__getRawTag_js__["a" /* default */])(value)
    : Object(__WEBPACK_IMPORTED_MODULE_2__objectToString_js__["a" /* default */])(value);
}

/* harmony default export */ __webpack_exports__["a"] = (baseGetTag);


/***/ }),
/* 83 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__ = __webpack_require__(84);


/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__["a" /* default */] || freeSelf || Function('return this')();

/* harmony default export */ __webpack_exports__["a"] = (root);


/***/ }),
/* 84 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/* harmony default export */ __webpack_exports__["a"] = (freeGlobal);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(19)))

/***/ }),
/* 85 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(18);


/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (getRawTag);


/***/ }),
/* 86 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/* harmony default export */ __webpack_exports__["a"] = (objectToString);


/***/ }),
/* 87 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__overArg_js__ = __webpack_require__(88);


/** Built-in value references. */
var getPrototype = Object(__WEBPACK_IMPORTED_MODULE_0__overArg_js__["a" /* default */])(Object.getPrototypeOf, Object);

/* harmony default export */ __webpack_exports__["a"] = (getPrototype);


/***/ }),
/* 88 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/* harmony default export */ __webpack_exports__["a"] = (overArg);


/***/ }),
/* 89 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/* harmony default export */ __webpack_exports__["a"] = (isObjectLike);


/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(91);


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, module) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ponyfill = __webpack_require__(93);

var _ponyfill2 = _interopRequireDefault(_ponyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var root; /* global window */


if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (true) {
  root = module;
} else {
  root = Function('return this')();
}

var result = (0, _ponyfill2['default'])(root);
exports['default'] = result;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(19), __webpack_require__(92)(module)))

/***/ }),
/* 92 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});
exports['default'] = symbolObservablePonyfill;
function symbolObservablePonyfill(root) {
	var result;
	var _Symbol = root.Symbol;

	if (typeof _Symbol === 'function') {
		if (_Symbol.observable) {
			result = _Symbol.observable;
		} else {
			result = _Symbol('observable');
			_Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};

/***/ }),
/* 94 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = combineReducers;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createStore__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash_es_isPlainObject__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils_warning__ = __webpack_require__(20);




function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Given action ' + actionName + ', reducer "' + key + '" returned undefined. ' + 'To ignore an action, you must explicitly return the previous state. ' + 'If you want this reducer to hold no value, you can return null instead of undefined.';
}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers);
  var argumentName = action && action.type === __WEBPACK_IMPORTED_MODULE_0__createStore__["a" /* ActionTypes */].INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!Object(__WEBPACK_IMPORTED_MODULE_1_lodash_es_isPlainObject__["a" /* default */])(inputState)) {
    return 'The ' + argumentName + ' has unexpected type of "' + {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected argument to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"');
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
  });

  unexpectedKeys.forEach(function (key) {
    unexpectedKeyCache[key] = true;
  });

  if (unexpectedKeys.length > 0) {
    return 'Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" found in ' + argumentName + '. ') + 'Expected to find one of the known reducer keys instead: ' + ('"' + reducerKeys.join('", "') + '". Unexpected keys will be ignored.');
  }
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, { type: __WEBPACK_IMPORTED_MODULE_0__createStore__["a" /* ActionTypes */].INIT });

    if (typeof initialState === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined. If you don\'t want to set a value for this reducer, ' + 'you can use null instead of undefined.');
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + __WEBPACK_IMPORTED_MODULE_0__createStore__["a" /* ActionTypes */].INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined, but can be null.');
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */
function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers);
  var finalReducers = {};
  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i];

    if (false) {
      if (typeof reducers[key] === 'undefined') {
        warning('No reducer provided for key "' + key + '"');
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }
  var finalReducerKeys = Object.keys(finalReducers);

  var unexpectedKeyCache = void 0;
  if (false) {
    unexpectedKeyCache = {};
  }

  var shapeAssertionError = void 0;
  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var action = arguments[1];

    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    if (false) {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
      if (warningMessage) {
        warning(warningMessage);
      }
    }

    var hasChanged = false;
    var nextState = {};
    for (var _i = 0; _i < finalReducerKeys.length; _i++) {
      var _key = finalReducerKeys[_i];
      var reducer = finalReducers[_key];
      var previousStateForKey = state[_key];
      var nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(_key, action);
        throw new Error(errorMessage);
      }
      nextState[_key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}

/***/ }),
/* 95 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = bindActionCreators;
function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  var keys = Object.keys(actionCreators);
  var boundActionCreators = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var actionCreator = actionCreators[key];
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}

/***/ }),
/* 96 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = applyMiddleware;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__compose__ = __webpack_require__(21);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };



/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (createStore) {
    return function (reducer, preloadedState, enhancer) {
      var store = createStore(reducer, preloadedState, enhancer);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = __WEBPACK_IMPORTED_MODULE_0__compose__["a" /* default */].apply(undefined, chain)(store.dispatch);

      return _extends({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const parseStageEnemies_1 = __webpack_require__(98);
const stages_1 = __webpack_require__(9);
const emptyTransientKillInfo = immutable_1.Map({
    'player-1': immutable_1.Map({
        basic: -1,
        fast: -1,
        power: -1,
        armor: -1,
    }),
    'player-2': immutable_1.Map({
        basic: -1,
        fast: -1,
        power: -1,
        armor: -1,
    }),
});
const defaultRemainingEnemies = immutable_1.Repeat('basic', 20).toList();
exports.GameRecord = immutable_1.Record({
    /** 游戏是否暂停 */
    paused: false,
    /** 当前场景 */
    scene: 'game-title',
    /** 当前的关卡名 */
    currentStage: null,
    /** 当前关卡剩余的敌人的类型列表 */
    remainingEnemies: defaultRemainingEnemies,
    /** 当前关卡的击杀信息 */
    killInfo: immutable_1.Map(),
    /** 当前关卡的击杀信息, 用于进行动画播放 */
    transientKillInfo: emptyTransientKillInfo,
    /** 关卡击杀信息动画, 是否显示total的数量 */
    showTotalKillCount: false,
    /** AI坦克的冻结时间. 小于等于0表示没有冻结, 大于0表示还需要一段时间解冻 */
    AIFrozenTimeout: 0,
    /** 是否显示HUD */
    showHUD: false,
    /** stage-enter-curtain相关字段 TODO 这个字段需要移动到其他的reducer中 */
    stageEnterCurtainT: 0,
}, 'GameRecord');
const gameRecord = exports.GameRecord();
function game(state = gameRecord, action) {
    if (action.type === 'LOAD_SCENE') {
        return state.set('scene', action.scene);
    }
    else if (action.type === 'START_STAGE') {
        return state.merge({
            currentStage: action.name,
            transientKillInfo: emptyTransientKillInfo,
            killInfo: immutable_1.Map(),
            remainingEnemies: parseStageEnemies_1.default(stages_1.default[action.name].enemies),
            showTotalKillCount: false,
        });
    }
    else if (action.type === 'REMOVE_FIRST_REMAINING_ENEMY') {
        return state.update('remainingEnemies', enemies => enemies.shift());
    }
    else if (action.type === 'INC_KILL_COUNT') {
        const { playerName, level } = action;
        return state.updateIn(['killInfo', playerName, level], x => (x == null ? 1 : x + 1));
    }
    else if (action.type === 'UPDATE_TRANSIENT_KILL_INFO') {
        return state.set('transientKillInfo', action.info);
    }
    else if (action.type === 'SHOW_TOTAL_KILL_COUNT') {
        return state.set('showTotalKillCount', true);
    }
    else if (action.type === 'SET_AI_FROZEN_TIMEOUT') {
        return state.set('AIFrozenTimeout', action.AIFrozenTimeout);
    }
    else if (action.type === 'GAMEPAUSE') {
        return state.set('paused', true);
    }
    else if (action.type === 'GAMERESUME') {
        return state.set('paused', false);
    }
    else if (action.type === 'UPDATE_CURTAIN') {
        return state.set('stageEnterCurtainT', action.t);
    }
    else if (action.type === 'SHOW_HUD') {
        return state.set('showHUD', true);
    }
    else if (action.type === 'HIDE_HUD') {
        return state.set('showHUD', false);
    }
    else {
        return state;
    }
}
exports.default = game;


/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
function parseStageEnemies(enemies) {
    const array = [];
    for (const descriptor of enemies) {
        const splited = descriptor.split('*').map(s => s.trim());
        console.assert(splited.length === 2);
        const number = Number(splited[0]);
        const tankLevel = splited[1];
        console.assert(!isNaN(number));
        console.assert(['basic', 'fast', 'power', 'armor'].includes(tankLevel));
        for (let i = 0; i < number; i += 1) {
            array.push(tankLevel);
        }
    }
    return immutable_1.List(array);
}
exports.default = parseStageEnemies;


/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
function flickers(state = immutable_1.Map(), action) {
    if (action.type === 'ADD_OR_UPDATE_FLICKER') {
        return state.set(action.flicker.flickerId, action.flicker);
    }
    else if (action.type === 'REMOVE_FLICKER') {
        return state.delete(action.flickerId);
    }
    else {
        return state;
    }
}
exports.default = flickers;


/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const parseStageMap_1 = __webpack_require__(101);
const stages_1 = __webpack_require__(9);
const types_1 = __webpack_require__(2);
const initState = types_1.mapRecord.set('eagle', null);
function mapReducer(state = initState, action) {
    if (action.type === 'LOAD_STAGE_MAP') {
        const { name } = action;
        return parseStageMap_1.default(stages_1.default[name].map);
    }
    else if (action.type === 'DESTROY_EAGLE') {
        return state.setIn(['eagle', 'broken'], true);
    }
    else if (action.type === 'REMOVE_BRICKS') {
        return state.update('bricks', bricks => (bricks.map((set, t) => (action.ts.has(t) ? false : set))));
    }
    else if (action.type === 'REMOVE_STEELS') {
        return state.update('steels', steels => (steels.map((set, t) => (action.ts.has(t) ? false : set))));
    }
    else if (action.type === 'UPDATE_MAP') {
        return action.map;
    }
    else {
        return state;
    }
}
exports.default = mapReducer;


/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const constants_1 = __webpack_require__(6);
const types_1 = __webpack_require__(2);
function parseBrickBits(str) {
    if (str.length === 1) {
        const short = parseInt(str, 16);
        let long = 0;
        if (0b0001 & short) {
            long += 0xf000;
        }
        if (0b0010 & short) {
            long += 0x0f00;
        }
        if (0b0100 & short) {
            long += 0x00f0;
        }
        if (0b1000 & short) {
            long += 0x000f;
        }
        return long;
    }
    else if (str.length === 4) {
        return parseInt(str, 16);
    }
}
// 空白 XX
// 砖块 brick  B<n>
// 河流 river  R
// 雪地 snow   S
// 森林 forest F
// 钢块 steel  T<n>
// 老鹰 eagle  E
/**
 * 解析关卡文件中的地图配置.
 * 地图配置数据格式为 string[], 数组中每一个string对应地图中的一行.
 * 一行中包含16个item(由一个或多个空格分隔开来), 对应地图一行的16个block
 * item的第一个字符标记了block的类型, 各个字母的含义见上方
 * item后续字符(如果存在的话)为十六进制格式, 用来表示该block中哪些部分包含了地图元素
 */
function parseStageMap(map) {
    const bricks = new Set();
    const steels = new Set();
    const rivers = new Set();
    const snows = new Set();
    const forests = new Set();
    let eaglePos = null;
    for (let row = 0; row < constants_1.FIELD_BLOCK_SIZE; row += 1) {
        const line = map[row].toLowerCase().split(/ +/);
        for (let col = 0; col < constants_1.FIELD_BLOCK_SIZE; col += 1) {
            const item = line[col].trim();
            if (item[0] === 'b') {
                const bits = parseBrickBits(item.substring(1));
                const rowrow = 4 * row;
                const colcol = 4 * col;
                const N = 52;
                const part0 = (bits >> 12) & 0xf;
                (part0 & 0b0001) && bricks.add(rowrow * N + colcol + 0);
                (part0 & 0b0010) && bricks.add(rowrow * N + colcol + 1);
                (part0 & 0b0100) && bricks.add(rowrow * N + colcol + N);
                (part0 & 0b1000) && bricks.add(rowrow * N + colcol + N + 1);
                const part1 = (bits >> 8) & 0xf;
                (part1 & 0b0001) && bricks.add(rowrow * N + colcol + 2 + 0);
                (part1 & 0b0010) && bricks.add(rowrow * N + colcol + 2 + 1);
                (part1 & 0b0100) && bricks.add(rowrow * N + colcol + 2 + N);
                (part1 & 0b1000) && bricks.add(rowrow * N + colcol + 2 + N + 1);
                const part2 = (bits >> 4) & 0xf;
                (part2 & 0b0001) && bricks.add((rowrow + 2) * N + colcol + 0);
                (part2 & 0b0010) && bricks.add((rowrow + 2) * N + colcol + 1);
                (part2 & 0b0100) && bricks.add((rowrow + 2) * N + colcol + N);
                (part2 & 0b1000) && bricks.add((rowrow + 2) * N + colcol + N + 1);
                const part3 = (bits >> 0) & 0xf;
                (part3 & 0b0001) && bricks.add((rowrow + 2) * N + colcol + 2 + 0);
                (part3 & 0b0010) && bricks.add((rowrow + 2) * N + colcol + 2 + 1);
                (part3 & 0b0100) && bricks.add((rowrow + 2) * N + colcol + 2 + N);
                (part3 & 0b1000) && bricks.add((rowrow + 2) * N + colcol + 2 + N + 1);
            }
            else if (item[0] === 't') {
                const bits = parseInt(item[1], 16);
                // console.assert(0 < bits && bits < 16)
                if (bits & 0b0001) {
                    steels.add(2 * row * 26 + 2 * col);
                }
                if (bits & 0b0010) {
                    steels.add(2 * row * 26 + 2 * col + 1);
                }
                if (bits & 0b0100) {
                    steels.add((2 * row + 1) * 26 + 2 * col);
                }
                if (bits & 0b1000) {
                    steels.add((2 * row + 1) * 26 + 2 * col + 1);
                }
            }
            else if (item[0] === 'r') {
                rivers.add(row * constants_1.FIELD_BLOCK_SIZE + col);
            }
            else if (item[0] === 'f') {
                forests.add(row * constants_1.FIELD_BLOCK_SIZE + col);
            }
            else if (item[0] === 's') {
                snows.add(row * constants_1.FIELD_BLOCK_SIZE + col);
            }
            else if (item[0] === 'e') {
                if (eaglePos != null) {
                    throw new Error('Eagle appears more than once');
                }
                else {
                    eaglePos = {
                        x: col * constants_1.BLOCK_SIZE,
                        y: row * constants_1.BLOCK_SIZE,
                    };
                }
            }
            else if (item[0] !== 'x') {
                throw new Error('Invalid map');
            }
        }
    }
    return types_1.MapRecord({
        eagle: eaglePos ? types_1.EagleRecord({
            x: eaglePos.x,
            y: eaglePos.y,
            broken: false,
        }) : null,
        bricks: immutable_1.Repeat(false, constants_1.N_MAP.BRICK ** 2)
            .map((set, index) => bricks.has(index)).toList(),
        steels: immutable_1.Repeat(false, constants_1.N_MAP.STEEL ** 2)
            .map((set, index) => steels.has(index)).toList(),
        rivers: immutable_1.Repeat(false, constants_1.N_MAP.RIVER ** 2)
            .map((set, index) => rivers.has(index)).toList(),
        snows: immutable_1.Repeat(false, constants_1.N_MAP.SNOW ** 2)
            .map((set, index) => snows.has(index)).toList(),
        forests: immutable_1.Repeat(false, constants_1.N_MAP.FOREST ** 2)
            .map((set, index) => forests.has(index)).toList(),
    });
}
exports.default = parseStageMap;


/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
function powerUps(state = immutable_1.Map(), action) {
    if (action.type === 'ADD_POWER_UP') {
        return state.set(action.powerUp.powerUpId, action.powerUp);
    }
    else if (action.type === 'UPDATE_POWER_UP') {
        return state.update(action.powerUp.powerUpId, old => old.merge(action.powerUp));
    }
    else if (action.type === 'REMOVE_POWER_UP') {
        return state.delete(action.powerUpId);
    }
    else {
        return state;
    }
}
exports.default = powerUps;


/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = __webpack_require__(6);
const common_1 = __webpack_require__(5);
const logAhead = (...args) => 0; /* console.log('[ahead]', ...args) */
/** AI是否可以破坏该障碍物 */
function canDestroy(barrierType) {
    return barrierType === 'brick';
}
class RelativePosition {
    constructor(subject, object) {
        this.subject = subject;
        this.object = object;
        this.dx = object.x - subject.x;
        this.dy = object.y - subject.y;
        this.absdx = Math.abs(this.dx);
        this.absdy = Math.abs(this.dy);
    }
    getForwardInfo(direction) {
        if (direction === 'left') {
            return {
                length: -this.dx,
                offset: this.absdy,
            };
        }
        else if (direction === 'right') {
            return {
                length: this.dx,
                offset: this.absdy,
            };
        }
        else if (direction === 'up') {
            return {
                length: -this.dy,
                offset: this.absdx,
            };
        }
        else {
            return {
                length: this.dy,
                offset: this.absdx,
            };
        }
    }
}
exports.RelativePosition = RelativePosition;
exports.FireThreshhold = {
    eagle(forwardLength) {
        logAhead('eagle:', forwardLength);
        if (forwardLength < 0) {
            return 0;
        }
        else if (forwardLength <= 4 * constants_1.BLOCK_SIZE) {
            return 0.8;
        }
    },
    humanTank(forwardLength) {
        logAhead('human-tank:', forwardLength);
        if (forwardLength < 0) {
            return 0;
        }
        else if (forwardLength <= 4 * constants_1.BLOCK_SIZE) {
            return 0.6;
        }
    },
    destroyable(forwardLength) {
        logAhead('destroyable:', forwardLength);
        // 随着距离增加fire概率减小; 距离0时, 一定fire; 距离10*BLOCK_SIZE时, 不fire
        return 1 - forwardLength / 10 * constants_1.BLOCK_SIZE;
    },
    idle() {
        return 0;
    },
};
function calculatePriorityMap({ tankPosition: pos, barrierInfo: binfo }) {
    const priorityMap = {
        up: 2,
        down: 2,
        left: 2,
        right: 2,
    };
    // 计算往下走的优先级
    if (pos.eagle.dy >= 4 * constants_1.BLOCK_SIZE) {
        priorityMap.down += 2;
    }
    else if (pos.eagle.dy >= 2 * constants_1.BLOCK_SIZE) {
        priorityMap.down += 1;
    }
    // if (binfo.down.length <= 2 * BLOCK_SIZE && !canDestroy(binfo.down.type)) {
    //   priorityMap.down = 1
    // }
    if (binfo.down.length < 4 && !canDestroy(binfo.down.type)) {
        priorityMap.down = 0;
    }
    // 计算往上走的优先级
    if (pos.eagle.dy <= -4 * constants_1.BLOCK_SIZE) {
        priorityMap.up += 2;
    }
    else if (pos.eagle.dy < -2 * constants_1.BLOCK_SIZE) {
        priorityMap.up += 1;
    }
    // if (binfo.up.length <= 2 * BLOCK_SIZE && !canDestroy(binfo.up.type)) {
    //   priorityMap.up = 1
    // }
    if (binfo.up.length < 4 && !canDestroy(binfo.up.type)) {
        priorityMap.up = 0;
    }
    // 计算往左走的优先级
    if (pos.eagle.dx <= -4 * constants_1.BLOCK_SIZE) {
        priorityMap.left += 2;
    }
    else if (pos.eagle.dx <= -2 * constants_1.BLOCK_SIZE) {
        priorityMap.left += 1;
    }
    // if (binfo.left.length <= 2 * BLOCK_SIZE && !canDestroy(binfo.left.type)) {
    //   priorityMap.left = 1
    // }
    if (binfo.left.length < 4 && !canDestroy(binfo.left.type)) {
        priorityMap.left = 0;
    }
    // 计算往右走的优先级
    if (pos.eagle.dx >= 4 * constants_1.BLOCK_SIZE) {
        priorityMap.right += 2;
    }
    else if (pos.eagle.dx >= 2 * constants_1.BLOCK_SIZE) {
        priorityMap.right += 1;
    }
    // if (binfo.right.length <= 2 * BLOCK_SIZE && !canDestroy(binfo.right.type)) {
    //   priorityMap.right = 1
    // }
    if (binfo.right.length < 4 && !canDestroy(binfo.right.type)) {
        priorityMap.right = 0;
    }
    return priorityMap;
}
exports.calculatePriorityMap = calculatePriorityMap;
// 获取tank的环境信息
function getEnv(map, tanks, tank) {
    // pos对象用来存放tank与其他物体之间的相对位置
    const pos = {
        eagle: new RelativePosition(tank, map.eagle),
        nearestHumanTank: null,
    };
    // 计算ai-tank与最近的human-tank的相对位置
    const { nearestHumanTank } = tanks.reduce((reduction, next) => {
        if (next.side === 'human') {
            const distance = Math.abs(next.x - tank.x) + Math.abs(next.y - tank.y);
            if (distance < reduction.minDistance) {
                return { minDistance: distance, nearestHumanTank: next };
            }
        }
        return reduction;
    }, { minDistance: Infinity, nearestHumanTank: null });
    if (nearestHumanTank) {
        pos.nearestHumanTank = new RelativePosition(tank, nearestHumanTank);
    }
    // 障碍物信息
    const binfo = {
        down: lookAhead(map, tank.set('direction', 'down')),
        right: lookAhead(map, tank.set('direction', 'right')),
        left: lookAhead(map, tank.set('direction', 'left')),
        up: lookAhead(map, tank.set('direction', 'up')),
    };
    return {
        tankPosition: pos,
        barrierInfo: binfo,
    };
}
exports.getEnv = getEnv;
/** 根据目前AI-tank的环境信息, 决定AI-tank是否应该开火 */
function shouldFire(tank, { barrierInfo, tankPosition: pos }) {
    const random = Math.random();
    // console.log('fire-random:', random)
    // todo 目前部分result的计算是多余的
    let result = false;
    const ahead = barrierInfo[tank.direction];
    if (canDestroy(ahead.type)) {
        if (random < exports.FireThreshhold.destroyable(ahead.length)) {
            result = true;
        }
    }
    // 坦克面向eagle且足够接近时, 增加开火概率
    const eagleForwardInfo = pos.eagle.getForwardInfo(tank.direction);
    if (eagleForwardInfo.offset <= 8) {
        if (random < exports.FireThreshhold.eagle(eagleForwardInfo.length)) {
            result = true;
        }
    }
    // 坦克面向nearestHumanTank且足够接近时, 增加开火概率
    if (pos.nearestHumanTank) {
        const humanTankForwardInfo = pos.nearestHumanTank.getForwardInfo(tank.direction);
        if (humanTankForwardInfo.offset <= 8) {
            if (random < exports.FireThreshhold.humanTank(humanTankForwardInfo.length)) {
                result = true;
            }
        }
    }
    if (random < exports.FireThreshhold.idle()) {
        result = true;
    }
    return result;
}
exports.shouldFire = shouldFire;
function getRandomDirection({ up, down, left, right }) {
    const total = up + down + left + right;
    let n = Math.random() * total;
    n -= up;
    if (n < 0) {
        return 'up';
    }
    n -= down;
    if (n < 0) {
        return 'down';
    }
    n -= left;
    if (n < 0) {
        return 'left';
    }
    return 'right';
}
exports.getRandomDirection = getRandomDirection;
function lookAhead({ bricks, steels, rivers }, tank) {
    const brickAheadLength = getAheadBrickLength(bricks, tank);
    const steelAheadLength = getAheadSteelLength(steels, tank);
    const riverAheadLength = getAheadRiverLength(rivers, tank);
    if (steelAheadLength === Infinity
        && brickAheadLength === Infinity
        && riverAheadLength === Infinity) {
        let borderAheadLength;
        if (tank.direction === 'up') {
            borderAheadLength = tank.y;
        }
        else if (tank.direction === 'down') {
            borderAheadLength = constants_1.FIELD_SIZE - tank.y - constants_1.TANK_SIZE;
        }
        else if (tank.direction === 'left') {
            borderAheadLength = tank.x;
        }
        else {
            borderAheadLength = constants_1.FIELD_SIZE - tank.x - constants_1.TANK_SIZE;
        }
        return { type: 'border', length: borderAheadLength };
    }
    else if (steelAheadLength <= brickAheadLength && steelAheadLength <= riverAheadLength) {
        return { type: 'steel', length: steelAheadLength };
    }
    else if (riverAheadLength <= brickAheadLength) {
        return { type: 'river', length: riverAheadLength };
    }
    else {
        return { type: 'brick', length: brickAheadLength };
    }
}
function getAheadBrickLength(bricks, tank) {
    const size = constants_1.ITEM_SIZE_MAP.BRICK;
    const N = constants_1.N_MAP.BRICK;
    const { xy, updater } = common_1.getDirectionInfo(tank.direction);
    let step = 1;
    while (true) {
        const iterable = common_1.iterRowsAndCols(size, common_1.asBox(tank.update(xy, updater(step * size)), -0.02));
        const array = Array.from(iterable);
        if (array.length === 0) {
            return Infinity;
        }
        for (const [row, col] of array) {
            const t = row * N + col;
            if (bricks.get(t)) {
                return (step - 1) * size;
            }
        }
        step++;
    }
}
function getAheadSteelLength(steels, tank) {
    const size = constants_1.ITEM_SIZE_MAP.STEEL;
    const N = constants_1.N_MAP.STEEL;
    const { xy, updater } = common_1.getDirectionInfo(tank.direction);
    let step = 1;
    while (true) {
        const iterable = common_1.iterRowsAndCols(size, common_1.asBox(tank.update(xy, updater(step * size)), -0.02));
        const array = Array.from(iterable);
        if (array.length === 0) {
            return Infinity;
        }
        for (const [row, col] of array) {
            const t = row * N + col;
            if (steels.get(t)) {
                return (step - 1) * size;
            }
        }
        step++;
    }
}
function getAheadRiverLength(rivers, tank) {
    const size = constants_1.ITEM_SIZE_MAP.RIVER;
    const N = constants_1.N_MAP.RIVER;
    const { xy, updater } = common_1.getDirectionInfo(tank.direction);
    let step = 1;
    while (true) {
        const iterable = common_1.iterRowsAndCols(size, common_1.asBox(tank.update(xy, updater(step * size)), -0.02));
        const array = Array.from(iterable);
        if (array.length === 0) {
            return Infinity;
        }
        for (const [row, col] of array) {
            const t = row * N + col;
            if (rivers.get(t)) {
                return (step - 1) * size;
            }
        }
        step++;
    }
}


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = __webpack_require__(0);
const redux_1 = __webpack_require__(15);
const types_1 = __webpack_require__(2);
class GameAIClient {
    constructor() {
        this.pendingNotes = {
            'bullet-complete': [],
            reach: [],
        };
        this.pendingQueries = {
            'my-tank-info': [],
            'map-info': [],
            'active-tanks-info': [],
            'my-fire-info': [],
        };
        this.post = self.postMessage.bind(self);
        this.onMessage = (event) => {
            const d = event.data;
            if (d.type === 'query-result') {
                const fns = this.pendingQueries[d.result.type];
                this.pendingQueries[d.result.type] = [];
                fns.forEach(fn => fn(d.result));
            }
            else {
                const fns = this.pendingNotes[d.type];
                this.pendingNotes[d.type] = [];
                fns.forEach(fn => fn(d));
            }
        };
        self.addEventListener('message', this.onMessage);
    }
    queryMyTank() {
        return new Promise(resolve => {
            this.post({ type: 'query', query: 'my-tank-info' });
            this.pendingQueries['my-tank-info'].push(redux_1.compose(resolve, (result) => (types_1.TankRecord(result.tank))));
        });
    }
    queryMyFireInfo() {
        return new Promise(resolve => {
            this.post({ type: 'query', query: 'my-fire-info' });
            this.pendingQueries['my-fire-info'].push(resolve);
        });
    }
    queryMapInfo() {
        return new Promise(resolve => {
            this.post({ type: 'query', query: 'map-info' });
            this.pendingQueries['map-info'].push(redux_1.compose(resolve, (result) => (types_1.MapRecord(result.map)
                .update('eagle', types_1.EagleRecord)
                .update('bricks', immutable_1.List)
                .update('steels', immutable_1.List)
                .update('rivers', immutable_1.List)
                .update('snows', immutable_1.List)
                .update('forests', immutable_1.List))));
        });
    }
    queryTanksInfo() {
        return new Promise(resolve => {
            this.post({ type: 'query', query: 'active-tanks-info' });
            this.pendingQueries['active-tanks-info'].push(redux_1.compose(resolve, (result) => (immutable_1.List(result.tanks)
                .toMap()
                .map(types_1.TankRecord)
                .mapKeys((_, t) => t.tankId))));
        });
    }
    noteBulletComplete() {
        return new Promise(resolve => {
            this.pendingNotes['bullet-complete'].push(resolve);
        });
    }
    noteReach() {
        return new Promise(resolve => {
            this.pendingNotes['reach'].push(resolve);
        });
    }
}
exports.default = GameAIClient;


/***/ })
/******/ ]);
/**
 * @ignore
 * @hidden
 *
 * @param _obj
 */
function _isObjLiteral<T>(_obj: Record<string | number | symbol, T>): boolean {
    let _test = _obj;
    return (typeof _obj !== "object" || _obj === null ? false : ((function () {
        while (!false) {
            if (Object.getPrototypeOf(_test = Object.getPrototypeOf(_test)) === null) {
                break;
            }
        }
        return Object.getPrototypeOf(_obj) === _test;
    })()));
}

/**
 * @ignore
 * @hidden
 *
 * @param x
 * @param y
 */
function _equals(x: any, y: any): boolean {
    if (x === y) return true;
    // if both x and y are null or undefined and exactly the same

    if (!(x instanceof Object) || !(y instanceof Object)) return false;
    // if they are not strictly equal, they both need to be Objects

    if (x.constructor !== y.constructor) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for (const p in x) {
        if (!x.hasOwnProperty(p)) continue;
        // other properties were tested using x.constructor === y.constructor

        if (!y.hasOwnProperty(p)) return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if (x[p] === y[p]) continue;
        // if they have the same strict value or identity then they are equal

        if (typeof (x[p]) !== "object") return false;
        // Numbers, Strings, Functions, Booleans must be strictly equal

        if (!_equals(x[p], y[p])) return false;
        // Objects and Arrays must be tested recursively
    }

    for (const p in y) {
        if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
        // allows x[ p ] to be set to undefined
    }
    return true;
}

interface Result<T> {
    key: string | number;
    value: T;
}

interface AbstractClass {
    name: string;
}

type Predicate<T> = (i: T) => boolean

export class Collection<T> extends Map<string | number, T> {
    private TName: string;

    /**
     * Another way is to use `base: new () => T` or `base: T&Function` but this does not work with abstract classes.
     *
     * @param {AbstractClass | null} [base] The type of the collection, even though it's optional it's better to always pass a param
     * @param {T[] | Record<string|number|symbol, T> | null} [from] Construct new Collection with items from array or object
     *
     * @example
     * ```ts
     * const collection = new Collection<array>(null, ["foo", "bar", "baz"]);
     * const collection = new Collection<array>(Array, ["foo", "bar", "baz"])
     * const collection = new Collection<array>(Array)
     * ```
     */
    constructor(base?: AbstractClass | null, from?: T[] | Record<string | number | symbol, T> | null) {
        super();
        this.TName = base ? base.name : "any";

        if (from) {
            if (Array.isArray(from)) {
                for (let i = 0; i < from.length; i++) {
                    if (from[i]) this.set(i, from[i]!);
                }
            } else if (_isObjLiteral(from)) {
                for (const [key, value] of Object.entries(from)) {
                    this.set(key, value);
                }
            }
        }
    }

    /**
     * @since 0.4.0
     *
     * @returns {boolean} true if collection is empty else false
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * collection.isEmpty // => false
     * ```
     */
    get isEmpty(): boolean {
        return this.size === 0;
    }

    /**
     * @since 0.4.0
     *
     * Convert collection values to array
     *
     * @returns {T[]}
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * collection.asArray // => ["foo", "bar", "baz"]
     * ```
     */
    toArray(): T[] {
        const arr: T[] = [];
        for (const [, value] of this) {
            arr.push(value);
        }
        return arr;
    }

    /**
     * @since 0.4.0
     *
     * Convert collection to object
     *
     * @returns {Record<string|number|symbol, T>}
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * collection.asObject // => {0: "foo", 1: "bar", 2: "baz"}
     * ```
     */
    toObject(): Record<string | number | symbol, T> {
        const obj: Record<string | number | symbol, T> = {};
        for (const [key, value] of this) {
            obj[key] = value;
        }
        return obj;
    }

    /**
     * @since 0.2.0
     *
     * @since 0.4.8 Add generic type to static method
     *
     * Create a Collection from an Array or Object
     *
     * @param {T[] | Record<string|number|symbol, T>} x The array you want to create a collection from
     * @returns {Collection<T>} The created collection
     *
     * @example
     * ```ts
     * const col = Collection.from<string>(["foo", "bar", "baz"]);
     * // Collection {
     * //     0 => 'foo',
     * //     1 => 'bar',
     * //     2 => 'baz'
     * // }
     * ```
     */
    static from<T>(x: T[] | Record<string | number | symbol, T>): Collection<T> {
        const col = new Collection<T>();
        if (Array.isArray(x)) {
            for (let i = 0; i < x.length; i++) {
                if (x[i]) col.set(i, x[i]!);
            }
        } else if (_isObjLiteral(x)) {
            for (const [key, value] of Object.entries(x)) {
                col.set(key, value);
            }
        }
        return col;
    }

    /**
     * @since 0.3.4
     *
     * @since 0.4.8 Add generic type to static method
     *
     * Merge multiple collections together
     *
     * @param {Collection<any>[]} collections All the collections you want to merge together
     *
     * @example
     * ```ts
     * const col1 = new Collection<string>(String, ["foo", "bar"]);
     * const col2 = new Collection<string>(String, ["baz"]);
     *
     * const col3 = Collection.merge(col1, col2);
     * // Collection {
     * //     0 => 'foo',
     * //     1 => 'bar',
     * //     2 => 'baz'
     * // }
     * ```
     */
    static merge<T>(...collections: Collection<T>[]): Collection<T> {
        const temp = new Collection<T>();
        for (let i = 0; i < collections.length; i++) {
            if (collections[i]) {
                for (const [key, value] of collections[i]!) {
                    temp.set(key, value);
                }
            }
        }
        return temp;
    }

    /**
     * @since 0.2.0
     *
     * Simple set function
     * If `v` has an index named `_key` it will use it as the key
     *
     * @param {T} v Value to add to the collection
     *
     * @example
     * ```ts
     * const collection = new Collection<string>(String);
     * collection.add("foo");
     * // Collection {
     * //     0 => 'foo'
     * // }
     * ```
     */
    add(v: T): void {
        if ((v as any)._key) {
            this.set((v as any)._key, v);
        } else {
            this.set(this.size, v);
        }
    }

    /**
     * @since 0.3.3
     * @since 0.4.3 Added addMany from Collection
     *
     * Add multiple items at once to the collection
     *
     * @param {T[] | Record<string|number|symbol, T>} x The array with items
     *
     * @example
     * ```ts
     * const collection = new Collection<string>(String);
     * collection.addMany(["foo", "bar", "baz", "123"]);
     * collection.addMany({ "foo": "bar", "baz": "123" });
     * // Collection {
     * //     0 => 'foo',
     * //     1 => 'bar',
     * //     2 => 'baz',
     * //     3 => '123',
     * //     'foo' => 'bar',
     * //     'baz' => '123'
     * // }
     * ```
     */
    addMany(x: T[] | Record<string | number | symbol, T> | Collection<T>): void {
        if (x instanceof Collection) {
            for (const [key, value] of x.entries()) {
                this.set(key, value);
            }
        } else if (Array.isArray(x)) {
            for (let i = 0; i < x.length; i++) {
                if (x[i]) this.set(this.size, x[i]!);
            }
        } else if (_isObjLiteral(x)) {
            for (const [key, value] of Object.entries(x)) {
                this.set(key, value);
            }
        }
    }

    /**
     * @since 0.1.0
     *
     * Returns first matching Object or undefined if no match
     *
     * @param {Predicate<T>} fn A function that returns true if it matches the given param
     * @returns {Result<T> | undefined} The first matching object or undefined if none found
     *
     * @example
     * ```ts
     * const collection = new Collection<string>(String, ["foo", "bar", "baz", "123"]);
     * const result = collection.find((item) => item === "foo");
     * console.log(result);
     * // { "key": 0, "value": "foo" }
     * ```
     */
    find(fn: Predicate<T>): Result<T> | undefined {
        for (const [key, value] of this) {
            if (fn(value)) return { key, value };
        }
        return undefined;
    }

    /**
     * @since 0.1.0
     *
     * Returns an Array with all the elements that make the function evaluate true
     *
     * @param {Predicate<T>} fn A function that returns true if it matches the given param
     * @returns {Result<T>[]} An array with all the elements that evaluated true
     *
     * @example
     * ```ts
     * const collection = new Collection<string>(String, ["foo", "bar", "baz", "123"]);
     * const results = collection.filter((item) => item.includes("a"));
     * console.log(results);
     * // [
     * //     { "key": 1, "value": "bar" },
     * //     { "key": 2, "value": "baz" }
     * // ]
     * ```
     */
    filter(fn: Predicate<T>): Result<T>[] {
        const results: Result<T>[] = [];
        for (const [key, value] of this) {
            if (fn(value)) results.push({ key, value });
        }
        return results;
    }

    /**
     * @since 0.1.0
     *
     * Returns an Array with the results of applying the given function to each element
     *
     * @param {Function} fn A function that returns a result
     * @returns {R[]} An array with the results
     *
     * @example
     * ```ts
     * const collection = new Collection<string>(String, ["foo", "bar", "baz", "123"]);
     * collection.map((v) => v.replace("a", "o"));
     * // [
     * //     "foo",
     * //     "bor",
     * //     "boz",
     * //     "123"
     * // ]
     * ```
     */
    map<R>(fn: (v: T, k: string | number, c: Collection<T>) => R): R[] {
        const results: R[] = [];
        for (const [key, value] of this) {
            results.push(fn(value, key, this));
        }
        return results;
    }

    /**
     * @since 0.1.0
     *
     * Merge two collections
     *
     * @param {Collection<T>} x A collection to merge together with this
     * @returns {Collection<T>} The merged collection
     *
     * @example
     * ```ts
     * const col1 = Collection.from<string>(["foo", "bar"]);
     * const col2 = Collection.from<string>(["baz"]);
     *
     * col1.merge(col2);
     * // Collection {
     * //     0 => 'foo',
     * //     1 => 'bar',
     * //     2 => 'baz'
     * // }
     * ```
     */
    merge(x: Collection<T>): Collection<T> {
        const temp = new Collection<T>();
        for (const [, value] of this) {
            temp.add(value);
        }
        for (const [, value] of x) {
            temp.add(value);
        }
        return temp;
    }

    /**
     * @since 0.1.0
     *
     * Returns a random Object from the Collection or undefined if the Collection is empty
     *
     * @returns {T | undefined} The random object or undefined if none exist
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * collection.random(); // => will return 1 of foo, bar or baz
     * ```
     */
    random(): T | undefined {
        const index = Math.floor(Math.random() * this.size);
        const iter = this.values();
        for (let i = 0; i < index; ++i) {
            iter.next();
        }
        return iter.next().value;
    }

    /**
     * @since 0.1.0
     *
     * @example
     * ```ts
     * const collection = new Collection<string>(String, ["foo", "bar", "baz"]);
     * collection.toString(); // => [Collection<String>]
     * ```
     */
    toString(): string {
        return `[Collection<${this.TName}>]`;
    }

    /**
     * @since 0.4.0
     *
     * Returns true if all elements satisfy predicate.
     *
     * @param {Predicate<T>} fn A function that returns a result
     *
     * @returns {boolean}
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * const result = collection.all((value) => typeof value === "string");
     * // => true, all the items in the collection are strings
     * ```
     */
    all(fn: Predicate<T>): boolean {
        for (const [, value] of this) {
            if (!fn(value)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @since 0.4.0
     *
     * Returns true if atleast one element satisfies the predicate.
     *
     * @param {Predicate<T>} fn A function that returns a result
     *
     * @returns {boolean}
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * const result = collection.any((value) => value.includes("a"));
     * // => true, collection has atleast 1 item that includes an "a"
     * ```
     */
    any(fn: Predicate<T> | null): boolean {
        if (fn) {
            for (const [, value] of this) {
                if (fn(value)) return true;
            }
            return false;
        }
        return false;
    }

    /**
     * @since 0.4.0
     *
     * Checks if element is in the collection
     *
     * @param {T} element Element you want to check
     *
     * @returns {boolean} true if element is in collection else false
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * const result = collection.contains("baz");
     * // => true, collection has an item that is "baz"
     * ```
     */
    contains(element: T): boolean {
        for (const [, value] of this) {
            if (element === value) return true;
        }
        return false;
    }

    /**
     * @since 0.4.0
     *
     * Checks if all values from given collection are in this collection
     *
     * @param {Collection<T>} collection The collection with values you want to check
     *
     * @returns {boolean} true if all values are in this collection else false
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * const collection2 = Collection.from<string>(["foo", "bar", "baz", "123"]);
     * const result = collection.containsAll(collection2);
     * // => false, 123 does not exist in collection
     * ```
     */
    containsAll(collection: Collection<T>): boolean {
        let containsAll = false;
        for (const [, value] of collection) {
            if (this.contains(value)) containsAll = true;
            else return false;
        }
        return containsAll;
    }

    /**
     * @since 0.4.0
     *
     * Gives the number of items in the collection, if predicate is given the number of items that evaluated true
     *
     * @param {Predicate<T>} fn A function that returns a result
     *
     * @returns {number}
     *
     * @example
     * ```ts
     * const collection = Collection.from<string>(["foo", "bar", "baz"]);
     * const result = collection.count((value) => value.includes("a"));
     * // => 2, only 2 items include an "a"
     * ```
     */
    count(fn?: Predicate<T> | null): number {
        if (fn) {
            let i = 0;
            for (const [, value] of this) {
                if (fn(value)) i++;
            }
            return i;
        } else {
            return this.size;
        }
    }

    /**
     * @since 0.5.0
     *
     * Remove an item from the collection
     *
     * @param {T} item The item to delete
     */
    remove(item: T): void {
        if ((item as any)._key) {
            const result = this.get((item as any)._key);
            if (result) {
                this.delete((result as any)._key);
            }
        } else {
            const result = this.find((v) => _equals(v, item));
            if (result) {
                this.delete(result.key);
            }
        }
    }
}

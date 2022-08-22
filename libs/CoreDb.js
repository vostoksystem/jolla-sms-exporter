const pa = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

class CoreDb {

	/*
	 * 
	 * @param {object} opts : {path{string}, readonly(boolean) }
	 * @returns {nm$_CoreDb.CoreDb}
	 */
	constructor(opts = {path: "commhistory.db", readonly: false}) {

		this._dbPath = opts.path
		this._readonly = opts.readonly

		if (this._readonly) {
			console.log("Db : opened in readonly")
		}

		this.open()
	}

	/**
	 * verifie si la db est ouverte, si non, l'ouvre
	 * @returns {boolean} 
	 */
	open() {
		try {
			if (this._db.open) {
				return true
			}
			delete this._db		// si la db a été fermé, on libére l'objet
		} catch (e) {
		}

		// ouverture de la db
		try {
			console.log("DB : opening db")

			this._db = new Database(this._dbPath, {readonly: this._readonly})

		} catch (e) {
			console.log("DB : cannot open Db : " + e)
		}

		return false;
	}

	/*
	 * 
	 * @returns {String} path to commhistory.db
	 */
	getdbPath() {
		return this._dbPath
	}

	/**
	 * 
	 * @returns {String} path of directory where commhistory.db and data are stored
	 */
	getDbDir() {
		return pa.dirname(this._dbPath)
	}

	/**
	 * 
	 * @returns {nm$_CoreDb.sqlite3.Database}
	 */
	get connection() {
		return this._db
	}

	/**
	 * 
	 * @returns {boolean}
	 */
	get readonly() {
		return this._readonly
	}

	/**
	 * fait aussi un test/open db
	 * @returns {boolean} true si a pu commancer la transaction
	 */
	startTransaction() {
		if (this.open() == false) {
			return false
		}
		this._db.prepare("BEGIN").run()
	}

	/**
	 * 
	 */
	commitTransaction() {
		this._db.prepare("COMMIT").run()
	}

	/**
	 * 
	 */
	rollbackTransaction() {
		try {
			this._db.prepare("ROLLBACK").run()
		} catch (e) {
		}
	}

	/**
	 * 
	 * @param {string} sql
	 * @returns {Statement}
	 */
	createQuery(sql) {
		return this._db.prepare(sql)
	}

}

function parseCommandFile(rawdata) {

	// on vire les commentaires
	let tmp = rawdata.split('\n')
	let tmpA = []
	for (let item of tmp) {
		let v = item.trim()
		if (v.startsWith("--")) {
			continue
		}

		if (v.length == 0) {
			continue
		}

		tmpA.push(v)
	}

	// split en commandes
	let list = tmpA.join("").split(';').filter((el) => {
		return el.length > 0
	})

	return list
}

module.exports = CoreDb;

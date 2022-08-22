/**
 * export call log
 */

const pa = require('path')
const fs = require('fs')
const moment = require('moment')

const Dao = require('./Dao')
const {sanitizeName, unifiedName, htmlEncode} = require('./Utils')

class Call {
	/**
	 * 
	 * @param {object} db : sqlite objet 
	 * @param {string} fileName : name of the file to export data 
	 */
	constructor(db, fileName) {
		this._db = db
		this._dataDir = pa.join(this._db.getDbDir(), "data")
		this._xmlFile = pa.join(process.cwd(), fileName)
		this._dao = new Dao(this._db)
	}

	/**
	 * export all data to specified xml
	 */
	exportAll() {
		const data = this._dao.foundAllCall()
		this._doExport(data)
	}

	/**
	 * just export call log for this number
	 * @param {type} phoneNumber
	 */
	exportForPhoneNumber(phoneNumber) {
		const data = this._dao.foundAllCallForPhoneNumber(phoneNumber)
		this._doExport(data)
	}

	/**
	 * 
	 * @param {[row]} data
	 */
	_doExport(data) {

		console.log("------------------------------")
		console.log(`Call log export with ${data.length} entries`)
		console.log(`... export as ${this._xmlFile}`)

		const date = new Date().getTime()

		const fd = fs.openSync(this._xmlFile, "w")
		fs.writeSync(fd, "<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>\n")
		fs.writeSync(fd, `<calls count="${data.length}" backup_date="${date}" type="full">\n`)

		for (const item of data) {
			fs.writeSync(fd, this._getRow(item))
		}

		fs.writeSync(fd, '</calls>')
		fs.closeSync(fd)

		console.log("Call log export done")
		console.log("------------------------------")
	}

	/**
	 * sql row to xml
	 */
	_getRow(data) {
		const date = moment(data.startTime*1000).format('LLLL')
		console.log(`---> Call : ${data.remoteUid} on ${date}`)
		
		let str = "<call "
		str += 'number="' + data.remoteUid + '" '
		str += 'duration="' + (Number(data.endTime) - Number(data.startTime)) + '" '
		str += 'date="' + data.startTime + '000" '
		str += 'type="' + this._getType(data) + '" '
		str += 'presentation="1" '
		str += 'readable_date="' + date + '" '
		str += "/>\n"
		return str
	}

	/**
	 * return the type of call : (only 1,2,3 used by sailfishos)
	 * type : 1 = Incoming, 2 = Outgoing, 3 = Missed, 4 = Voicemail, 5 = Rejected, 6 = Refused List.
	 * @param {row} data
	 * @returns {number}
	 */
	_getType(data) {
		if (data.isMissed == 1) {
			return 3;
		}

		return data.direction
	}

}

module.exports = Call

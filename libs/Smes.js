/* 
 * export sms/mms
 */

const pa = require('path')
const fs = require('fs')
const moment = require('moment')

const Dao = require('./Dao')
const {sanitizeName, unifiedName, htmlEncode} = require('./Utils')

// location of data / commhistory on jolla phone, hard coded on database field
const BASE_URI = "/home/nemo/.local/share/commhistory/data"

// there an issue with vcf, file name and reference into smil doesn't match, must be fixed before exporting
const VCF_EXP = /src="(.+\.vcf)"/g

class Smes {
	/**
	 * 
	 * @param {object} db : sqlite objet 
	 * @param {string} fileName : name of the file to export data (current dir
	 * @returns {nm$_Smes.Smes}
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
		const data = this._dao.foundAllSmes()
		this._doExport(data)
	}

	/**
	 * export data matching groupid to specified xml
	 * @param {string} phone
	 */
	exportForPhoneNumber(phone) {	
		const data = this._dao.foundAllSmesByPhoneNumber(phone)
		this._doExport(data)
	}

	/**
	 * do the actual export from selected row
	 * @param {[row]} data	array of sms/mms row to export
	 */
	_doExport(data) {
		console.log("------------------------------")
		console.log(`Smes export with ${data.length} entries`)
		console.log(`... export as ${this._xmlFile}`)

		const date = new Date().getTime()

		const fd = fs.openSync(this._xmlFile, "w")
		fs.writeSync(fd, '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>')
		fs.writeSync(fd, '<?xml-stylesheet type="text/xsl" href="sms.xsl"?>')
		fs.writeSync(fd, `<smses count="${data.length}" backup_date="${date}" type="full">\n`)

		for (const item of data) {
			// check if this is an sms
			if (item.headers != null && item.headers.startsWith("x-mms")) {
				fs.writeSync(fd, this._doMms(item))
				continue;
			}

			// simple sms
			fs.writeSync(fd, this._doSms(item))
		}

		fs.writeSync(fd, '</smses>')
		fs.closeSync(fd)

		console.log("Smes export done")
		console.log("------------------------------")
	}

	/**
	 * return an sms
	 * @param {[row]} data : row from Events table
	 * @returns {String} xml part as string
	 */
	_doSms(data) {
		const date = moment(data.startTime*1000).format('LLLL')
		console.log(`----> SMS entry ${data.id} / ${data.remoteUid} on ${date}`)

		let str = '<sms protocole="0" '
		str += 'address="' + data.remoteUid + '" '
		str += 'date="' + data.startTime + '000" '
		str += 'type="' + data.direction + '" '
		str += 'body="' + data.freeText + '" '
		str += 'read="' + data.isRead + '" '
		str += 'status="' + data.status + '" '
		str += 'readable_date="' + date + '" '
		str += ' />\n'

		return str
	}

	/**
	 * return an mms with all part encoded
	 * @param {[row]} data row from events	
	 * @returns {string}	// xml part as string
	 */
	_doMms(data) {

		const parts = this._dao.foundPartsForEventId(data.id)
		const date = moment(data.startTime*1000).format('LLLL')

		console.log(`---> MMS entry ${data.id} / ${data.remoteUid} with ${parts.length} parts on ${date}`)

		let str = '<mms '
		str += 'address="' + data.remoteUid + '" '
		str += 'date="' + data.startTime + '000" '
		str += 'ct_t="application/vnd.wap.multipart.related" '
		str += 'msg_box="' + data.direction + '" '
		str += 'rr="' + data.isRead + '" '
		str += 'read_status="' + data.isRead + '" '
		if (data.subject.length > 0) {
			str += 'sub="' + data.subject + '" '
		}
		str += 'm_id="' + data.mmsId + '" '
		str += 'm_type="132" '
		str += 'readable_date="' + date + '" '
		str += '>\n'

		// parts
		let p = '<parts>'
		for (let i = 0; i < parts.length; i++) {
			if (parts[i].contentType.startsWith("text/plain")) {
				p += this._getTxtPart(parts[i], i)
				continue;
			}

			if (parts[i].contentType.toLowerCase().startsWith("image")) {
				p += this._getBase64Part(parts[i], i)
				continue;
			}

			if (parts[i].contentType.toLowerCase().startsWith("audio")) {
				p += this._getBase64Part(parts[i], i)
				continue;
			}

			if (parts[i].contentType.toLowerCase().startsWith("video")) {
				p += this._getBase64Part(parts[i], i)
				continue;
			}

			if (parts[i].contentType.toLowerCase().startsWith("application/pdf")) {
				p += this._getBase64Part(parts[i], i)
				continue;
			}

			if (parts[i].contentType.toLowerCase().startsWith("application/smil")) {
				p += this._getSmilPart(parts[i], i)
				continue;
			}

			if (parts[i].contentType.toLowerCase().startsWith("text/x-vcard")) {
				p += this._getVcardPart(parts[i], i)
				continue;
			}
		}
		p += '</parts>\n'
		str += p

		// address ; only one with jolla
		str += '<addrs><adrr '
		str += 'address="' + data.remoteUid + '" '
		str += 'type="' + (data.direction == 1 ? 137 : 151) + '" '	// from / to
		str += 'charset="utf-8" '

		str += '/></addrs>\n</mms>\n'

		return str
	}

	/**
	 * <part> for an text/plain
	 * @param {object} part row from MessageParts table
	 * @param {integer} seg
	 * @returns {string}
	 */
	_getTxtPart(part, seq) {
		console.log("--------> Text part")

		let str = "<part "
		str += 'seq="' + seq + '" '
		str += 'ct="text/plain" '
		str += 'name="' + sanitizeName(part.contentId) + '" '
		str += 'chset="utf-8" '

		let text = ""
		try {
			text = fs.readFileSync(pa.join(this._dataDir, part.path.replace(BASE_URI, "")))
		} catch (e) {
		}

		str += 'text="' + text + '" '
		str += '/>\n'

		return str
	}

	/**
	 * <part> for a base64 element i.e. image/jpeg, image.gif...
	 * @param {object} part row from MessageParts table
	 * @param {integer} seg
	 * @returns {string}
	 */
	_getBase64Part(part, seq) {
		console.log("--------> Base64 / Image part")

		let str = "<part "
		str += 'seq="' + seq + '" '
		str += 'cid="' + htmlEncode(part.contentId) + '" '
		str += 'ct="' + part.contentType + ';base64" '
		str += 'name="' + sanitizeName(part.contentId) + '" '

		let data = ""
		try {
			data = fs.readFileSync(pa.join(this._dataDir, part.path.replace(BASE_URI, "")))
			data = Buffer.from(data).toString('base64');
		} catch (e) {
			console.log(e)
		}

		str += 'data="' + data + '" '
		str += '/>\n'

		return str
	}

	/**
	 * <part> for a smil markup
	 * @param {object} part row from MessageParts table
	 * @param {integer} seg
	 * @returns {string}
	 */
	_getSmilPart(part, seq) {
		console.log("--------> Smil part")

		let str = "<part "
		str += 'seq="' + seq + '" '
		str += 'ct="application/smil" '
		str += 'cid="' + htmlEncode(part.contentId) + '" '
		str += 'name="' + sanitizeName(part.contentId) + '" '

		let data = ""
		try {
			let tmp = '' + String(fs.readFileSync(pa.join(this._dataDir, part.path.replace(BASE_URI, ""))))

			// looking for a vcf name, and eventually replace it with an unified format
			try {
				const array = VCF_EXP.exec(tmp)
				tmp = tmp.replace(array[1], unifiedName(array[1]))
			} catch (e) {
			}

			data = htmlEncode(tmp)
		} catch (e) {
		}

		str += 'text="' + data + '" '
		str += '/>\n'

		return str
	}

	/**
	 * <part> for a vcard 
	 * @param {object} part row from MessageParts table
	 * @param {integer} seg
	 * @returns {string}
	 */
	_getVcardPart(part, seq) {
		console.log("--------> Vcard part")

		let str = "<part "
		str += 'seq="' + seq + '" '
		str += 'ct="text/x-Vcard" '
		str += 'cid="' + htmlEncode(pa.basename(part.path)) + '" '
		str += 'cl="' + unifiedName(pa.basename(part.path)) + '" '
		str += 'name="' + unifiedName(pa.basename(part.path)) + '" '

		let data = ""
		try {
			data = fs.readFileSync(pa.join(this._dataDir, part.path.replace(BASE_URI, "")))
			data = Buffer.from(data).toString('base64');

		} catch (e) {
			console.log(e)
		}

		str += 'data="' + data + '" '
		str += '/>\n'

		return str
	}
}

module.exports = Smes

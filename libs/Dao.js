/**
 * access data from the sqlite db
 */

class Dao {
	constructor(db) {
		this._db = db
	}

	/**
	 * return all groupid 
	 * @returns {[{groupid(number), phoneNumber(string)}]}
	 */
	listGroupid() {

		if (this._db.startTransaction() == false) {
			return [];
		}

		try {
			const q = `SELECT id as groupid, RemoteUids as phone FROM Groups ORDER BY RemoteUids`

			const list = this._db.createQuery(q).all()
			this._db.commitTransaction()

			return list

		} catch (e) {
			this._db.rollbackTransaction()
			console.log(e)
		}

		return []
	}

	/**
	 * get phone number from groupid
	 * @param {type} groupid
	 * @returns {[phoneNumber]}
	 */
	getPhoneforGroupid(groupid) {

		if (this._db.startTransaction() == false) {
			return [];
		}

		try {
			const std = this._db.createQuery("SELECT RemoteUids as phone FROM Groups WHERE groupid = @groupid")// 2 sms, 6 mms, 3 phone
			const res = std.run({
				groupid: groupid
			})

			this._db.commitTransaction()

			return res.phone.split("\n")

		} catch (e) {
			this._db.rollbackTransaction()
			console.log(e)
		}

		return ""
	}
	

	/**
	 * Return all entry for groupid
	 * @param {string} phone
	 * @returns {Array}
	 */
	foundAllSmesByPhoneNumber(phonenumber) {
		if (this._db.startTransaction() == false) {
			return [];
		}

		try {
			const std = this._db.createQuery("SELECT * FROM Events WHERE remoteUid = @phonenumber AND type != 3 ORDER BY startTime")// 2 sms, 6 mms, 3 phone
			const list = std.all({
				phonenumber: phonenumber
			})

			this._db.commitTransaction()

			return list

		} catch (e) {
			this._db.rollbackTransaction()
			console.log(e)
		}

		return []
	}

	/**
	 * Return all entry
	 * @returns {Array}
	 */
	foundAllSmes() {
		if (this._db.startTransaction() == false) {
			return [];
		}

		try {
			const q = `SELECT * FROM Events WHERE groupId not NULL AND type != 3 ORDER BY startTime` // 2 sms, 6 mms, 3 phone
			const list = this._db.createQuery(q).all()

			this._db.commitTransaction()

			return list

		} catch (e) {
			this._db.rollbackTransaction()
			console.log(e)
		}

		return []
	}

	/**
	 * return all parts corresponding to the eventid
	 * @param {number} eventid
	 * @returns {[]}
	 */
	foundPartsForEventId(eventid) {

		if (this._db.startTransaction() == false) {
			return [];
		}

		try {
			const std = this._db.createQuery("SELECT * FROM MessageParts WHERE eventId = @eventid ORDER BY id")
			const list = std.all({
				eventid: eventid
			})

			this._db.commitTransaction()

			return list

		} catch (e) {
			this._db.rollbackTransaction()
			console.log(e)
		}

		return []
	}

	/**
	 * return alll phone call
	 * @returns {[rows]}
	 */
	foundAllCall() {
		if (this._db.startTransaction() == false) {
			return [];
		}

		try {
			const q = `SELECT * FROM Events WHERE type = 3 ORDER BY startTime` // 2 sms, 6 mms, 3 phone
			const list = this._db.createQuery(q).all()

			this._db.commitTransaction()

			return list

		} catch (e) {
			this._db.rollbackTransaction()
			console.log(e)
		}

		return []
	}

	/**
	 * phone log for a specific number
	 * @param {string} phonenumber
	 * @returns {[rows]}
	 */
	foundAllCallForPhoneNumber(phonenumber) {

		if (this._db.startTransaction() == false) {
			return [];
		}

		try {
			const std = this._db.createQuery("SELECT * FROM Events WHERE type = 3 AND remoteUid = @phonenumber ORDER BY startTime")
			const list = std.all({
				phonenumber: phonenumber
			})

			this._db.commitTransaction()

			return list

		} catch (e) {
			this._db.rollbackTransaction()
			console.log(e)
		}

		return []
	}
}

module.exports = Dao

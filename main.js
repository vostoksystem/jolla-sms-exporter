/**
 * this progrma export sms/mms from the commhistory.db of sailfishos to and xml export format usable with 
 * sms restore backup for android : https://www.synctech.com.au/sms-backup-restore
 * 
 * you can test the xml online : https://www.synctech.com.au/sms-backup-restore/view-backup/
 * 
 * Discamimer ! 
 * I did this soft for myself to kept track of some important discution.  
 
 */

const yargs = require("yargs")
const pa = require('path')
const moment = require('moment')

const CoreDb = require('./libs/CoreDb')
const Dao = require('./libs/Dao')

// options de demmarage
const options = yargs
		.usage("Usage: --source <path to commhistory.db> --name <name> --id <number> --groups")
		.option("smes", {describe: "only export sms", type: "boolean", demandOption: false}).default("smes",false)
		.option("calls", {describe: "only export call log", type: "boolean", demandOption: false}).default("calls",false)
		.option("s", {alias: "source", describe: "path to commhistory.db", type: "string", demandOption: true})
		.option("n", {alias: "name", describe: "name to add to the xml export file", type: "string", demandOption: false})
		.option("p", {alias: "phone", describe: "only for this phone number", type: "string", demandOption: false}).default("p",null)
		.option("grp", {alias: "groups", describe: "list groupid / phone number", type: "boolean", demandOption: false})
		.argv;

// open (singleton) handler to the database
const db = new CoreDb({path: options.source, readonly: true})

/**
 * print group list
 */
if (options.groups) {

	const dao = new Dao(db)
	const grp = dao.listGroupid()

	console.log("------------------------------")
	console.log("\n\nGroup list : ")
	for (const item of grp) {
		console.log("groupid: " + item.groupid + "	phone : " + item.phone)
	}

	process.exit()
}

// check what to do, if nothins specified, do both
let dosms = options.smes
let docall = options.calls

if (dosms === false && docall === false) {
	dosms = true
	docall = true
}

if (options.phone) {
	console.log("------------------------------")
	console.log("Exporting phone number " +options.phone)
}

//--------------------------------------------------
// do sms / mms export

if (dosms) {
	try {
		const Smes = require('./libs/Smes')

		const _date = moment().format('YYMMDD-HH.mm.ss');
		const _exportname = options.name ? `${_date}-${options.name}-smses.xml` : `${_date}-smses.xml`

		const smes = new Smes(db, _exportname)

		// export all entries or just for a receiver ?
		if (options.phone) {
			smes.exportForPhoneNumber(options.phone)
		} else {
			smes.exportAll()
		}

	} catch (e) {
		console.log(e)
	}

	console.log("\n\n\n")
}

//--------------------------------------------------
// do call log
if (docall) {
	try {
		const Call = require('./libs/Call')

		const _date = moment().format('YYMMDD-HH.mm.ss');
		const _exportname = options.name ? `${_date}-${options.name}-call.xml` : `${_date}-call.xml`

		const call = new Call(db, _exportname)

		if (options.phone) {
			call.exportForPhoneNumber(options.phone)
		} else {
			call.exportAll()
		}

	} catch (e) {
		console.log(e)
	}
}

process.exit()

# Jolla sms exporter
This cli program can extract sms, mms and phone log from the com database of Jolla/SailfishOS and export them
into the xml file format used by Android app "sms backup & restore" from [SyncTech](https://www.synctech.com.au/sms-backup-restore/)

I coded it for personal purpose so I can keep some important conversation. Others alternatives are heavenly bugged and produce a faulty xml export when they manage to process any data. Also this one can export globally or from a single number number.

I coded it using the sql schema, xml info from synctech and "retro engineering" real export from the app.

It work as I expected, it successfully fully exported > 8000 sms/mms without errors in presentation but I can't guaranty It won't produce error on your side.

type / format tested : sms, mms, txt, smil, image, vcard.
I included support for audio and video but untested.

Export is written in a friendly format.
You can check it before overriding your phone at : https://www.synctech.com.au/sms-backup-restore/view-backup/

Nota : 
+ Won't work properly with conversation including more than one address.
Y+ ou should be able to import older sms into a current conversation in your Android phone, as long as the phone number is the same, but
I can't guaranties you won't end with some error, such as data imported twice

Note I moved away from Jolla, I'm not working on this sofware (since it did the job for me) anymore.

## Prerequisites
+ You need to have [node.js](https://nodejs.org) installed. Tested and compiled with node 16 on linux. (You may have to edit the package.json in the futur)
+ Download or clone the project locally. (the entire project, not just the main.js file alone !)


## Install / Build
You need an active internet connection.
to install additional package run the command (from console) :
```
npm install
```


## Configure
You need to have the original database imported locally, including "commhistory.db" and all the data which hold mms data.
Because of new restriction, you can't access those file from regular app (like file manager). On the phone you must activate dev mode in order to have access to console. Copy to sdcard or use ssh to transfert.

Data location : /home/nemo/.local/share/commhistory/


## Export
You can export all data globally or select between sms or call log, also you can select a single number to export.

* show options
```
node main.js 
```

* show know numbers
```
node main.js -s <path to commhistory.db> --groups
```

* export globally
```
node main.js -s <path to commhistory.db>
```

* export just sms for a single number, adding a name
```
node main.js -s <path to commhistory.db> -smes -phone 0673****** -name xyz
```
nota : (*) char cannot be used in phone number, this is for demo purpose,


## Authors
* **Jerome Levreau** levreau.jerome@vostoksystem.com https://twitter.com/j_levreau


## Licence
[GnuV3](https://www.gnu.org/licenses/gpl-3.0.en.html)


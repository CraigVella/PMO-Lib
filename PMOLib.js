import Axios from 'axios'
Axios.defaults.withCredentials = true;
import _ from 'lodash';

const PMO_API_BASE = "https://pmorganizer.org/api/"

class DayList {
    constructor() {
        this.days = [
            {
                dayNum: 1,
                name: "Monday",
                active: false,
                dId: 0,
                locId: 0,
                shifts: []
            },
            {
                dayNum: 2,
                name: "Tuesday",
                active: false,
                dId: 0,
                locId: 0,
                shifts: []
            },
            {
                dayNum: 3,
                name: "Wednesday",
                active: false,
                dId: 0,
                locId: 0,
                shifts: []
            },
            {
                dayNum: 4,
                name: "Thursday",
                active: false,
                dId: 0,
                locId: 0,
                shifts: []
            },
            {
                dayNum: 5,
                name: "Friday",
                active: false,
                dId: 0,
                locId: 0,
                shifts: []
            },
            {
                dayNum: 6,
                name: "Saturday",
                active: false,
                dId: 0,
                locId: 0,
                shifts: []
            },
            {
                dayNum: 7,
                name: "Sunday",
                active: false,
                dId: 0,
                locId: 0,
                shifts: []
            }
        ]
    }

    setDayOfWeek(dayNumber, active, dId, locId, shifts) {
        this.days[dayNumber - 1].active = active;
        this.days[dayNumber - 1].dId = dId;
        this.days[dayNumber - 1].locId = locId;
        if (shifts) {
            this.days[dayNumber - 1].shifts = shifts;
        }
    }

    getDayOfWeekZeroStart(zeroStartDay) {
        if (zeroStartDay > 6 || zeroStartDay < 0) {
            return null;
        } else if (0 ===  zeroStartDay) {
            return this.days[6]
        } else {
            return this.days[zeroStartDay-1]
        }
    }
}

class Publisher {
    constructor() {
        this.congAdmin = 0
        this.congId = 0
        this.disabled = 0
        this.id = 0
        this.keyPerson = "N"
        this.email = ""
        this.firstName = ""
        this.lastName = ""
        this.phone = ""
        this.pin = ""
    }
}

class Location {
    constructor() {
        this.address = ""
        this.city = ""
        this.id = 0;
        this.name = "";
        this.state = "";
        this.zip = "";
    }
}

class Shift {
    constructor() {
        this.adId = 0;
        this.hasKeyPerson = 'N';
        this.id = 0;
        this.shiftEnd = "2022-01-01T12:00:00+00:00";
        this.shiftStart = "2022-01-01T10:00:00+00:00";
        this.slots = 4;
    }
}

class Signups {
    constructor(slots, haskeyPerson, shiftId) {
        this.slots = slots;
        this.hasKeyPerson = haskeyPerson === 'Y' ? true : false;
        this.shiftId = shiftId;
        this.slotsLeft = slots;
        this.keyPersonSlotsLeft = 0;
        if (this.hasKeyPerson) {
            this.keyPersonSlotsLeft++;
            this.slotsLeft--;
        }
        this.signups = Array(slots);
    }

    populate(signupsDataArray) {
        let signupCopy = [];
        let currentLocation = 0;
        if (signupsDataArray.length !== undefined && signupsDataArray.length > 0) {
            signupCopy = _.cloneDeep(signupsDataArray);
        }
        for (let x = 0; x < this.slots; ++x) {
            this.signups[x] = new Signup();
        }

        if (this.hasKeyPerson) {
            // Look for Key Person
            this.signups[currentLocation].keyPersonSlot = true;
            for (let y = 0; y < signupCopy.length; ++y) {
                if (signupCopy[y].keyMan === 'Y') {
                    this.keyPersonSlotsLeft--;
                    this.signups[currentLocation].populated = true;
                    this.signups[currentLocation].signupObject = _.cloneDeep(signupCopy[y]);
                    signupCopy.splice(y,1);
                    break;
                }
            }
            currentLocation++;
        }

        signupCopy.forEach(element => {
            this.signups[currentLocation].populated = true;
            this.signups[currentLocation].signupObject = _.cloneDeep(element)
            this.slotsLeft--;
            currentLocation++;
        });
    }
}

class Signup {
    constructor() {
        this.signupObject = {};
        this.populated = false;
        this.keyPersonSlot = false;
    }
}

class PMO {
    /**
     * Create an instance of the PMO library
     *
     * @param {Boolean} admin - true = allows you to access admin methods if you bear the right credentials
     */
    constructor(admin) {
        if (admin) {
            this._a = "?a=ADMIN"
        } else {
            this._a = "?a=USER"
        }
    }

    getUserObject() {
        return Axios.get(PMO_API_BASE);
    }

    isLoggedIn() {
        return new Promise ( (res, rej) => {
            Axios.get(PMO_API_BASE).then( r=> {
                res(r.data.api.logged_in);
            }).catch( e=> {
                rej(e)
            })
        })
    }

    loginUser(email,pin,remember) {
        return new Promise((res,rej) => {
            let loginReq = new FormData();
            loginReq.append('email',email);
            loginReq.append('pin',pin);
            loginReq.append('remember',remember ? 1 : 0);
            Axios.post(PMO_API_BASE + '?a=login', loginReq).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    logout(preserve) {
        return new Promise((res,rej) => {
            let logoutReq = new FormData();
            logoutReq.append('preserve',preserve ? 1 : 0);
            Axios.post(PMO_API_BASE + '?a=logout', logoutReq).then( r=> {
                res(r.data.api.logged_in);
            }).catch(r=>{
                rej(r)
            })
        })
    }

    deviceLogin(deviceid) {
        return new Promise((res,rej) => {
            let loginReq = new FormData();
            loginReq.append('deviceid',deviceid);
            Axios.post(PMO_API_BASE + '?a=device', loginReq).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    // Publisher Methods

    getPublishers() {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','GETPUBLISHERS');
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            });
        })
    }

    createPublisher(firstName, lastName, email, phone, keyPerson, pin, congAdmin, disabled) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','CREATEPUBLISHER');
            req.append('firstname',firstName);
            req.append('lastname',lastName);
            req.append('email',email);
            req.append('phone',phone);
            req.append('keyperson',keyPerson);
            req.append('pin',pin);
            req.append('congadmin',congAdmin);
            req.append('disabled',disabled);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    updatePublisher(pid, firstName, lastName, email, phone, keyPerson, pin, congAdmin, disabled) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','UPDATEPUBLISHER');
            req.append('pid',pid)
            req.append('firstname',firstName);
            req.append('lastname',lastName);
            req.append('email',email);
            req.append('phone',phone);
            req.append('keyperson',keyPerson);
            req.append('pin',pin);
            req.append('congadmin',congAdmin);
            req.append('disabled',disabled);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    // Locations Methods
    getLocations() {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','GETLOCATIONS');
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            });
        })
    }

    createLocation(name, address, city, state, zip) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action', 'CREATELOCATION');
            req.append('name', name);
            req.append('address', address);
            req.append('city', city);
            req.append('state', state);
            req.append('zip',zip);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    updateLocation(lid, name, address, city, state, zip) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action', 'UPDATELOCATION');
            req.append('lid', lid);
            req.append('name', name);
            req.append('address', address);
            req.append('city', city);
            req.append('state', state);
            req.append('zip', zip);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    removeLocation(lid) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','REMOVELOCATION');
            req.append('lid', lid);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    addLocationByCode(code) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','ADDLOCATIONBYCODE');
            req.append('code', code);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    // Schedules

    getSchedule(lid) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','GETSCHEDULE');
            req.append('lid', lid);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    getLocationDays(lid) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','GETLOCATIONDAYS');
            req.append('lid', lid);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    addLocationDay(lid, dayOfWeek) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','ADDLOCATIONDAY');
            req.append('lid', lid);
            req.append('dayofweek', dayOfWeek);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    removeLocationDay(lid, dayOfWeekId) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','REMOVELOCATIONDAY');
            req.append('lid', lid);
            req.append('dayofweekid', dayOfWeekId);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    getShiftsForLocationDay(lid, dayOfWeekId) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','GETSHIFTSFORLOCATIONDAY');
            req.append('lid', lid);
            req.append('dayofweekid', dayOfWeekId);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    addScheduleShift(lid, dayOfWeekId, shiftStart, shiftEnd, slots, hasKeyPerson) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','ADDSCHEDULESHIFT');
            req.append('lid', lid);
            req.append('dayofweekid', dayOfWeekId);
            req.append('shiftstart', shiftStart);
            req.append('shiftend', shiftEnd);
            req.append('slots', slots);
            req.append('haskeyperson', hasKeyPerson);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    updateScheduleShift(lid, sid, shiftStart, shiftEnd, slots, hasKeyPerson) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','UPDATESCHEDULESHIFT');
            req.append('lid', lid);
            req.append('sid', sid);
            req.append('shiftstart', shiftStart);
            req.append('shiftend', shiftEnd);
            req.append('slots', slots);
            req.append('haskeyperson', hasKeyPerson);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    removeScheduleShift(lid, sid) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','REMOVESCHEDULESHIFT');
            req.append('lid', lid);
            req.append('sid', sid);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    getMyUpcoming(startDate) {
        return new Promise((res,rej) => {
            let req = new FormData();
            req.append('action','GETMYUPCOMING');
            req.append('startdate',startDate);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    getSignupsForShift(shiftId, date) {
        return new Promise((res, rej) => {
            let req = new FormData();
            req.append('action','GETSIGNUPSFORSHIFT');
            req.append('sid',shiftId);
            req.append('date', date);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    signUpForShift(shiftId, date, note, keyManReq) {
        return new Promise((res, rej) => {
            let req = new FormData();
            req.append('action', 'SIGNUPFORSHIFT');
            req.append('sid', shiftId);
            req.append('date', date);
            req.append('note', note);
            req.append('keyman', keyManReq);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    updateNote(apID, note) {
        return new Promise((res, rej) => {
            let req = new FormData();
            req.append('action','UPDATENOTE');
            req.append('apid',apID);
            req.append('note', note);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    removeFromShift(apID) {
        return new Promise((res, rej) => {
            let req = new FormData();
            req.append('action','REMOVEFROMSHIFT');
            req.append('apid', apID);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    updateProfile(firstName, lastName, email, phone, pin) {
        return new Promise((res, rej) => {
            let req = new FormData();
            req.append('action','UPDATEPROFILE');
            req.append('firstname', firstName);
            req.append('lastname', lastName);
            req.append('email', email);
            req.append('phone', phone);
            req.append('pin', pin);
            Axios.post(PMO_API_BASE + this._a,req).then( r=> {
                res(r.data);
            }).catch(r=>{
                rej(r);
            })
        })
    }

    // Helper funcs
    generalError(vue, message) {
        vue.$buefy.dialog.alert({
            title: 'Error',
            message: message,
            type: 'is-danger',
            hasIcon: true,
            icon: 'alert-circle'
        })
    }
}

export default {PMO, Publisher, DayList, Location, Shift, Signups};
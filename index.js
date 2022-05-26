const axios = require('axios');
const https = require('https');
const events = require('events');

const Event = new events.EventEmitter();

const instance = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
});

//function to register email
const getEmail = async ()=>{
    let res = await instance({
        method: 'GET',
        url: 'https://www.minuteinbox.com/index/index',
        headers: {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
        }
    }).catch(console.log);

    let cookie = res.headers['set-cookie'][0];
    let email = JSON.parse((res.data).replace('﻿', '')).email;

    return { cookie, email };
}

//function to delete email
const deleteEmail = async (cookie, id)=>{
    let res = await instance({
        method: 'POST',
        url: 'https://www.minuteinbox.com/delete-email/1',
        headers: {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "Cookie": cookie
        },
        data: {
            id: id
        }
    }).catch(console.log);

    return res.data;
}

//function to wait for instagram code and emit to client
const waitForInstagramCode = async (cookie, email)=>{
    let interval = setInterval(async ()=>{
        let res = await instance({
            method: 'GET',
            url: 'https://www.minuteinbox.com/index/refresh',
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "Cookie": cookie
            }
        }).catch(console.log);

        let emails = JSON.parse((res.data).replace('﻿', ''));

        if(emails[0].predmetZkraceny !== 'Welcome to MinuteInbox:)'){
            //separate code from message
            let emailCode = (emails[0].predmetZkraceny).replace(' is your Instagram ...', '');
            //delete the email so we don't retrieve it again
            await deleteEmail(cookie, emails[0].id);
            //emit email code to client
            console.log(emails[0]);
            Event.emit('code', emailCode);
            //make sure we don't keep fetching it
            clearInterval(interval);
        }
    }, 2000);
};

module.exports = {
    getEmail,
	deleteEmail,
    waitForInstagramCode,
    Event
};
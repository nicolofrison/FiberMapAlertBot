require('dotenv').config()

const axios = require('axios')
const fs = require('fs')

const fiberMap = require('./fiberMapRequest');

setInterval(() => {
    console.log('Alert check');

    const users = JSON.parse(fs.readFileSync('files/users'));

    users.forEach(async (u) => {
        const lastData = JSON.parse(await fs.readFileSync('files/addresses/' + u.address));
        const newData = await fiberMap.getInfo(u.address);

        u.service.forEach((s) => {
            s.types.forEach((t) => {
                const lastDataService = lastData.service.find((se) => se.name === s.name);
                const lastDataServiceType = lastDataService.types.find((ty) => ty.name === t);
                const newDataService = newData.service.find((se) => se.name === s.name);
                const newDataServiceType = newDataService.types.find((ty) => ty.name === t);
                //console.log(newData.service.find((se) => se.name === s.name).types);
                if (lastDataServiceType.state !== newDataServiceType.state) {
                    sendMessage('something changes', u.chatId);
                }
            });
        });

        fs.writeFileSync('files/addresses/' + u.address, JSON.stringify(newData, null, 2));
    });
}, 43200000);

const sendMessage = (message, chatId) => {
    axios
        .get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            data: {
                chat_id: chatId,
                parse_mode: "markdown",
                text: message,
            },
        })
        .then((res) => {
            console.log("Messaggio inviato con successo: " + res.status);
            // console.log(res.data);
        })
        .catch((err) => {
            console.log(err);
            console.log("Errore (" + err.response + ") nell'invio del messaggio");
        });
};
module.exports.sendMessage = sendMessage;
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

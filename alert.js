require('dotenv').config()

const fs = require('fs');
const fiberMap = require('./fiberMapRequest');
const {sendMessage} = require('./utils')

const lang = JSON.parse(fs.readFileSync('./lang/'+process.env.LANGUAGE_FILE));

const oneMinute = 1000*60;
const oneHour = oneMinute*60;
const sixHours = oneHour*6;

setInterval(() => {
    console.log('Alert check');

    const usersInFile = JSON.parse(fs.readFileSync('./files/users'));

    usersInFile.forEach(async (u) => {
        const lastData = JSON.parse(await fs.readFileSync('./files/addresses/' + u.address));
        const newData = await fiberMap.getInfo(u.address);

        u.service.forEach((s) => {
            s.types.forEach((t) => {
                const lastDataService = lastData.service.find((se) => se.name === s.name);
                const lastDataServiceType = lastDataService.types.find((ty) => ty.name === t);
                const newDataService = newData.service.find((se) => se.name === s.name);
                const newDataServiceType = newDataService.types.find((ty) => ty.name === t);
                //console.log(newData.service.find((se) => se.name === s.name).types);
                console.log(JSON.stringify(lastDataServiceType));
                console.log(JSON.stringify(newDataServiceType));
                if (JSON.stringify(lastDataServiceType) !== JSON.stringify(newDataServiceType)) {
                    sendMessage(lang.messages.somethingChangedForService + s.name +
                        lang.messages.somethingChangedForType + t + lang.messages.somethingChangedInfo, u.chatId);
                }
            });
        });

        fs.writeFileSync('files/addresses/' + u.address, JSON.stringify(newData, null, 2));
    });
}, oneMinute);

const addAlert = (chatId, service, type) => {
    const usersInFile = JSON.parse(fs.readFileSync('./files/users'));

    const user = usersInFile.find((u) => u.chatId === chatId);
    if (user !== undefined) {
        let serviceInFile = user.service.find((s) => s.name === service);
        if (serviceInFile === undefined) {
            user.service.push({name: service, types: []});
        }
        serviceInFile = user.service.find((s) => s.name === service);
        if (serviceInFile.types.find((t) => t === type) === undefined) {
            serviceInFile.types.push(type);
        } else {
            return -1;
        }

        fs.writeFileSync('files/users', JSON.stringify(usersInFile, null, 2));
        return 0;
    } else {
        return -1;
    }
}
module.exports.addAlert = addAlert;

const removeAlert = (chatId, service, type) => {
    const usersInFile = JSON.parse(fs.readFileSync('./files/users'));

    const user = usersInFile.find((u) => u.chatId === chatId);
    if (user !== undefined) {
        let index = -1;
        let serviceInFile = user.service.find((s) => s.name === service);
        if (serviceInFile !== undefined) {
            index = serviceInFile.types.indexOf(type);
            if (index !== -1) {
                serviceInFile.types.splice(index, 1);
                if (serviceInFile.types.length === 0) {
                    index = user.service.indexOf(serviceInFile);
                    user.service.splice(index, 1);
                }
                fs.writeFileSync('files/users', JSON.stringify(usersInFile, null, 2));
            }
        }
    }
    return 0;
}
module.exports.removeAlert = removeAlert;
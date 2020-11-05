const fs = require('fs');
const fiberMap = require('./fiberMapRequest');
const {sendMessage} = require('./utils')

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
                if (lastDataServiceType.state !== newDataServiceType.state) {
                    sendMessage('something changes', u.chatId);
                }
            });
        });

        fs.writeFileSync('files/addresses/' + u.address, JSON.stringify(newData, null, 2));
    });
}, 43200000);

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
const fs = require('fs');

const usersFilePath = 'files/users';

module.exports.saveAddress = async (chatId, address) => {
    if (!fs.existsSync(usersFilePath)) {
        createFile();
    }

    const users = JSON.parse(fs.readFileSync(usersFilePath));

    let found = false;
    users.forEach((u) => {
        if (!found && u.chatId === chatId) {
            u.address = address;
            u.service = [];
            found = true;
        }
    });

    if (!found) {
        const user = {
            chatId: chatId,
            address: address,
            service: [],
        };

        users.push(user);
    }

    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

module.exports.find = async (chatId) => {
    if (!fs.existsSync(usersFilePath)) {
        createFile();
    }

    const users = JSON.parse(fs.readFileSync(usersFilePath));

    let user = null;
    users.forEach((u) => {
        if (user === null && u.chatId === chatId) {
            user = u;
        }
    });

    if (user !== null) {
        return user;
    } else {
        return -1;
    }
};

const createFile = () => {
    fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
}
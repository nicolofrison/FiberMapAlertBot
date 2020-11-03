const fs = require('fs');

const usersFilePath = 'files/users';

module.exports.save = async (chatId, address) => {
    if (!fs.existsSync(usersFilePath)) {
        createFile();
    }

    const users = JSON.parse(fs.readFileSync(usersFilePath));

    let found = false;
    users.forEach((u) => {
        if (!found && u.chatId === chatId) {
            u.address = address;
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

const createFile = () => {
    fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
}
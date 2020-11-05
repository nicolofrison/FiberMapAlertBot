require('dotenv').config()

const axios = require('axios')

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

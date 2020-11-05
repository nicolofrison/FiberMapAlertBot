require('dotenv').config()

const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const fs = require('fs');

const utils = require('../utils');
const user = require('../user');
const fiberMap = require('../fiberMapRequest');
const botPlace = require('./place');

const lang = JSON.parse(fs.readFileSync('./lang/'+process.env.LANGUAGE_FILE));

const showInfo = async (ctx) => {
    let address;
    if (ctx.session.address !== undefined) {
        address = ctx.session.address;
        ctx.session.address = undefined;
    } else {
        const user1 = await user.find((await ctx.getChat()).id);
        if (user1 !== -1) {
            address = user1.address;
        }
    }

    const info = await fiberMap.getInfo(address);

    if (info) {
        ctx.session.info = info;

        await ctx.reply(lang.messages.chooseService.capitalize(), Extra.HTML().markup(
            Markup.inlineKeyboard(info.service.map((s) => [Markup.callbackButton(s.name, 'service'+s.name)]))));
    } else {
        await ctx.reply(lang.messages.infoError.capitalize());
    }
};
module.exports.showInfo = showInfo;

const botInfo = (bot) => {

    bot.command('info', async (ctx) => {
        const buttons = [
            [Markup.callbackButton(lang.messages.addressSaved.capitalize(), 'selectInfoOwnAddress')],
            [Markup.callbackButton(lang.messages.anotherAddress.capitalize(), 'selectInfoAnotherAddress')]
        ];

        await ctx.reply(lang.messages.showInfoAbout.capitalize(), Extra.HTML().markup(
            Markup.inlineKeyboard(buttons)));
    });

    bot.action(/selectInfo(.+)$/, async (ctx) => {
        const actionType = ctx.match[1];

        switch (actionType) {
            case 'OwnAddress':
                await ctx.editMessageText(lang.messages.showInfoAbout.capitalize() + ': \n\t' +
                    lang.messages.addressSaved.capitalize());
                await showInfo(ctx);
                break;
            case 'AnotherAddress':
                await ctx.editMessageText(lang.messages.showInfoAbout.capitalize() + ': \n\t' +
                    lang.messages.anotherAddress.capitalize());
                ctx.session.action = "showInfo";
                botPlace.startPlaceSetup(ctx);
                break;
            default:
                await ctx.reply(lang.messages.infoError.capitalize());
        }
    });

    bot.action(/service(.+)$/, async (ctx) => {
        const serviceName = ctx.match[1];
        console.log(serviceName);

        const service = ctx.session.info.service.find((s) => s.name === serviceName);

        if (service) {
            ctx.session.info = service;

            await ctx.editMessageText('Service: ' + serviceName);

            ctx.reply('Choose the type: ', Extra.HTML().markup(
                Markup.inlineKeyboard(service.types.map((t) => [Markup.callbackButton(t.name, 'type' + t.name)]))));
        }
    });


    bot.action(/type(.+)$/, async (ctx) => {
        const typeName = ctx.match[1];

        const type = ctx.session.info.types.find((t) => t.name === typeName);

        await ctx.editMessageText('Type: ' + typeName);

        ctx.reply('Info: \n' + JSON.stringify(type, null, 2));
    });

};
module.exports.botInfo = botInfo;
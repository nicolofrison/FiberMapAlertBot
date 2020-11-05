const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');

const user = require('../user');
const fiberMap = require('../fiberMapRequest');
const botPlace = require('./place');

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
    ctx.session.info = info;

    await ctx.reply('Choose the service: ', Extra.HTML().markup(
        Markup.inlineKeyboard(info.service.map((s) => [Markup.callbackButton(s.name, 'service'+s.name)]))));
};
module.exports.showInfo = showInfo;

const botInfo = (bot) => {

    bot.command('info', async (ctx) => {
        const buttons = [
            [Markup.callbackButton('Address saved', 'selectInfoOwnAddress')],
            [Markup.callbackButton('Another address', 'selectInfoAnotherAddress')]
        ];

        await ctx.reply('Show info about: ', Extra.HTML().markup(
            Markup.inlineKeyboard(buttons)));
    });

    bot.action(/selectInfo(.+)$/, async (ctx) => {
        const actionType = ctx.match[1];

        switch (actionType) {
            case 'OwnAddress':
                await ctx.editMessageText('Show info about: \n\tAddress saved');
                await showInfo(ctx);
                break;
            case 'AnotherAddress':
                await ctx.editMessageText('Show info about: \n\tAnother address');
                ctx.session.action = "showInfo";
                botPlace.startPlaceSetup(ctx);
                break;
            default:
                await ctx.reply('There was an error for the request /info!');
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
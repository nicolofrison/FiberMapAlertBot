const Markup = require('telegraf/markup');
const fiberMap = require('../fiberMapRequest');
const Extra = require('telegraf/extra');
const botInfo = require('./info');

const startPlaceSetup = async (ctx) => {
    const regions = await fiberMap.getRegions();
    const regionsButtons = regions.map((r) => [Markup.callbackButton(r.name, 'region'+r.id+r.name)]);

    await ctx.reply('Select your region:', Extra.HTML().markup(Markup.inlineKeyboard(regionsButtons)));
};
module.exports.startPlaceSetup = startPlaceSetup;

const botPlace = (bot) => {

    bot.action(/region(\d+)(.+)$/, async (ctx) => {
        await ctx.editMessageText('Region selected: ' + ctx.match[2]);
        const region = ctx.match[1];
        const provinces = await fiberMap.getProvinces(region);
        await ctx.reply('Select your province:', Extra.HTML().markup(
            Markup.inlineKeyboard(
                provinces.map((p) => [Markup.callbackButton(p.name, 'province'+p.id+p.name)])
            )));
    });

    bot.action(/province(.{2})(.+)$/, async (ctx) => {
        await ctx.editMessageText('Province selected: ' + ctx.match[2]);
        const province = ctx.match[1];
        const cities = await fiberMap.getCities(province);
        await ctx.reply('Select your city:', Extra.HTML().markup(
            Markup.inlineKeyboard(
                cities.map((c) => [Markup.callbackButton(c.name, 'city'+c.id+c.name)])
            )));
    });

    bot.action(/city(\d+)(.+)$/, async (ctx) => {
        await ctx.editMessageText('City selected: ' + ctx.match[2]);
        const city = ctx.match[1];
        const streets = await fiberMap.getStreets(city);
        await ctx.reply('Select your street:', Extra.HTML().markup(
            Markup.inlineKeyboard(
                streets.map((s) => [Markup.callbackButton(s.name, 'street'+s.id)])
            )));
    });

    bot.action(/street(.+)$/, async (ctx) => {
        //const streetName = await fiberMap.
        const streetName = ctx.update.callback_query.message.reply_markup.inline_keyboard.map((s) =>
            s[0]).find((s) => s.callback_data === ctx.match[0]).text;
        await ctx.editMessageText('Street selected: ' + streetName);
        const street = ctx.match[1];
        const streetNumbers = await fiberMap.getStreetNumbers(street);
        await ctx.reply('Select your street number:', Extra.HTML().markup(
            Markup.inlineKeyboard(
                streetNumbers.map((sn) => [Markup.callbackButton(sn.name, 'houseId'+sn.id)])
            )));
    });

    bot.action(/houseId(.+)$/, async (ctx) => {
        //const streetName = await fiberMap.
        const streetNumber = ctx.update.callback_query.message.reply_markup.inline_keyboard.map((s) =>
            s[0]).find((s) => s.callback_data === ctx.match[0]).text;
        await ctx.editMessageText('Street number selected: ' + streetNumber);

        ctx.session.address = ctx.match[1];

        switch (ctx.session.action) {
            case 'setAddress':
                await ctx.replyWithChatAction('saveAddress');
                break;
            case 'showInfo':
                await botInfo.showInfo(ctx);
                break;
            default:
                await ctx.reply('There was an error during the setup of the address!');

        }

        ctx.session.action = undefined;
    });
};
module.exports.botPlace = botPlace;
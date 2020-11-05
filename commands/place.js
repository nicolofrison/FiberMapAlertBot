require('dotenv').config()

const Markup = require('telegraf/markup');
const fiberMap = require('../fiberMapRequest');
const Extra = require('telegraf/extra');
const fs = require('fs');

const utils = require('../utils');
const botInfo = require('./info');
const user = require('../user');

const lang = JSON.parse(fs.readFileSync('./lang/'+process.env.LANGUAGE_FILE));

const startPlaceSetup = async (ctx) => {
    const regions = await fiberMap.getRegions();
    const regionsButtons = regions.map((r) => [Markup.callbackButton(r.name, 'region'+r.id+r.name)]);

    await ctx.reply(lang.messages.selectRegion.capitalize(), Extra.HTML().markup(Markup.inlineKeyboard(regionsButtons)));
};
module.exports.startPlaceSetup = startPlaceSetup;

const botPlace = (bot) => {

    bot.action(/region(\d+)(.+)$/, async (ctx) => {
        await ctx.editMessageText(lang.messages.regionSelected.capitalize() + ': ' + ctx.match[2]);
        const region = ctx.match[1];
        const provinces = await fiberMap.getProvinces(region);
        await ctx.reply(lang.messages.selectProvince.capitalize(), Extra.HTML().markup(
            Markup.inlineKeyboard(
                provinces.map((p) => [Markup.callbackButton(p.name, 'province'+p.id+p.name)])
            )));
    });

    bot.action(/province(.{2})(.+)$/, async (ctx) => {
        await ctx.editMessageText(lang.messages.provinceSelected.capitalize() + ': ' + ctx.match[2]);
        const province = ctx.match[1];
        const cities = await fiberMap.getCities(province);
        await ctx.reply(lang.messages.selectCity.capitalize(), Extra.HTML().markup(
            Markup.inlineKeyboard(
                cities.map((c) => [Markup.callbackButton(c.name, 'city'+c.id+c.name)])
            )));
    });

    bot.action(/city(\d+)(.+)$/, async (ctx) => {
        await ctx.editMessageText(lang.messages.citySelected.capitalize() + ': ' + ctx.match[2]);
        const city = ctx.match[1];
        const streets = await fiberMap.getStreets(city);
        await ctx.reply(lang.messages.selectStreet.capitalize(), Extra.HTML().markup(
            Markup.inlineKeyboard(
                streets.map((s) => [Markup.callbackButton(s.name, 'street'+s.id)])
            )));
    });

    bot.action(/street(.+)$/, async (ctx) => {
        //const streetName = await fiberMap.
        const streetName = ctx.update.callback_query.message.reply_markup.inline_keyboard.map((s) =>
            s[0]).find((s) => s.callback_data === ctx.match[0]).text;
        await ctx.editMessageText(lang.messages.streetSelected.capitalize() + ': ' + streetName);
        const street = ctx.match[1];
        const streetNumbers = await fiberMap.getStreetNumbers(street);
        await ctx.reply(lang.messages.selectStreetNumber.capitalize(), Extra.HTML().markup(
            Markup.inlineKeyboard(
                streetNumbers.map((sn) => [Markup.callbackButton(sn.name, 'houseId'+sn.id)])
            )));
    });

    bot.action(/houseId(.+)$/, async (ctx) => {
        //const streetName = await fiberMap.
        const streetNumber = ctx.update.callback_query.message.reply_markup.inline_keyboard.map((s) =>
            s[0]).find((s) => s.callback_data === ctx.match[0]).text;
        await ctx.editMessageText(lang.messages.streetNumberSelected.capitalize() + ': ' + streetNumber);

        ctx.session.address = ctx.match[1];

        switch (ctx.session.placeAction) {
            case 'setAddress':
                await saveAddress(ctx);
                break;
            case 'showInfo':
                await botInfo.showInfo(ctx);
                break;
            default:
                await ctx.reply(lang.messages.setAddressError.capitalize());

        }

        ctx.session.placeAction = undefined;
    });

    const saveAddress = async (ctx) => {
        const chatId = (await ctx.getChat()).id;
        const address = ctx.session.address;

        if (address) {
            await user.saveAddress(chatId, address);
            fs.writeFileSync('./files/addresses/' + address, JSON.stringify((await fiberMap.getInfo(address)), null, 2));
            await ctx.reply(lang.messages.addressSaved);
        } else {
            await ctx.reply(lang.messages.addressNotSaved);
        }

        ctx.session.address = undefined;
    };
};
module.exports.botPlace = botPlace;
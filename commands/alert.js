require('dotenv').config()

const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const fs = require('fs');

const utils = require('../utils');
const user = require('../user');
const fiberMap = require('../fiberMapRequest');
const alert = require('../alert');

const lang = JSON.parse(fs.readFileSync('./lang/'+process.env.LANGUAGE_FILE));

const botAlert = (bot) => {
    bot.command(lang.commands.addAlert, async (ctx) => {
        const user1 = await user.find((await ctx.getChat()).id);

        if (user1 === undefined) {
            await ctx.reply(lang.messages.addressNotSaved);
        } else {
            const info = await fiberMap.getInfo(user1.address);

            if (info === null) {
                ctx.reply(lang.messages.addressNotSaved.capitalize());
            } else {
                // Check if are present alerts able to be added or are all already activated
                const services = [];
                info.service.forEach((s) => {
                    const service = {name: s.name, types: []};
                    s.types.forEach((t) => {
                        const savedService = user1.service.find((s1) => s1.name === s.name);

                        let alreadyPresent = false;
                        if (savedService !== undefined) {
                            const savedType = savedService.types.find((t1) => t1 === t.name);
                            if (savedType !== undefined) {
                                alreadyPresent = true;
                            }
                        }

                        if (!alreadyPresent) {
                            service.types.push(t.name)
                        }
                    });

                    if (service.types.length > 0) {
                        services.push(service);
                    }
                });

                if (services.length === 0) {
                    await ctx.reply(lang.messages.noAlertToAddFound.capitalize());
                } else {
                    ctx.session.alertAction = "add";
                    ctx.session.services = services;

                    const servicesButtons = services.map((s) => [Markup.callbackButton(s.name, 'alertService'+s.name)]);

                    await ctx.reply(lang.messages.selectService.capitalize(), Extra.HTML().markup(
                        Markup.inlineKeyboard(servicesButtons)));
                }
            }
        }
    });

    bot.command(lang.commands.removeAlert, async (ctx) => {
        const user1 = await user.find((await ctx.getChat()).id);

        if (user1 === undefined) {
            await ctx.reply(lang.messages.addressNotSaved);
        } else {
            ctx.session.alertAction = "remove";
            ctx.session.services = user1.service;

            if (user1.service.length === 0) {
                await ctx.reply(lang.messages.noAlertToRemoveFound.capitalize());
            } else {
                const servicesButtons = user1.service.map((s) => [Markup.callbackButton(s.name, 'alertService'+s.name)]);

                await ctx.reply(lang.messages.selectService.capitalize(), Extra.HTML().markup(
                    Markup.inlineKeyboard(servicesButtons)));
            }
        }
    });

    bot.action(/alertService(.+)$/, async (ctx) => {
        const serviceSelected = ctx.match[1];
        ctx.session.serviceSelected = serviceSelected;
        const services = ctx.session.services;

        await ctx.editMessageText(lang.messages.serviceSelected.capitalize() + ': ' + serviceSelected);

        if (services === undefined) {
            await ctx.reply(lang.messages.addAlertError.capitalize());
        } else {
            const typesButtons = services.find((s) => s.name === serviceSelected)
                .types.map((t) => [Markup.callbackButton(t, 'alertType'+t)]);

            await ctx.reply(lang.messages.selectType, Extra.HTML().markup(
                Markup.inlineKeyboard(typesButtons)));
        }
    });

    bot.action(/alertType(.+)$/, async (ctx) => {
        const serviceSelected = ctx.session.serviceSelected;
        const typeSelected = ctx.match[1];

        ctx.session.services = undefined;
        ctx.session.serviceSelected = undefined;

        await ctx.editMessageText(lang.messages.typeSelected.capitalize() + ': ' + typeSelected);

        if (serviceSelected === undefined) {
            await ctx.reply(lang.messages.addAlertError.capitalize());
        } else {
            let ok = 0;
            switch (ctx.session.alertAction) {
                case "add":
                    if (await alert.addAlert((await ctx.getChat()).id, serviceSelected, typeSelected) === 0) {
                        await ctx.reply(lang.messages.alertAdded.capitalize());
                        return;
                    }
                case "remove":
                    if (await alert.removeAlert((await ctx.getChat()).id, serviceSelected, typeSelected) === 0) {
                        await ctx.reply(lang.messages.alertRemoved.capitalize());
                        return;
                    }
                default:
            }
            await ctx.reply(lang.messages.addAlertError.capitalize());
        }
    });
};
module.exports.botAlert = botAlert;
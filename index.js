require('dotenv').config()

const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const fs = require('fs');
const session = require('telegraf/session');

const fiberMap = require('./fiberMapRequest');
const user = require('./user');
const utils = require('./utils');

const bot = new Telegraf(process.env.BOT_TOKEN)


bot.use(session());

bot.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const response_time = new Date() - start
  console.log(`(Response Time: ${response_time})`)
});

bot.command('help', async (ctx) => {
  let helpMessage = 'Telegram bot that alert if something in fibermap site changes based on the preferences\n\n' +
    'Commands:\n\n';
  (await  ctx.getMyCommands()).forEach((c) => {
    helpMessage += '/' + c.command + ' - ' + c.description + '\n';
  });
  console.log(await ctx.getMyCommands());
  ctx.reply(helpMessage);
});

bot.command('place', async (message) => {
  const regions = await fiberMap.getRegions();
  const regionsButtons = regions.map((r) => Markup.callbackButton(r.name, 'region'+r.id));
  message.reply('Select your region:', Extra.HTML()
      .markup(Markup.inlineKeyboard(regions.map((r) => [Markup.callbackButton(r.name, 'region'+r.id+r.name)]))));
});

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
  //await ctx.editMessageText('Street number selected: ' + streetNumber);

  ctx.session.address = ctx.match[1];

  ctx.reply('What do you want to do with the address inserted?', Extra.HTML().markup(
      Markup.inlineKeyboard([
        Markup.callbackButton('Save address', 'saveAddress'),
        Markup.callbackButton('Show info', 'showInfo')
      ])));
});

bot.action('saveAddress', async (ctx) => {
  const chatId = (await ctx.getChat()).id;
  const address = ctx.session.address;

  if (address) {
    user.save(chatId, address);
    fs.writeFileSync('files/addresses/' + address, JSON.stringify((await fiberMap.getInfo(address)), null, 2));
    ctx.reply('Address saved');
  } else {
    ctx.reply('No address selected!\nUse /place to set the address');
  }
});


bot.action('showInfo', async (ctx) => {
  //const info = fiberMap.getInfo(ctx.session.address);

  //await ctx.reply(message, {parse_mode: 'Markdown'});
  //await ctx.reply(message, { parse_mode: "MarkdownV2" });
});

bot.launch()

// bot.command('stop', (ctx) => bot.stop());
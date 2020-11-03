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
})

bot.settings(async (ctx) => {
  await ctx.setMyCommands([
    {
      command: '/place',
      description: 'Select your address'
    },
    {
      command: '/saveAddress',
      description: 'After the selection of the address with /place it saves your address'
    },
    {
      command: '/baz',
      description: 'baz description'
    }
  ])
  return ctx.reply('Ok')
})

bot.command('help', (message) => {
  /*fiberMap.getRegions();
  fiberMap.getProvinces(5);
  fiberMap.getCities('VE');
  fiberMap.getStreets('027035');*/
  message.reply("prova",
      Markup.keyboard([Markup.callbackButton(`ciao`, 'id1')]).oneTime().resize().extra()
    );
});

bot.command('place', async (message) => {
  const regions = await fiberMap.getRegions();
  const regionsButtons = regions.map((r) => Markup.callbackButton(r.name, 'region'+r.id));
  message.reply('Select your region:', Extra.HTML()
      .markup(Markup.inlineKeyboard(regions.map((r) => [Markup.callbackButton(r.name, 'region'+r.id+r.name)]))));
    //Markup.keyboard(regionsButtons).oneTime().resize().extra());
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
  await ctx.editMessageText('Street number selected: ' + streetNumber);
  const houseId = ctx.match[1];
  const info = await  fiberMap.getInfo(houseId);

  ctx.session.address = houseId;

  await ctx.reply('Info: \n'/* + JSON.stringify(info.service, null, 1)*/, Extra.HTML().markup(JSON.stringify(info.service)));
});

bot.command('saveAddress', async (ctx) => {
  const chatId = ctx.message.chat.id;
  const address = ctx.session.address;

  if (address) {
    user.save(chatId, address);
    fs.writeFileSync('files/addresses/' + address, JSON.stringify((await fiberMap.getInfo(address)), null, 2));
    ctx.reply('Address saved');
  } else {
    ctx.reply('No address selected!\nUse /place to set the address');
  }
});

bot.launch()

// bot.command('stop', (ctx) => bot.stop());
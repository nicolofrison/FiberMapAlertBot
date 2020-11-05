require('dotenv').config()

const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const fs = require('fs');
const session = require('telegraf/session');

const fiberMap = require('./fiberMapRequest');
const user = require('./user');
const utils = require('./utils');

// commands
const cmdPlace = require('./commands/place');
const cmdInfo = require('./commands/info');

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session());
bot.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const response_time = new Date() - start
  console.log(`(Response Time: ${response_time})`)
});

cmdPlace.botPlace(bot);
cmdInfo.botInfo(bot);

bot.command('help', async (ctx) => {
  let helpMessage = 'Telegram bot that alert if something in fibermap site changes based on the preferences\n\n' +
    'Commands:\n\n';
  (await  ctx.getMyCommands()).forEach((c) => {
    helpMessage += '/' + c.command + ' - ' + c.description + '\n';
  });
  console.log(await ctx.getMyCommands());
  ctx.reply(helpMessage);
});

bot.command('setAddress', async (ctx) => {
  await cmdPlace.startPlaceSetup(ctx);
});

bot.action('saveAddress', async (ctx) => {
  ctx.session.action = "saveAddress";
  const chatId = (await ctx.getChat()).id;
  const address = ctx.session.address;

  if (address) {
    await user.save(chatId, address);
    fs.writeFileSync('files/addresses/' + address, JSON.stringify((await fiberMap.getInfo(address)), null, 2));
    await ctx.reply('Address saved');
  } else {
    await ctx.reply('No address selected!\nUse /setAddress to set the address');
  }

  ctx.session.address = undefined;
});

bot.launch()

// bot.command('stop', (ctx) => bot.stop());
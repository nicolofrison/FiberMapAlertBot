require('dotenv').config()

const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const fs = require('fs');
const session = require('telegraf/session');

const utils = require('./utils');
const fiberMap = require('./fiberMapRequest');
const user = require('./user');

// commands
const cmdPlace = require('./commands/place');
const cmdInfo = require('./commands/info');

const bot = new Telegraf(process.env.BOT_TOKEN)
const lang = JSON.parse(fs.readFileSync('./lang/'+process.env.LANGUAGE_FILE));

bot.use(session());
bot.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const response_time = new Date() - start
  console.log(`(Response Time: ${response_time})`)
});

cmdPlace.botPlace(bot);
cmdInfo.botInfo(bot);

bot.command(lang.commands.help, async (ctx) => {
  let helpMessage = lang.messages.helpMessage.capitalize() + '\n\n' +
    lang.messages.commands.capitalize() + ':\n\n';
  (await  ctx.getMyCommands()).forEach((c) => {
    helpMessage += '/' + c.command + ' - ' + c.description + '\n';
  });
  console.log(await ctx.getMyCommands());
  ctx.reply(helpMessage);
});

bot.command(lang.commands.setAddress, async (ctx) => {
  await cmdPlace.startPlaceSetup(ctx);
});

bot.action('saveAddress', async (ctx) => {
  ctx.session.action = "saveAddress";
  const chatId = (await ctx.getChat()).id;
  const address = ctx.session.address;

  if (address) {
    await user.save(chatId, address);
    fs.writeFileSync('files/addresses/' + address, JSON.stringify((await fiberMap.getInfo(address)), null, 2));
    await ctx.reply(lang.messages.addressSaved);
  } else {
    await ctx.reply(lang.messages.addressNotSaved);
  }

  ctx.session.address = undefined;
});

bot.launch()

// bot.command('stop', (ctx) => bot.stop());
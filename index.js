require('dotenv').config()

const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const fs = require('fs');
const session = require('telegraf/session');

const utils = require('./utils');
const fiberMap = require('./fiberMapRequest');
const user = require('./user');
const alert = require('./alert');

// commands
const cmdPlace = require('./commands/place');
const cmdInfo = require('./commands/info');
const cmdAlert = require('./commands/alert');

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
cmdAlert.botAlert(bot);

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
  ctx.session.placeAction = 'setAddress';
  await cmdPlace.startPlaceSetup(ctx);
});

bot.launch()

// bot.command('stop', (ctx) => bot.stop());
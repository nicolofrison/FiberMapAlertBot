require('dotenv').config()

const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const fiberMap = require('./fiberMapRequest');

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const response_time = new Date() - start
  console.log(`(Response Time: ${response_time})`)
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
  const regionsButtons = regions.map((r) => [Markup.callbackButton(r.name, 'region'+r.id)]);
  message.reply('Set your region', Markup.inlineKeyboard([
    regionsButtons
  ]).oneTime().resize().extra());
    //Markup.keyboard(regionsButtons).oneTime().resize()/*.extra()*/0);
});

bot.action(/^region(.+)$/, async (message) => {
  console.log(message);
  console.log(message.match[0]);
  /*
  const provinces = await fiberMap.getProvinces();
  message.reply('Set your region', 
    Markup.keyboard(
      regions.map((r) => Markup.callbackButton(r.name, 'region'+r.id)
    )).oneTime().resize().extra());*/
});

bot.on('callback_query', (callbackQuery) => {
  console.log(callbackQuery);
});

bot.hears('hello', (ctx) => {
  ctx.reply('<b>Hello</b>. <i>How are you today?</i>',
    Extra.HTML()
    .markup(Markup.inlineKeyboard([
      Markup.callbackButton('Not bad', 'not bad'),
      Markup.callbackButton('All right', 'all right')
    ])))
})
bot.action('not bad', (ctx) => {
  ctx.editMessageText('<i>Have a nice day 😊</i>',
    Extra.HTML())
})
bot.action('all right', (ctx) => {
  ctx.editMessageText('<i>May happiness be with you 🙏</i>',
    Extra.HTML())
})
bot.launch()
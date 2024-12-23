import { Client, GatewayIntentBits, TextChannel } from 'discord.js'

class LoggerService {
  private client: Client
  private channelId: string | undefined

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    })

    this.channelId = process.env.CHANNELID_DISCORD_LOGINFOR

    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user?.tag}`)
    })

    this.client.login(process.env.TOKEN_DISCORD_LOGINFOR)
  }

  sendLog(logData: {
    message?: string
    title?: string
    headerRequest?: any
    bodyRequest?: any
    headerResponse?: any
    bodyResponse?: any
    params?: any
  }): void {
    const { message, bodyRequest, bodyResponse, params } = logData

    const formattedMessage = {
      content: message,
      embeds: [
        {
          color: parseInt('00ff00', 16),
          title: 'Request',
          description:
            'Body```json\n' +
            JSON.stringify(bodyRequest, null, 2) +
            '\n```Params```json\n' +
            JSON.stringify(params, null, 2) +
            '\n```'
        },
        {
          color: parseInt('00ff00', 16),
          title: 'Response',
          description: '```json\n' + JSON.stringify(bodyResponse, null, 2) + '\n```'
        }
      ]
    }

    this.sendToMessage(formattedMessage)
  }

  private sendToMessage(message: any) {
    const channel = this.client.channels.cache.get(this.channelId!) as TextChannel
    if (!channel) {
      console.error(`Couldn't find the channel...`, this.channelId)
      return
    }
    channel.send(message).catch((e) => console.error(e))
  }
}
export const loggerService = new LoggerService()

module.exports = {
    name: 'ping',
    description: 'Ping command',
    async execute(message){

        message.channel.send("Pong! The bot is online.");


    }
}
const { GuildMember } = require("discord.js");

module.exports = {
    name: 'roll',
    description: 'Roll command',
    execute(message){

        // Rolls random number between 1 & 100
        let randomNumber = Math.floor(Math.random() * 101) + 1;

        // Print + send number & message author
        message.channel.send(`**${message.author.username}** rolled **${randomNumber}**`);

        console.log(`${message.author.username} rolled ${randomNumber}`);

    }
}
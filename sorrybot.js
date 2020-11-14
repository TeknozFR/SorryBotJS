const Discord = require ("discord.js");
const fs = require ("fs");
const path = require ("path");

const prefix = ">";

const client = new Discord.Client();

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, "commands", file));

    client.commands.set(command.name, command);
}


// On ready function
client.once('ready', () => {
    console.log("Connected as " + client.user.tag);
    client.user.setActivity(">help", {type: "PLAYING"});
});

// Triggers every time a message is sent.
client.on('message', message => {
    if(!message.content.toLowerCase().startsWith(prefix) || message.author.bot) return;

    // Defines individual arguments
    const args = message.content.slice(prefix.length).split(/ +/); // Arguments are case-sensitive
    const command = args.shift().toLowerCase(); // Commands themselves are not case-sensitive.
    console.log(command)
    console.log(args)
    // Command handling, calls files in ./commands/
    switch (command)
    {
        case "help":
            client.commands.get('help').execute(message, args);
            break;
    }
        
})


client.login("discord token");
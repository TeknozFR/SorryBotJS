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
// On member join function
client.on('guildMemberAdd', member => {

    
    const roleUnregistered = member.guild.roles.cache.get("777658740584873995");
    const channelRegister = member.guild.channels.cache.get("777658741339455530")

    // Add unregistered role to new member
    member.roles.add(roleUnregistered);
    // Send message in #register channel
    channelRegister.send(`<@${member.id}>, welcome to the :maple_leaf: **Beat Saber Canadian Discord** :maple_leaf:\n\nYou are currently quarantined and can't access the server's regular channels.\nPlease **read our rules** in <#777658741339455533> and **follow the instructions** in <#777658741088059431> to gain access to the rest of the server.`)

    console.log(member.displayName + " joined the server.");



})    

// Triggers every time a message is sent.
client.on('message', message => {
    // Checks if message author is bot
    if (message.author.bot) return;
    // Checks if channel message was sent in is #birthdays
    if (message.channel.id === "777658741583511554"){
        // Checks if message is length 5 (MM/DD)
        if (message.content.length === 5){

            // Deserializes, parses, and applies settings.json
            var birthdayObject = JSON.parse(fs.readFileSync("./birthdays.json"));

            var i = -1;
            // Checks all users in birthdayObject
            for (user of birthdayObject.users) {
                i++;
                // If discordID in birthdayObject == message author ID, delete from birthdayObject.users
                if (user.discordID == message.author.id) {
                    
                    birthdayObject.users.splice(i,1);
                    break;
                }
              }
              
            // Create object with message author ID & birthday (message.content)
            var personObject = {
                "discordID": message.author.id,
                "birthday": message.content
              }
            // Add personObject to end of birthdayObject
            birthdayObject.users.push(personObject);
            // Overwrites birthdays.json and adds birthdayObject (birthday dict)
            const saveThis = JSON.stringify(birthdayObject);
            fs.writeFile('./birthdays.json', saveThis, (err) => {
                if (err) {
                    throw err;
                }
                console.log(message.author.username + " saved their birthday : " + message.content);
                message.channel.send("Your birthday has been saved.")
            })      

        }
        // If message was wrong length (MM/DD)
        else{
            
            message.channel.send("Error : you must use the format **MM/DD**. Please try again.")

        }
    }



    // Triggers when message "pog" and sends ChampCanada emote
    if (message.content.toLowerCase() === "pog" && message.author.id != "776971936370393109"){

        message.channel.send("<:ChampCanada:524459296365477889>");
    }

    // Triggers is message sent in #register not from staff. Deletes message, sends warning & print.
    if (message.channel.id === "777658741339455530"){

        
        // Gets guild from message
        const { guild } = message;
        // Creates member object from message author ID
        const member = guild.members.cache.get(message.author.id);
        // Checks if message author is SorryBot or BeatStalker, pass if it is
        if (message.author.id === "776971936370393109" || message.author.id === "521458813874864141"){
            //pass
        }
        // Checks if message content is command
        else if (message.content.substring(0,9) != ">register" && message.content.substring(0,6) != ">claim"){

            
            // Checks if message author has staff role, if not, execute
            if (!member.roles.cache.get("777658740748714005")){

                message.delete();

                message.channel.send("You are only allowed to use commands in this channel (>register & >claim). If you wish to contact a staff member, please DM them.");

                console.log(message.author.username + " sent '" + message.content + "' in #register and it was deleted.");
            }

        }

    }

    if(!message.content.toLowerCase().startsWith(prefix) || message.author.bot) return;

    
    // Defines individual arguments
    const args = message.content.slice(prefix.length).split(/ +/); // Arguments are case-sensitive
    const command = args.shift().toLowerCase(); // Commands themselves are not case-sensitive.
    
    // Command handling, calls files in ./commands/
    switch (command)
    {
        case "help":
            client.commands.get('help').execute(message);
            break;

        case "roll":
            client.commands.get("roll").execute(message);
            break;

        case "guess":
            client.commands.get("guess").execute(message, args);
            break;

        case "sabub":
            client.commands.get("sabub").execute(message);
            break;
    }
        
})


client.login("discord token");
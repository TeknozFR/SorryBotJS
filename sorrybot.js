const { settings } = require("cluster");
const Discord = require ("discord.js");
const fs = require ("fs");
const { request } = require("http");
const path = require ("path");
const moment = require('moment');

const prefix = ">";

const client = new Discord.Client();

// Deserializes, parses, and applies settings.json
const settingsObject = JSON.parse(fs.readFileSync("./json_files/settings.json"));
// Declaring all my constants for roles, channels & etc IDs from settings.json
const discordToken = settingsObject.other[0].token;
const guildID = settingsObject.other[0].guildID;

const channelGeneralID = settingsObject.channels[0].generalID;
const channelRegisterID = settingsObject.channels[0].registerID;
const channelBirthdaysID = settingsObject.channels[0].birthdaysID;
const channelNewMembersID = settingsObject.channels[0].newMembersID;
const channelRulesInfosID = settingsObject.channels[0].rulesInfosID;
const channelJoinRequestsID = settingsObject.channels[0].joinRequestsID;
const channelCMStaffID = settingsObject.channels[0].cmStaffID;

const roleUnregisteredID = settingsObject.roles[0].unregisteredID;
const roleBirthdayID = settingsObject.roles[0].birthdayID;
const roleCanadianID = settingsObject.roles[0].canadianID;
const roleNonCanadianID = settingsObject.roles[0].nonCanadianID;

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

    // Creating all my channel and role objects for on_ready task loops (interval functions)
    const guild = client.guilds.cache.get(guildID);

    const channelGeneral = guild.channels.cache.get(channelGeneralID);
    const channelJoinRequests = guild.channels.cache.get(channelJoinRequestsID);
    const channelNewMembers = guild.channels.cache.get(channelNewMembersID);
    const channelCMSTaff = guild.channels.cache.get(channelCMStaffID);

    const roleBirthday = guild.roles.cache.get(roleBirthdayID);
    const roleCanadian = guild.roles.cache.get(roleCanadianID);
    const roleUnregistered = guild.roles.cache.get(roleUnregisteredID);
    const roleNonCanadian = guild.roles.cache.get(roleNonCanadianID);

    // task loop every hour that checks birthday
    var intervalBirthday = setInterval (function () {

        // current date + time object
        let currentDatetime = new Date();

        let currentHour = currentDatetime.getHours();

        let currentDate = currentDatetime.getDate();

        let currentMonth = currentDatetime.getMonth() + 1; // +1 because january is 0

        let currentMMDD = currentMonth + "/" + currentDate;

        console.log("Birthday task executed")

        // checks if the current hour is 3-4 am, if yes, check if its someone's bday
        if (currentHour === 3){

            console.log("Birthday task executed between 3am-4am");

            // Deserializes, parses, and applies birthdays.json
            var birthdayObject = JSON.parse(fs.readFileSync("./json_files/birthdays.json"));

            // Checks all users in birthdayObject
            for (user of birthdayObject.users) {
            
                // If discordID in birthdayObject == message author ID, delete from birthdayObject.users
                if (user.birthday === currentMMDD) {
                    
                    let member = guild.members.cache.get(discordID);

                    channelGeneral.send(`Happy birthday to <@${discordID}>!!!:partying_face: We all hope you have a beautiful day! :smile:`);

                    console.log(`It's ${member.nickname}'s birthday!`);

                    if (!member.roles.cache.get("777658740731019285")){

                        member.roles.add(roleBirthday);
                    }
                }
            }
        }
        // checks if the current hour is 2-3am, if yes, remove birthday role from anyone who has it
        else if (currentHour === 2){

            console.log("Birthday task executed between 2am-3am");

            let membersBirthdayRole = roleBirthday.members.map(user => user.id);
            
            for (memberID of membersBirthdayRole){

                let memberObject = guild.members.cache.get(memberID);

                memberObject.roles.remove(roleBirthday);

                console.log("The birthday role was removed from " + memberObject.displayName);
            }
        }

      }, 3600000); 

      var intervalJoinRequest = setInterval (async function () {
        // nbr of ms per day
        const msPerDay = 1000 * 60 * 60 * 24;
        // current date + time object
        let currentDatetime = new Date();
        // counter for index for loop
        var i = -1;

        let currentDateTime = new Date()

        // Deserializes, parses, and applies settings.json
        var joinRequestsObject = JSON.parse(fs.readFileSync("./json_files/join_requests.json"));

        console.log("Join Request task executed");

        for (joinRequest of joinRequestsObject.waiting_approval){

            i++;

            let memberObject = guild.members.cache.get(joinRequest.memberID);

            let messageRequest = await channelJoinRequests.messages.fetch(joinRequest.messageID);
            
            let requestReactions = messageRequest.reactions.resolve("✅").count;

            let requestDateTime = new Date(JSON.parse(joinRequest.date));

            let requestDateUTC = Date.UTC(requestDateTime.getFullYear(), requestDateTime.getMonth()+1, requestDateTime.getDate());
            let currentDateUTC = Date.UTC(currentDateTime.getFullYear(), currentDateTime.getMonth()+1, currentDateTime.getDate());

            let differenceInDays = Math.floor((currentDateUTC - requestDateUTC) / msPerDay);

            if (joinRequest.claimedNationality === "Canadian" && requestReactions >= 2){

                memberObject.roles.add(roleCanadian);
                memberObject.roles.remove(roleUnregistered);

                channelGeneral.send(`Welcome <@${memberObject.id}>!\n\nWe recommend that you visit the 'Ayana self-assignable role' section of <#${channelRulesInfosID}>. You will be able to assign yourself which headset you use, what province you're from, etc.\n\nEnjoy the server :smile:`);
                channelCMSTaff.send(`**${memberObject.displayName}** received **more than 1 vote**. They left quarantine and were assigned the Canadian role. The join request was deleted.`);
                channelNewMembers.send(`**${memberObject.displayName}** just joined the server!`);

                messageRequest.delete();

                joinRequestsObject.approved.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${memberObject.displayName} received more than 1 vote and was allowed into the server.`);
                })
            }
            else if (joinRequest.claimedNationality === "Non-Canadian" && requestReactions >= 4){

                memberObject.roles.add(roleNonCanadian);
                memberObject.roles.remove(roleUnregistered);

                channelGeneral.send(`Welcome <@${memberObject.id}>!\n\nWe recommend that you visit the 'Ayana self-assignable role' section of <#${channelRulesInfosID}>. You will be able to assign yourself which headset you use, which grip you use, etc.\n\nEnjoy the server :smile:`);
                channelCMSTaff.send(`**${memberObject.displayName}** received **more than 3 votes**. They left quarantine and were assigned the Non-Canadian role. The join request was deleted.`);
                channelNewMembers.send(`**${memberObject.displayName}** just joined the server!`);

                messageRequest.delete();

                joinRequestsObject.approved.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${memberObject.displayName} received more than 3 votes and was allowed into the server.`);
                })

            }
            else if (joinRequest.claimedNationality === "Non-Canadian" && requestReactions < 4 && differenceInDays >= 1){

                memberObject.send("Your request to join the **Beat Saber Canadian Discord was denied**.\n\nYou can try applying again in the near future.\nYou were probably denied due to a poor reason, we are strict when it comes to accepting Non-Canadians considering it is a server made for Canadian players mainly.\n\nIf you have any questions, please message **TeknozFR#6900**.\n\n*If you received this message but have been accepted into the server, this is probably because you submitted two join requests. In that case, just ignore this message.*");
                channelCMSTaff.send(`**${memberObject.displayName}** received **less than 3 votes in 24 hours**. They were declined, were DM'ed and the join request was deleted.`)

                messageRequest.delete();

                joinRequestsObject.declined.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${memberObject.displayName} received less than 3 votes in 24 hours and was declined.`);
                })
            }
            else if (joinRequest.claimedNationality === "Canadian" && requestReactions < 2 && differenceInDays >= 3){

                channelCMSTaff.send(`**${memberObject.displayName}** received **less than 1 vote in 24 hours**. They were declined and the join request was deleted.\n\nPlease do note that they were Canadian so there must have been a good reason to decline them (lying, etc).`)

                messageRequest.delete();

                joinRequestsObject.declined.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${memberObject.displayName} received less than 1 vote in 24 hours and was declined.`);
                })
            }
        }
    

        

      }, 300000);

});
// On member join function
client.on('guildMemberAdd', member => {

    
    const roleUnregistered = member.guild.roles.cache.get(roleUnregisteredID);
    const channelRegister = member.guild.channels.cache.get(channelRegisterID);

    // Add unregistered role to new member
    member.roles.add(roleUnregistered);
    // Send message in #register channel
    channelRegister.send(`<@${member.id}>, welcome to the :maple_leaf: **Beat Saber Canadian Discord** :maple_leaf:\n\nYou are currently quarantined and can't access the server's regular channels.\nPlease **read our rules** in <#777658741339455533> and **follow the instructions** in <#777658741088059431> to gain access to the rest of the server.`);

    console.log(member.displayName + " joined the server.");



})    

// Triggers every time a message is sent.
client.on('message', message => {

    if (message.content.includes("you are now linked to this Canadian ScoreSaber profile") === true && message.channel.id === channelRegisterID && message.author.id === "521458813874864141"){

        const roleCanadian = message.guild.roles.cache.get(roleCanadianID);
        const roleUnregistered = message.guild.roles.cache.get(roleUnregisteredID);

        const channelNewMembers = message.guild.channels.cache.get(channelNewMembersID);
        const channelGeneral = message.guild.channels.cache.get(channelGeneralID);

        var member = message.mentions.members.first();

        member.roles.remove(roleUnregistered);

        member.roles.add(roleCanadian);

        channelNewMembers.send(`**${member.displayName}** just joined the server!`);

        channelGeneral.send(`Welcome ${member}!\n\nWe recommend that you visit the 'Ayana self-assignable role' section of <#${channelRulesInfosID}>. You will be able to assign yourself which headset you use, what province you're from, etc.\n\nEnjoy the server :smile:`)

        console.log(`${member.displayName} registered with a Canadian ScoreSaber`)
    }
    // Checks if message author is bot
    if (message.author.bot) return;
    // Checks if channel message was sent in is #birthdays
    if (message.channel.id === channelBirthdaysID){
        // Checks if message is length 5 (MM/DD)
        if (message.content.length === 5 && message.content.charAt(0) != ">"){

            // Deserializes, parses, and applies settings.json
            var birthdayObject = JSON.parse(fs.readFileSync("./json_files/birthdays.json"));

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
            fs.writeFile('./json_files/birthdays.json', saveThis, (err) => {
                if (err) {
                    throw err;
                }
                console.log(message.author.username + " saved their birthday : " + message.content);
                message.channel.send("Your birthday has been saved.");
            })      

        }
        // If message was wrong length (MM/DD)
        else{
            
            message.channel.send("Error : you must use the format **MM/DD**. Please try again.");

        }
    }


    

    if (message.content.toLowerCase() === "bad bot"){

        message.channel.send("Take that back! >:(");
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

        case "register":
            client.commands.get("register").execute(message, args);
            break;

        case "ping":
            client.commands.get("ping").execute(message);
            break;
    }
        
})


client.login(discordToken);
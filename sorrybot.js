const { settings } = require("cluster");
const Discord = require ("discord.js");
const fs = require ("fs");
const { request } = require("http");
const path = require ("path");
const moment = require('moment');
const getJSON = require('get-json');


const prefix = ">";

const client = new Discord.Client();

// Deserializes, parses, and applies settings.json
const settingsObject = JSON.parse(fs.readFileSync("./json_files/settings.json"));

// Declaring all my constants for roles, channels & etc IDs from settings.json
const discordToken = settingsObject.other[0].token;
const guildID = settingsObject.other[0].guildID;

const youtubeAPIKey = settingsObject.other[0].apiKey;

const channelGeneralID = settingsObject.channels[0].generalID;
const channelRegisterID = settingsObject.channels[0].registerID;
const channelBirthdaysID = settingsObject.channels[0].birthdaysID;
const channelNewMembersID = settingsObject.channels[0].newMembersID;
const channelRulesInfosID = settingsObject.channels[0].rulesInfosID;
const channelJoinRequestsID = settingsObject.channels[0].joinRequestsID;
const channelCMStaffID = settingsObject.channels[0].cmStaffID;
const channelNewVideosID = settingsObject.channels[0].newVideos;

const roleUnregisteredID = settingsObject.roles[0].unregisteredID;
const roleBirthdayID = settingsObject.roles[0].birthdayID;
const roleCanadianID = settingsObject.roles[0].canadianID;
const roleNonCanadianID = settingsObject.roles[0].nonCanadianID;
const roleYoutubeID = settingsObject.roles[0].youtubeID;
const roleStaffID = settingsObject.roles[0].staffID;

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
    const channelNewVideos = guild.channels.cache.get(channelNewVideosID);

    const roleBirthday = guild.roles.cache.get(roleBirthdayID);
    const roleCanadian = guild.roles.cache.get(roleCanadianID);
    const roleUnregistered = guild.roles.cache.get(roleUnregisteredID);
    const roleNonCanadian = guild.roles.cache.get(roleNonCanadianID);

    // task loop every hour that checks birthday
    var intervalBirthday = setInterval (function () {

        // current date + time object
        let currentDatetime = new Date();

        let currentHour = currentDatetime.getHours();

        console.log("Birthday task executed")

        // checks if the current hour is 3-4 am, if yes, check if its someone's bday
        if (currentHour === 3){

            console.log("Birthday task executed between 3am-4am");

            let currentDD = currentDatetime.getDate();
            let currentMM = currentDatetime.getMonth() + 1; // +1 because january is 0

            if (currentDD < 10){
                currentDD = "0" + currentDD;
            }
            if (currentMM < 10){
                currentMM = "0" + currentMM;
            }

            let currentMMDD = currentMM + "/" + currentDD;

            // Deserializes, parses, and applies birthdays.json
            var birthdayObject = JSON.parse(fs.readFileSync("./json_files/birthdays.json"));

            // Checks all users in birthdayObject
            for (user of birthdayObject.users) {

                // If discordID in birthdayObject == message author ID, delete from birthdayObject.users
                if (user.birthday === currentMMDD && guild.member(user.discordID)) {
                    
                    let member = guild.members.cache.get(user.discordID);

                    channelGeneral.send(`Happy birthday to <@${user.discordID}> ! :partying_face: We all hope you have a beautiful day! :smile:`);

                    console.log(`It's ${member.displayName}'s birthday!`);

                    if (!member.roles.cache.get(roleBirthdayID)){

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
            
            let requestReactionsApprove = messageRequest.reactions.resolve("✅").count;
            let requestReactionsDecline = messageRequest.reactions.resolve("⛔").count;

            let requestDateTime = new Date(JSON.parse(joinRequest.date));

            let requestDateUTC = Date.UTC(requestDateTime.getFullYear(), requestDateTime.getMonth()+1, requestDateTime.getDate());
            let currentDateUTC = Date.UTC(currentDateTime.getFullYear(), currentDateTime.getMonth()+1, currentDateTime.getDate());

            let differenceInDays = Math.floor((currentDateUTC - requestDateUTC) / msPerDay);

            if (!guild.member(joinRequest.memberID)){

                //channelCMSTaff.send(`**${memberObject.displayName}** has left the server so their join request was declined and deleted.`)

                messageRequest.delete();

                joinRequestsObject.declined.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    //console.log(`${memberObject.displayName} left the server so their application was declined and deleted`);
                })

            }

            else if (joinRequest.claimedNationality === "Canadian" && requestReactionsApprove >= 2 && guild.member(joinRequest.memberID)){

                memberObject.roles.add(roleCanadian);
                memberObject.roles.remove(roleUnregistered);

                channelGeneral.send(`Welcome <@${memberObject.id}>!\n\nWe recommend that you visit the 'Ayana self-assignable role' section of <#${channelRulesInfosID}>. You will be able to assign yourself which headset you use, what province you're from, etc.\n\nEnjoy the server :smile:`);
                channelCMSTaff.send(`**${memberObject.displayName}** received **more than 1 'yes' vote**. They left quarantine and were assigned the Canadian role. The join request was deleted.`);
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
                    console.log(`${memberObject.displayName} received more than 1 'yes' vote and was allowed into the server.`);
                })
            }
            else if (joinRequest.claimedNationality === "Non-Canadian" && requestReactionsApprove >= 4 && guild.member(joinRequest.memberID)){

                memberObject.roles.add(roleNonCanadian);
                memberObject.roles.remove(roleUnregistered);

                channelGeneral.send(`Welcome <@${memberObject.id}>!\n\nWe recommend that you visit the 'Ayana self-assignable role' section of <#${channelRulesInfosID}>. You will be able to assign yourself which headset you use, which grip you use, etc.\n\nEnjoy the server :smile:`);
                channelCMSTaff.send(`**${memberObject.displayName}** received **more than 3 'yes' votes**. They left quarantine and were assigned the Non-Canadian role. The join request was deleted.`);
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
                    console.log(`${memberObject.displayName} received more than 3 'yes' votes and was allowed into the server.`);
                })

            }
            else if (joinRequest.claimedNationality === "Non-Canadian" && requestReactionsApprove < 4 && differenceInDays >= 2 && guild.member(joinRequest.memberID)){

                memberObject.send("Your request to join the **Beat Saber Canadian Discord was denied**.\n\nYou can try applying again in the near future.\nYou were probably denied due to a poor reason, we are strict when it comes to accepting Non-Canadians considering it is a server made for Canadian players mainly.\n\nIf you have any questions, please message **teknoz#6900**.\n\n*If you received this message but have been accepted into the server, this is probably because you submitted two join requests. In that case, just ignore this message.*");
                channelCMSTaff.send(`**${memberObject.displayName}** received **less than 3 'yes' votes in 48+ hours**. They were declined, were DM'ed and the join request was deleted.`)

                messageRequest.delete();

                joinRequestsObject.declined.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${memberObject.displayName} received less than 3 'yes' votes in 24 hours and was declined.`);
                })
            }
            else if (joinRequest.claimedNationality === "Canadian" && requestReactionsApprove < 2 && differenceInDays >= 4 && guild.member(joinRequest.memberID)){

                channelCMSTaff.send(`**${memberObject.displayName}** received **less than 1 'yes' vote in 96+ hours**. They were declined and the join request was deleted.\n\nPlease do note that they were Canadian so there must have been a good reason to decline them (lying, etc).`)

                messageRequest.delete();

                joinRequestsObject.declined.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${memberObject.displayName} received less than 1 'yes' vote in 24 hours and was declined.`);
                })
            }
            else if (joinRequest.claimedNationality === "Non-Canadian" && requestReactionsDecline >= 4 && guild.member(joinRequest.memberID)){

                memberObject.send("Your request to join the **Beat Saber Canadian Discord was denied**.\n\nYou can try applying again in the near future.\nYou were probably denied due to a poor reason, we are strict when it comes to accepting Non-Canadians considering it is a server made for Canadian players mainly.\n\nIf you have any questions, please message **teknoz#6900**.\n\n*If you received this message but have been accepted into the server, this is probably because you submitted two join requests. In that case, just ignore this message.*");
                channelCMSTaff.send(`**${memberObject.displayName}** received **3 or more 'no' votes**. They were declined, were DM'ed and the join request was deleted.`)

                messageRequest.delete();

                joinRequestsObject.declined.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${memberObject.displayName} received 3 or more 'no' votes and was declined.`);
                })
            }
            else if (joinRequest.claimedNationality === "Canadian" && requestReactionsDecline >= 2 && guild.member(joinRequest.memberID)){

                channelCMSTaff.send(`**${memberObject.displayName}** received **1 or more 'no' votes**. They were declined and the join request was deleted.\n\nPlease do note that they were Canadian so there must have been a good reason to decline them (lying, etc).`)

                messageRequest.delete();

                joinRequestsObject.declined.push(joinRequest);
                joinRequestsObject.waiting_approval.splice(i,1);

                // Overwrites birthdays.json and adds birthdayObject (birthday dict)
                const saveThis = JSON.stringify(joinRequestsObject);
                fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${memberObject.displayName} received 1 or more 'no' votes and was declined.`);
                })
            }
        }
    

        

    }, 300000);

    // task loop every 10 mins that checks new video on BSCanada youtube channel
    var intervalNewVideo = setInterval (function () {

        getJSON(`https://www.googleapis.com/youtube/v3/search?key=${youtubeAPIKey}&channelId=UCgmd2oa2F1zNNhwyjP9N31Q&part=snippet,id&order=date&maxResults=1`)


            .then(function(response) {

                console.log("New Video task loop executed");

                var youtubeAPIObject = JSON.parse(fs.readFileSync("./json_files/youtube_api.json"));

                var latestVideo = youtubeAPIObject.youtube[0].latestVideoID;
                var videoID = response.items[0].id.videoId;
                
                if (videoID != latestVideo){

                    if (!youtubeAPIObject.previous_videos.includes(videoID)){
                        
                        getJSON(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${youtubeAPIKey}`)


                        .then(function(response){
                            
                            var videoDescription = response.items[0].snippet.description;
                            var customMsgDescription = videoDescription.substring(0, videoDescription.indexOf("\n\n"));
                            var newLatestVideoDict = {"latestVideoID":videoID};

                            channelNewVideos.send(`${customMsgDescription} :maple_leaf: <@&${roleYoutubeID}>\nCheck it out here! https://www.youtube.com/watch?v=${videoID}`);

                            youtubeAPIObject.youtube.splice(0,1);

                            youtubeAPIObject.youtube.push(newLatestVideoDict);
                            youtubeAPIObject.previous_videos.push(videoID);

                            // Overwrites youtube_api.json and adds new latestVideoTitle
                            const saveThis = JSON.stringify(youtubeAPIObject);
                            fs.writeFile('./json_files/youtube_api.json', saveThis, (err) => {
                                if (err) {
                                    throw err;
                                }
                                console.log(`New Video on BSCanada Youtube : ${response.items[0].snippet.title}`);
                            })
                        })

                        .catch(function(error){
                            console.log(error);
                        })

                    }

                }
            })
            .catch(function(error) {
                console.log(error);
            });
        
    }, 900000);
});
// On member join function
client.on('guildMemberAdd', (member) => {

    guildBSCD = client.guilds.get(guildID)

    if (guildBSCD.member(member.id)){

        const roleUnregistered = guildBSCD.roles.cache.get(roleUnregisteredID);
        const channelRegister = client.channels.cache.get(channelRegisterID);

        // Add unregistered role to new member
        member.roles.add(roleUnregistered);
        // Send message in #register channel
        channelRegister.send(`<@${member.id}>, welcome to the :maple_leaf: **Beat Saber Canadian Discord** :maple_leaf:\n\nYou are currently quarantined and can't access the server's regular channels.\nPlease **read our rules** in <#${channelRulesInfosID}> and **follow the instructions** in <#764680632450154507> to gain access to the rest of the server.`);

        console.log(member.displayName + " joined the server.");

    }
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
    if (message.channel.id === channelRegisterID){

        
        // Gets guild from message
        const { guild } = message;

        const channelCMSTaff = guild.channels.cache.get(channelCMStaffID);
        // Creates member object from message author ID
        const member = guild.members.cache.get(message.author.id);
        // Checks if message author is SorryBot or BeatStalker, pass if it is
        if (message.author.id === "776971936370393109" || message.author.id === "521458813874864141"){
            //pass
        }
        // Checks if message content is command
        else if (message.content.substring(0,9) != ">register" && message.content.substring(0,6) != ">claim"){

            
            // Checks if message author has staff role, if not, execute
            if (!member.roles.cache.get(roleStaffID)){

                message.delete();

                message.channel.send("You are only allowed to use commands in this channel (>register & >claim). If you wish to contact a staff member, please DM them.");
                channelCMSTaff.send(message.author.username + " sent '" + message.content + "' in <#" + channelRegisterID + "> and it was deleted.");

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
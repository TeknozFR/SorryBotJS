module.exports = {
    name: 'register',
    description: 'Register command',
    async execute(message, args){
        const Discord = require ("discord.js");
        const fs = require ("fs");
        // Deserializes, parses, and applies settings.json
        const settingsObject = JSON.parse(fs.readFileSync("./json_files/settings.json"));

        const channelJoinRequests = message.guild.channels.cache.get(settingsObject.channels[0].joinRequestsID);

        // Gets guild from message
        const { guild } = message;
        // Creates member object from message author ID
        const member = guild.members.cache.get(message.author.id);

        const hmdQuest = "quest";
        const hdmQuest2 = "quest2";
        const hdmPSVR = "psvr";
        const other = "other";

        let date = new Date();
        let dateJSON = JSON.stringify(date);

        if (args[0].toLowerCase() === hmdQuest || args[0].toLowerCase() === hdmQuest2 || args[0].toLowerCase() === hdmPSVR || args[0].toLowerCase() === other){

            const joinRequestEmbed = new Discord.MessageEmbed()
	            .setColor('RED')
                .setTitle('Join Request')
                .setDescription('This person applied to get access to the rest of the server.')
                .addFields(
                    { name: 'Name', value: member.displayName, inline: true },
                    { name: "Claimed Nationality", value: "Canadian", inline: true },
                    { name: "Reason", value: args[0] },
                    { name: "Staff actions needed", value: "One staff/CM needs to ask the 5 questions pinned in the community-staff channel.\nIf everything checks out, click the reaction on this message and they will automatically receive the appropriate role(s)."}
                )

            let requestMessage = await channelJoinRequests.send(joinRequestEmbed);
                
            requestMessage.react("✅");

            // Deserializes, parses, and applies settings.json
            var joinRequestsObject = JSON.parse(fs.readFileSync("./json_files/join_requests.json"));

            // Create object with message author ID & birthday (message.content)
            var memberRequestObject = {
                "messageID" : requestMessage.id,
                "memberID" : message.author.id,
                "date" : dateJSON,
                "claimedNationality" : "Canadian",
              }

            // Add personObject to end of birthdayObject
            joinRequestsObject.waiting_approval.push(memberRequestObject);

            // Overwrites birthdays.json and adds birthdayObject (birthday dict)
            const saveThis = JSON.stringify(joinRequestsObject);
            fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                if (err) {
                    throw err;
                }
                console.log(`${member.displayName} is Canadian and applied with the reason : ${args[0]}`);
                message.channel.send("Your request was sent to staff. Someone will review it shortly.");
            })

            

        }

        else {

            let argString = "";
            

            for (value of args){
                argString += `${value} `;
            }

            const joinRequestEmbed = new Discord.MessageEmbed()
	            .setColor('BLUE')
                .setTitle('Join Request')
                .setDescription('This person applied to get access to the rest of the server.')
                .addFields(
                    { name: 'Name', value: member.displayName, inline: true },
                    { name: "Claimed Nationality", value: "Non-Canadian", inline: true },
                    { name: "Reason", value: argString },
                    { name: "Staff actions needed", value: "Discuss with other staff/CM if you think the reason is valid.\nIf you find the reason valid, click the reaction on this message. If 3+ staff/CM react to the message, the member wil automatically receive the appropriate role(s)."}
                )

            let requestMessage = await channelJoinRequests.send(joinRequestEmbed);
                
            requestMessage.react("✅");

            // Deserializes, parses, and applies settings.json
            var joinRequestsObject = JSON.parse(fs.readFileSync("./json_files/join_requests.json"));

            // Create object with message author ID & birthday (message.content)
            var memberRequestObject = {
                "messageID" : requestMessage.id,
                "memberID" : message.author.id,
                "date" : dateJSON,
                "claimedNationality" : "Non-Canadian",
              }

            // Add personObject to end of birthdayObject
            joinRequestsObject.waiting_approval.push(memberRequestObject);

            // Overwrites birthdays.json and adds birthdayObject (birthday dict)
            const saveThis = JSON.stringify(joinRequestsObject);
            fs.writeFile('./json_files/join_requests.json', saveThis, (err) => {
                if (err) {
                    throw err;
                }
                console.log(`${member.displayName} is Non-Canadian and applied with the reason : ${argString}`);
                message.channel.send("Your request was sent to staff. Someone will review it shortly.");
            })
        }
    }
}
module.exports = {
    name: 'help',
    description: 'Help command',
    async execute(message){

        // Gets guild from message
        const { guild } = message;
        // Creates member object from message author ID
        const member = guild.members.cache.get(message.author.id);
        // Creates role object from ID
        //var roleUnregistered = message.guild.roles.cache.find(role => role.id == "764679965232463882");
        if (!member.roles.cache.get("764679965232463882")) {

            await message.channel.send("DM sent.");
            message.author.send("**Commands**\n```>roll -> Rolls an integer between 1 and 100.\n>guess <number> -> Rolls an integer between 1 and 100. Try to guess the right <number>!\n```");
        } 
        else {
                
                await message.channel.send("DM sent.");
                message.author.send("**Commands**\n```>register <scoresaber_id, headset or reason>\nCanadians with Canadian ScoreSaber -> <scoresaber_id>\nCanadians without ScoreSaber profile or without Canadian ScoreSaber profile -> <headset> options : quest, quest2, psvr or other\nNon-Canadians -> <reason> to join```");

        }

        
    }
}
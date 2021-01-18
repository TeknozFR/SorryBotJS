module.exports = {
    name: 'ping',
    description: 'Ping command',
    async execute(message){

        const fs = require ("fs");

        message.channel.send("Pong! The bot is online.");

        var youtubeAPIObject = JSON.parse(fs.readFileSync("./json_files/youtube_api.json"));

        for (previousID of youtubeAPIObject.previous_videos){
            console.log(previousID);
        }

        var latestVideo = youtubeAPIObject.youtube[0].latestVideoID;

        if (!youtubeAPIObject.previous_videos.includes(latestVideo)){
            console.log("its not in there");
            
        }


    }
}
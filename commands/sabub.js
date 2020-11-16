module.exports = {
    name: 'sabub',
    description: 'Sabub command',
    execute(message){
        // Print message author
        console.log(message.author.username + " used >sabub command");
        // Delete message
        message.delete();
        // Ping sabooboo
        message.channel.send("<@172056555217354752>");

    }
}
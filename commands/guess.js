module.exports = {
    name: 'guess',
    description: 'Guess command',
    execute(message, args){

        // Rolls random number between 1 & 100
        let randomNumber = Math.floor(Math.random() * 101) + 1;

        if (randomNumber === args){
            // Print + send number & message author
            message.channel.send(`**${message.author}** rolled **${randomNumber}**.\nCongratulations, you rolled the right number! :partying_face:`);
            console.log(`${message.author.username} rolled ${randomNumber} and won`);

        }

        else{
            // Print + send number & message author
            message.channel.send(`**${message.author.username}** rolled **${randomNumber}**.\nWrong number, better luck next time. :pleading_face:`);
            console.log(`${message.author.username} rolled ${randomNumber} and lost`);

        } 

    }
}
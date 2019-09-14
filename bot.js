// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// __  __                    ___                ______   ___    __                      __     __             ____                                     
// /\ \/\ \                  /\_ \              /\  _  \ /\_ \  /\ \                    /\ \__ /\ \          /\  _`\   __                              
// \ \ \ \ \     ___      ___\//\ \       __    \ \ \L\ \\//\ \ \ \ \____     __   _ __ \ \ ,_\\ \/   ____   \ \ \L\ \/\_\   ____    ____       __     
//  \ \ \ \ \  /' _ `\   /'___\\ \ \    /'__`\   \ \  __ \ \ \ \ \ \ '__`\  /'__`\/\`'__\\ \ \/ \/   /',__\   \ \ ,__/\/\ \ /\_ ,`\ /\_ ,`\   /'__`\   
//   \ \ \_\ \ /\ \/\ \ /\ \__/ \_\ \_ /\  __/    \ \ \/\ \ \_\ \_\ \ \L\ \/\  __/\ \ \/  \ \ \_    /\__, `\   \ \ \/  \ \ \\/_/  /_\/_/  /_ /\ \L\.\_ 
//    \ \_____\\ \_\ \_\\ \____\/\____\\ \____\    \ \_\ \_\/\____\\ \_,__/\ \____\\ \_\   \ \__\   \/\____/    \ \_\   \ \_\ /\____\ /\____\\ \__/.\_\
//     \/_____/ \/_/\/_/ \/____/\/____/ \/____/     \/_/\/_/\/____/ \/___/  \/____/ \/_/    \/__/    \/___/      \/_/    \/_/ \/____/ \/____/ \/__/\/_/

const { ActivityHandler } = require('botbuilder');
const { CardFactory } = require('botbuilder');
const WelcomeCard = require('./resources/welcomeCard.json');

class PizzaBot extends ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
    */
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');

            // Run the Dialog with the new message Activity.
            await this.dialog.run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
                    await context.sendActivity({ attachments: [welcomeCard] });
                    await dialog.run(context, conversationState.createProperty('DialogState'));
                }
            }
            await next();
        });
    }
}

module.exports.PizzaBot = PizzaBot;

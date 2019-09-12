// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory, InputHints } = require('botbuilder');
// const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, orderingDialog) {
        super('MainDialog');

        // if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        // this.luisRecognizer = luisRecognizer;

        if (!orderingDialog) throw new Error('[MainDialog]: Missing parameter \'orderingDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(orderingDialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a ordering request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    async introStep(stepContext) {
        // if (!this.luisRecognizer.isConfigured) {
        //     const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
        //     await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
        //     return await stepContext.next();
        // }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'What can I help you with today?\nSay something like "order a pizza", "place an order" or "I\'m hungry"';
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the intent and order detils.
     * Then, it hands off to the orderingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const orderingDetails = {};

        // if (!this.luisRecognizer.isConfigured) {
        //     // LUIS is not configured, we just run the orderingDialog path.
        //     return await stepContext.orderingDialog('orderingDialog');
        // }

        return await stepContext.beginDialog('orderingDialog');

        return await stepContext.next();
    }

    
    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "place and order" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        // If the child dialog ("orderingDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            const result = stepContext.result;
            // Now we have all the order details.

            // This is where calls to the ordering API service or database would go.

            // If the call to the ordering service was successful tell the user.
            const msg = `Your order for two large pepperoni pizzas has been received and we are now preparing your food. Expected delivery time is 7:00pm.`;
            await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
        }

        // Restart the main dialog with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}

module.exports.MainDialog = MainDialog;

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class OrderingDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'orderingDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.sizeStep.bind(this),
                this.cheeseStep.bind(this),
                this.toppingsStep.bind(this),
                this.deliveryDateStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a size has not been provided, prompt for one.
     */
    async sizeStep(stepContext) {
        const orderingDetails = stepContext.options;

        if (!orderingDetails.size) {
            const messageText = 'What size pizza would you like?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(orderingDetails.size);
    }

    /**
     * If the type of cheese has not been provided, prompt for one.
     */
    async cheeseStep(stepContext) {
        const orderingDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        orderingDetails.size = stepContext.result;
        if (!orderingDetails.cheese) {
            const messageText = 'What kind of cheese would you like on your pizza?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(orderingDetails.cheese);
    }

    /**
     * If the type of cheese has not been provided, prompt for one.
     */
    async toppingsStep(stepContext) {
        const orderingDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        orderingDetails.cheese = stepContext.result;
        if (!orderingDetails.toppings) {
            const messageText = 'What kind of toppings would you like on your pizza?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(orderingDetails.toppings);
    }

    /**
     * If a travel date has not been provided, prompt for one.
     * This will use the DATE_RESOLVER_DIALOG.
     */
    async deliveryDateStep(stepContext) {
        const orderingDetails = stepContext.options;

        // Capture the results of the previous step
        orderingDetails.toppings = stepContext.result;
        if (!orderingDetails.deliveryDate || this.isAmbiguous(orderingDetails.deliverylDate)) {
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: orderingDetails.deliveryDate });
        }
        return await stepContext.next(orderingDetails.deliveryDate);
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const orderingDetails = stepContext.options;

        // Capture the results of the previous step
        orderingDetails.deliveryDate = stepContext.result;
        const messageText = `Please confirm, I a ${ orderingDetails.size } pizza with ${ orderingDetails.cheese } cheese and ${ orderingDetails.toppings } for delivery on ${ orderingDetails.deliveryDate }. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const orderingDetails = stepContext.options;
            return await stepContext.endDialog(orderingDetails);
        }
        return await stepContext.endDialog();
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.OrderingDialog = OrderingDialog;

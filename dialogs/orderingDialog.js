// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ChoicePrompt, ConfirmPrompt, DateTimePrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const SIZE_PROMPT = 'sizePrompt';
const CHEESE_PROMPT = 'cheesePrompt';
const DATETIME_PROMPT = 'datetimePrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class OrderingDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'orderingDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(SIZE_PROMPT))
            .addDialog(new ChoicePrompt(CHEESE_PROMPT))
            .addDialog(new DateTimePrompt(DATETIME_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.sizeStep.bind(this),
                this.cheeseStep.bind(this),
                this.toppingsStep.bind(this),
                this.deliveryTimeStep.bind(this),
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
            return await stepContext.prompt(
                SIZE_PROMPT, {
                    prompt: messageText,
                    choices: ['large', 'medium', 'small'],
                    retryPrompt: 'Not a valid option'
                }
            );
        }
        return await stepContext.next(orderingDetails.size);
    }

    /**
     * If the type of cheese has not been provided, prompt for one.
     */
    async cheeseStep(stepContext) {
        const orderingDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        orderingDetails.size = stepContext.result.value;

        if (!orderingDetails.cheese) {
            const messageText = 'What kind of cheese would you like?';
            return await stepContext.prompt(
                SIZE_PROMPT, {
                    prompt: messageText,
                    choices: ['mozzarella', 'cheddar', 'no cheese'],
                    retryPrompt: 'Not a valid option'
                }
            );
        }
        return await stepContext.next(orderingDetails.cheese);
    }

    /**
     * If the type of cheese has not been provided, prompt for one.
     */
    async toppingsStep(stepContext) {
        const orderingDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        orderingDetails.cheese = stepContext.result.value;

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
    async deliveryTimeStep(stepContext) {
        // Capture the results of the previous step
        const orderingDetails = stepContext.options;

        orderingDetails.toppings = stepContext.result;

        const promptMessage = "What time would you like your pizza delivered?";
        const repromptMessage = "I'm sorry, for best results, please enter  a valid delivery time.";

        if (!orderingDetails.deliveryTime || this.isAmbiguous(orderingDetails.deliveryDate)) {
            // We were not given any date at all so prompt the user.
            return await stepContext.prompt(DATETIME_PROMPT,
                {
                    prompt: promptMessage,
                    retryPrompt: repromptMessage
                });
        }

        return await stepContext.next(orderingDetails.deliveryTime);
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const orderingDetails = stepContext.options;

        // Capture the results of the previous step
        orderingDetails.deliveryTime = this.formatTime(stepContext.result[0].value);
        const messageText = `Please confirm, I a ${ orderingDetails.size } pizza with ${ orderingDetails.cheese } cheese and ${ orderingDetails.toppings } for delivery at ${ orderingDetails.deliveryTime }. Is this correct?`;
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

    formatTime (time) {
        if (time.charAt(0) === '0') {
           time = time.slice(1);
        }
        const timeSegments = time.split(':');
        return `${timeSegments[0]}:${timeSegments[1]}`;
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.OrderingDialog = OrderingDialog;

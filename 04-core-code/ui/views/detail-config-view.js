// File: 04-core-code/ui/views/detail-config-view.js

/**
 * @fileoverview View module responsible for all logic related to the Detail Configuration screen.
 */
export class DetailConfigView {
    constructor({ quoteService, uiService, eventAggregator, publishStateChangeCallback }) {
        this.quoteService = quoteService;
        this.uiService = uiService;
        this.eventAggregator = eventAggregator;
        this.publish = publishStateChangeCallback;

        this.propertyOptions = {
            over: ['', 'O'],
            oi: ['', 'IN', 'OUT'],
            lr: ['', 'L', 'R']
        };

        // All event subscriptions are handled by AppController.
        console.log("DetailConfigView Initialized (Passive View).");
    }

    handleFocusModeRequest({ column }) {
        this.uiService.setVisibleColumns(['sequence', column]);
        this.uiService.setActiveCell(0, column);
        this.publish();
    }

    handleBatchUpdateRequest({ column, value }) {
        this.quoteService.batchUpdateProperty(column, value);
        this.publish();
    }

    handleTableCellInteraction({ rowIndex, column }) {
        if (['location', 'fabric', 'color'].includes(column)) {
            this.uiService.setActiveCell(rowIndex, column);
            this.publish();
            return;
        }

        if (this.propertyOptions[column]) {
            const options = this.propertyOptions[column];
            this.quoteService.cycleItemProperty(rowIndex, column, options);
            this.publish();
            return;
        }
    }

    _handleCellInputBlur(inputElement) {
        const rowIndex = parseInt(inputElement.dataset.rowIndex, 10);
        const column = inputElement.dataset.column;
        const newValue = inputElement.value;

        this.quoteService.updateItemProperty(rowIndex, column, newValue);
        
        this.uiService.setActiveCell(null, null);
        this.publish();
    }
}
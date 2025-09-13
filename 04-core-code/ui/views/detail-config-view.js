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
        console.log(`[DetailConfigView] Handling 'handleFocusModeRequest'... Column: ${column}`);
        this.uiService.setVisibleColumns(['sequence', column]);
        this.uiService.setActiveCell(0, column);
        this.publish();
    }

    handleBatchUpdateRequest({ column, value }) {
        console.log(`[DetailConfigView] Handling 'handleBatchUpdateRequest'... Column: ${column}, Value: ${value}`);
        this.quoteService.batchUpdateProperty(column, value);
        this.publish();
    }

    handleTableCellInteraction({ rowIndex, column }) {
        console.log(`[DetailConfigView] Handling 'handleTableCellInteraction'... Row: ${rowIndex}, Column: ${column}`);
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
        
        // --- [MODIFIED DIAGNOSTIC LOG] ---
        // This log should ONLY appear if we are in DetailConfig view and click on a non-interactive column like 'width'.
        console.error(`[DetailConfigView] ERROR: Unhandled table cell interaction in Detail view for column: '${column}'. This should NOT happen in Quick Quote view.`);
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
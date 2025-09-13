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

        // --- [NEW] Define option sequences for cycleable properties ---
        this.propertyOptions = {
            over: ['', 'O'],
            oi: ['', 'IN', 'OUT'],
            lr: ['', 'L', 'R']
        };

        this._initialize();
        console.log("DetailConfigView Initialized.");
    }

    _initialize() {
        this.eventAggregator.subscribe('userRequestedFocusMode', (data) => this.handleFocusModeRequest(data));
        this.eventAggregator.subscribe('tableCellClicked', (data) => this.handleTableCellInteraction(data));
        this.eventAggregator.subscribe('userRequestedBatchUpdate', (data) => this.handleBatchUpdateRequest(data));
        
        document.getElementById('results-table').addEventListener('blur', (event) => {
            if (event.target.matches('.editable-cell-input')) {
                this._handleCellInputBlur(event.target);
            }
        }, true);
    }

    handleFocusModeRequest({ column }) {
        console.log(`Focus mode requested for: ${column}`);
        this.uiService.setVisibleColumns(['sequence', column]);
        this.uiService.setActiveCell(0, column);
        this.publish();
    }

    handleBatchUpdateRequest({ column, value }) {
        this.quoteService.batchUpdateProperty(column, value);
        this.publish();
    }

    handleTableCellInteraction({ rowIndex, column }) {
        // --- Logic for K1 editable text fields ---
        if (['location', 'fabric', 'color'].includes(column)) {
            this.uiService.setActiveCell(rowIndex, column);
            this.publish();
            return;
        }

        // --- [NEW] Logic for K2 cycleable option fields ---
        if (this.propertyOptions[column]) {
            const options = this.propertyOptions[column];
            this.quoteService.cycleItemProperty(rowIndex, column, options);
            this.publish();
            return;
        }

        // --- Fallback for other potential interactions ---
        console.log(`Unhandled table cell interaction in Detail view for column: ${column}`);
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
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

        this._initialize();
        console.log("DetailConfigView Initialized.");
    }

    _initialize() {
        this.eventAggregator.subscribe('userRequestedFocusMode', (data) => this.handleFocusModeRequest(data));
        this.eventAggregator.subscribe('tableCellClicked', (data) => this.handleTableCellInteraction(data));
        
        // Listen for blur events bubbling up from the table
        document.getElementById('results-table').addEventListener('blur', (event) => {
            if (event.target.matches('.editable-cell-input')) {
                this._handleCellInputBlur(event.target);
            }
        }, true); // Use capturing phase to ensure we catch the event
    }

    /**
     * Handles the request to enter "Focus Mode" for a specific column.
     * @param {object} data - The event data, containing the target column.
     */
    handleFocusModeRequest({ column }) {
        console.log(`Focus mode requested for: ${column}`);
        // Set the visible columns to only be the sequence number and the target column
        this.uiService.setVisibleColumns(['sequence', column]);
        // Set the active cell to the first row of the target column to begin editing
        this.uiService.setActiveCell(0, column);
        this.publish();
    }

    /**
     * Handles data input or interaction within the main table when in detail config view.
     * @param {object} eventData Data about the cell interaction { rowIndex, column }.
     */
    handleTableCellInteraction(eventData) {
        // When a cell is clicked, set it as the active cell to trigger the re-render with an input field.
        this.uiService.setActiveCell(eventData.rowIndex, eventData.column);
        this.publish();
    }

    /**
     * Handles the blur event from an editable input cell in the table.
     * @param {HTMLInputElement} inputElement The input element that lost focus.
     */
    _handleCellInputBlur(inputElement) {
        const rowIndex = parseInt(inputElement.dataset.rowIndex, 10);
        const column = inputElement.dataset.column;
        const newValue = inputElement.value;

        // Update the data in the core model
        this.quoteService.updateItemProperty(rowIndex, column, newValue);
        
        // Important: After editing, reset the active cell to prevent the input from reappearing
        // and revert to the default view of the focused column.
        this.uiService.setActiveCell(null, null);
        this.publish();
    }
}
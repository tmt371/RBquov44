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

        // [REMOVED] All direct DOM event listeners are removed from the view.
        console.log("DetailConfigView Initialized (Corrected Passive View).");
    }

    handleFocusModeRequest({ column }) {
        if (column === 'fabric') {
            this._resyncFabricAndColorData();
            this.uiService.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'fabric', 'color']);
            this._updatePanelInputsState(); 
            this.uiService.setActiveCell(null, null);
        } else {
            this.uiService.setVisibleColumns(['sequence', column]);
            this.uiService.setActiveCell(0, column);
        }
        this.publish();
    }

    handleBatchUpdateRequest({ column, value }) {
        this.quoteService.batchUpdateProperty(column, value);
        this.publish();
    }

    handlePanelInputEnter({ type, field }) {
        const inputElement = document.querySelector(`.panel-input[data-type="${type}"][data-field="${field}"]`);
        if (inputElement) {
            this.quoteService.batchUpdatePropertyByType(type, field, inputElement.value);
            this.publish();
        }

        const inputs = Array.from(document.querySelectorAll('.panel-input:not([disabled])'));
        const currentIndex = inputs.indexOf(inputElement);
        const nextInput = inputs[currentIndex + 1];

        if (nextInput) {
            nextInput.focus();
        } else {
            inputElement.blur();
        }
    }

    handleTableCellInteraction({ rowIndex, column }) {
        if (['location', 'fabric', 'color'].includes(column)) {
            this.uiService.setActiveCell(rowIndex, column);
            this.publish();
            return;
        }

        if (this.propertyOptions[column]) {
            this.uiService.setActiveCell(rowIndex, column);
            const options = this.propertyOptions[column];
            this.quoteService.cycleItemProperty(rowIndex, column, options);
            this.publish();
            setTimeout(() => {
                this.uiService.setActiveCell(null, null);
                this.publish();
            }, 100);
            return;
        }
    }

    // [MODIFIED] Method name changed to be public, now called by AppController
    _handleCellInputBlur({ rowIndex, column, value }) {
        this.quoteService.updateItemProperty(rowIndex, column, value);
        this.uiService.setActiveCell(null, null);
        this.publish();
    }

    // [MODIFIED] Method name changed to be public, now called by AppController
    _handleCellInputEnter({ rowIndex, column, value }) {
        const totalRows = this.quoteService.getItems().length;

        this.quoteService.updateItemProperty(rowIndex, column, value);

        const nextRowIndex = rowIndex + 1;
        if (nextRowIndex < totalRows - 1) {
            this.uiService.setActiveCell(nextRowIndex, column);
        } else {
            this.uiService.setActiveCell(null, null);
        }
        this.publish();
    }

    _updatePanelInputsState() {
        const items = this.quoteService.getItems();
        const presentTypes = new Set(items.map(item => item.fabricType).filter(Boolean));
        
        const allPanelInputs = document.querySelectorAll('.panel-input');
        allPanelInputs.forEach(input => {
            if (input.dataset.type !== 'LF') {
                input.disabled = !presentTypes.has(input.dataset.type);
            }
        });

        const firstEnabledInput = document.querySelector('.panel-input:not([disabled])');
        if (firstEnabledInput) {
            setTimeout(() => firstEnabledInput.focus(), 0);
        }
    }

    _resyncFabricAndColorData() {
        const enabledInputs = document.querySelectorAll('.panel-input:not([disabled])');
        enabledInputs.forEach(input => {
            const type = input.dataset.type;
            const field = input.dataset.field;
            const value = input.value;
            if (value) {
                this.quoteService.batchUpdatePropertyByType(type, field, value);
            }
        });
        this.publish();
    }
}